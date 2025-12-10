import { useFormContext } from 'react-hook-form'
import { Box, Button, Grid, Stack, Typography } from '@mui/material'
import {
  ChildCareRounded,
  FemaleRounded,
  HealingRounded,
  LocalHospitalRounded,
} from '@mui/icons-material'
import type { SvgIconComponent } from '@mui/icons-material'
import type { SpecialtyOption } from '../../../types/intake'
import type { IntakeFormValues } from '../types'

type SpecialtyStepProps = {
  specialties: SpecialtyOption[]
}

const specialtyIcons: Record<string, SvgIconComponent> = {
  'clinico-geral': LocalHospitalRounded,
  trauma: HealingRounded,
  pediatria: ChildCareRounded,
  ginecologia: FemaleRounded,
}

export function SpecialtyStep({ specialties }: SpecialtyStepProps) {
  const { watch, setValue, formState } = useFormContext<IntakeFormValues>()
  const selectedSpecialty = watch('specialtyId')
  const errorMessage = formState.errors.specialtyId?.message

  return (
    <Stack spacing={{ xs: 2.5, md: 3 }} alignItems="center">
      <Stack spacing={0.4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          Qual a especialidade?
        </Typography>
      </Stack>

      <Grid
        container
        spacing={2}
        justifyContent="center"
        sx={{
          width: '100%',
          maxWidth: 840,
          px: { xs: 2, md: 0 },
        }}
      >
        {specialties.map((specialty) => {
          const isSelected = selectedSpecialty === specialty.id
          const IconComponent = specialtyIcons[specialty.id] ?? LocalHospitalRounded
          return (
            <Grid key={specialty.id} size={{ xs: 12, sm: 6, md: 6 }}>
              <Button
                fullWidth
                variant={isSelected ? 'contained' : 'text'}
                size="large"
                onClick={() => setValue('specialtyId', specialty.id, { shouldValidate: true })}
                startIcon={<IconComponent fontSize="medium" />}
                sx={{
                  py: 2.5,
                  px: 3,
                  gap: 2,
                  borderRadius: 3,
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  cursor: 'pointer',
                  position: 'relative',
                  ...(isSelected
                    ? {
                      backgroundColor: '#1A73E8',
                      color: 'rgba(255, 255, 255, 0.95)',
                      border: '2px solid rgba(26, 115, 232, 0.6)',
                      boxShadow: '0 8px 20px rgba(26,115,232,0.3)',
                      '&:hover': {
                        backgroundColor: '#0F4FAB',
                        borderColor: '#0F4FAB',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 12px 24px rgba(26,115,232,0.35)',
                      },
                    }
                    : {
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: 'text.primary',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        borderColor: 'rgba(255, 255, 255, 0.4)',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      },
                    }),
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <Stack spacing={0.8} sx={{ width: '100%' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600 }}>
                      {specialty.name}
                    </Typography>
                    {isSelected && (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: 'rgba(255, 255, 255, 0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ color: 'white', fontSize: '0.875rem', fontWeight: 700 }}>
                          ✓
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                  {specialty.description ? (
                    <Typography
                      variant="body2"
                      sx={{
                        color: isSelected ? 'rgba(255,255,255,0.9)' : 'text.secondary',
                        lineHeight: 1.5,
                        fontSize: '0.875rem',
                      }}
                    >
                      {specialty.description}
                    </Typography>
                  ) : null}
                </Stack>
              </Button>
            </Grid>
          )
        })}
      </Grid>

      {errorMessage ? (
        <Typography variant="body2" color="error" textAlign="center">
          {errorMessage}
        </Typography>
      ) : null}
    </Stack>
  )
}

