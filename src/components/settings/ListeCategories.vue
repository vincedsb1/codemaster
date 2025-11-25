<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
    <div class="px-6 py-4 border-b border-slate-200">
      <h2 class="text-lg font-semibold">Catégories existantes</h2>
    </div>

    <div v-if="categories.length === 0" class="px-6 py-8 text-center">
      <p class="text-slate-500">Aucune catégorie créée. Ajoutez-en une ci-dessus.</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full">
        <thead>
          <tr class="border-b border-slate-200 bg-slate-50">
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600">Icône</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600">Label</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600">Couleur</th>
            <th class="px-6 py-3 text-left text-xs font-semibold text-slate-600">Questions</th>
            <th class="px-6 py-3 text-right text-xs font-semibold text-slate-600">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="category in categories"
            :key="category.id"
            class="border-b border-slate-200 hover:bg-slate-50 transition"
          >
            <!-- Icon with color background -->
            <td class="px-6 py-4">
              <div
                :class="[
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  `bg-${category.color}-100`,
                ]"
              >
                <PhosphorIcon :size="20">{{ category.icon }}</PhosphorIcon>
              </div>
            </td>

            <!-- Label -->
            <td class="px-6 py-4">
              <p class="font-medium text-slate-900">{{ category.label }}</p>
            </td>

            <!-- Color badge -->
            <td class="px-6 py-4">
              <span
                :class="[
                  'inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium',
                  `bg-${category.color}-100 text-${category.color}-700`,
                ]"
              >
                <span :class="[`w-3 h-3 rounded-full bg-${category.color}-500`]" />
                {{ category.color }}
              </span>
            </td>

            <!-- Question count -->
            <td class="px-6 py-4">
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-slate-100 text-slate-800">
                {{ getQuestionCountForCategory(category.label) }}
              </span>
            </td>

            <!-- Actions -->
            <td class="px-6 py-4">
              <div class="flex justify-end gap-2">
                <button
                  @click="$emit('edit', category)"
                  class="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  Éditer
                </button>
                <button
                  @click="$emit('delete', category.id)"
                  class="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  Supprimer
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
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

const getQuestionCountForCategory = (label: string): number => {
  return props.questions.filter((q) => q.categorie === label).length
}
</script>
