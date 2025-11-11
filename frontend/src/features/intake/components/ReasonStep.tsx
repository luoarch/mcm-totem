import { Controller, useFormContext } from 'react-hook-form'
import { Stack, TextField, Typography } from '@mui/material'
import type { IntakeFormValues } from '../types'
import { REASON_MAX_LENGTH } from '../constants'

export function ReasonStep() {
  const { control } = useFormContext<IntakeFormValues>()

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }} alignItems="center">
      <Stack spacing={0.4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Descreva o motivo do atendimento
        </Typography>
      </Stack>

      <Controller
        name="reason"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Motivo da visita"
            placeholder="Descreva brevemente o motivo"
            multiline
            minRows={4}
            maxRows={8}
            slotProps={{
              input: { inputProps: { maxLength: REASON_MAX_LENGTH } },
            }}
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? ' '}
            fullWidth
            size="small"
            sx={{ maxWidth: 640 }}
          />
        )}
      />
    </Stack>
  )
}
