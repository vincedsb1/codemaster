<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/useDataStore'
import { useQuizStore } from '@/stores/useQuizStore'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()
const dataStore = useDataStore()
const quizStore = useQuizStore()

// Get categories that have questions
const categoriesDisponibles = computed(() => {
  const questionsCategories = new Set(dataStore.questions.map((q) => q.categorie))
  return dataStore.allCategories.filter((cat) => questionsCategories.has(cat.label))
})

// Get category labels for random config
const categoryLabels = computed(() => {
  return categoriesDisponibles.value.map((cat) => cat.label)
})

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

function selectCategory(category: string) {
  quizStore.selectCategory(category)
  router.push('/quiz/difficulty')
}

function openRandomConfig() {
  quizStore.openRandomConfig(categoryLabels.value)
  router.push('/quiz/randomconfig')
}

function goToImport() {
  router.push('/settings/import')
}
</script>

<template>
  <div v-if="dataStore.isLoading" class="flex items-center justify-center h-full">
    <LoadingSpinner />
  </div>

  <div v-else class="p-4 space-y-6 h-full flex flex-col">
    <div class="space-y-2">
      <h2 class="text-2xl font-bold text-slate-800">Bonjour ! 👋</h2>
      <p class="text-slate-500">Prêt pour un entraînement ? Choisis une catégorie.</p>
    </div>

    <div class="grid grid-cols-2 gap-3">
      <button
        v-for="cat in categoriesDisponibles"
        :key="cat.id"
        @click="selectCategory(cat.label)"
        :class="[
          'p-4 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center gap-2 hover:shadow-md transition active:scale-95',
          getColorClasses(cat.color).border,
        ]"
      >
        <div
          :class="[
            'w-10 h-10 rounded-full flex items-center justify-center',
            getColorClasses(cat.color).bg,
          ]"
        >
          <PhosphorIcon :weight="'bold'" :size="24">{{ cat.icon }}</PhosphorIcon>
        </div>
        <span class="font-medium text-sm text-center">{{ cat.label }}</span>
      </button>
    </div>

    <!-- Random Selection -->
    <button
      @click="openRandomConfig"
      class="w-full p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md text-white flex items-center justify-between group active:scale-95 transition"
    >
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <i class="ph ph-shuffle text-xl"></i>
        </div>
        <div class="text-left">
          <div class="font-bold">Mode Aléatoire</div>
          <div class="text-xs opacity-90">Mélange les catégories</div>
        </div>
      </div>
      <i class="ph ph-caret-right text-xl group-hover:translate-x-1 transition"></i>
    </button>

    <div class="flex-1"></div>

    <div class="pt-8 border-t border-slate-200">
      <button
        @click="goToImport"
        class="text-sm text-slate-500 flex items-center gap-2 hover:text-indigo-600"
      >
        <i class="ph ph-download-simple"></i> Gestion des données / Import
      </button>
    </div>
  </div>
</template>
