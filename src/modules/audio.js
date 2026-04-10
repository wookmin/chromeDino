const SOUND_MAP = {
  move: { type: 'sine', freq: 440, duration: 0.05, gain: 0.15 },
  wall: { type: 'square', freq: 120, duration: 0.12, gain: 0.3 },
  open: { type: 'sine', freq: 300, duration: 0.08, gain: 0.1 },
  close: { type: 'sine', freq: 500, duration: 0.08, gain: 0.1 },
  clear: { type: 'sine', freq: 880, duration: 0.6, gain: 0.4 },
}

export const createAudioController = () => {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext
  const audioContext = AudioContextClass ? new AudioContextClass() : null

  const resume = async () => {
    if (!audioContext || audioContext.state !== 'suspended') {
      return
    }

    await audioContext.resume()
  }

  const play = async (name) => {
    const sound = SOUND_MAP[name]

    if (!audioContext || !sound) {
      return
    }

    if (audioContext.state === 'suspended') {
      return
    }

    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    const now = audioContext.currentTime

    oscillator.type = sound.type
    oscillator.frequency.setValueAtTime(sound.freq, now)

    gainNode.gain.setValueAtTime(sound.gain, now)
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + sound.duration)

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    oscillator.start(now)
    oscillator.stop(now + sound.duration)
  }

  return {
    play,
    resume,
  }
}
