<script setup>
import { computed, ref, watch } from 'vue'
import { BookOpenCheck, ChevronLeft, ChevronRight, FileJson2, Plus, Search, Trash2, Upload, X } from 'lucide-vue-next'
import { parseWordFile } from '../utils/importer.js'

const props = defineProps({ words: { type: Array, required: true } })
const emit = defineEmits(['close', 'save'])
const activeTab = ref(props.words.length ? 'manage' : 'import')
const rawText = ref('')
const fileName = ref('')
const error = ref('')
const query = ref('')
const page = ref(1)
const pageSize = 40
const selectedKeys = ref([])

const pending = computed(() => parseWordFile(rawText.value, fileName.value))
const filteredWords = computed(() => {
  const keyword = query.value.trim().toLocaleLowerCase()
  if (!keyword) return props.words
  return props.words.filter((word) => word.en.toLocaleLowerCase().includes(keyword) || word.zh.toLocaleLowerCase().includes(keyword))
})
const pageCount = computed(() => Math.max(1, Math.ceil(filteredWords.value.length / pageSize)))
const pageWords = computed(() => filteredWords.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const allPageSelected = computed(() => pageWords.value.length > 0 && pageWords.value.every((word) => selectedKeys.value.includes(wordKey(word))))

watch(query, () => { page.value = 1 })
watch(() => props.words.length, () => {
  page.value = Math.min(page.value, pageCount.value)
  const available = new Set(props.words.map(wordKey))
  selectedKeys.value = selectedKeys.value.filter((key) => available.has(key))
})

async function readFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  fileName.value = file.name
  rawText.value = await file.text()
}

function saveImport() {
  if (!pending.value.length) {
    error.value = '没有识别到有效的中英文词对'
    return
  }
  const map = new Map(props.words.map((word) => [wordKey(word), word]))
  pending.value.forEach((word) => map.set(wordKey(word), word))
  emit('save', [...map.values()].slice(0, 5000))
  emit('close')
}

function toggleWord(word) {
  const key = wordKey(word)
  selectedKeys.value = selectedKeys.value.includes(key)
    ? selectedKeys.value.filter((item) => item !== key)
    : [...selectedKeys.value, key]
}

function togglePage() {
  const pageKeys = pageWords.value.map(wordKey)
  if (allPageSelected.value) {
    const removing = new Set(pageKeys)
    selectedKeys.value = selectedKeys.value.filter((key) => !removing.has(key))
  } else {
    selectedKeys.value = [...new Set([...selectedKeys.value, ...pageKeys])]
  }
}

function removeWord(word) {
  if (!window.confirm(`删除“${word.en} / ${word.zh}”？`)) return
  const key = wordKey(word)
  emit('save', props.words.filter((item) => wordKey(item) !== key))
  selectedKeys.value = selectedKeys.value.filter((item) => item !== key)
}

function removeSelected() {
  if (!selectedKeys.value.length || !window.confirm(`删除选中的 ${selectedKeys.value.length} 个词？`)) return
  const removing = new Set(selectedKeys.value)
  emit('save', props.words.filter((word) => !removing.has(wordKey(word))))
  selectedKeys.value = []
}

function clearAll() {
  if (props.words.length && window.confirm(`清空全部 ${props.words.length} 个本地词汇？`)) {
    emit('save', [])
    selectedKeys.value = []
  }
}

function wordKey(word) {
  return word.en.toLocaleLowerCase()
}
</script>

