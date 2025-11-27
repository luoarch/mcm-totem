import { Box, Stack, Typography } from '@mui/material'
import type { ConfirmationSnapshot } from '../types'

type ConfirmationStepProps = {
  confirmation: ConfirmationSnapshot
}

export function ConfirmationStep({ confirmation }: ConfirmationStepProps) {
  const heading = confirmation.manualAssistance ? 'Atendimento manual necessário' : 'Atendimento registrado'
  const description = confirmation.manualAssistance
    ? 'Leve este identificador ao balcão para concluir o atendimento com ajuda de um atendente.'
    : 'Utilize o identificador abaixo para acompanhar a chamada no painel.'
  const submittedAtLabel = confirmation.submittedAt
    ? new Date(confirmation.submittedAt).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : null

  return (
    <Stack spacing={{ xs: 2.5, md: 3.5 }} sx={{ height: '100%' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={1}>
          <Typography variant="h3" component="h2" sx={{ typography: { xs: 'h4', md: 'h3' } }}>
            {heading}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
            {description}
          </Typography>
          {submittedAtLabel ? (
            <Typography variant="body2" color="text.secondary">
              Gerado em {submittedAtLabel}. Anote ou fotografe o identificador.
            </Typography>
          ) : null}
        </Stack>
        <Box
          sx={{
            bgcolor: 'primary.dark',
            color: 'primary.contrastText',
            borderRadius: 4,
            px: { xs: 3, md: 5 },
            py: { xs: 2.5, md: 3 },
            textAlign: 'center',
            minWidth: { xs: '100%', md: 320 },
          }}
          role="status"
          aria-live="polite"
        >
          <Typography variant="overline" sx={{ opacity: 0.85 }}>
            Identificador público
          </Typography>
          <Typography
            variant="h3"
            component="p"
            sx={{ letterSpacing: 2, wordBreak: 'break-word', userSelect: 'all' }}
          >
            {confirmation.maskedIdentifier}
          </Typography>
        </Box>
      </Stack>

    </Stack>
  )
}

