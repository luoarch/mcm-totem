const FIRST_NAMES = [
  'Maria',
  'Joao',
  'Ana',
  'Lucas',
  'Beatriz',
  'Gabriel',
  'Fernanda',
  'Rafael',
  'Camila',
  'Pedro',
];

const LAST_NAMES = [
  'Silva',
  'Souza',
  'Oliveira',
  'Pereira',
  'Costa',
  'Rodrigues',
  'Almeida',
  'Nascimento',
  'Lima',
  'Fernandes',
];

const randomItem = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];

const computeCpfDigit = (numbers: number[]): number => {
  const startWeight = numbers.length + 1;
  const sum = numbers.reduce((acc, digit, index) => acc + digit * (startWeight - index), 0);
  const mod = sum % 11;
  return mod < 2 ? 0 : 11 - mod;
};

const INVALID_CPF_PATTERNS = new Set([
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  '12345678909',
]);

export const generateCpf = (): string => {
  while (true) {
    const baseDigits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));

    if (baseDigits.every((digit) => digit === baseDigits[0])) {
      baseDigits[baseDigits.length - 1] = (baseDigits[baseDigits.length - 1] + 1) % 10;
    }

    const digit1 = computeCpfDigit(baseDigits);
    const digit2 = computeCpfDigit([...baseDigits, digit1]);

    const cpf = [...baseDigits, digit1, digit2].join('');
    if (!INVALID_CPF_PATTERNS.has(cpf)) {
      return cpf;
    }
  }
};

export const generateFullName = (): string => `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)}`;

export const generateBirthdateIso = (startYear = 1960, endYear = 2005): string => {
  const year = Math.floor(Math.random() * (endYear - startYear + 1)) + startYear;
  const month = Math.floor(Math.random() * 12);
  const day = Math.floor(Math.random() * 28) + 1;
  const date = new Date(Date.UTC(year, month, day));
  return date.toISOString().slice(0, 10);
};

export const generatePhone = (): string => {
  const availableDdds = [
    11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 31, 32, 33, 34, 35, 37, 41, 42, 43, 44, 45, 47, 48, 51, 53, 54,
    55, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88, 89, 91, 92, 93, 94,
    95, 96, 97, 98, 99,
  ];
  const ddd = randomItem(availableDdds);
  const suffix = Math.floor(Math.random() * 100_000_000)
    .toString()
    .padStart(8, '0');
  return `55${ddd}9${suffix}`;
};

export const isoToSearchDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

export const isoToCreateDate = (isoDate: string): string => {
  const [year, month, day] = isoDate.split('-');
  return `${day}${month}${year}`;
};

