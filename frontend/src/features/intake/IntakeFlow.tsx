import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FormProvider, useForm, useWatch, type Resolver } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { Alert, Box, Button, Stack } from '@mui/material'
import { KioskLayout } from '../../layouts/KioskLayout'
import {
  ConfirmationStep,
  CoverageStep,
  DocumentStep,
  ForeignStep,
  ModeStep,
  PatientStep,
  PriorityStep,
  ReviewStep,
  ReasonStep,
  StepNavigation,
  SpecialtyStep,
  WelcomeStep,
} from './components'
import {
  DEFAULT_FORM_VALUES,
  STEP_FIELD_MAP,
  getIntakeSteps,
} from './constants'
import type {
  ConfirmationSnapshot,
  IntakeFormValues,
  IntakeStepDefinition,
  IntakeStepKey,
  IntakeSubmissionCpf,
} from './types'
import { intakeSchema } from './validation'
import {
  createPatient,
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
import { logError } from '../../utils/logger'

type IntakeFlowProps = {
  onComplete?: (payload: IntakeSubmissionCpf) => Promise<void> | void
}

type LookupStatus = 'idle' | 'loading' | 'success' | 'error'

const STATIC_DATA_REQUIRED_STEPS = new Set<IntakeStepKey>([
  'coverage',
  'specialty',
  'reason',
  'review',
  'confirmation',
])

const STATIC_DATA_CONTENT_STEPS = new Set<IntakeStepKey>(['coverage', 'specialty'])

export function IntakeFlow({ onComplete }: IntakeFlowProps) {
  const methods = useForm<IntakeFormValues>({
    mode: 'onChange',
    defaultValues: DEFAULT_FORM_VALUES,
    resolver: yupResolver(intakeSchema) as unknown as Resolver<IntakeFormValues>,
  })
  const [
    intakeMode,
    patientSelection,
    existingPatientId,
    patientName,
    foreignName,
    coverageType,
    convenioId,
    specialtyId,
  ] = useWatch({
    control: methods.control,
    name: [
      'intakeMode',
      'patientSelection',
      'existingPatientId',
      'patientName',
      'foreignName',
      'coverageType',
      'convenioId',
      'specialtyId',
    ],
  }) as [
      IntakeFormValues['intakeMode'],
      IntakeFormValues['patientSelection'],
      IntakeFormValues['existingPatientId'],
      IntakeFormValues['patientName'],
      IntakeFormValues['foreignName'],
      IntakeFormValues['coverageType'],
      IntakeFormValues['convenioId'],
      IntakeFormValues['specialtyId'],
    ]

  const [activeStep, setActiveStep] = useState(0)
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [matches, setMatches] = useState<PatientMatch[]>([])
  const [convenios, setConvenios] = useState<PayerOption[]>([])
  const [specialties, setSpecialties] = useState<SpecialtyOption[]>([])
  const [defaultConvenioId, setDefaultConvenioId] = useState<string | null>(null)
  const [staticDataError, setStaticDataError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [wasResetByTimeout, setWasResetByTimeout] = useState(false)
  const [confirmation, setConfirmation] = useState<ConfirmationSnapshot | null>(null)
  const staticDataRequestId = useRef(0)
  const lookupRequestId = useRef(0)

  const steps = useMemo<IntakeStepDefinition[]>(() => getIntakeSteps(intakeMode), [intakeMode])
  const stepDefinition = steps[activeStep] ?? steps[0]
  const stepsCount = steps.length
  const isLastStep = activeStep === stepsCount - 1
  const canGoBack = activeStep > 0
  const isStaticDataReady = !staticDataError && convenios.length > 0 && specialties.length > 0
  const isStaticDataLoading = !staticDataError && (convenios.length === 0 || specialties.length === 0)
  const shouldBlockForStaticData =
    STATIC_DATA_REQUIRED_STEPS.has(stepDefinition.key) && !isStaticDataReady
  const contentBlockedByStaticData =
    STATIC_DATA_CONTENT_STEPS.has(stepDefinition.key) && !isStaticDataReady

  const summary = useMemo(() => {
    const patientLabel =
      intakeMode === 'foreign'
        ? foreignName || 'Cadastro estrangeiro'
        : patientSelection === 'existing'
          ? matches.find((item) => item.id === existingPatientId)?.name ?? 'Paciente selecionado'
          : patientName || 'Novo cadastro'

    const coverageLabel =
      coverageType === 'convenio'
        ? `Convênio: ${convenios.find((item) => item.id === convenioId)?.name ?? 'Selecionado anteriormente'
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

  const fetchStaticData = useCallback(async () => {
    const requestId = ++staticDataRequestId.current
    setStaticDataError(null)
    try {
      const [payerOptions, specialtyOptions] = await Promise.all([listConvenios(), listSpecialties()])
      if (staticDataRequestId.current !== requestId) {
        return
      }
      setConvenios(payerOptions)
      const resolvedDefault =
        payerOptions.find((option) => option.name.toLowerCase().includes('particular'))?.id ??
        payerOptions[0]?.id ??
        null
      setDefaultConvenioId(resolvedDefault)
      setSpecialties(specialtyOptions)
    } catch (error) {
      if (staticDataRequestId.current !== requestId) {
        return
      }
      logError('Erro ao carregar dados iniciais', error)
      setStaticDataError('Não foi possível carregar convênios e especialidades. Tente novamente.')
    }
  }, [])

  useEffect(() => {
    void fetchStaticData()
    return () => {
      staticDataRequestId.current += 1
    }
  }, [fetchStaticData])

  const handleRetryStaticData = useCallback(() => {
    void fetchStaticData()
  }, [fetchStaticData])

  const performLookup = useCallback(async () => {
    const { cpf, birthDate, lookupFirstName } = methods.getValues()
    const requestId = ++lookupRequestId.current
    setLookupStatus('loading')
    if (!cpf || !birthDate || !lookupFirstName) {
      if (lookupRequestId.current === requestId) {
        setLookupStatus('idle')
      }
      return
    }
    try {
      const results = await lookupPatients(cpf, birthDate, lookupFirstName)
      if (lookupRequestId.current !== requestId) {
        return
      }
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
      if (lookupRequestId.current !== requestId) {
        return
      }
      logError('Falha ao consultar paciente', error)
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
      methods.setValue('lookupFirstName', '', { shouldValidate: false })
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

  useEffect(() => {
    if (coverageType !== 'particular' || !defaultConvenioId) {
      return
    }
    const isValidConvenio = convenios.some((c) => c.id === defaultConvenioId)
    if (!isValidConvenio) {
      return
    }
    const currentConvenio = methods.getValues('convenioId')
    if (!currentConvenio) {
      methods.setValue('convenioId', defaultConvenioId, { shouldValidate: false })
    }
  }, [coverageType, defaultConvenioId, convenios, methods])

  const handleTimeoutReset = useCallback(() => {
    window.location.reload()
  }, [])

  const { resetTimer: resetInactivityTimer } = useInactivityTimeout({
    timeoutMs: INACTIVITY_TIMEOUT_MS,
    onTimeout: handleTimeoutReset,
  })

  const handleRetryLookup = useCallback(() => {
    resetInactivityTimer()
    void performLookup()
  }, [performLookup, resetInactivityTimer])

  useEffect(() => {
    return () => {
      lookupRequestId.current += 1
    }
  }, [])

  const handleBack = () => {
    resetInactivityTimer()
    setSubmitError(null)
    setWasResetByTimeout(false)
    setActiveStep((prev) => Math.max(prev - 1, 0))
  }

  const onSubmitValid = useCallback(
    async (values: IntakeFormValues) => {
      resetInactivityTimer()
      setIsSubmitting(true)
      setSubmitError(null)
      setWasResetByTimeout(false)

      try {
        if (values.intakeMode === 'foreign') {
          const summarySnapshot = {
            patient: values.foreignName || summary.patient,
            coverage: summary.coverage,
            specialty: summary.specialty,
          }

          const maskedIdentifier = createMaskedIdentifier({
            intakeMode: 'foreign',
            name: values.foreignName,
            birthDate: values.foreignBirthDate,
          })

          setConfirmation({
            maskedIdentifier,
            submittedAt: new Date().toISOString(),
            summary: summarySnapshot,
            surveyUrl: SURVEY_FORM_URL || undefined,
            manualAssistance: true,
          })

          setLookupStatus('idle')
          setIsSubmitting(false)
          setActiveStep((prev) => Math.min(prev + 1, stepsCount - 1))
          return
        }

        if (!values.specialtyId) {
          setSubmitError('Selecione a especialidade.')
          setIsSubmitting(false)
          return
        }

        // If creating a new patient, call the patient creation API first
        let finalPatientId =
          values.patientSelection === 'existing' ? values.existingPatientId : undefined

        if (
          values.intakeMode === 'cpf' &&
          values.patientSelection === 'new' &&
          values.patientName &&
          values.phone
        ) {
          const convenioCode = values.convenioId ?? defaultConvenioId ?? ''
          try {
            finalPatientId = await createPatient(
              values.cpf,
              values.patientName,
              values.birthDate,
              values.phone,
              convenioCode,
              values.socialName && values.socialName.trim() !== '' ? values.socialName.trim() : undefined,
            )
          } catch (error) {
            logError('Erro ao criar paciente', error)
            setSubmitError(
              'Não foi possível criar o cadastro do paciente. Verifique os dados e tente novamente.',
            )
            setIsSubmitting(false)
            return
          }
        }

        if (!finalPatientId) {
          setSubmitError('Não foi possível identificar o paciente selecionado.')
          setIsSubmitting(false)
          return
        }

        const payload: IntakeSubmissionCpf = {
          intakeMode: 'cpf',
          cpf: values.cpf,
          birthDate: values.birthDate,
          patientId: finalPatientId,
          coverageType: values.coverageType,
          convenioId:
            values.coverageType === 'convenio'
              ? values.convenioId ?? null
              : defaultConvenioId ?? null,
          specialtyId: values.specialtyId,
          reason: values.reason,
          npsScore: values.npsScore,
          isPriority: values.isPriority,
          patientName: values.patientSelection === 'new' ? values.patientName : undefined,
          socialName:
            values.patientSelection === 'new' && values.socialName && values.socialName.trim() !== ''
              ? values.socialName.trim()
              : undefined,
          phone: values.patientSelection === 'new' ? values.phone : undefined,
        }

        await submitIntake(payload)
        if (onComplete) {
          await onComplete(payload)
        }
        const resolvedPatientName =
          values.patientSelection === 'existing'
            ? matches.find((item) => item.id === values.existingPatientId)?.name ?? values.patientName
            : values.patientSelection === 'new'
              ? values.patientName
              : values.foreignName

        const summarySnapshot = {
          patient: resolvedPatientName || summary.patient,
          coverage: summary.coverage,
          specialty:
            specialties.find((item) => item.id === values.specialtyId)?.name ?? summary.specialty,
        }

        const maskedIdentifier = createMaskedIdentifier({
          intakeMode: values.intakeMode ?? 'cpf',
          name: summarySnapshot.patient,
          cpf: values.cpf,
          birthDate: values.birthDate,
        })

        setConfirmation({
          maskedIdentifier,
          submittedAt: new Date().toISOString(),
          summary: summarySnapshot,
          surveyUrl: SURVEY_FORM_URL || undefined,
        })

        setLookupStatus('idle')
        setIsSubmitting(false)
        setActiveStep((prev) => Math.min(prev + 1, stepsCount - 1))
      } catch (error) {
        logError('Erro durante envio do atendimento', error)
        setSubmitError(
          'Não foi possível registrar o atendimento. Tente novamente ou chame um atendente.',
        )
        setIsSubmitting(false)
      }
    },
    [defaultConvenioId, matches, onComplete, resetInactivityTimer, specialties, stepsCount, summary],
  )

  const submitForm = useCallback(() => methods.handleSubmit(onSubmitValid)(), [methods, onSubmitValid])

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

  const handleWelcomeStart = useCallback(() => {
    resetInactivityTimer()
    setActiveStep(1)
  }, [resetInactivityTimer])

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
      await submitForm()
      return
    }

    if (stepDefinition.key === 'confirmation') {
      handleFinish()
      return
    }

    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1))
  }

  const footer = (
    <Stack spacing={2} width="100%">
      {submitError ? (
        <Alert severity="error" variant="filled">
          {submitError}
        </Alert>
      ) : null}
      {stepDefinition.key !== 'welcome' ? (
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
                ? 'Ir para sala de espera'
                : undefined
          }
          nextDisabled={
            (stepDefinition.key === 'mode' && !intakeMode) ||
            (stepDefinition.key === 'confirmation' && !confirmation) ||
            shouldBlockForStaticData
          }
        />
      ) : null}
    </Stack>
  )

  useEffect(() => {
    resetInactivityTimer()
  }, [activeStep, resetInactivityTimer])

  const currentStepContent = useMemo(() => {
    if (contentBlockedByStaticData) {
      const severity = staticDataError ? 'error' : 'info'
      const message = staticDataError
        ? 'Não foi possível carregar as opções necessárias.'
        : 'Carregando opções, aguarde...'
      const action = staticDataError ? (
        <Button color="inherit" size="small" onClick={handleRetryStaticData}>
          Tentar novamente
        </Button>
      ) : undefined

      return (
        <Alert severity={severity} action={action}>
          {message}
        </Alert>
      )
    }

    switch (stepDefinition.key) {
      case 'welcome':
        return <WelcomeStep onStart={handleWelcomeStart} />
      case 'priority':
        return <PriorityStep />
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
  }, [
    confirmation,
    contentBlockedByStaticData,
    convenios,
    handleRetryLookup,
    handleRetryStaticData,
    handleWelcomeStart,
    lookupStatus,
    matches,
    specialties,
    staticDataError,
    stepDefinition.key,
    summary,
  ])

  const displaySteps = useMemo(() => {
    if (stepDefinition.key === 'welcome') {
      return []
    }
    return steps.filter((step) => step.key !== 'welcome').map((step) => step.label)
  }, [steps, stepDefinition.key])

  const displayStepIndex = useMemo(() => {
    if (stepDefinition.key === 'welcome') {
      return -1
    }
    return activeStep - 1
  }, [activeStep, stepDefinition.key])

  const isWelcomeScreen = stepDefinition.key === 'welcome'

  if (isWelcomeScreen) {
    return (
      <FormProvider {...methods}>
        <Box
          sx={{
            height: '100vh',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
          }}
        >
          {currentStepContent}
        </Box>
      </FormProvider>
    )
  }

  return (
    <FormProvider {...methods}>
      <KioskLayout
        heading="Clinica Exemplo"
        steps={displaySteps}
        stepIndex={displayStepIndex}
        footer={footer}
      >
        <Stack spacing={{ xs: 3, md: 4 }}>
          {wasResetByTimeout ? (
            <Alert severity="warning">
              Sessão reiniciada por inatividade. Os dados inseridos foram apagados para sua
              segurança.
            </Alert>
          ) : null}
          {staticDataError && !contentBlockedByStaticData ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={handleRetryStaticData}>
                  Tentar novamente
                </Button>
              }
            >
              {staticDataError}
            </Alert>
          ) : null}
          {isStaticDataLoading && !contentBlockedByStaticData ? (
            <Alert severity="info">Carregando convênios e especialidades...</Alert>
          ) : null}
          {currentStepContent}
        </Stack>
      </KioskLayout>
    </FormProvider>
  )
}

