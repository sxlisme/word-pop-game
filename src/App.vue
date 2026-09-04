<script setup>
import { computed, ref } from 'vue'
import { LibraryBig, Volume2, VolumeX } from 'lucide-vue-next'
import { BUILTIN_WORDS } from './data/words.js'
import HomeScreen from './components/HomeScreen.vue'
import GameBoard from './components/GameBoard.vue'
import ImportDialog from './components/ImportDialog.vue'
import { loadCustomWords, loadStats, saveCustomWords, saveStats } from './utils/storage.js'

const view = ref('home')
const gameConfig = ref(null)
const importOpen = ref(false)
const customWords = ref(loadCustomWords())
const stats = ref(loadStats())
const speechSupported = 'speechSynthesis' in window
const soundEnabled = ref(speechSupported)

const wordCounts = computed(() => ({
  primary: BUILTIN_WORDS.filter((word) => word.stage === 'primary').length,
  junior: BUILTIN_WORDS.filter((word) => word.stage === 'junior').length,
  senior: BUILTIN_WORDS.filter((word) => word.stage === 'senior').length,
  custom: customWords.value.length,
}))

function startGame(config) {
  gameConfig.value = config
  view.value = 'game'
}

function finishRound(result) {
  if (!result.completed) return
  stats.value = {
    rounds: stats.value.rounds + 1,
    bestScore: Math.max(stats.value.bestScore, result.score),
    matched: stats.value.matched + result.matched,
  }
  saveStats(stats.value)
}

function updateCustomWords(words) {
  customWords.value = words
  saveCustomWords(words)
}
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="brand-button" type="button" aria-label="返回首页" @click="view = 'home'">
        <span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>
        <span>词语碰碰</span>
      </button>
      <div class="top-actions">
        <button
          v-if="speechSupported"
          class="icon-button"
          type="button"
          :aria-label="soundEnabled ? '关闭发音' : '开启发音'"
          :title="soundEnabled ? '关闭发音' : '开启发音'"
          @click="soundEnabled = !soundEnabled"
        >
          <Volume2 v-if="soundEnabled" :size="19" />
          <VolumeX v-else :size="19" />
        </button>
        <button class="tool-button" type="button" @click="importOpen = true">
          <LibraryBig :size="18" />
          <span>我的词库</span>
          <b>{{ customWords.length }}</b>
        </button>
      </div>
    </header>

    <main>
      <HomeScreen
        v-if="view === 'home'"
        :word-counts="wordCounts"
        :stats="stats"
        @start="startGame"
        @import="importOpen = true"
      />
      <GameBoard
        v-else
        :key="`${gameConfig.stage}-${gameConfig.difficulty}-${gameConfig.playMode}-${gameConfig.duelDeck || 'same'}`"
        :config="gameConfig"
        :builtin-words="BUILTIN_WORDS"
        :custom-words="customWords"
        :sound-enabled="soundEnabled"
        @exit="view = 'home'"
        @finish="finishRound"
      />
    </main>

    <ImportDialog
      v-if="importOpen"
      :words="customWords"
      @close="importOpen = false"
      @save="updateCustomWords"
    />
  </div>
</template>
