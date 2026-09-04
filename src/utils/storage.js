const CUSTOM_WORDS_KEY = 'word-pop.custom-words.v1'
const STATS_KEY = 'word-pop.stats.v1'

export function loadCustomWords() {
  try {
    const value = JSON.parse(localStorage.getItem(CUSTOM_WORDS_KEY) || '[]')
    return Array.isArray(value) ? value.filter(isWordPair) : []
  } catch {
    return []
  }
}

export function saveCustomWords(words) {
  localStorage.setItem(CUSTOM_WORDS_KEY, JSON.stringify(words))
}

export function loadStats() {
  const defaults = { rounds: 0, bestScore: 0, matched: 0 }
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(STATS_KEY) || '{}') }
  } catch {
    return defaults
  }
}

export function saveStats(stats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

function isWordPair(item) {
  return item && typeof item.en === 'string' && typeof item.zh === 'string'
}
