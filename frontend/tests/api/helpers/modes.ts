import { stripCpf } from '../../../src/utils/cpf';
import { isoToCreationFormat, isoToSearchFormat } from '../../../src/utils/date';
import type { TotemEnv } from './env';
import { loadTotemEnv } from './env';
import { generateBirthdateIso, generateCpf, generateFullName, generatePhone } from './random';

export type FlowMode = 'existing' | 'create';

type BirthdateFormats = {
  search: string;
  create: string;
};

export type ExistingPatientMode = {
  mode: 'existing';
  search: {
    cpf: string;
    nasci: string;
    nome: string;
    celular?: string;
  };
};

export type CreatePatientMode = {
  mode: 'create';
  search: {
    cpf: string;
    nasci: string;
    nome: string;
    celular?: string;
  };
  create: {
    cpf: string;
    nome: string;
    nasci: string;
    celular: string;
  };
  metadata: {
    generated: boolean;
  };
};

export type PatientModeConfig = ExistingPatientMode | CreatePatientMode;

const deriveBirthdateFormats = (value: string): BirthdateFormats => {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return {
      search: isoToSearchFormat(trimmed),
      create: isoToCreationFormat(trimmed),
    };
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
    const compact = trimmed.replace(/\//g, '');
    return {
      search: trimmed,
      create: compact,
    };
  }

  if (/^\d{8}$/.test(trimmed)) {
    return {
      create: trimmed,
      search: `${trimmed.slice(0, 2)}/${trimmed.slice(2, 4)}/${trimmed.slice(4)}`,
    };
  }

  throw new Error(
    `[totem-flow] Invalid birthdate format "${value}". Use ISO (YYYY-MM-DD), DD/MM/YYYY, or ddmmyyyy.`,
  )
};

const getRequestedMode = (): FlowMode =>
  process.env.TOTEM_FLOW_MODE?.toLowerCase() === 'create' ? 'create' : 'existing';

const loadExistingMode = (env: TotemEnv): ExistingPatientMode => {
  if (!env.patientFixture) {
    throw new Error(
      '[totem-flow] Existing patient mode requires TOTEM_PATIENT_CPF, TOTEM_PATIENT_NASCI e TOTEM_PATIENT_FIRSTNAME.',
    );
  }

  const birthdate = deriveBirthdateFormats(env.patientFixture.nasci);

  return {
    mode: 'existing',
    search: {
      cpf: stripCpf(env.patientFixture.cpf),
      nasci: birthdate.search,
      nome: env.patientFixture.firstName,
    },
  };
};

const readCreateEnv = () => {
  const cpf = process.env.TOTEM_CREATE_CPF?.trim();
  const nome = process.env.TOTEM_CREATE_FULLNAME?.trim();
  const nasci = process.env.TOTEM_CREATE_BIRTHDATE?.trim();
  const celular = process.env.TOTEM_CREATE_PHONE?.trim();

  if (cpf && nome && nasci && celular) {
    return { cpf, nome, nasci, celular };
  }

  return null;
};

const buildCreatePayload = (): {
  payload: { cpf: string; nome: string; nasci: string; celular: string };
  generated: boolean;
} => {
  const envPayload = readCreateEnv();

  if (envPayload) {
    return {
      payload: envPayload,
      generated: false,
    };
  }

  if (process.env.TOTEM_ALLOW_CREATE_MODE !== 'true') {
    throw new Error(
      '[totem-flow] Create mode is disabled. Set TOTEM_ALLOW_CREATE_MODE=true and provide TOTEM_CREATE_* vars or accept random generation.',
    );
  }

  const randomPayload = {
    cpf: generateCpf(),
    nome: generateFullName(),
    nasci: generateBirthdateIso(),
    celular: generatePhone(),
  };

  return {
    payload: randomPayload,
    generated: true,
  };
};

const loadCreateMode = (): CreatePatientMode => {
  if (process.env.TOTEM_ALLOW_CREATE_MODE !== 'true') {
    throw new Error(
      '[totem-flow] Create mode requires TOTEM_ALLOW_CREATE_MODE=true to avoid accidental patient creation.',
    );
  }

  const { payload, generated } = buildCreatePayload();
  const birthdate = deriveBirthdateFormats(payload.nasci);
  const firstName = payload.nome.split(' ')[0] ?? payload.nome;

  return {
    mode: 'create',
    search: {
      cpf: stripCpf(payload.cpf),
      nasci: birthdate.search,
      nome: firstName,
      celular: payload.celular,
    },
    create: {
      cpf: stripCpf(payload.cpf),
      nome: payload.nome,
      nasci: birthdate.create,
      celular: payload.celular,
    },
    metadata: {
      generated,
    },
  };
};

export const resolvePatientMode = (env?: TotemEnv): PatientModeConfig => {
  const mode = getRequestedMode();
  const effectiveEnv = env ?? loadTotemEnv({ requirePatientFixture: mode === 'existing' });

  return mode === 'create' ? loadCreateMode() : loadExistingMode(effectiveEnv);
};

