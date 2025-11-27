import { performance } from 'node:perf_hooks';
import type { APIRequestContext, APIResponse } from '@playwright/test';
import { z } from 'zod';

import { stripCpf } from '../../../src/utils/cpf';
import { formatPhoneE164 } from '../../../src/utils/phone';
import type { TotemEnv } from './env';
import { loadTotemEnv } from './env';
import { createLogger, type SafeLogger } from './logging';

const loginSchema = z.object({
  token: z.string().min(1),
  codacesso: z.union([z.number(), z.string()]).optional(),
});

const patientSchema = z.object({
  nropaciente: z.number(),
  nome: z.string().optional(),
  cpf: z.string().optional(),
  nasci: z.string().optional(),
  celular: z.string().optional(),
});

const convenioSchema = z.object({
  convenio: z.union([z.number(), z.string()]).transform((value) => value.toString()),
  nomefantasia: z.string().optional(),
  razaosocial: z.string().optional(),
});

const especialidadeSchema = z.object({
  especialidade: z.union([z.number(), z.string()]).transform((value) => value.toString()),
  descricao: z.string(),
});

const createPatientSchema = z
  .object({
    ok: z.boolean(),
    nropac: z.number().optional(),
    msg: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .transform((value) => ({
    ...value,
    message: value.message ?? value.msg,
  }));

const atendimentoSchema = z
  .object({
    type: z.enum(['success', 'error']),
    msg: z.string().optional(),
    message: z.string().optional(),
    ok: z.boolean().optional(),
  })
  .transform((value) => ({
    ...value,
    message: value.message ?? value.msg,
  }));

const errorEnvelopeSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
});

type LoginPayload = z.infer<typeof loginSchema>;
export type PatientRecord = z.infer<typeof patientSchema>;
export type ConvenioRecord = z.infer<typeof convenioSchema>;
export type EspecialidadeRecord = z.infer<typeof especialidadeSchema>;

type HttpMethod = 'GET' | 'POST';

type RequestOptions<TSchema extends z.ZodTypeAny> = {
  method: HttpMethod;
  endpoint: string;
  params?: Record<string, string>;
  data?: URLSearchParams;
  schema: TSchema;
  label: string;
  includeAuth?: boolean;
};

const AUTH_ERROR_CODES = new Set([401, 403]);

const toUrl = (baseUrl: string, endpoint: string) => {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return new URL(normalizedEndpoint, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString();
};

const formData = (payload: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    params.append(key, value.toString());
  });
  return params;
};

const sortPatients = (patients: PatientRecord[]) =>
  [...patients].sort((a, b) => b.nropaciente - a.nropaciente);

const normalizePhoneDigits = (rawPhone: string) => formatPhoneE164(rawPhone).replace(/\D/g, '');

export class TotemClient {

  private loginInfo: LoginPayload | null = null;

  private readonly request: APIRequestContext;

  private readonly logger: SafeLogger;

  private readonly env: TotemEnv;

  constructor(request: APIRequestContext, env: TotemEnv, logger: SafeLogger = createLogger()) {
    if (!env.credentials) {
      throw new Error('[totem-client] Credentials are required. Did you call loadTotemEnv()?');
    }
    this.request = request;
    this.env = env;
    this.logger = logger;
  }

  static from(request: APIRequestContext, logger?: SafeLogger) {
    return new TotemClient(request, loadTotemEnv(), logger);
  }

  async login(force = false) {
    if (this.loginInfo && !force) {
      return this.loginInfo;
    }

    const credentials = this.env.credentials;
    if (!credentials) {
      throw new Error('[totem-client] Missing credentials');
    }

    const response = await this.performRequest({
      method: 'POST',
      endpoint: '/login/externo',
      data: formData({
        empresa: credentials.empresa,
        username: credentials.username,
        password: credentials.password,
        integracaowhatsapp: 'S',
      }),
      schema: loginSchema,
      label: 'login',
      includeAuth: false,
    });

    this.loginInfo = response;
    if (!this.env.companyCode && response.codacesso) {
      this.env.companyCode = response.codacesso.toString();
    }
    return response;
  }

  async searchPatients(args: {
    cpf: string;
    nasci: string;
    nome?: string;
    celular?: string;
  }): Promise<PatientRecord[]> {
    const params: Record<string, string> = {
      integracaowhatsapp: 'S',
      autoagendamento: 'true',
      cpf: stripCpf(args.cpf),
      nasci: args.nasci,
    };

    if (args.nome) {
      params.nome = args.nome;
    }
    if (args.celular) {
      params.celular = normalizePhoneDigits(args.celular);
    }

    const patients = await this.performRequest({
      method: 'GET',
      endpoint: '/pacientesautoage',
      params,
      schema: z.array(patientSchema),
      label: 'pacientesautoage',
      includeAuth: true,
    });

    return sortPatients(patients);
  }

  async createPatient(payload: {
    cpf: string;
    nome: string;
    nasci: string;
    celular: string;
    convenio: string;
  }) {
    const body = formData({
      cpf: stripCpf(payload.cpf),
      nome: payload.nome,
      nasci: payload.nasci,
      celular: normalizePhoneDigits(payload.celular),
      convenio: payload.convenio,
      integracaowhatsapp: 'S',
    });

    const response = await this.performRequest({
      method: 'POST',
      endpoint: '/pacientesautoage',
      data: body,
      schema: createPatientSchema,
      label: 'create-paciente',
      includeAuth: true,
    });

    if (response.ok && typeof response.nropac === 'number') {
      return response.nropac;
    }

    throw new Error(
      response.message ??
      response.error ??
      'Falha desconhecida ao criar paciente. Consulte os logs para mais detalhes.',
    );
  }

