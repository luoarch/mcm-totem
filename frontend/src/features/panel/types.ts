export type QueueStatus = 'waiting' | 'called' | 'in-progress'

export type QueueEntry = {
  id: string
  patientLabel: string
  specialty: string
  status: QueueStatus
  calledAt?: string
  room?: string
}

export type QueuePanelState = {
  entries: QueueEntry[]
  lastUpdatedAt: number | null
}

