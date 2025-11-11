import { Button, Stack } from '@mui/material'

type StepNavigationProps = {
  canGoBack: boolean
  isLastStep: boolean
  onBack: () => void
  onNext: () => void
  isSubmitting?: boolean
  nextLabel?: string
  nextDisabled?: boolean
}

export function StepNavigation({
  canGoBack,
  isLastStep,
  onBack,
  onNext,
  isSubmitting = false,
  nextLabel,
  nextDisabled = false,
}: StepNavigationProps) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      justifyContent="flex-end"
      sx={{ width: '100%' }}
    >
      <Button
        variant="outlined"
        size="large"
        onClick={onBack}
        disabled={!canGoBack || isSubmitting}
        sx={{ minWidth: 200 }}
      >
        Voltar
      </Button>
      <Button
        variant="contained"
        size="large"
        onClick={onNext}
        disabled={isSubmitting || nextDisabled}
        sx={{ minWidth: 240 }}
      >
        {isLastStep ? nextLabel ?? 'Concluir atendimento' : nextLabel ?? 'Avançar'}
      </Button>
    </Stack>
  )
}

