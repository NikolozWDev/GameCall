

export enum SoundEvent {
  ROOM_CREATED = 'room_created',
  LOGIN_SUCCESS = 'login_success',
  REGISTER_SUCCESS = 'register_success',
  PROFILE_UPDATE = 'profile_update',
  ROOM_JOIN = 'room_join',
  CHAT_MESSAGE = 'chat_message',
  MIC_ON = 'mic_on',
  MIC_OFF = 'mic_off',
  PARTICIPANT_LEAVE = 'participant_leave',
}

let audioCtx: AudioContext | null = null

const getAudioContext = (): AudioContext => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  }
  return audioCtx
}

const playTone = (
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  rampDown = true
) => {
  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  if (rampDown) {
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  }
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export const playSound = (event: SoundEvent) => {
  switch (event) {
    case SoundEvent.ROOM_CREATED:
      playTone(880, 0.1, 'sine', 0.25)
      setTimeout(() => playTone(1100, 0.15, 'sine', 0.2), 80)
      break
    case SoundEvent.LOGIN_SUCCESS:
      playTone(660, 0.08, 'sine', 0.2)
      setTimeout(() => playTone(880, 0.12, 'sine', 0.2), 60)
      break
    case SoundEvent.REGISTER_SUCCESS:
      playTone(523, 0.08, 'triangle', 0.2)
      setTimeout(() => playTone(659, 0.08, 'triangle', 0.2), 60)
      setTimeout(() => playTone(784, 0.12, 'triangle', 0.2), 120)
      break
    case SoundEvent.PROFILE_UPDATE:
      playTone(440, 0.06, 'sine', 0.15)
      setTimeout(() => playTone(554, 0.1, 'sine', 0.15), 60)
      break
    case SoundEvent.ROOM_JOIN:
      playTone(523, 0.06, 'square', 0.2)
      setTimeout(() => playTone(659, 0.06, 'square', 0.2), 60)
      setTimeout(() => playTone(784, 0.1, 'square', 0.2), 120)
      break
    case SoundEvent.CHAT_MESSAGE:
      playTone(1200, 0.04, 'sine', 0.15, false)
      break
    case SoundEvent.MIC_ON:
      playTone(800, 0.05, 'square', 0.25, false)
      break
    case SoundEvent.MIC_OFF:
      playTone(300, 0.05, 'sawtooth', 0.2, false)
      break
    case SoundEvent.PARTICIPANT_LEAVE:
      playTone(440, 0.1, 'sine', 0.15)
      setTimeout(() => playTone(330, 0.15, 'sine', 0.15), 80)
      break
  }
}