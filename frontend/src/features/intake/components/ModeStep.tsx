import { useFormContext } from 'react-hook-form'
import { Box, Button, Stack, Typography } from '@mui/material'
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
              <Button
                key={option.value}
                variant={isSelected ? 'contained' : 'outlined'}
                size="large"
                onClick={() => handleSelect(option.value)}
                sx={{
                  flex: 1,
                  px: 3,
                  py: 1.6,
                  borderRadius: 10,
                  fontWeight: 700,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  boxShadow: isSelected ? '0 10px 18px rgba(26,115,232,0.18)' : 'none',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 16px rgba(15,79,171,0.18)',
                  },
                }}
              >
                {option.title}
              </Button>
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

