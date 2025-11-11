const CPF_LENGTH = 11

export function stripCpf(value: string): string {
  return value.replace(/\D+/g, '').slice(0, CPF_LENGTH)
}

export function formatCpf(value: string): string {
  const digits = stripCpf(value)
  if (digits.length <= 3) {
    return digits
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`
  }
  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  }
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(
    6,
    9,
  )}-${digits.slice(9, 11)}`
}

export function isValidCpf(rawValue: string): boolean {
  const cpf = stripCpf(rawValue)

  if (cpf.length !== CPF_LENGTH) {
    return false
  }

  if (/^(\d)\1{10}$/.test(cpf)) {
    return false
  }

  const calcVerifier = (factor: number): number => {
    let total = 0

    for (let i = 0; i < factor - 1; i += 1) {
      total += parseInt(cpf[i] ?? '0', 10) * (factor - i)
    }

    const mod = (total * 10) % 11
    return mod === 10 ? 0 : mod
  }

  const digit1 = calcVerifier(10)
  if (digit1 !== parseInt(cpf[9] ?? '0', 10)) {
    return false
  }

  const digit2 = calcVerifier(11)
  return digit2 === parseInt(cpf[10] ?? '0', 10)
}

