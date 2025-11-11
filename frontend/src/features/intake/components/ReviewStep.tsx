import { useFormContext } from 'react-hook-form'
import { Box, Divider, Stack, Typography } from '@mui/material'
import { formatCpf } from '../../../utils/cpf'
import type { IntakeFormValues } from '../types'

export type ReviewSummary = {
  patient: string
  coverage: string
  specialty: string
}

type ReviewStepProps = {
  summary: ReviewSummary
}

export function ReviewStep({ summary }: ReviewStepProps) {
  const { watch } = useFormContext<IntakeFormValues>()
  const values = watch()

  const birthDateSource =
    values.intakeMode === 'foreign' ? values.foreignBirthDate : values.birthDate
  const birthDateLabel = birthDateSource
    ? new Date(birthDateSource).toLocaleDateString('pt-BR')
    : '—'

  const cpfLabel =
    values.intakeMode === 'foreign'
      ? 'Cadastro estrangeiro'
      : formatCpf(values.cpf) || '—'

  const reasonLabel = values.reason.trim() || 'Não informado'

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }} alignItems="center">
      <Stack spacing={0.4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Revise os dados do atendimento
        </Typography>
      </Stack>

      <Box
        sx={{
          width: '100%',
          maxWidth: 680,
          borderRadius: 2,
          bgcolor: (theme) => theme.palette.grey[100],
          px: { xs: 2.5, md: 3 },
          py: { xs: 2, md: 2.5 },
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
          Motivo informado
        </Typography>
        <Typography variant="body1" sx={{ mt: 1 }} color="text.secondary">
          {reasonLabel}
        </Typography>
      </Box>

      <Divider sx={{ width: '100%', maxWidth: 680, opacity: 0.2 }} />

      <Box sx={{ width: '100%', maxWidth: 680 }}>
        <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Dados do atendimento
        </Typography>
        <Stack spacing={1.25}>
          <SummaryLine
            label={values.intakeMode === 'foreign' ? 'Documento' : 'CPF'}
            value={cpfLabel}
          />
          <SummaryLine label="Data de nascimento" value={birthDateLabel} />
          {values.intakeMode === 'foreign' && values.foreignEmail ? (
            <SummaryLine label="Contato" value={values.foreignEmail} />
          ) : null}
          <SummaryLine label="Paciente" value={summary.patient} />
          <SummaryLine label="Forma de atendimento" value={summary.coverage} />
          <SummaryLine label="Especialidade" value={summary.specialty} />
        </Stack>
      </Box>
    </Stack>
  )
}

type SummaryLineProps = {
  label: string
  value: string
}

function SummaryLine({ label, value }: SummaryLineProps) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={0.75}
      alignItems={{ xs: 'flex-start', sm: 'center' }}
    >
      <Typography variant="subtitle1" fontWeight={600} sx={{ minWidth: { sm: 220 }, opacity: 0.78 }}>
        {label}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {value}
      </Typography>
    </Stack>
  )
}


