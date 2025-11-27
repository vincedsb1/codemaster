<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/useDataStore'
import { useQuizStore } from '@/stores/useQuizStore'
import { computed } from 'vue'

const router = useRouter()
const dataStore = useDataStore()
const quizStore = useQuizStore()

// Get categories that have questions
const categoriesDisponibles = computed(() => {
  console.log('[RandomConfig] Computing available categories...')
  const questionsCategories = new Set(dataStore.questions.map((q) => q.categorie))
  console.log('[RandomConfig] Question category IDs:', Array.from(questionsCategories))

  const available = dataStore.allCategories.filter((cat) => {
    const hasQuestions = questionsCategories.has(cat.id)
    console.log(`[RandomConfig] Category "${cat.label}" (id=${cat.id}): ${hasQuestions ? '✓ has questions' : '✗ no questions'}`)
    return hasQuestions
  })
  console.log('[RandomConfig] Available categories:', available.map((c) => c.label))
  return available
})

const canValidate = computed(() => quizStore.randomCategoriesSelection.length > 0)

// Helper function to get color classes
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  slate: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'hover:border-slate-400' },
  red: { bg: 'bg-red-50', text: 'text-red-600', border: 'hover:border-red-400' },
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'hover:border-orange-400' },
  amber: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'hover:border-amber-400' },
  yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'hover:border-yellow-400' },
  lime: { bg: 'bg-lime-50', text: 'text-lime-600', border: 'hover:border-lime-400' },
  green: { bg: 'bg-green-50', text: 'text-green-600', border: 'hover:border-green-400' },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'hover:border-emerald-400' },
  teal: { bg: 'bg-teal-50', text: 'text-teal-600', border: 'hover:border-teal-400' },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'hover:border-cyan-400' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-400' },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'hover:border-indigo-400' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-400' },
  pink: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'hover:border-pink-400' },
}

function getColorClasses(color: string): { bg: string; text: string; border: string } {
  return (colorMap[color] ?? colorMap.indigo) as { bg: string; text: string; border: string }
}

function validateRandomSelection() {
  quizStore.validateRandomSelection()
  router.push('/quiz/difficulty')
}
</script>

<template>
  <div class="p-4 flex flex-col h-full">
    <h2 class="text-xl font-bold mb-4">Quelles catégories ?</h2>

    <div class="flex-1 overflow-y-auto space-y-2">
      <label
        v-for="cat in categoriesDisponibles"
        :key="cat.id"
        :class="[
          'flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 cursor-pointer transition',
          getColorClasses(cat.color).border,
        ]"
      >
        <input
          type="checkbox"
          :value="cat.label"
          v-model="quizStore.randomCategoriesSelection"
          class="w-5 h-5 rounded focus:ring-2 focus:ring-offset-0"
          :class="[
            `accent-${cat.color}-600`,
          ]"
        />
        <div
          :class="[
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            getColorClasses(cat.color).bg,
          ]"
        >
          <PhosphorIcon :weight="'bold'" :size="18">{{ cat.icon }}</PhosphorIcon>
        </div>
        <span class="font-medium flex-1">{{ cat.label }}</span>
      </label>
    </div>

    <div class="mt-4 pt-4 border-t">
      <button
        @click="validateRandomSelection"
        :disabled="!canValidate"
        class="w-full bg-indigo-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Valider la sélection
      </button>
    </div>
  </div>
</template>
