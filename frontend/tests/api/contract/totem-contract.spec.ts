import { test, expect } from '@playwright/test';

import type { TotemEnv } from '../helpers/env';
import { TotemClient } from '../helpers/totemClient';
import { jsonResponse, startMockServer } from '../helpers/mockServer';

const credentials = {
  empresa: 'mock',
  username: 'tester',
  password: 'secret',
};

const createEnv = (baseUrl: string): TotemEnv => ({
  baseUrl,
  allowProdE2E: false,
  credentials,
  companyCode: '42',
});

test.describe('auth retry', () => {
  test('retries login once when encountering 401 on auth endpoints', async ({ request }) => {
    let loginCount = 0;
    let convenioCalls = 0;
    const tokens = ['token-initial', 'token-refreshed'];

    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => {
          const token = tokens[Math.min(loginCount, tokens.length - 1)];
          loginCount += 1;
          jsonResponse(res, 200, { token, codacesso: '123' });
        },
      },
      '/convenios': {
        GET: async ({ req, res, url }) => {
          convenioCalls += 1;
          if (convenioCalls === 1) {
            jsonResponse(res, 401, { error: 'expired' });
            return;
          }

          const authHeader = req.headers.authorization;
          expect(authHeader).toBe(`Bearer ${tokens[1]}`);
          expect(url.searchParams.get('permiteagweb')).toBe('S');
          expect(url.searchParams.get('integracaowhatsapp')).toBe('S');
          expect(url.searchParams.get('codempresa')).toBe('42');

          jsonResponse(res, 200, [
            {
              convenio: 'abc',
              nomefantasia: 'Mock Convenio',
            },
          ]);
        },
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      const convenios = await client.listConvenios();
      expect(convenios).toHaveLength(1);
      expect(loginCount).toBe(2);
      expect(convenioCalls).toBe(2);
    } finally {
      await server.close();
    }
  });
});

test.describe('convenios schema', () => {
  test('throws when convenio entry is missing identifier', async ({ request }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/convenios': {
        GET: async ({ res }) =>
          jsonResponse(res, 200, [
            {
              nomefantasia: 'Sem ID',
            },
          ]),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(client.listConvenios()).rejects.toThrow(/convenio/i);
    } finally {
      await server.close();
    }
  });
});

test.describe('patient flow', () => {
  test('fails fast when patient lookup returns empty and create payload missing', async ({
    request,
  }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/pacientesautoage': {
        GET: async ({ res }) => jsonResponse(res, 200, []),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(
        client.findOrCreatePatient({
          search: {
            cpf: '12345678901',
            nasci: '01/01/1990',
            nome: 'Maria',
          },
        }),
      ).rejects.toThrow(/Nenhum paciente encontrado/i);
    } finally {
      await server.close();
    }
  });

  test('throws when patient lookup responds with 404 envelope', async ({ request }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/pacientesautoage': {
        GET: async ({ res }) => jsonResponse(res, 404, { error: 'não encontrado' }),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(
        client.findOrCreatePatient({
          search: {
            cpf: '12345678901',
            nasci: '01/01/1990',
          },
        }),
      ).rejects.toThrow(/não encontrado/i);
    } finally {
      await server.close();
    }
  });

  test('throws zod error when patient lookup payload is malformed', async ({ request }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/pacientesautoage': {
        GET: async ({ res }) => jsonResponse(res, 200, { unexpected: true }),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(
        client.findOrCreatePatient({
          search: {
            cpf: '12345678901',
            nasci: '01/01/1990',
          },
        }),
      ).rejects.toThrow(/Expected array/i);
    } finally {
      await server.close();
    }
  });

  test('propagates backend validation error when creating patient', async ({ request }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/pacientesautoage': {
        POST: async ({ res }) => jsonResponse(res, 200, { ok: false, msg: 'CPF already exists' }),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(
        client.createPatient({
          cpf: '12345678901',
          nome: 'Paciente Teste',
          nasci: '01011990',
          celular: '5511999999999',
          convenio: '200',
        }),
      ).rejects.toThrow(/CPF already exists/);
    } finally {
      await server.close();
    }
  });
});

test.describe('atendimento errors', () => {
  test('surfaces backend error message when atendimento fails', async ({ request }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/atendimentoboletim': {
        POST: async ({ res }) => jsonResponse(res, 200, { type: 'error', msg: 'blocked-slot' }),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(
        client.generateAtendimento({
          especialidade: '100',
          convenio: '200',
          nropaciente: 123,
        }),
      ).rejects.toThrow(/blocked-slot/);
    } finally {
      await server.close();
    }
  });

  test('propagates message when atendimento request fails with non-2xx status', async ({
    request,
  }) => {
    const server = await startMockServer({
      '/login/externo': {
        POST: async ({ res }) => jsonResponse(res, 200, { token: 'token', codacesso: '991' }),
      },
      '/atendimentoboletim': {
        POST: async ({ res }) => jsonResponse(res, 400, { error: 'invalid convenio' }),
      },
    });

    try {
      const client = new TotemClient(request, createEnv(server.url));
      await expect(
        client.generateAtendimento({
          especialidade: '100',
          convenio: '200',
          nropaciente: 123,
        }),
      ).rejects.toThrow(/invalid convenio/i);
    } finally {
      await server.close();
    }
  });
});