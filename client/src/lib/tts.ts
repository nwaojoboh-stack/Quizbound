// Text-to-Speech via Web Speech API. Vom Server getriggert (tts:start / tts:stop),
// damit der Vorleser bei allen Clients (nahezu) synchron startet und beim ersten
// Buzz sofort verstummt. Server-seitige TTS fuer echte ms-Synchronitaet ist als
// spaeteres Upgrade vorgesehen (siehe Plan).

let warmed = false

function synth(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null
  return window.speechSynthesis
}

export function primeTTS(): void {
  const s = synth()
  if (!s) return
  try {
    s.getVoices()
    warmed = true
  } catch {
    /* noop */
  }
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const s = synth()
  if (!s) return undefined
  const voices = s.getVoices()
  if (!voices.length) return undefined
  const code = lang.slice(0, 2).toLowerCase()
  return (
    voices.find((v) => v.lang?.toLowerCase() === lang.toLowerCase()) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(code))
  )
}

export function speak(text: string, rate = 1, lang = 'de-DE'): void {
  const s = synth()
  if (!s || !text) return
  try {
    s.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = rate
    utter.pitch = 1
    utter.lang = lang
    const v = pickVoice(lang)
    if (v) utter.voice = v
    s.speak(utter)
  } catch {
    /* noop */
  }
}

export function stopSpeaking(): void {
  const s = synth()
  if (!s) return
  try {
    s.cancel()
  } catch {
    /* noop */
  }
}

export function ttsSupported(): boolean {
  return synth() != null
}

export { warmed }
