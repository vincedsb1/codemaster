<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/useDataStore'
import type { Category } from '@/types/models'

const router = useRouter()
const dataStore = useDataStore()
const categories = dataStore.allCategories

const selectedCategory = ref<string>('')
const isImporting = ref(false)
const importSuccess = ref(false)

// Retrieve pending JSON from sessionStorage
const pendingJsonStr = sessionStorage.getItem('pendingImportJson')
const pendingJson = pendingJsonStr ? JSON.parse(pendingJsonStr) : null

const availableIcons = [
  'Code',
  'Rocket',
  'Cpu',
  'Palette',
  'Database',
  'Chat',
  'Calculator',
  'Microscope',
  'Globe',
  'Lightning',
  'Book',
  'Moon',
  'Bug',
  'Wine',
  'Sparkle',
  'Lightbulb',
  'Gear',
  'Wrench',
  'Hammer',
  'Square',
  'Star',
  'Heart',
  'Flag',
  'Target',
]

const colorMap: Record<string, string> = {
  slate: 'bg-slate-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  yellow: 'bg-yellow-500',
  lime: 'bg-lime-500',
  green: 'bg-green-500',
  emerald: 'bg-emerald-500',
  teal: 'bg-teal-500',
  cyan: 'bg-cyan-500',
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
}

const availableColors = Object.keys(colorMap)

const newCategory = ref({
  label: '',
  icon: 'Code',
  color: 'blue',
})

const createAndSelect = () => {
  if (!newCategory.value.label.trim()) return
  selectedCategory.value = newCategory.value.label
  newCategory.value = { label: '', icon: 'Code', color: 'blue' }
}

const handleSelect = async () => {
  if (!selectedCategory.value) return

  console.log('[SelectCategory] Category selected:', selectedCategory.value)
  isImporting.value = true
  importSuccess.value = false

  try {
    // Create category if it doesn't exist
    const existingCategory = dataStore.getCategoryByLabel(selectedCategory.value)
    if (!existingCategory) {
      console.log('[SelectCategory] Creating new category...')
      // Auto-create category with default values
      await dataStore.addCategory({
        id: `cat_${Date.now()}`,
        label: selectedCategory.value,
        icon: 'Code',
        color: 'blue',
      })
      console.log('[SelectCategory] Category created')
    }

    console.log('[SelectCategory] PendingJson:', pendingJson?.length, 'questions')

    if (pendingJson) {
      // Import questions with timeout
      console.log('[SelectCategory] Starting import...')

      const importPromise = dataStore.importQuestions(pendingJson, selectedCategory.value)

      // Add timeout to detect hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Import timeout après 30 secondes')), 30000)
      )

      const result = await Promise.race([importPromise, timeoutPromise])
      console.log('[SelectCategory] Import result:', result)
      console.log('[SelectCategory] Import successful! Count:', (result as any).count)
    }

    // Show success message
    importSuccess.value = true
    console.log('[SelectCategory] Import success state set to true')

    // Clear sessionStorage and navigate back to home after short delay
    sessionStorage.removeItem('pendingImportJson')
    console.log('[SelectCategory] Import complete, navigating to home')

    setTimeout(() => {
      router.push({ name: 'home' })
    }, 2000)
  } catch (err) {
    isImporting.value = false
    console.error('[SelectCategory] Error:', err)
    alert(err instanceof Error ? err.message : 'Erreur lors de l\'import')
  }
}

const handleCancel = () => {
  console.log('[SelectCategory] Import cancelled')
  sessionStorage.removeItem('pendingImportJson')
  router.back()
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 pt-6 px-4">
      <h1 class="text-2xl font-bold">Sélectionner une catégorie</h1>
      <p class="text-slate-600 text-sm">Choisissez la catégorie pour les questions importées</p>
    </div>

    <div class="px-4 space-y-6 pb-4">
      <!-- Existing categories -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-semibold mb-4">Catégories existantes</h3>
        <div class="space-y-2">
          <button
            v-for="cat in categories"
            :key="cat.id"
            type="button"
            @click="selectedCategory = cat.label"
            :class="[
              'w-full text-left px-4 py-3 rounded-lg border-2 transition flex items-center gap-3',
              selectedCategory === cat.label
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300',
            ]"
          >
            <PhosphorIcon :size="20">{{ cat.icon }}</PhosphorIcon>
            <span class="font-medium">{{ cat.label }}</span>
          </button>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-slate-200"></div>

      <!-- New category form -->
      <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 class="text-lg font-semibold mb-4">Créer une nouvelle catégorie</h3>
        <form @submit.prevent class="space-y-4">
          <input
            v-model="newCategory.label"
            type="text"
            placeholder="Label (ex: Python)"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <div>
            <label class="text-sm font-medium text-slate-600 mb-2 block">Icône</label>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="icon in availableIcons"
                :key="icon"
                type="button"
                @click="newCategory.icon = icon"
                :class="[
                  'p-2 border-2 rounded-lg transition flex items-center justify-center',
                  newCategory.icon === icon
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-slate-300',
                ]"
                :title="icon"
              >
                <PhosphorIcon :size="20">{{ icon }}</PhosphorIcon>
              </button>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-600 mb-2 block">Couleur</label>
            <div class="grid grid-cols-7 gap-2">
              <button
                v-for="color in availableColors"
                :key="color"
                type="button"
                @click="newCategory.color = color"
                :class="[
                  'w-10 h-10 rounded-lg border-2 transition',
                  newCategory.color === color ? 'border-slate-800' : 'border-slate-300',
                  colorMap[color],
                ]"
                :title="color"
              ></button>
            </div>
          </div>

          <button
            type="button"
            @click="createAndSelect"
            :disabled="!newCategory.label.trim()"
            class="w-full px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Créer et sélectionner
          </button>
        </form>
      </div>

      <!-- Actions -->
      <div class="flex gap-2">
        <button
          @click="handleCancel"
          :disabled="isImporting"
          class="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Annuler
        </button>
        <button
          @click="handleSelect"
          :disabled="!selectedCategory || isImporting"
          class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <span v-if="isImporting" class="animate-spin">⏳</span>
          <span>{{ isImporting ? 'Import en cours...' : 'Importer' }}</span>
        </button>
      </div>

      <!-- Success Message -->
      <div
        v-if="importSuccess"
        class="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-bounce"
      >
        <span class="text-xl">✓</span>
        <span class="font-medium">Import réussi!</span>
      </div>
    </div>
  </div>
</template>