<template>
  <div class="dialog-backdrop" @mousedown.self="emit('close')" @keydown.esc="emit('close')">
    <section class="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <header>
        <div><span class="dialog-icon"><FileJson2 :size="21" /></span><h2 id="import-title">我的词库</h2></div>
        <button class="icon-button" type="button" aria-label="关闭" title="关闭" @click="emit('close')"><X :size="20" /></button>
      </header>

      <div class="library-tabs" role="tablist" aria-label="词库操作">
        <button type="button" role="tab" :aria-selected="activeTab === 'manage'" :class="{ active: activeTab === 'manage' }" @click="activeTab = 'manage'">
          <BookOpenCheck :size="17" /> 管理词汇 <b>{{ words.length }}</b>
        </button>
        <button type="button" role="tab" :aria-selected="activeTab === 'import'" :class="{ active: activeTab === 'import' }" @click="activeTab = 'import'">
          <Plus :size="17" /> 导入词汇
        </button>
      </div>

      <div v-if="activeTab === 'import'" class="import-panel" role="tabpanel">
        <div class="import-summary">
          <span><small>已保存</small><b>{{ words.length }}</b></span>
          <span><small>本次识别</small><b>{{ pending.length }}</b></span>
        </div>

        <label class="file-button">
          <Upload :size="18" /> 选择 TXT、CSV 或 JSON
          <input type="file" accept=".txt,.csv,.json,text/plain,application/json" @change="readFile" />
        </label>
        <textarea v-model="rawText" rows="9" placeholder="apple, 苹果&#10;take care, 当心；保重&#10;beautiful, 美丽的；漂亮的"></textarea>
        <p v-if="fileName" class="file-name">{{ fileName }}</p>
        <p v-if="error" class="form-error">{{ error }}</p>

        <div v-if="pending.length" class="import-preview">
          <span v-for="word in pending.slice(0, 3)" :key="word.en"><b>{{ word.en }}</b><small>{{ word.zh }}</small></span>
        </div>

        <footer class="import-actions">
          <span></span>
          <button class="primary-button compact" type="button" @click="saveImport">保存 {{ pending.length }} 个词</button>
        </footer>
      </div>

      <div v-else class="manage-panel" role="tabpanel">
        <div class="manager-toolbar">
          <label class="search-field"><Search :size="17" /><input v-model="query" type="search" placeholder="搜索英文或中文" /></label>
          <button class="danger-button" type="button" :disabled="!selectedKeys.length" @click="removeSelected"><Trash2 :size="16" /> 删除所选</button>
        </div>

        <div v-if="words.length" class="selection-bar">
          <label><input type="checkbox" :checked="allPageSelected" @change="togglePage" /> 选择本页</label>
          <span>{{ filteredWords.length }} 个结果<span v-if="selectedKeys.length"> · 已选 {{ selectedKeys.length }}</span></span>
        </div>

        <div v-if="pageWords.length" class="word-manager-list">
          <div v-for="word in pageWords" :key="wordKey(word)" class="word-manager-row">
            <input type="checkbox" :checked="selectedKeys.includes(wordKey(word))" :aria-label="`选择 ${word.en}`" @change="toggleWord(word)" />
            <strong>{{ word.en }}</strong>
            <span>{{ word.zh }}</span>
            <button class="row-delete" type="button" :aria-label="`删除 ${word.en}`" :title="`删除 ${word.en}`" @click="removeWord(word)"><Trash2 :size="16" /></button>
          </div>
        </div>
        <div v-else class="manager-empty">
          <BookOpenCheck :size="27" />
          <strong>{{ words.length ? '没有匹配的词汇' : '词库还是空的' }}</strong>
          <button v-if="!words.length" class="secondary-button" type="button" @click="activeTab = 'import'"><Plus :size="16" /> 导入词汇</button>
        </div>

        <div v-if="filteredWords.length" class="manager-pagination">
          <button class="icon-button" type="button" aria-label="上一页" title="上一页" :disabled="page === 1" @click="page -= 1"><ChevronLeft :size="18" /></button>
          <span>{{ page }} / {{ pageCount }}</span>
          <button class="icon-button" type="button" aria-label="下一页" title="下一页" :disabled="page === pageCount" @click="page += 1"><ChevronRight :size="18" /></button>
        </div>

        <footer class="manage-actions">
          <button class="danger-button" type="button" :disabled="!words.length" @click="clearAll"><Trash2 :size="16" /> 清空全部</button>
          <button class="secondary-button" type="button" @click="emit('close')">完成</button>
        </footer>
      </div>
    </section>
  </div>
</template>
