import { useFormContext } from 'react-hook-form'
import { Box, Stack, Typography } from '@mui/material'
import { SelectableButton } from '../../../components/atoms'
import type { IntakeFormValues } from '../types'

const OPTIONS: Array<{
  value: boolean
  title: string
}> = [
    { value: false, title: 'Atendimento Normal' },
    { value: true, title: 'Atendimento Prioritário' },
  ]

export function PriorityStep() {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<IntakeFormValues>()

  const isPriority = watch('isPriority')

  const handleSelect = (priority: boolean) => {
    setValue('isPriority', priority, { shouldValidate: true, shouldDirty: true })
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
            Qual tipo de atendimento você precisa?
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
            const isSelected = isPriority === option.value
            return (
              <SelectableButton
                key={option.value.toString()}
                isSelected={isSelected}
                size="large"
                onClick={() => handleSelect(option.value)}
              >
                {option.title}
              </SelectableButton>
            )
          })}
        </Stack>

        {errors.isPriority ? (
          <Typography
            variant="body2"
            color="error"
            sx={{ textAlign: 'center', fontSize: '0.9rem' }}
          >
            {errors.isPriority.message}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  )
}


