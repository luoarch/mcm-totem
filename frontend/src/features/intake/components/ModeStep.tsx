import { useFormContext } from 'react-hook-form'
import { Box, Stack, Typography } from '@mui/material'
import { SelectableButton } from '../../../components/atoms'
import type { IntakeFormValues, IntakeMode } from '../types'

const OPTIONS: Array<{
  value: IntakeMode
  title: string
}> = [
    { value: 'cpf', title: 'Tenho CPF' },
    { value: 'foreign', title: 'Sou estrangeiro' },
  ]

export function ModeStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IntakeFormValues>()

  const selectedMode = watch('intakeMode')

  const handleSelect = (mode: IntakeMode) => {
    setValue('intakeMode', mode, { shouldValidate: true, shouldDirty: true })
    if (mode === 'cpf') {
      setValue('patientSelection', 'existing', { shouldValidate: false })
    } else {
      setValue('patientSelection', 'new', { shouldValidate: false })
      setValue('existingPatientId', undefined, { shouldValidate: false })
    }
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 4, md: 6 },
      }}
    >
      <Stack spacing={{ xs: 2.5, md: 3 }} alignItems="center" sx={{ width: '100%' }}>
        <Stack spacing={0.4} alignItems="center">
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700, textAlign: 'center' }}>
            Como deseja se identificar?
          </Typography>
        </Stack>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 1.5, sm: 2 }}
          justifyContent="center"
          alignItems="stretch"
          sx={{ width: '100%', maxWidth: 520 }}
        >
          {OPTIONS.map((option) => {
            const isSelected = selectedMode === option.value
            return (
              <SelectableButton
                key={option.value}
                isSelected={isSelected}
                size="large"
                onClick={() => handleSelect(option.value)}
              >
                {option.title}
              </SelectableButton>
            )
          })}
        </Stack>

        {errors.intakeMode ? (
          <Typography
            variant="body2"
            color="error"
            sx={{ textAlign: 'center', fontSize: '0.9rem' }}
          >
            {errors.intakeMode.message}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  )
}

