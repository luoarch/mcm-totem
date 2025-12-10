/**
 * Runtime validation schemas for MC AutoAtendimento API responses using Zod
 */

import { z } from 'zod'
import type {
  MCConvenioResponse,
  MCEspecialidadeResponse,
  MCCreatePatientResponse,
  MCAtendimentoResponse,
  MCPatientResponse,
} from '../types/intake'
import type { QueueEntry } from '../features/panel/types'

/**
 * Schema for patient response from API
 */
export const mcPatientResponseSchema = z.object({
  nropaciente: z.number(),
  nome: z.string().optional(),
  cpf: z.string().optional(),
  nasci: z.string().optional(),
  celular: z.string().optional(),
  email: z.string().optional(),
  nomesocial: z.string().nullable().optional(),
}) satisfies z.ZodType<MCPatientResponse>

/**
 * Schema for convenio (insurance) response from API
 */
export const mcConvenioResponseSchema = z
  .object({
    convenio: z.union([z.number(), z.string()]),
    nomefantasia: z.string().optional(),
    razaosocial: z.string().optional(),
  })
  .transform((value) => ({
    convenio: typeof value.convenio === 'number' ? value.convenio.toString() : value.convenio,
    nomefantasia: value.nomefantasia,
    razaosocial: value.razaosocial,
  })) satisfies z.ZodType<MCConvenioResponse>

/**
 * Schema for specialty response from API
 */
export const mcEspecialidadeResponseSchema = z
  .object({
    especialidade: z.union([z.number(), z.string()]),
    descricao: z.string(),
  })
  .transform((value) => ({
    especialidade: typeof value.especialidade === 'number' ? value.especialidade.toString() : value.especialidade,
    descricao: value.descricao,
  })) satisfies z.ZodType<MCEspecialidadeResponse>

/**
 * Schema for create patient response from API
 */
export const mcCreatePatientResponseSchema = z
  .object({
    ok: z.boolean(),
    nropac: z.number().optional(),
    msg: z.string().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .transform((value) => ({
    ok: value.ok,
    nropac: value.nropac,
    message: value.message ?? value.msg,
    error: value.error,
  })) satisfies z.ZodType<MCCreatePatientResponse>

/**
 * Schema for attendance (atendimento) response from API
 */
export const mcAtendimentoResponseSchema = z
  .object({
    type: z.enum(['success', 'error']),
    ok: z.boolean().optional(),
    msg: z.string().optional(),
    message: z.string().optional(),
  })
  .transform((value) => ({
    type: value.type,
    ok: value.ok,
    message: value.message ?? value.msg,
  })) satisfies z.ZodType<MCAtendimentoResponse>

/**
 * Schema for queue entry from WebSocket or API panel endpoint
 */
export const queueEntrySchema = z.object({
  id: z.string().min(1),
  patientLabel: z.string().min(1),
  specialty: z.string().min(1),
  status: z.enum(['waiting', 'called', 'in-progress']),
  calledAt: z.string().optional(),
  room: z.string().optional(),
}) satisfies z.ZodType<QueueEntry>

/**
 * Schema for array of queue entries (WebSocket/API response format)
 */
export const queueEntriesSchema = z.array(queueEntrySchema)

/**
 * Validate API response data with a Zod schema, returning validated data or throwing a sanitized error
 * @param data - Raw data from API response
 * @param schema - Zod schema to validate against
 * @param context - Context string for error messages (e.g., 'convenios', 'pacientes')
 * @returns Validated data matching the schema
 * @throws Error with sanitized message if validation fails
 */
export function validateApiResponse<T>(
  data: unknown,
  schema: z.ZodSchema<T>,
  context: string,
): T {
  const result = schema.safeParse(data)

  if (!result.success) {
    const issues = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    throw new Error(`Invalid ${context} response format: ${issues}`)
  }

  return result.data
}
