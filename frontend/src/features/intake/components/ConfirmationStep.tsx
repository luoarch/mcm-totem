import { Box, Stack, Typography } from '@mui/material'
import type { ConfirmationSnapshot } from '../types'

type ConfirmationStepProps = {
  confirmation: ConfirmationSnapshot
}

export function ConfirmationStep({ confirmation }: ConfirmationStepProps) {
  return (
    <Stack spacing={{ xs: 2.5, md: 3.5 }} sx={{ height: '100%' }}>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={{ xs: 2, md: 3 }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        justifyContent="space-between"
      >
        <Stack spacing={1}>
          <Typography variant="h3" component="h2">
            Atendimento registrado
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 520 }}>
            Utilize o identificador abaixo para acompanhar a chamada no painel.
          </Typography>
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
        >
          <Typography variant="overline" sx={{ opacity: 0.85 }}>
            Identificador público
          </Typography>
          <Typography variant="h3" component="p">
            {confirmation.maskedIdentifier}
          </Typography>
        </Box>
      </Stack>

    </Stack>
  )
}