  async listConvenios() {
    const convenios = await this.performRequest({
      method: 'GET',
      endpoint: '/convenios',
      params: {
        permiteagweb: 'S',
        integracaowhatsapp: 'S',
        codempresa: this.resolveCompanyCode(),
      },
      schema: z.array(convenioSchema),
      label: 'convenios',
      includeAuth: true,
    });

    return convenios;
  }

  async listEspecialidades() {
    const especialidades = await this.performRequest({
      method: 'GET',
      endpoint: '/especialidades',
      params: {
        permiteagweb: 'S',
        integracaowhatsapp: 'S',
        codempresa: this.resolveCompanyCode(),
      },
      schema: z.array(especialidadeSchema),
      label: 'especialidades',
      includeAuth: true,
    });

    return especialidades;
  }

  async generateAtendimento(payload: {
    especialidade: string;
    convenio: string;
    nropaciente: number | string;
  }) {
    const body = formData({
      autoagendamento: 'true',
      especialidade: payload.especialidade,
      convenio: payload.convenio,
      nropaciente: payload.nropaciente.toString(),
      tipo: 'e',
      integracaowhatsapp: 'S',
    });

    const response = await this.performRequest({
      method: 'POST',
      endpoint: '/atendimentoboletim',
      data: body,
      schema: atendimentoSchema,
      label: 'atendimentoboletim',
      includeAuth: true,
    });

    if (response.type !== 'success') {
      throw new Error(response.message ?? 'Atendimento retornou erro inesperado.');
    }

    return response;
  }

  async findOrCreatePatient(options: {
    search: {
      cpf: string;
      nasci: string;
      nome?: string;
      celular?: string;
    };
    create?: {
      cpf: string;
      nome: string;
      nasci: string;
      celular: string;
      convenio: string;
    };
  }): Promise<{ patientId: number; matched: boolean }> {
    const matches = await this.searchPatients(options.search);
    if (matches.length > 0) {
      const topMatch = matches[0];
      return {
        patientId: Number(topMatch.nropaciente),
        matched: true,
      };
    }

    if (!options.create) {
      throw new Error(
        '[totem-client] Nenhum paciente encontrado e payload de criação não fornecido.',
      );
    }

    const createdId = await this.createPatient(options.create);

    return { patientId: createdId, matched: false };
  }

  private async performRequest<TSchema extends z.ZodTypeAny>(
    {
      method,
      endpoint,
      params,
      data,
      schema,
      label,
      includeAuth = true,
    }: RequestOptions<TSchema>,
    attempt = 0,
  ): Promise<z.infer<TSchema>> {
    if (includeAuth) {
      await this.login(attempt > 0);
    }

    const url = toUrl(this.env.baseUrl, endpoint);
    const headers: Record<string, string> = {};

    if (includeAuth && this.loginInfo?.token) {
      headers.Authorization = `Bearer ${this.loginInfo.token}`;
    }

    if (data) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    const startedAt = performance.now();
    const response = await this.request.fetch(url, {
      method,
      params,
      data: data?.toString(),
      headers,
    });
    const durationMs = performance.now() - startedAt;

    if (includeAuth && AUTH_ERROR_CODES.has(response.status())) {
      this.logger.info(`HTTP ${method} ${endpoint}`, {
        status: response.status(),
        durationMs: Math.round(durationMs),
        attempt,
        success: false,
        error: `auth:${response.status()}`,
      });
      if (attempt >= 1) {
        throw new Error(
          `[totem-client] Authentication failed for ${method} ${endpoint} even after refresh.`,
        );
      }
      this.loginInfo = null;
      this.logger.warn(`Auth error on ${method} ${endpoint}. Retrying with refreshed token.`);
      return this.performRequest(
        {
          method,
          endpoint,
          params,
          data,
          schema,
          label,
          includeAuth,
        },
        attempt + 1,
      );
    }

    let parseError: unknown;
    try {
      const payload = await this.parseResponse(response, schema, label);
      return payload;
    } catch (error) {
      parseError = error;
      throw error;
    } finally {
      this.logger.info(`HTTP ${method} ${endpoint}`, {
        status: response.status(),
        durationMs: Math.round(durationMs),
        attempt,
        success: !parseError,
        error: parseError instanceof Error ? parseError.message : undefined,
      });
    }
  }

  private async parseResponse<TSchema extends z.ZodTypeAny>(
    response: APIResponse,
    schema: TSchema,
    label: string,
  ): Promise<z.infer<TSchema>> {
    if (!response.ok()) {
      const text = await response.text();
      let message = text;
      try {
        const parsed = errorEnvelopeSchema.parse(JSON.parse(text));
        message = parsed.message ?? parsed.error ?? text;
      } catch {
        // noop
      }
      throw new Error(`[totem-client] ${label} failed (${response.status()}): ${message}`);
    }

    const json = await response.json();
    return schema.parse(json);
  }

  private resolveCompanyCode(): string {
    if (this.env.companyCode) {
      return this.env.companyCode;
    }
    if (this.loginInfo?.codacesso) {
      return this.loginInfo.codacesso.toString();
    }
    throw new Error(
      '[totem-client] company code is missing. Provide TOTEM_COMPANY_CODE or ensure login returns codacesso.',
    );
  }
}

