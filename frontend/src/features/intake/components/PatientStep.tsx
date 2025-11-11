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
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: isSelected ? 'primary.main' : 'divider',
                    backgroundColor: isSelected ? 'action.selected' : 'background.paper',
                    boxShadow: 'none',
                    transition: 'background-color 0.2s ease, border-color 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'divider',
                    },
                    '&:focus-visible': {
                      outline: '2px solid',
                      outlineColor: 'primary.main',
                      outlineOffset: 2,
                    },
                  }}
                >
                  {isSelected ? (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 12,
                        top: 8,
                        bottom: 8,
                        width: 3,
                        borderRadius: 10,
                        backgroundColor: 'primary.main',
                        pointerEvents: 'none',
                      }}
                    />
                  ) : null}
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" component="span" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                        {match.name}
                      </Typography>
                    }
                    secondary={
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
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
                    <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                      ✓ Selecionado
                    </Typography>
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
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: patientSelection === 'new' ? 'primary.main' : 'divider',
                backgroundColor:
                  patientSelection === 'new' ? 'action.selected' : 'background.paper',
                cursor: 'pointer',
                transition: 'background-color 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'divider',
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
              sx={{ maxWidth: 560 }}
            />
          )}
        />
      )}
    </Stack>
  )
}

