export function parseWordFile(text, fileName = '') {
  const trimmed = String(text || '').trim()
  if (!trimmed) return []

  if (fileName.toLowerCase().endsWith('.json') || trimmed.startsWith('[')) {
    try {
      const data = JSON.parse(trimmed)
      if (Array.isArray(data)) return normalize(data.map(fromJsonItem))
    } catch {
      // Fall through to line parsing for malformed or non-JSON input.
    }
  }

  const pairs = trimmed.split(/\r?\n/).map((line) => {
    const cells = line.split(/\t|,|，|:|：|=|\s+-\s+/)
    if (cells.length < 2) return null
    return { en: cells.shift(), zh: cells.join('，') }
  })
  return normalize(pairs)
}

function fromJsonItem(item) {
  if (Array.isArray(item)) return { en: item[0], zh: item[1] }
  return { en: item?.en || item?.english || item?.word, zh: item?.zh || item?.chinese || item?.meaning }
}

function normalize(items) {
  const unique = new Map()
  for (const item of items) {
    const en = String(item?.en || '').trim()
    const zh = String(item?.zh || '').trim()
    if (!en || !zh || en.length > 60 || zh.length > 160) continue
    const key = en.toLocaleLowerCase()
    if (!unique.has(key)) unique.set(key, { en, zh, stage: 'custom' })
  }
  return [...unique.values()].slice(0, 5000)
}
