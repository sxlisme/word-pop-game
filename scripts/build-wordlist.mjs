import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const output = resolve(root, 'src/data/words.js')
const repository = 'reinhardliu-cloud/aubergines-words'

const juniorSource = fetchJson('chuzhong.json')
const seniorSource = fetchJson('gaozhong.json')
const selected = new Set()

const primary = pick(juniorSource, 600, 'primary')
const junior = pick(juniorSource, 900, 'junior')
const senior = pick(seniorSource, 1500, 'senior')
const words = [...primary, ...junior, ...senior]

if (words.length !== 3000) throw new Error(`Expected 3000 words, generated ${words.length}`)

mkdirSync(dirname(output), { recursive: true })
writeFileSync(
  output,
  `// Generated from ECDICT exam-tag data (MIT): https://github.com/skywind3000/ECDICT\nexport const BUILTIN_WORDS = ${JSON.stringify(words)}\n`,
)
console.log(`Generated ${words.length} words: primary=${primary.length} junior=${junior.length} senior=${senior.length}`)

function fetchJson(fileName) {
  const endpoint = `repos/${repository}/contents/web/public/wordlists/${fileName}`
  const json = execFileSync('gh', ['api', '-H', 'Accept: application/vnd.github.raw+json', endpoint], {
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  })
  return JSON.parse(json)
}

function pick(source, count, stage) {
  const result = []
  for (const item of source) {
    const en = String(item.word || '').trim().toLowerCase()
    const zh = cleanMeaning(item.meaning)
    if (!en || !zh || selected.has(en) || !/^[a-z][a-z'-]{1,23}$/.test(en)) continue
    selected.add(en)
    result.push({ en, zh, stage })
    if (result.length === count) break
  }
  return result
}

function cleanMeaning(value) {
  return String(value || '')
    .replace(/\\n/g, '；')
    .replace(/\s+/g, ' ')
    .replace(/[;；]+$/g, '')
    .trim()
    .slice(0, 88)
}
