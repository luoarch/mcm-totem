import { stripCpf } from './cpf'
import type { IntakeMode } from '../features/intake/types'

type MaskOptions = {
  intakeMode: IntakeMode
  name: string
  cpf?: string
  birthDate?: string
}

const createNamePrefix = (name: string) => {
  if (!name) {
    return 'Paciente'
  }
  const trimmed = name.trim()
  if (!trimmed) {
    return 'Paciente'
  }
  const [first, second] = trimmed.split(/\s+/)
  return second ? `${first} ${second.charAt(0)}.` : first
}

export function createMaskedIdentifier({
  intakeMode,
  name,
  cpf,
  birthDate,
}: MaskOptions): string {
  const prefix = createNamePrefix(name)

  if (intakeMode === 'cpf') {
    const digits = stripCpf(cpf ?? '')
    const suffix = digits.slice(-3) || '000'
    return `${prefix} ***${suffix}`
  }

  const dateDigits = birthDate?.replace(/\D+/g, '') ?? ''
  const suffix = dateDigits.slice(-4) || 'EXT'
  return `${prefix} ***${suffix}`
}

