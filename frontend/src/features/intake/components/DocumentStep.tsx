import { Controller, useFormContext } from 'react-hook-form'
import Grid from '@mui/material/Grid'
import { Stack, TextField, Typography } from '@mui/material'
import { formatCpf, stripCpf } from '../../../utils/cpf'
import type { IntakeFormValues } from '../types'

export function DocumentStep() {
  const { control } = useFormContext<IntakeFormValues>()

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }} alignItems="center">
      <Stack spacing={0.4} alignItems="center">
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textAlign: 'center' }}>
          Identifique o paciente
        </Typography>
      </Stack>

      <Grid
        container
        spacing={{ xs: 1.5, md: 2 }}
        justifyContent="center"
        sx={{ maxWidth: 680 }}
      >
        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="cpf"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="CPF"
                placeholder="000.000.000-00"
                value={formatCpf(field.value)}
                onChange={(event) => {
                  const rawValue = event.target.value
                  field.onChange(stripCpf(rawValue))
                }}
                inputMode="numeric"
                inputProps={{
                  maxLength: 14,
                }}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
                fullWidth
                size="medium"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Controller
            name="birthDate"
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
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
                fullWidth
                size="medium"
              />
            )}
          />
        </Grid>
      </Grid>
    </Stack>
  )
}

