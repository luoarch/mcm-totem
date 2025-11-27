type EnvOptions = {
  requirePatientFixture?: boolean;
  requireCredentials?: boolean;
};

export type TotemCredentials = {
  empresa: string;
  username: string;
  password: string;
};

export type TotemPatientFixture = {
  cpf: string;
  nasci: string;
  firstName: string;
};

export type TotemEnv = {
  baseUrl: string;
  allowProdE2E: boolean;
  credentials?: TotemCredentials;
  patientFixture?: TotemPatientFixture;
  companyCode?: string;
};

const PROD_HOST_SNIPPETS = ['gestaosaude.mcinfor-saude.net.br'];

const loggedTargets = new Set<string>();

const mustGet = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`[totem-env] Missing required environment variable: ${name}`);
  }
  return value;
};

const logTarget = (baseUrl: string) => {
  if (loggedTargets.has(baseUrl)) return;
  loggedTargets.add(baseUrl);
   
  console.info(`[totem-e2e] Target base URL: ${baseUrl}`);
};

const guardProdTarget = (baseUrl: string, allowProd: boolean) => {
  try {
    const { hostname } = new URL(baseUrl);
    const matchesProd = PROD_HOST_SNIPPETS.some((snippet) =>
      hostname.toLowerCase().includes(snippet),
    );
    if (matchesProd && !allowProd) {
      throw new Error(
        `[totem-env] Refusing to run against production host "${hostname}". Set ALLOW_PROD_E2E=true if you really intend to target production.`,
      );
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('[totem-env]')) {
      throw error;
    }
    throw new Error(`[totem-env] Invalid TOTEM_BASE_URL: ${baseUrl}`);
  }
};

const loadCredentials = (): TotemCredentials => ({
  empresa: mustGet('TOTEM_LOGIN_EMPRESA'),
  username: mustGet('TOTEM_LOGIN_USERNAME'),
  password: mustGet('TOTEM_LOGIN_PASSWORD'),
});

const loadPatientFixture = (): TotemPatientFixture => ({
  cpf: mustGet('TOTEM_PATIENT_CPF'),
  nasci: mustGet('TOTEM_PATIENT_NASCI'),
  firstName: mustGet('TOTEM_PATIENT_FIRSTNAME'),
});

export const loadTotemEnv = (options: EnvOptions = {}): TotemEnv => {
  const baseUrl = mustGet('TOTEM_BASE_URL');
  const allowProdE2E = process.env.ALLOW_PROD_E2E === 'true';

  guardProdTarget(baseUrl, allowProdE2E);
  logTarget(baseUrl);

  const env: TotemEnv = {
    baseUrl,
    allowProdE2E,
    companyCode: process.env.TOTEM_COMPANY_CODE,
  };

  if (options.requireCredentials !== false) {
    env.credentials = loadCredentials();
  }

  if (options.requirePatientFixture) {
    env.patientFixture = loadPatientFixture();
  } else if (
    process.env.TOTEM_PATIENT_CPF &&
    process.env.TOTEM_PATIENT_NASCI &&
    process.env.TOTEM_PATIENT_FIRSTNAME
  ) {
    env.patientFixture = loadPatientFixture();
  }

  return env;
};

