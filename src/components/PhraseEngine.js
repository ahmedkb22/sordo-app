// =============================================================
// PHRASE ENGINE — shared across call & entrainement pages
// Edit SINGLE_SIGN_PHRASES and MULTI_SIGN_PHRASES to match
// the words your model actually returns (labels.json)
// =============================================================

export const SINGLE_SIGN_PHRASES = {
  'hello':    'Hello, how are you?',
  'bye':      'Goodbye, see you later!',
  'thanks':   'Thank you very much!',
  'sorry':    'I am sorry.',
  'help':     'I need help.',
  'yes':      'Yes.',
  'no':       'No.',
  'please':   'Please.',
  'good':     'That is good!',
  'bad':      'That is bad.',
  'love':     'I love you.',
  'hungry':   'I am hungry.',
  'tired':    'I am tired.',
  'happy':    'I am happy!',
  'sad':      'I am sad.',
  'water':    'Can I have some water?',
  'bathroom': 'Where is the bathroom?',
  'stop':     'Please stop.',
  'wait':     'Please wait.',
  'come':     'Please come here.',
}

// Multi-sign combinations — order matters, must appear in sequence
// within COMBO_WINDOW_MS milliseconds
export const MULTI_SIGN_PHRASES = [
  { signs: ['name', 'ahmed'],        phrase: 'My name is Ahmed.' },
  { signs: ['name', 'sara'],         phrase: 'My name is Sara.' },
  { signs: ['name', 'omar'],         phrase: 'My name is Omar.' },
  { signs: ['how', 'are', 'you'],    phrase: 'How are you?' },
  { signs: ['i', 'am', 'fine'],      phrase: 'I am fine, thank you.' },
  { signs: ['nice', 'meet'],         phrase: 'Nice to meet you!' },
  { signs: ['where', 'from'],        phrase: 'Where are you from?' },
  { signs: ['i', 'from', 'algeria'], phrase: 'I am from Algeria.' },
  { signs: ['what', 'name'],         phrase: 'What is your name?' },
  { signs: ['i', 'deaf'],            phrase: 'I am deaf.' },
  { signs: ['i', 'hear'],            phrase: 'I can hear.' },
  { signs: ['call', 'police'],       phrase: 'Please call the police!' },
  { signs: ['call', 'doctor'],       phrase: 'Please call a doctor!' },
  { signs: ['i', 'understand'],      phrase: 'I understand.' },
  { signs: ['i', 'not', 'understand'], phrase: 'I do not understand.' },
]

export const COMBO_WINDOW_MS = 5000
export const SUBTITLE_DURATION = 4000

// Check if needles appear as an ordered subsequence in haystack
function isSubsequence(needles, haystack) {
  let ni = 0
  for (const h of haystack) {
    if (h === needles[ni]) ni++
    if (ni === needles.length) return true
  }
  return false
}

// Factory — call once per component mount
export function buildPhraseEngine() {
  let signHistory = [] // [{ word: string, time: number }]

  function addSign(word) {
    const now = Date.now()
    signHistory = signHistory.filter(s => now - s.time < COMBO_WINDOW_MS)
    signHistory.push({ word: word.toLowerCase(), time: now })
    return resolvePhrase()
  }

  function resolvePhrase() {
    const words = signHistory.map(s => s.word)

    // Longest combo first
    const sorted = [...MULTI_SIGN_PHRASES].sort((a, b) => b.signs.length - a.signs.length)
    for (const combo of sorted) {
      if (isSubsequence(combo.signs, words)) {
        signHistory = []
        return { phrase: combo.phrase, type: 'combo' }
      }
    }

    const lastWord = words[words.length - 1]
    if (SINGLE_SIGN_PHRASES[lastWord]) {
      signHistory = []
      return { phrase: SINGLE_SIGN_PHRASES[lastWord], type: 'single' }
    }

    return { phrase: lastWord.toUpperCase(), type: 'raw' }
  }

  function clear() { signHistory = [] }
  function getPending() { return signHistory.map(s => s.word.toUpperCase()) }

  return { addSign, clear, getPending }
}

// Subtitle background color based on phrase type
export function subtitleStyle(type) {
  if (type === 'combo')  return { bg: 'rgba(124,58,237,0.88)',  border: 'rgba(167,139,250,0.4)' }
  if (type === 'single') return { bg: 'rgba(22,163,74,0.88)',   border: 'rgba(134,239,172,0.4)' }
  return                        { bg: 'rgba(37,99,235,0.82)',   border: 'rgba(147,197,253,0.3)' }
}