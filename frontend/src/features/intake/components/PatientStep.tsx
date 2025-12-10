import { useMemo } from 'react'
import { Controller, useFormContext } from 'react-hook-form'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import type { PatientMatch } from '../../../types/intake'
import { formatCpf } from '../../../utils/cpf'
import type { IntakeFormValues } from '../types'

type LookupStatus = 'idle' | 'loading' | 'success' | 'error'

type PatientStepProps = {
  matches: PatientMatch[]
  status: LookupStatus
  onRetry: () => void
}

export function PatientStep({ matches, status, onRetry }: PatientStepProps) {
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IntakeFormValues>()

  const patientSelection = watch('patientSelection')
  const selectedPatientId = watch('existingPatientId')

  const hasMatches = matches.length > 0

  const hasValidSocialName = (socialName: string | undefined | null): boolean => {
    if (socialName === null || socialName === undefined) return false
    return socialName.trim() !== ''
  }
  const heading = useMemo(() => {
    if (status === 'loading') return 'Buscando paciente...'
    if (hasMatches) return 'Confirme o paciente'
    return 'Cadastrar novo paciente'
  }, [status, hasMatches])

  const handleSelectExisting = (patientId: string) => {
    setValue('patientSelection', 'existing', { shouldValidate: true })
    setValue('existingPatientId', patientId, { shouldValidate: true })
  }

  const handleSelectNew = () => {
    setValue('patientSelection', 'new', { shouldValidate: true })
    setValue('existingPatientId', undefined)
  }

  return (
    <Stack spacing={{ xs: 3, md: 3.5 }} alignItems="center">
      <Stack spacing={0.4} alignItems="center" sx={{ textAlign: 'center' }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
          {heading}
        </Typography>
      </Stack>

      {status === 'loading' ? (
        <Box display="flex" justifyContent="center" py={5}>
          <CircularProgress size={64} thickness={5} />
        </Box>
      ) : null}

      {status === 'error' ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={onRetry}>
              Tentar novamente
            </Button>
          }
          sx={{ maxWidth: 640, width: '100%' }}
        >
          Não foi possível consultar o cadastro. Verifique a conexão ou chame um atendente.
        </Alert>
      ) : null}

      {hasMatches ? (
        <Stack spacing={1.25} sx={{ width: '100%', maxWidth: 720 }}>
          <List
            sx={{
              width: '100%',
              p: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.25,
            }}
          >
            {matches.map((match) => {
              const isSelected = selectedPatientId === match.id && patientSelection === 'existing'

              return (
                <ListItem
                  key={match.id}
                  component="button"
                  type="button"
                  onClick={() => handleSelectExisting(match.id)}
                  sx={{
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    textAlign: 'left',
                    cursor: 'pointer',
                    py: { xs: 1.05, md: 1.25 },
                    px: { xs: 1.8, md: 2.3 },
                    borderRadius: 2,
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'rgba(26, 115, 232, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                    borderWidth: isSelected ? 2 : 1,
                    backgroundColor: isSelected ? '#1A73E8' : 'rgba(255, 255, 255, 0.15)',
                    backdropFilter: isSelected ? 'none' : 'blur(12px)',
                    WebkitBackdropFilter: isSelected ? 'none' : 'blur(12px)',
                    color: isSelected ? 'rgba(255, 255, 255, 0.95)' : 'text.primary',
                    boxShadow: isSelected ? '0 4px 12px rgba(26,115,232,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: isSelected ? '#0F4FAB' : 'rgba(255, 255, 255, 0.2)',
                      borderColor: isSelected ? '#0F4FAB' : 'rgba(255, 255, 255, 0.4)',
                      transform: 'translateY(-1px)',
                      boxShadow: isSelected ? '0 6px 16px rgba(26,115,232,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  <ListItemText
                    primary={
                      <Stack spacing={0.5}>
                        <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {match.name}
                        </Typography>
                        {hasValidSocialName(match.socialName) ? (
                          <Typography
                            variant="body2"
                            sx={{
                              color: isSelected ? 'rgba(255, 255, 255, 0.9)' : 'text.secondary',
                              fontStyle: 'italic',
                              lineHeight: 1.2,
                            }}
                          >
                            Nome social: {match.socialName?.trim()}
                          </Typography>
                        ) : null}
                      </Stack>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        sx={{
                          color: isSelected ? 'rgba(255, 255, 255, 0.8)' : 'text.secondary',
                          display: 'flex',
                          columnGap: 1,
                          rowGap: 0.5,
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          lineHeight: 1.35,
                        }}
                      >
                        <span>Nasc.: {new Date(match.birthDate).toLocaleDateString('pt-BR')}</span>
                        <Divider orientation="vertical" flexItem sx={{ height: 16, mx: 0.5 }} />
                        <span>CPF: {formatCpf(match.document)}</span>
                      </Typography>
                    }
                    sx={{ mr: 1.5, ml: 0.5 }}
                  />
                  {isSelected ? (
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
                  ) : null}
                </ListItem>
              )
            })}

            <ListItem
              component="button"
              type="button"
              onClick={handleSelectNew}
              sx={{
                display: 'flex',
                justifyContent: 'center',
                py: { xs: 1.05, md: 1.25 },
                px: { xs: 1.8, md: 2.3 },
                borderRadius: 2,
                borderStyle: 'dashed',
                borderColor: patientSelection === 'new' ? 'rgba(26, 115, 232, 0.6)' : 'rgba(255, 255, 255, 0.3)',
                borderWidth: patientSelection === 'new' ? 2 : 1,
                backgroundColor:
                  patientSelection === 'new' ? '#1A73E8' : 'rgba(255, 255, 255, 0.15)',
                backdropFilter: patientSelection === 'new' ? 'none' : 'blur(12px)',
                WebkitBackdropFilter: patientSelection === 'new' ? 'none' : 'blur(12px)',
                color: patientSelection === 'new' ? 'rgba(255, 255, 255, 0.95)' : 'text.primary',
                cursor: 'pointer',
                boxShadow: patientSelection === 'new' ? '0 4px 12px rgba(26,115,232,0.25)' : '0 2px 8px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: patientSelection === 'new' ? '#0F4FAB' : 'rgba(255, 255, 255, 0.2)',
                  borderColor: patientSelection === 'new' ? '#0F4FAB' : 'rgba(255, 255, 255, 0.4)',
                  transform: 'translateY(-1px)',
                  boxShadow: patientSelection === 'new' ? '0 6px 16px rgba(26,115,232,0.3)' : '0 4px 12px rgba(0,0,0,0.08)',
                },
                '&:focus-visible': {
                  outline: '2px solid',
                  outlineColor: 'primary.main',
                  outlineOffset: 2,
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Paciente não está nesta lista
              </Typography>
            </ListItem>
          </List>

          {errors.existingPatientId ? (
            <Typography variant="body2" color="error" textAlign="center">
              {errors.existingPatientId.message}
            </Typography>
          ) : null}
        </Stack>
      ) : null}

      {(patientSelection === 'new' || (!hasMatches && status !== 'loading')) && (
        <Stack spacing={2} sx={{ width: '100%', maxWidth: 560 }}>
          <Controller
            name="patientName"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nome completo do paciente"
                placeholder="Nome e sobrenome"
                autoFocus={!hasMatches}
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
                fullWidth
                size="medium"
              />
            )}
          />
          <Controller
            name="socialName"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Nome social (opcional)"
                placeholder="Nome social"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
                fullWidth
                size="medium"
              />
            )}
          />
          <Controller
            name="phone"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                label="Telefone celular"
                placeholder="(11) 99999-9999"
                type="tel"
                error={Boolean(fieldState.error)}
                helperText={fieldState.error?.message ?? ' '}
                fullWidth
                size="medium"
              />
            )}
          />
        </Stack>
      )}
    </Stack>
  )
}

