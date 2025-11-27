import { test, expect } from '@playwright/test';

import { loadTotemEnv } from '../helpers/env';
import { resolvePatientMode } from '../helpers/modes';
import type { ConvenioRecord, EspecialidadeRecord } from '../helpers/totemClient';
import { TotemClient } from '../helpers/totemClient';

const getRequestedMode = () =>
  process.env.TOTEM_FLOW_MODE?.toLowerCase() === 'create' ? 'create' : 'existing';

const normalize = (value?: string) => value?.trim().toLowerCase() ?? '';

const selectConvenio = (items: ConvenioRecord[]) => {
  const preferredName = normalize(process.env.TOTEM_CONVENIO_NAME);
  const fallbackName = normalize('PARTICULAR');
  const resolveLabel = (item: ConvenioRecord) =>
    normalize(item.nomefantasia ?? item.razaosocial ?? '');

  const findByName = (needle?: string) =>
    needle ? items.find((item) => resolveLabel(item)?.includes(needle)) : undefined;

  return findByName(preferredName) ?? findByName(fallbackName) ?? items[0];
};

const selectEspecialidade = (items: EspecialidadeRecord[]) => {
  const preferredName = normalize(process.env.TOTEM_ESPECIALIDADE_NAME);
  const findByName = (needle?: string) =>
    needle ? items.find((item) => normalize(item.descricao).includes(needle)) : undefined;
  return findByName(preferredName) ?? items[0];
};

test.describe('Totem API live flow', () => {
  test('executes login -> find/create -> atendimento successfully', async ({ request }) => {
    const mode = getRequestedMode();
    const env = loadTotemEnv({ requirePatientFixture: mode === 'existing' });
    const patientMode = resolvePatientMode(env);
    if (patientMode.mode !== mode) {
      throw new Error(
        `[totem-flow] Requested mode "${mode}" diverges from resolved mode "${patientMode.mode}".`,
      );
    }
    const client = new TotemClient(request, env);

    test.info().annotations.push({ type: 'targetBaseUrl', description: env.baseUrl });

    await test.step('Login', async () => {
      const result = await client.login();
      expect(result.token).toBeTruthy();
    });

    const convenios = await test.step('List convenios', async () => {
      const data = await client.listConvenios();
      expect(data.length).toBeGreaterThan(0);
      return data;
    });

    const convenio = selectConvenio(convenios);
    if (!convenio) {
      throw new Error('Nenhum convênio disponível para prosseguir o fluxo.');
    }

    const especialidades = await test.step('List specialties', async () => {
      const data = await client.listEspecialidades();
      expect(data.length).toBeGreaterThan(0);
      return data;
    });

    const especialidade = selectEspecialidade(especialidades);
    if (!especialidade) {
      throw new Error('Nenhuma especialidade retornada pela API.');
    }

    test.info().annotations.push({
      type: 'convenio',
      description: `${convenio.convenio}:${convenio.nomefantasia ?? convenio.razaosocial ?? 'sem-nome'}`,
    });
    test.info().annotations.push({
      type: 'especialidade',
      description: `${especialidade.especialidade}:${especialidade.descricao}`,
    });

    const patientResult = await test.step('Find or create patient', async () => {
      return client.findOrCreatePatient({
        search: {
          cpf: patientMode.search.cpf,
          nasci: patientMode.search.nasci,
          nome: patientMode.search.nome,
          ...(patientMode.search.celular ? { celular: patientMode.search.celular } : {}),
        },
        create:
          patientMode.mode === 'create'
            ? {
              cpf: patientMode.create.cpf,
              nome: patientMode.create.nome,
              nasci: patientMode.create.nasci,
              celular: patientMode.create.celular,
              convenio: convenio.convenio,
            }
            : undefined,
      });
    });

    test.info().annotations.push({
      type: 'patientMode',
      description: `${patientMode.mode}-${patientResult.matched ? 'matched' : 'created'}`,
    });
    if (patientMode.mode === 'create') {
      test.info().annotations.push({
        type: 'createPayload',
        description: patientMode.metadata.generated ? 'generated' : 'env',
      });
    }

    await test.step('Generate atendimento', async () => {
      const response = await client.generateAtendimento({
        especialidade: especialidade.especialidade,
        convenio: convenio.convenio,
        nropaciente: patientResult.patientId,
      });
      expect(response.type).toBe('success');
    });
  });
});

