<script setup>
import { computed } from 'vue'
import { Check, Lightbulb, Trophy, Volume2 } from 'lucide-vue-next'

const props = defineProps({
  board: { type: Object, required: true },
  isHard: { type: Boolean, default: false },
  soundEnabled: { type: Boolean, default: true },
  competitive: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'hint'])

const englishCards = computed(() => props.board.cards.filter((card) => card.side === 'en'))
const chineseCards = computed(() => props.board.cards.filter((card) => card.side === 'zh'))
const progress = computed(() => props.board.target ? Math.round((props.board.matched / props.board.target) * 100) : 0)

function cardLabel(card) {
  if (card.status === 'empty') return '已消除的词语槽位'
  return card.text
}
</script>

<template>
  <section class="player-board" :class="[board.tone, { competitive, finished: board.finished }]">
    <header v-if="competitive" class="competitor-header">
      <span class="player-avatar">{{ board.index + 1 }}</span>
      <span class="competitor-name">
        <small>{{ board.finished ? '已完成' : '独立答题中' }}</small>
        <strong>{{ board.name }}</strong>
      </span>
      <span class="competitor-score"><small>得分</small><b>{{ board.score }}</b></span>
      <button
        class="mini-icon-button"
        type="button"
        aria-label="提示"
        title="提示（扣 30 分）"
        :disabled="disabled || board.finished"
        @click="emit('hint', board)"
      ><Lightbulb :size="17" /></button>
    </header>

    <div v-if="competitive" class="competitor-progress">
      <i :style="{ width: `${progress}%` }"></i>
      <span>{{ board.matched }} / {{ board.target }}</span>
    </div>

    <div class="player-board-content" :class="{ mixed: isHard }">
      <template v-if="!isHard">
        <div class="board-column">
          <p class="column-label"><span>ENGLISH</span><small>英文</small></p>
          <div class="card-list">
            <button
              v-for="card in englishCards"
              :key="card.id"
              class="word-card english-card"
              :class="[card.status, { long: card.text.length > 17 }]"
              type="button"
              :disabled="disabled || board.finished || card.status === 'empty'"
              :aria-label="cardLabel(card)"
              @click="emit('select', board, card)"
            >
              <template v-if="card.status !== 'empty'"><span>{{ card.text }}</span><Volume2 v-if="soundEnabled" :size="15" /></template>
              <Check v-else class="slot-check" :size="18" />
            </button>
          </div>
        </div>
        <div class="board-column">
          <p class="column-label"><span>中文</span><small>MEANING</small></p>
          <div class="card-list">
            <button
              v-for="card in chineseCards"
              :key="card.id"
              class="word-card chinese-card"
              :class="[card.status, { long: card.text.length > 18 }]"
              type="button"
              :disabled="disabled || board.finished || card.status === 'empty'"
              :aria-label="cardLabel(card)"
              @click="emit('select', board, card)"
            ><span v-if="card.status !== 'empty'">{{ card.text }}</span><Check v-else class="slot-check" :size="18" /></button>
          </div>
        </div>
      </template>

      <div v-else class="hard-grid">
        <button
          v-for="card in board.cards"
          :key="card.id"
          class="word-card"
          :class="[`${card.side}-card`, card.status, { long: card.text.length > 18 }]"
          type="button"
          :disabled="disabled || board.finished || card.status === 'empty'"
          :aria-label="cardLabel(card)"
          @click="emit('select', board, card)"
        >
          <template v-if="card.status !== 'empty'"><span>{{ card.text }}</span><Volume2 v-if="card.side === 'en' && soundEnabled" :size="15" /></template>
          <Check v-else class="slot-check" :size="18" />
        </button>
      </div>
    </div>

    <div v-if="competitive && board.finished" class="board-finished"><Trophy :size="19" /> 完成</div>
  </section>
</template>
