import { Controller, useFormContext } from 'react-hook-form'
import { Stack, TextField, Typography } from '@mui/material'
import type { IntakeFormValues } from '../types'

export function ForeignStep() {
  const { control } = useFormContext<IntakeFormValues>()

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <div>
        <Typography variant="h3" component="h2" gutterBottom>
          Informe seus dados básicos
        </Typography>
      </div>

      <Controller
        name="foreignName"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="Nome completo"
            placeholder="Nome e sobrenome"
            autoFocus
            fullWidth
            size="medium"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? ' '}
          />
        )}
      />

      <Controller
        name="foreignBirthDate"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            type="date"
            label="Data de nascimento"
            InputLabelProps={{ shrink: true }}
            inputProps={{
              max: new Date().toISOString().split('T')[0],
            }}
            fullWidth
            size="medium"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? ' '}
          />
        )}
      />

      <Controller
        name="foreignEmail"
        control={control}
        render={({ field, fieldState }) => (
          <TextField
            {...field}
            label="E-mail (opcional)"
            placeholder="nome@email.com"
            type="email"
            fullWidth
            size="medium"
            error={Boolean(fieldState.error)}
            helperText={fieldState.error?.message ?? ' '}
          />
        )}
      />
    </Stack>
  )
}

