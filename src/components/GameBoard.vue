<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ArrowLeft, Lightbulb, Pause, Play, RefreshCw, RotateCcw, Sparkles } from 'lucide-vue-next'
import PlayerBoard from './PlayerBoard.vue'
import { duelOutcome } from '../utils/duel.js'

const props = defineProps({
  config: { type: Object, required: true },
  builtinWords: { type: Array, required: true },
  customWords: { type: Array, required: true },
  soundEnabled: { type: Boolean, default: true },
})
const emit = defineEmits(['exit', 'finish'])

const stageNames = { primary: '小学词汇', junior: '初中词汇', senior: '高中词汇', custom: '我的词库' }
const pairTarget = computed(() => props.config.difficulty === 'hard' ? 12 : 8)
const isHard = computed(() => props.config.difficulty === 'hard')
const isDuo = computed(() => props.config.playMode === 'duo')
const boards = ref([])
const elapsed = ref(0)
const remaining = ref(90)
const paused = ref(false)
const round = ref(0)
const toast = ref(null)
const result = ref(null)
let timer = null
let toastTimer = null
let speechTimer = null

const totalTarget = computed(() => boards.value.reduce((sum, board) => sum + board.target, 0))
const totalMatched = computed(() => boards.value.reduce((sum, board) => sum + board.matched, 0))
const totalAttempts = computed(() => boards.value.reduce((sum, board) => sum + board.attempts, 0))
const totalScore = computed(() => boards.value.reduce((sum, board) => sum + board.score, 0))
const finishedBoards = computed(() => boards.value.filter((board) => board.finished).length)
const progress = computed(() => totalTarget.value ? Math.round((totalMatched.value / totalTarget.value) * 100) : 0)
const accuracy = computed(() => totalAttempts.value ? Math.round((totalMatched.value / totalAttempts.value) * 100) : 100)
const timeLabel = computed(() => {
  const value = isHard.value ? remaining.value : elapsed.value
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
})

onMounted(startRound)
onBeforeUnmount(() => {
  stopTimer()
  window.clearTimeout(speechTimer)
  window.speechSynthesis?.cancel()
})

function startRound() {
  stopTimer()
  round.value += 1
  elapsed.value = 0
  remaining.value = 90
  paused.value = false
  result.value = null

  const source = props.config.stage === 'custom'
    ? props.customWords
    : props.builtinWords.filter((word) => word.stage === props.config.stage)
  const target = Math.min(pairTarget.value, source.length)
  const firstPairs = takeUniquePairs(shuffle(source), target)
  boards.value = [createBoard(firstPairs, 0)]

  if (isDuo.value) {
    let secondPairs = firstPairs
    if (props.config.duelDeck === 'different') {
      const firstWords = new Set(firstPairs.map((word) => word.en.toLocaleLowerCase()))
      const unused = source.filter((word) => !firstWords.has(word.en.toLocaleLowerCase()))
      secondPairs = takeUniquePairs(shuffle(unused), firstPairs.length)
      if (secondPairs.length < firstPairs.length) secondPairs = takeUniquePairs([...secondPairs, ...shuffle(source)], firstPairs.length)
    }
    boards.value.push(createBoard(secondPairs, 1))
  }
  startTimer()
}

function createBoard(pairs, index) {
  const generated = pairs.flatMap((word, pairId) => [
    { id: `${round.value}-${index}-${pairId}-en`, pairId, side: 'en', text: word.en, status: 'idle' },
    { id: `${round.value}-${index}-${pairId}-zh`, pairId, side: 'zh', text: word.zh, status: 'idle' },
  ])
  return {
    index,
    name: `玩家 ${index + 1}`,
    tone: index === 0 ? 'coral' : 'blue',
    cards: isHard.value ? shuffle(generated) : [...shuffle(generated.filter((card) => card.side === 'en')), ...shuffle(generated.filter((card) => card.side === 'zh'))],
    selectedId: null,
    locked: false,
    matched: 0,
    attempts: 0,
    combo: 0,
    score: 0,
    target: pairs.length,
    finished: false,
    finishedAt: null,
  }
}

function startTimer() {
  timer = window.setInterval(() => {
    if (paused.value || result.value) return
    if (isHard.value) {
      remaining.value -= 1
      if (remaining.value <= 0) finish(false)
    } else {
      elapsed.value += 1
    }
  }, 1000)
}

