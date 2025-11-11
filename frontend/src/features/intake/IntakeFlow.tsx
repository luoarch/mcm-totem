import { useCallback, useEffect, useMemo, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Alert, Stack } from '@mui/material'
import { KioskLayout } from '../../layouts/KioskLayout'
import {
  ConfirmationStep,
  CoverageStep,
  DocumentStep,
  ForeignStep,
  ModeStep,
  PatientStep,
  ReviewStep,
  ReasonStep,
  StepNavigation,
  SpecialtyStep,
} from './components'
import {
  DEFAULT_FORM_VALUES,
  STEP_FIELD_MAP,
  getIntakeSteps,
} from './constants'
import type {
  ConfirmationSnapshot,
  IntakeFormValues,
  IntakeSubmission,
  IntakeStepDefinition,
} from './types'
import { intakeSchema } from './validation'
import {
  listConvenios,
  listSpecialties,
  lookupPatients,
  submitIntake,
} from '../../services/intake'
import type { PatientMatch, PayerOption, SpecialtyOption } from '../../types/intake'
import { useInactivityTimeout } from '../../core/useInactivityTimeout'
import { INACTIVITY_TIMEOUT_MS } from '../../config/app'
import { SURVEY_FORM_URL } from '../../config/survey'
import { createMaskedIdentifier } from '../../utils/identifier'

type IntakeFlowProps = {
  onComplete?: (payload: IntakeSubmission) => Promise<void> | void
}

type LookupStatus = 'idle' | 'loading' | 'success' | 'error'

