'use client'
import { useRef, useState, useCallback, useEffect } from 'react'

const SUBTITLE_LINGER_MS = 3000

export function useVoiceSubtitles() {
  const [subtitle, setSubtitle]       = useState(null)
  const [voiceActive, setVoiceActive] = useState(false)
  const [selectedLang, setSelectedLang] = useState('en-US') // Default to English

  const recognitionRef = useRef(null)
  const lingerTimer    = useRef(null)

  const clearLinger = () => {
    if (lingerTimer.current) clearTimeout(lingerTimer.current)
  }

  const scheduleClear = useCallback(() => {
    clearLinger()
    lingerTimer.current = setTimeout(() => setSubtitle(null), SUBTITLE_LINGER_MS)
  }, [])

  const startVoice = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.warn('useVoiceSubtitles: SpeechRecognition not supported')
      return
    }

    const rec = new SpeechRecognition()
    rec.continuous          = true
    rec.interimResults      = true
    rec.lang                = selectedLang // Set the selected language
    
    // Arabic (ar-EG) or English (en-US)

    rec.onresult = (e) => {
      let interim = ''
      let final   = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript
        if (e.results[i].isFinal) final += t
        else interim += t
      }
      const text = (final || interim).trim()
      if (text) {
        setSubtitle({ text, isFinal: !!final })
        if (final) scheduleClear()
        else clearLinger()            // don't clear while still speaking
      }
    }

    rec.onerror = (e) => {
      if (e.error === 'no-speech') return   // silent gap, ignore
      console.warn('SpeechRecognition error:', e.error)
    }

    rec.onend = () => {
      // Auto-restart if still active (browser stops on silence)
      if (recognitionRef.current === rec && voiceActiveRef.current) {
        try { rec.start() } catch (_) {}
      }
    }

    recognitionRef.current = rec
    setVoiceActive(true)
    voiceActiveRef.current = true
    rec.start()
  }, [scheduleClear, selectedLang])

  const stopVoice = useCallback(() => {
    voiceActiveRef.current = false
    setVoiceActive(false)
    recognitionRef.current?.stop()
    recognitionRef.current = null
    clearLinger()
    setSubtitle(null)
  }, [])

  const changeLanguage = useCallback((lang) => {
    setSelectedLang(lang)
    if (voiceActive) {
      // Restart recognition with new language
      stopVoice()
      setTimeout(() => startVoice(), 100)
    }
  }, [voiceActive, stopVoice, startVoice])

  // Internal ref so `onend` closure can read current active state
  const voiceActiveRef = useRef(false)

  useEffect(() => () => stopVoice(), [])   // cleanup on unmount

  return { subtitle, startVoice, stopVoice, voiceActive, changeLanguage, selectedLang }
}