function stopTimer() {
  if (timer) window.clearInterval(timer)
  timer = null
}

function selectCard(board, card) {
  const interactive = card.status === 'idle' || card.status === 'selected'
  if (board.locked || board.finished || paused.value || result.value || !interactive) return
  if (card.side === 'en') speak(card.text)

  const first = board.cards.find((item) => item.id === board.selectedId)
  if (!first) {
    card.status = 'selected'
    board.selectedId = card.id
    return
  }
  if (first.id === card.id) {
    return
  }
  if (first.side === card.side) {
    first.status = 'idle'
    card.status = 'selected'
    board.selectedId = card.id
    return
  }

  card.status = 'selected'
  board.locked = true
  board.attempts += 1
  if (first.pairId === card.pairId) handleMatch(board, first, card)
  else handleMiss(board, first, card)
}

function handleMatch(board, first, second) {
  board.combo += 1
  board.matched += 1
  const points = 100 + Math.min(board.combo - 1, 5) * 20
  board.score += points
  first.status = 'matched'
  second.status = 'matched'
  showToast(isDuo.value ? `${board.name} +${points}` : (board.combo >= 2 ? `${board.combo} 连击！` : '碰对啦！'), board.tone)
  window.setTimeout(() => {
    first.status = 'empty'
    second.status = 'empty'
    board.selectedId = null
    board.locked = false
    if (board.matched === board.target) {
      board.finished = true
      board.finishedAt = isHard.value ? 90 - remaining.value : elapsed.value
      if (isDuo.value) showToast(`${board.name} 完成！`, board.tone)
      if (boards.value.every((item) => item.finished)) finish(true)
    }
  }, 520)
}

function handleMiss(board, first, second) {
  board.combo = 0
  first.status = 'wrong'
  second.status = 'wrong'
  showToast(isDuo.value ? `${board.name} 再想想` : '再想一想', board.tone)
  window.setTimeout(() => {
    first.status = 'idle'
    second.status = 'idle'
    board.selectedId = null
    board.locked = false
  }, 440)
}

function useHint(board = boards.value[0]) {
  if (!board || board.finished || board.locked || paused.value || result.value) return
  const live = board.cards.filter((card) => card.status === 'idle')
  const first = live.find((card) => live.some((other) => other.pairId === card.pairId && other.side !== card.side))
  if (!first) return
  const second = live.find((card) => card.pairId === first.pairId && card.side !== first.side)
  first.status = 'hint'
  second.status = 'hint'
  board.combo = 0
  board.score = Math.max(0, board.score - 30)
  window.setTimeout(() => {
    if (first.status === 'hint') first.status = 'idle'
    if (second.status === 'hint') second.status = 'idle'
  }, 950)
}

function togglePause() {
  paused.value = !paused.value
  window.speechSynthesis?.cancel()
}

function finish(completed) {
  if (result.value) return
  stopTimer()
  boards.value.forEach((board) => { board.locked = true })
  const players = boards.value.map((board) => ({
    name: board.name,
    tone: board.tone,
    score: board.score,
    matched: board.matched,
    target: board.target,
    finishedAt: board.finishedAt,
  }))
  result.value = {
    completed,
    score: totalScore.value,
    matched: totalMatched.value,
    accuracy: accuracy.value,
    seconds: isHard.value ? 90 - remaining.value : elapsed.value,
    players,
    duel: isDuo.value ? duelOutcome(players) : null,
  }
  emit('finish', result.value)
}

function showToast(message, tone = 'sunny') {
  toast.value = { message, tone }
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = null }, 900)
}

function speak(text) {
  if (!props.soundEnabled || !('speechSynthesis' in window)) return
  window.clearTimeout(speechTimer)
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = 0.85
  const voices = window.speechSynthesis.getVoices()
  utterance.voice = voices.find((voice) => /^en-(US|GB)/i.test(voice.lang)) || voices.find((voice) => /^en/i.test(voice.lang)) || null
  speechTimer = window.setTimeout(() => window.speechSynthesis.speak(utterance), 40)
}

function takeUniquePairs(source, count) {
  const words = []
  const english = new Set()
  const chinese = new Set()
  for (const item of source) {
    const enKey = item.en.trim().toLocaleLowerCase()
    const zhKey = item.zh.trim()
    if (english.has(enKey) || chinese.has(zhKey)) continue
    english.add(enKey)
    chinese.add(zhKey)
    words.push(item)
    if (words.length === count) break
  }
  return words
}