export function IntakeFlow({ onComplete }: IntakeFlowProps) {
  const methods = useForm<IntakeFormValues>({
    mode: 'onChange',
    defaultValues: DEFAULT_FORM_VALUES,
    resolver: yupResolver(intakeSchema),
  })
  const intakeMode = methods.watch('intakeMode')
  const patientSelection = methods.watch('patientSelection')
  const existingPatientId = methods.watch('existingPatientId')
  const patientName = methods.watch('patientName')
  const foreignName = methods.watch('foreignName')
  const coverageType = methods.watch('coverageType')
  const convenioId = methods.watch('convenioId')
  const specialtyId = methods.watch('specialtyId')

  const [activeStep, setActiveStep] = useState(0)
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [matches, setMatches] = useState<PatientMatch[]>([])
  const [convenios, setConvenios] = useState<PayerOption[]>([])
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wasResetByTimeout, setWasResetByTimeout] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationSnapshot | null>(null)

  const steps = useMemo<IntakeStepDefinition[]>(() => getIntakeSteps(intakeMode), [intakeMode])
  const stepDefinition = steps[activeStep] ?? steps[0]
  const isLastStep = activeStep === steps.length - 1
  const canGoBack = activeStep > 0

  useEffect(() => {
    let isMounted = true

    const loadStaticData = async () => {
      try {
        const [payerOptions, specialtyOptions] = await Promise.all([
          listConvenios(),
          listSpecialties(),
        ])
        if (!isMounted) return
        setConvenios(payerOptions)
        setSpecialties(specialtyOptions)
      } catch (error) {
        console.error('Erro ao carregar dados iniciais', error)
      }
    }

    loadStaticData()

    return () => {
      isMounted = false
    }
  }, [])

  const performLookup = useCallback(async () => {
    const { cpf, birthDate } = methods.getValues()
    setLookupStatus('loading')
    if (!cpf || !birthDate) {
      setLookupStatus('idle')
      return
    }
    try {
      const results = await lookupPatients(cpf, birthDate)
      setMatches(results)
      setLookupStatus('success')
      if (results.length > 0) {
        methods.setValue('patientSelection', 'existing')
        methods.setValue('existingPatientId', results[0]?.id, { shouldValidate: false })
      } else {
        methods.setValue('patientSelection', 'new')
        methods.setValue('existingPatientId', undefined)
      }
    } catch (error) {
      console.error('Falha ao consultar paciente', error)
      setLookupStatus('error')
      setMatches([])
      methods.setValue('patientSelection', 'new')
      methods.setValue('existingPatientId', undefined)
    }
  }, [methods])

  useEffect(() => {
    if (intakeMode === 'foreign') {
      setMatches([])
      setLookupStatus('idle')
      methods.setValue('patientSelection', 'new', { shouldValidate: false })
      methods.setValue('existingPatientId', undefined, { shouldValidate: false })
      methods.setValue('cpf', '', { shouldValidate: false })
      methods.setValue('birthDate', '', { shouldValidate: false })
    }

    if (intakeMode === 'cpf') {
      methods.setValue('foreignName', '', { shouldValidate: false })
      methods.setValue('foreignBirthDate', '', { shouldValidate: false })
      methods.setValue('foreignEmail', '', { shouldValidate: false })
    }
  }, [intakeMode, methods])

  useEffect(() => {
    if (activeStep >= steps.length) {
      setActiveStep(Math.max(steps.length - 1, 0))
    }
  }, [steps, activeStep])

  const handleTimeoutReset = useCallback(() => {
    methods.reset(DEFAULT_FORM_VALUES)
    setMatches([])
    setLookupStatus('idle')
    setActiveStep(0)
    setSubmitError(null)
    setIsSubmitting(false)
    setWasResetByTimeout(true)
    setConfirmation(null)
  }, [methods])

  const { resetTimer: resetInactivityTimer } = useInactivityTimeout({
    timeoutMs: INACTIVITY_TIMEOUT_MS,
    onTimeout: handleTimeoutReset,
  })

  const handleRetryLookup = () => {
    resetInactivityTimer()
    void performLookup()
  }

  const handleBack = () => {
    resetInactivityTimer()
    setSubmitError(null)
    setWasResetByTimeout(false)
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const handleSubmit = methods.handleSubmit(async (values) => {
    resetInactivityTimer()
    setIsSubmitting(true)
    setSubmitError(null)
    setWasResetByTimeout(false)
    const payload: IntakeSubmission = {
      intakeMode: values.intakeMode ?? 'cpf',
      cpf: values.cpf,
      birthDate: values.intakeMode === 'foreign' ? values.foreignBirthDate : values.birthDate,
      patientId: values.patientSelection === 'existing' ? values.existingPatientId : undefined,
      auditSelectionId:
        values.patientSelection === 'existing' ? values.existingPatientId ?? null : null,
      patientName:
        values.intakeMode === 'foreign'
          ? values.foreignName
          : values.patientSelection === 'new'
            ? values.patientName
            : undefined,
      foreignName: values.intakeMode === 'foreign' ? values.foreignName : undefined,
      foreignBirthDate: values.intakeMode === 'foreign' ? values.foreignBirthDate : undefined,
      foreignEmail:
        values.intakeMode === 'foreign' ? values.foreignEmail?.trim() || null : null,
      coverageType: values.coverageType,
      convenioId: values.coverageType === 'convenio' ? values.convenioId ?? null : null,
      specialtyId: values.specialtyId!,
      reason: values.reason,
      npsScore: values.npsScore,
    }

    try {
      await submitIntake(payload)
      if (onComplete) {
        await onComplete(payload)
      }
      const resolvedPatientName =
        values.intakeMode === 'foreign'
          ? values.foreignName
          : values.patientSelection === 'existing'
            ? matches.find((item) => item.id === values.existingPatientId)?.name ??
            values.patientName
            : values.patientName

      const summarySnapshot = {
        patient: resolvedPatientName || summary.patient,
        coverage: summary.coverage,
        specialty:
          specialties.find((item) => item.id === values.specialtyId)?.name ??
          summary.specialty,
      }

      const maskedIdentifier = createMaskedIdentifier({
        intakeMode: values.intakeMode ?? 'cpf',
        name: summarySnapshot.patient,
        cpf: values.cpf,
        birthDate:
          values.intakeMode === 'foreign' ? values.foreignBirthDate : values.birthDate,
      })

      setConfirmation({
        maskedIdentifier,
        submittedAt: new Date().toISOString(),
        summary: summarySnapshot,
        surveyUrl: SURVEY_FORM_URL || undefined,
      })

      setLookupStatus('idle')
      setIsSubmitting(false)
      setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
      return
    } catch (error) {
      console.error('Erro durante envio do atendimento', error)
      setSubmitError('Não foi possível registrar o atendimento. Tente novamente ou chame um atendente.')
      setIsSubmitting(false)
    }
  })

  const handleFinish = () => {
    resetInactivityTimer()
    setConfirmation(null)
    setWasResetByTimeout(false)
    setSubmitError(null)
    methods.reset(DEFAULT_FORM_VALUES)
    setMatches([])
    setLookupStatus('idle')
    setIsSubmitting(false)
    setActiveStep(0)
  }

  const handleNext = async () => {
    resetInactivityTimer()
    setSubmitError(null)
    setWasResetByTimeout(false)
    const fields = STEP_FIELD_MAP[stepDefinition.key]
    const isValid = await methods.trigger(fields)
    if (!isValid) {
      return
    }

    if (stepDefinition.key === 'document' && intakeMode === 'cpf') {
      await performLookup()
    }

    if (stepDefinition.key === 'review') {
      await handleSubmit()
      return
    }

    if (stepDefinition.key === 'confirmation') {
      handleFinish()
      return
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const summary = useMemo(() => {
    const patientLabel =
      intakeMode === 'foreign'
        ? foreignName || 'Cadastro estrangeiro'
        : patientSelection === 'existing'
          ? matches.find((item) => item.id === existingPatientId)?.name ??
          'Paciente selecionado'
          : patientName || 'Novo cadastro'

    const coverageLabel =
      coverageType === 'convenio'
        ? `Convênio: ${convenios.find((item) => item.id === convenioId)?.name ??
        'Selecionado anteriormente'
        }`
        : 'Particular'

    const specialtyLabel =
      specialties.find((item) => item.id === specialtyId)?.name ?? 'Selecionar'

    return {
      patient: patientLabel,
      coverage: coverageLabel,
      specialty: specialtyLabel,
    }
  }, [
    convenios,
    coverageType,
    convenioId,
    existingPatientId,
    foreignName,
    intakeMode,
    matches,
    patientName,
    patientSelection,
    specialties,
    specialtyId,
  ])

  const aside = null

  const footer = (
    <Stack spacing={2} width="100%">
      {submitError ? (
        <Alert severity="error" variant="filled">
          {submitError}
        </Alert>
      ) : null}
      <StepNavigation
        canGoBack={canGoBack && stepDefinition.key !== 'confirmation'}
        isLastStep={isLastStep}
        onBack={handleBack}
        onNext={handleNext}
        isSubmitting={isSubmitting}
        nextLabel={
          stepDefinition.key === 'review'
            ? 'Registrar atendimento'
            : stepDefinition.key === 'confirmation'
              ? 'Encerrar atendimento'
              : undefined
        }
        nextDisabled={
          (stepDefinition.key === 'mode' && !intakeMode) ||
          (stepDefinition.key === 'confirmation' && !confirmation)
        }
      />
    </Stack>
  )

  useEffect(() => {
    resetInactivityTimer()
  }, [activeStep, resetInactivityTimer])

  const stepContent = () => {
    switch (stepDefinition.key) {
      case 'mode':
        return <ModeStep />
      case 'document':
        return <DocumentStep />
      case 'foreign':
        return <ForeignStep />
      case 'patient':
        return (
          <PatientStep matches={matches} status={lookupStatus} onRetry={handleRetryLookup} />
        )
      case 'coverage':
        return <CoverageStep convenios={convenios} />
      case 'specialty':
        return <SpecialtyStep specialties={specialties} />
      case 'reason':
        return <ReasonStep />
      case 'review':
        return <ReviewStep summary={summary} />
      case 'confirmation':
        return confirmation ? (
          <ConfirmationStep confirmation={confirmation} />
        ) : (
          <Alert severity="info">Carregando detalhes do atendimento...</Alert>
        )
      default:
        return null
    }
  }

  return (
    <FormProvider {...methods}>
      <KioskLayout
        heading="Autoatendimento"
        steps={steps.map((step) => step.label)}
        stepIndex={activeStep}
        footer={footer}
        aside={aside}
      >
        <Stack spacing={{ xs: 3, md: 4 }}>
          {wasResetByTimeout ? (
            <Alert severity="warning">
              Sessão reiniciada por inatividade. Os dados inseridos foram apagados para sua
              segurança.
            </Alert>
          ) : null}
          {stepContent()}
        </Stack>
      </KioskLayout>
    </FormProvider>
  )
}

