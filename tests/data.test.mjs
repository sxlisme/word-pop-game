import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { BUILTIN_WORDS } from '../src/data/words.js'
import { parseWordFile } from '../src/utils/importer.js'
import { duelOutcome } from '../src/utils/duel.js'

test('built-in vocabulary contains exactly 3000 unique words in expected stages', () => {
  assert.equal(BUILTIN_WORDS.length, 3000)
  assert.equal(new Set(BUILTIN_WORDS.map((word) => word.en)).size, 3000)
  assert.equal(BUILTIN_WORDS.filter((word) => word.stage === 'primary').length, 600)
  assert.equal(BUILTIN_WORDS.filter((word) => word.stage === 'junior').length, 900)
  assert.equal(BUILTIN_WORDS.filter((word) => word.stage === 'senior').length, 1500)
  assert.ok(BUILTIN_WORDS.every((word) => word.en && word.zh))
})

test('imports CSV, tab-separated and JSON vocabularies', () => {
  assert.deepEqual(parseWordFile('apple,苹果\nbook\t书'), [
    { en: 'apple', zh: '苹果', stage: 'custom' },
    { en: 'book', zh: '书', stage: 'custom' },
  ])
  assert.deepEqual(parseWordFile('[{"english":"hello","chinese":"你好"}]', 'words.json'), [
    { en: 'hello', zh: '你好', stage: 'custom' },
  ])
})

test('production artifact is a self-contained HTML document', async () => {
  const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8')
  assert.match(html, /<style[^>]*>/)
  assert.match(html, /<script[^>]+type="module"/)
  assert.doesNotMatch(html, /<script[^>]+src=/)
  assert.doesNotMatch(html, /<link[^>]+rel="stylesheet"/)
})

test('duel mode resolves independent boards by matches, score, then finish time', () => {
  assert.equal(duelOutcome([
    { name: '玩家 1', matched: 8, score: 800, finishedAt: 40 },
    { name: '玩家 2', matched: 7, score: 900, finishedAt: null },
  ]).winner.name, '玩家 1')
  assert.equal(duelOutcome([
    { name: '玩家 1', matched: 8, score: 800, finishedAt: 36 },
    { name: '玩家 2', matched: 8, score: 800, finishedAt: 42 },
  ]).winner.name, '玩家 1')
  assert.equal(duelOutcome([
    { name: '玩家 1', matched: 8, score: 800, finishedAt: 40 },
    { name: '玩家 2', matched: 8, score: 800, finishedAt: 40 },
  ]).tied, true)
})
