import { Controller, useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import type { PayerOption } from '../../../types/intake'
import type { IntakeFormValues } from '../types'

type CoverageStepProps = {
  convenios: PayerOption[]
}

export function CoverageStep({ convenios }: CoverageStepProps) {
  const { control, watch, setValue } = useFormContext<IntakeFormValues>()
  const coverageType = watch('coverageType')

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }} alignItems="center">
      <Stack spacing={0.4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Como será o atendimento?
        </Typography>
      </Stack>

      <Controller
        name="coverageType"
        control={control}
        render={({ field }) => (
          <Stack spacing={1} sx={{ width: '100%', maxWidth: 520 }}>
            <ToggleButtonGroup
              exclusive
              value={field.value}
              onChange={(_, value) => {
                if (!value) return
                field.onChange(value)
                if (value === 'particular') {
                  setValue('convenioId', undefined, { shouldValidate: true })
                }
              }}
              sx={{
                justifyContent: 'center',
                '& .MuiToggleButton-root': {
                  px: 4,
                  py: 1.6,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 10,
                  borderColor: 'rgba(255, 255, 255, 0.28)',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: 'primary.contrastText',
                    backgroundColor: 'rgba(26, 115, 232, 0.9)',
                    boxShadow: '0 12px 24px rgba(26,115,232,0.28)',
                    borderColor: 'rgba(26,115,232,0.35)',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(26,115,232,0.12)',
                    borderColor: 'rgba(26,115,232,0.2)',
                  },
                },
              }}
            >
              <ToggleButton value="particular">Particular</ToggleButton>
              <ToggleButton value="convenio">Convênio</ToggleButton>
            </ToggleButtonGroup>
          </Stack>
        )}
      />

      {coverageType === 'convenio' ? (
        <Controller
          name="convenioId"
          control={control}
          render={({ field, fieldState }) => (
            <FormControl error={Boolean(fieldState.error)} sx={{ width: '100%', maxWidth: 520 }}>
              <InputLabel id="convenio-id-label">Convênio</InputLabel>
              <Select
                {...field}
                labelId="convenio-id-label"
                label="Convênio"
                size="medium"
                MenuProps={{
                  PaperProps: { sx: { maxHeight: 360 } },
                }}
              >
                {convenios.map((option) => (
                  <MenuItem key={option.id} value={option.id}>
                    {option.name}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {fieldState.error?.message ?? ' '}
              </FormHelperText>
            </FormControl>
          )}
        />
      ) : null}
    </Stack>
  )
}

