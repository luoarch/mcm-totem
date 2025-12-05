import {
  Box,
  Chip,
  Divider,
  Fade,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import VolumeUpIcon from '@mui/icons-material/VolumeUp'
import VolumeOffIcon from '@mui/icons-material/VolumeOff'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQueueUpdates } from './useQueueUpdates'
import type { QueueEntry } from './types'
import chimeUrl from './assets/chime.mp3'
import { logWarning } from '../../utils/logger'

const timeFormatter = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

function formatTime(value?: string) {
  if (!value) return '--:--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '--:--'
  }
  return timeFormatter.format(date)
}

export function QueuePanel() {
  const { entries, isRealtime, error, lastUpdatedAt } = useQueueUpdates()
  const [current, ...upcoming] = entries
  const [soundEnabled, setSoundEnabled] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const lastCallIdRef = useRef<string | null>(null)
  const hasCallChange = useMemo(
    () => current && current.id !== lastCallIdRef.current,
    [current],
  )

  useEffect(() => {
    if (hasCallChange && audioRef.current && soundEnabled) {
      void audioRef.current.play().catch((error) => {
        logWarning('Falha ao reproduzir alerta sonoro', { error })
      })
    }
    if (current) {
      lastCallIdRef.current = current.id
    }
  }, [current, hasCallChange, soundEnabled])

  useEffect(() => {
    if (!soundEnabled && audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [soundEnabled])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'stretch',
        py: 6,
      }}
    >
      <Box
        sx={{
          flex: 1,
          maxWidth: 960,
          margin: '0 auto',
          px: { xs: 3, md: 6 },
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h2" component="h1">
            Chamada de pacientes
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={isRealtime ? 'Tempo real' : 'Atualização periódica'}
              color={isRealtime ? 'success' : 'default'}
            />
            <Fade in>
              <IconButton
                color={soundEnabled ? 'primary' : 'default'}
                onClick={() => setSoundEnabled((prev) => !prev)}
                aria-label={soundEnabled ? 'Desativar alerta sonoro' : 'Ativar alerta sonoro'}
                size="large"
              >
                {soundEnabled ? <VolumeUpIcon fontSize="inherit" /> : <VolumeOffIcon fontSize="inherit" />}
              </IconButton>
            </Fade>
            {lastUpdatedAt ? (
              <Typography variant="body2" color="text.secondary">
                Atualizado às {timeFormatter.format(new Date(lastUpdatedAt))}
              </Typography>
            ) : null}
          </Stack>
        </Stack>

        {error ? (
          <Chip color="warning" label="Sem conexão em tempo real" sx={{ alignSelf: 'flex-start' }} />
        ) : null}

        {current ? <CurrentCall entry={current} /> : <EmptyState />}

        <UpcomingCalls entries={upcoming} />
      </Box>
      <audio ref={audioRef} src={chimeUrl} preload="auto" />
    </Box>
  )
}

type CallCardProps = {
  entry: QueueEntry
}

function CurrentCall({ entry }: CallCardProps) {
  return (
    <Paper elevation={10} sx={{ p: { xs: 4, md: 6 } }}>
      <Stack spacing={2}>
        <Typography variant="overline" color="primary.main">
          Chamando agora
        </Typography>
        <Typography variant="h2" component="p">
          {entry.patientLabel}
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={entry.specialty} color="primary" />
          {entry.room ? <Chip label={entry.room} color="secondary" /> : null}
        </Stack>
        <Typography variant="body1" color="text.secondary">
          Compareça ao consultório indicado. Horário:{' '}
          <strong>{formatTime(entry.calledAt)}</strong>
        </Typography>
      </Stack>
    </Paper>
  )
}

type UpcomingCallsProps = {
  entries: QueueEntry[]
}

function UpcomingCalls({ entries }: UpcomingCallsProps) {
  if (entries.length === 0) {
    return (
      <Paper sx={{ p: 4 }}>
        <Typography variant="body1" color="text.secondary">
          Nenhum paciente aguardando chamada no momento.
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={3}>
        <Typography variant="h4" component="h2">
          Próximos atendimentos
        </Typography>
        <Divider />
        <Stack spacing={2}>
          {entries.slice(0, 6).map((entry) => (
            <Stack
              key={entry.id}
              direction={{ xs: 'column', md: 'row' }}
              spacing={{ xs: 1, md: 3 }}
              alignItems={{ xs: 'flex-start', md: 'center' }}
              justifyContent="space-between"
            >
              <Typography variant="h5">{entry.patientLabel}</Typography>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Chip label={entry.specialty} variant="outlined" />
                <Typography variant="body2" color="text.secondary">
                  Status: {entry.status === 'waiting' ? 'Em espera' : 'Chamado'}
                </Typography>
                {entry.calledAt ? (
                  <Typography variant="body2" color="text.secondary">
                    {formatTime(entry.calledAt)}
                  </Typography>
                ) : null}
              </Stack>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}

function EmptyState() {
  return (
    <Paper sx={{ p: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom>
        Fila vazia
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Aguarde novas chamadas. Assim que a recepção acionar um paciente, a informação aparecerá
        aqui.
      </Typography>
    </Paper>
  )
}

