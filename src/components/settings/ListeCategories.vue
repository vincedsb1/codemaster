<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200">
      <h2 class="text-lg font-semibold">Catégories existantes</h2>
    </div>

    <div v-if="categories.length === 0" class="px-6 py-8 text-center">
      <p class="text-slate-500">Aucune catégorie créée. Ajoutez-en une ci-dessus.</p>
    </div>

    <div v-else class="space-y-2 p-4">
      <div
        v-for="category in categories"
        :key="category.id"
        class="relative overflow-hidden rounded-lg border border-slate-200"
        @touchstart="handleTouchStart($event, category.id)"
        @touchmove="handleTouchMove($event, category.id)"
        @touchend="handleTouchEnd(category.id)"
      >
        <!-- Swipe delete background -->
        <div class="absolute inset-0 bg-red-500 flex items-center justify-end pr-4 z-0">
          <button
            @click="$emit('delete', category.id)"
            class="text-white"
            title="Supprimer"
          >
            <PhosphorIcon :size="24">Trash</PhosphorIcon>
          </button>
        </div>

        <!-- Main category row (swipeable) -->
        <div
          :style="{ transform: `translateX(${swipeOffsets[category.id] || 0}px)` }"
          class="relative bg-white p-4 flex items-center justify-between gap-3 transition-transform"
        >
          <!-- Icon and label -->
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                colorLightMap[category.color],
              ]"
            >
              <PhosphorIcon :size="20">{{ category.icon }}</PhosphorIcon>
            </div>
            <div class="min-w-0 flex-1">
              <p class="font-medium text-slate-900 truncate">{{ category.label }}</p>
              <p class="text-xs text-slate-500">
                {{ getQuestionCountForCategory(category.label) }} question<span v-if="getQuestionCountForCategory(category.label) !== 1">s</span>
              </p>
            </div>
          </div>

          <!-- Edit button (icon only) -->
          <button
            @click="$emit('edit', category)"
            class="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition flex-shrink-0"
            title="Modifier"
          >
            <PhosphorIcon :size="20">Pencil</PhosphorIcon>
          </button>
        </div>
      </div>

      <!-- Swipe hint for mobile -->
      <p class="text-xs text-slate-500 text-center md:hidden mt-2">
        Swipe à gauche pour supprimer
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Category, Question } from '@/types/models'

interface Props {
  categories: Category[]
  questions: Question[]
}

const props = defineProps<Props>()

defineEmits<{
  edit: [category: Category]
  delete: [categoryId: string]
}>()

// Swipe state
const swipeOffsets = ref<Record<string, number>>({})
const touchStartX = ref<Record<string, number>>({})
const SWIPE_THRESHOLD = 60 // pixels to swipe before trigger

const handleTouchStart = (event: TouchEvent, categoryId: string) => {
  touchStartX.value[categoryId] = event.touches[0]?.clientX || 0
}

const handleTouchMove = (event: TouchEvent, categoryId: string) => {
  const currentX = event.touches[0]?.clientX || 0
  const startX = touchStartX.value[categoryId] || 0
  const diff = currentX - startX

  // Only allow swiping left (negative values)
  if (diff < 0) {
    swipeOffsets.value[categoryId] = Math.max(diff, -80)
  }
}

const handleTouchEnd = (categoryId: string) => {
  const offset = swipeOffsets.value[categoryId] || 0

  // If swiped more than threshold, snap to open
  if (offset < -SWIPE_THRESHOLD) {
    swipeOffsets.value[categoryId] = -80
  } else {
    // Otherwise snap back to closed
    swipeOffsets.value[categoryId] = 0
  }
}

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

const colorLightMap: Record<string, string> = {
  slate: 'bg-slate-100',
  red: 'bg-red-100',
  orange: 'bg-orange-100',
  amber: 'bg-amber-100',
  yellow: 'bg-yellow-100',
  lime: 'bg-lime-100',
  green: 'bg-green-100',
  emerald: 'bg-emerald-100',
  teal: 'bg-teal-100',
  cyan: 'bg-cyan-100',
  blue: 'bg-blue-100',
  indigo: 'bg-indigo-100',
  purple: 'bg-purple-100',
  pink: 'bg-pink-100',
}

const colorBadgeLightMap: Record<string, string> = {
  slate: 'bg-slate-100',
  red: 'bg-red-100',
  orange: 'bg-orange-100',
  amber: 'bg-amber-100',
  yellow: 'bg-yellow-100',
  lime: 'bg-lime-100',
  green: 'bg-green-100',
  emerald: 'bg-emerald-100',
  teal: 'bg-teal-100',
  cyan: 'bg-cyan-100',
  blue: 'bg-blue-100',
  indigo: 'bg-indigo-100',
  purple: 'bg-purple-100',
  pink: 'bg-pink-100',
}

const colorBadgeTextMap: Record<string, string> = {
  slate: 'text-slate-700',
  red: 'text-red-700',
  orange: 'text-orange-700',
  amber: 'text-amber-700',
  yellow: 'text-yellow-700',
  lime: 'text-lime-700',
  green: 'text-green-700',
  emerald: 'text-emerald-700',
  teal: 'text-teal-700',
  cyan: 'text-cyan-700',
  blue: 'text-blue-700',
  indigo: 'text-indigo-700',
  purple: 'text-purple-700',
  pink: 'text-pink-700',
}

const getQuestionCountForCategory = (label: string): number => {
  return props.questions.filter((q) => q.categorie === label).length
}
</script>
