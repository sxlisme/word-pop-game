<script setup>
import { computed, ref } from 'vue'
import { FileJson2, Trash2, Upload, X } from 'lucide-vue-next'
import { parseWordFile } from '../utils/importer.js'

const props = defineProps({ words: { type: Array, required: true } })
const emit = defineEmits(['close', 'save'])
const rawText = ref('')
const fileName = ref('')
const error = ref('')
const pending = computed(() => parseWordFile(rawText.value, fileName.value))

async function readFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  fileName.value = file.name
  rawText.value = await file.text()
}

function save() {
  if (!pending.value.length) {
    error.value = '没有识别到有效的中英文词对'
    return
  }
  const map = new Map(props.words.map((word) => [word.en.toLocaleLowerCase(), word]))
  pending.value.forEach((word) => map.set(word.en.toLocaleLowerCase(), word))
  emit('save', [...map.values()].slice(0, 5000))
  emit('close')
}

function clearAll() {
  if (!props.words.length || window.confirm('清空全部本地词汇？')) emit('save', [])
}
</script>

<template>
  <div class="dialog-backdrop" @mousedown.self="emit('close')" @keydown.esc="emit('close')">
    <section class="import-dialog" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <header>
        <div><span class="dialog-icon"><FileJson2 :size="21" /></span><h2 id="import-title">我的词库</h2></div>
        <button class="icon-button" type="button" aria-label="关闭" title="关闭" @click="emit('close')"><X :size="20" /></button>
      </header>

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

      <footer>
        <button class="danger-button" type="button" :disabled="!words.length" @click="clearAll"><Trash2 :size="17" /> 清空</button>
        <button class="primary-button compact" type="button" @click="save">保存 {{ pending.length }} 个词</button>
      </footer>
    </section>
  </div>
</template>
