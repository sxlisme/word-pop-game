<script setup>
import { computed, ref } from 'vue'
import { ArrowRight, BookOpen, Copy, GraduationCap, School, Shuffle, Sparkles, Swords, Upload, UserRound } from 'lucide-vue-next'

const props = defineProps({
  wordCounts: { type: Object, required: true },
  stats: { type: Object, required: true },
})
const emit = defineEmits(['start', 'import'])

const stage = ref('primary')
const difficulty = ref('easy')
const playMode = ref('solo')
const duelDeck = ref('same')
const stages = computed(() => [
  { id: 'primary', title: '小学词汇', label: '基础起跑线', count: props.wordCounts.primary, icon: BookOpen, tone: 'sunny' },
  { id: 'junior', title: '初中词汇', label: '核心加速场', count: props.wordCounts.junior, icon: School, tone: 'mint' },
  { id: 'senior', title: '高中词汇', label: '高考冲刺站', count: props.wordCounts.senior, icon: GraduationCap, tone: 'coral' },
  { id: 'custom', title: '我的词库', label: props.wordCounts.custom ? '私人练习册' : '导入新词表', count: props.wordCounts.custom, icon: Sparkles, tone: 'blue' },
])

function chooseStage(id) {
  if (id === 'custom' && !props.wordCounts.custom) {
    emit('import')
    return
  }
  stage.value = id
}

function start() {
  if (stage.value === 'custom' && !props.wordCounts.custom) return emit('import')
  emit('start', { stage: stage.value, difficulty: difficulty.value, playMode: playMode.value, duelDeck: duelDeck.value })
}
</script>

<template>
  <section class="home-view">
    <div class="welcome-row">
      <div>
        <p class="eyebrow">WORD POP CLUB</p>
        <h1>今天，从哪一站出发？</h1>
        <p class="welcome-copy">每天碰掉一点点，3000 个单词也会变轻。</p>
      </div>
      <div class="mascot" aria-hidden="true">
        <span class="mascot-ear left"></span><span class="mascot-ear right"></span>
        <span class="mascot-face"><i></i><i></i><b></b></span>
        <span class="mascot-book">ABC</span>
      </div>
    </div>

    <div class="stage-grid" role="radiogroup" aria-label="选择年级">
      <button
        v-for="item in stages"
        :key="item.id"
        class="stage-card"
        :class="[item.tone, { active: stage === item.id }]"
        type="button"
        role="radio"
        :aria-checked="stage === item.id"
        @click="chooseStage(item.id)"
      >
        <span class="stage-icon"><component :is="item.icon" :size="23" /></span>
        <span class="stage-copy"><strong>{{ item.title }}</strong><small>{{ item.label }}</small></span>
        <span class="stage-count"><b>{{ item.count }}</b><small>词</small></span>
      </button>
    </div>

    <section class="launch-band">
      <div class="setup-controls">
        <div class="control-group">
          <p>玩法</p>
          <div class="mode-control play-mode" role="radiogroup" aria-label="选择玩法">
            <button type="button" :class="{ active: playMode === 'solo' }" @click="playMode = 'solo'">
              <UserRound :size="17" /><strong>单人</strong>
            </button>
            <button type="button" :class="{ active: playMode === 'duo' }" @click="playMode = 'duo'">
              <Swords :size="17" /><strong>双人 PK</strong>
            </button>
          </div>
        </div>
        <div class="control-group">
          <p>难度</p>
          <div class="mode-control" role="radiogroup" aria-label="选择难度">
            <button type="button" :class="{ active: difficulty === 'easy' }" @click="difficulty = 'easy'">
              <strong>简单</strong><small>8 对 · 不限时</small>
            </button>
            <button type="button" :class="{ active: difficulty === 'hard' }" @click="difficulty = 'hard'">
              <strong>困难</strong><small>12 对 · 90 秒</small>
            </button>
          </div>
        </div>
        <div v-if="playMode === 'duo'" class="control-group duel-deck-group">
          <p>双方题目</p>
          <div class="mode-control play-mode" role="radiogroup" aria-label="选择双方题目">
            <button type="button" :class="{ active: duelDeck === 'same' }" @click="duelDeck = 'same'">
              <Copy :size="17" /><strong>同一套</strong>
            </button>
            <button type="button" :class="{ active: duelDeck === 'different' }" @click="duelDeck = 'different'">
              <Shuffle :size="17" /><strong>随机两套</strong>
            </button>
          </div>
        </div>
      </div>
      <button class="primary-button" type="button" @click="start">
        {{ playMode === 'duo' ? '开始对战' : '开始挑战' }} <ArrowRight :size="19" />
      </button>
    </section>

    <section class="mini-stats" aria-label="学习记录">
      <span><small>完成局数</small><b>{{ stats.rounds }}</b></span>
      <span><small>最佳得分</small><b>{{ stats.bestScore }}</b></span>
      <span><small>累计配对</small><b>{{ stats.matched }}</b></span>
      <button type="button" @click="emit('import')"><Upload :size="17" /> 导入词表</button>
    </section>
    <p class="data-credit">内置词库基于 ECDICT · MIT License</p>
  </section>
</template>