function shuffle(items) {
  const output = [...items]
  for (let index = output.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[output[index], output[randomIndex]] = [output[randomIndex], output[index]]
  }
  return output
}
</script>

<template>
  <section class="game-view" :class="{ 'duo-game': isDuo }">
    <div class="game-toolbar">
      <button class="icon-button back-button" type="button" aria-label="返回首页" title="返回首页" @click="emit('exit')"><ArrowLeft :size="20" /></button>
      <div class="round-title">
        <span>{{ stageNames[config.stage] }}</span>
        <strong>{{ isDuo ? '双人 PK' : '单人闯关' }} · {{ isHard ? '困难' : '简单' }}</strong>
      </div>
      <div class="game-actions">
        <button v-if="!isDuo" class="icon-button" type="button" aria-label="提示" title="提示（扣 30 分）" @click="useHint()"><Lightbulb :size="19" /></button>
        <button class="icon-button" type="button" :aria-label="paused ? '继续' : '暂停'" :title="paused ? '继续' : '暂停'" @click="togglePause">
          <Play v-if="paused" :size="19" /><Pause v-else :size="19" />
        </button>
        <button class="icon-button" type="button" aria-label="重新开始" title="重新开始" @click="startRound"><RefreshCw :size="18" /></button>
      </div>
    </div>

    <div class="score-strip" :class="{ duel: isDuo }">
      <span><small>{{ isHard ? '剩余时间' : '本局用时' }}</small><b :class="{ urgent: isHard && remaining <= 20 }">{{ timeLabel }}</b></span>
      <span><small>{{ isDuo ? '双方题目' : '已碰对' }}</small><b>{{ isDuo ? (config.duelDeck === 'same' ? '同一套' : '随机两套') : `${totalMatched} / ${totalTarget}` }}</b></span>
      <span><small>{{ isDuo ? '完成棋盘' : '得分' }}</small><b>{{ isDuo ? `${finishedBoards} / 2` : totalScore }}</b></span>
      <span><small>{{ isDuo ? '总准确率' : '准确率' }}</small><b>{{ accuracy }}%</b></span>
    </div>
    <div class="progress-track"><i :style="{ width: `${progress}%` }"></i></div>

    <div v-if="toast" class="game-toast" :class="toast.tone"><Sparkles :size="15" /> {{ toast.message }}</div>

    <div class="arena" :class="isDuo ? 'duo-arena' : 'solo-arena'">
      <PlayerBoard
        v-for="board in boards"
        :key="`${round}-${board.index}`"
        :board="board"
        :is-hard="isHard"
        :sound-enabled="soundEnabled"
        :competitive="isDuo"
        :disabled="paused || Boolean(result)"
        @select="selectCard"
        @hint="useHint"
      />
      <button v-if="paused" class="pause-overlay" type="button" @click="togglePause"><Play :size="26" /><span>继续挑战</span></button>
    </div>

    <div v-if="result" class="dialog-backdrop result-backdrop">
      <section class="result-dialog" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <div class="result-burst" aria-hidden="true"><i></i><i></i><i></i><i></i><span>{{ result.completed ? '✓' : '!' }}</span></div>
        <p class="eyebrow">ROUND COMPLETE</p>
        <h2 id="result-title">{{ isDuo ? result.duel.title : (result.completed ? '全部碰掉啦！' : '时间到，再来一次') }}</h2>
        <div v-if="isDuo" class="duel-result">
          <span v-for="player in result.players" :key="player.name" :class="player.tone">
            <small>{{ player.name }} · {{ player.matched }}/{{ player.target }} 对</small><b>{{ player.score }}</b>
          </span>
        </div>
        <div class="result-stats" :class="{ duo: isDuo }">
          <span v-if="!isDuo"><small>得分</small><b>{{ result.score }}</b></span>
          <span><small>准确率</small><b>{{ result.accuracy }}%</b></span>
          <span><small>用时</small><b>{{ result.seconds }}s</b></span>
        </div>
        <div class="result-actions">
          <button class="secondary-button" type="button" @click="emit('exit')"><ArrowLeft :size="18" /> 换个模式</button>
          <button class="primary-button compact" type="button" @click="startRound"><RotateCcw :size="18" /> 再来一局</button>
        </div>
      </section>
    </div>
  </section>
</template>
