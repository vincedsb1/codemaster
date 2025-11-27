<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import type { Category } from '@/types/models'
import { useDataStore } from '@/stores/useDataStore'

const router = useRouter()
const route = useRoute()
const dataStore = useDataStore()

// Get category ID from query params - if present, it's edit mode
const categoryId = route.query.id as string | undefined
const isEditMode = !!categoryId
const editingCategory = ref<Category | null>(null)

// Load category if editing
if (isEditMode && categoryId) {
  const cat = dataStore.allCategories.find((c) => c.id === categoryId)
  if (cat) {
    editingCategory.value = { ...cat }
  }
}

const form = ref<{ label: string; icon: string; color: string }>({
  label: editingCategory.value?.label || '',
  icon: editingCategory.value?.icon || 'Code',
  color: editingCategory.value?.color || 'blue',
})

const errors = ref<Record<string, string>>({})

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

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.label.trim()) {
    errors.value.label = 'Le label est requis'
  }

  const isDuplicate = dataStore.allCategories.some(
    (c) => c.label === form.value.label && c.id !== editingCategory.value?.id
  )

  if (isDuplicate) {
    errors.value.label = `Une catégorie avec le label "${form.value.label}" existe déjà`
  }

  if (!form.value.icon) {
    errors.value.icon = 'L\'icône est requise'
  }

  if (!form.value.color) {
    errors.value.color = 'La couleur est requise'
  }

  return Object.keys(errors.value).length === 0
}

const handleSubmit = async () => {
  if (!validate()) return

  try {
    const category: Category = {
      id: editingCategory.value?.id || `cat_${Date.now()}`,
      label: form.value.label,
      icon: form.value.icon,
      color: form.value.color as any,
    }

    if (isEditMode && editingCategory.value?.id) {
      await dataStore.updateCategory(category)
    } else {
      await dataStore.addCategory(category)
    }

    // Return to categories list
    router.push({ name: 'categories' })
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la catégorie:', err)
  }
}

const handleCancel = () => {
  router.push({ name: 'categories' })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 pt-6 px-4">
      <h1 class="text-2xl font-bold">
        {{ isEditMode ? 'Modifier la catégorie' : 'Créer une catégorie' }}
      </h1>
      <p class="text-slate-600 text-sm">
        {{ isEditMode ? 'Modifiez les détails de la catégorie' : 'Créez une nouvelle catégorie' }}
      </p>
    </div>

    <!-- Form -->
    <div class="px-4">
      <form @submit.prevent="handleSubmit" class="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <!-- Label -->
        <div>
          <label for="label" class="block text-sm font-medium text-slate-700 mb-2">
            Label
          </label>
          <input
            id="label"
            v-model="form.label"
            type="text"
            placeholder="Ex: TypeScript, React, Node.js"
            class="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p v-if="errors.label" class="mt-1 text-sm text-red-600">{{ errors.label }}</p>
        </div>

        <!-- Icon Selection -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-3">
            Icône
          </label>
          <div class="grid grid-cols-6 gap-3">
            <button
              v-for="icon in availableIcons"
              :key="icon"
              type="button"
              @click="form.icon = icon"
              :class="[
                'w-12 h-12 border rounded-xl transition-all duration-200 flex items-center justify-center text-slate-600',
                form.icon === icon
                  ? 'border-indigo-400 bg-indigo-50 text-indigo-600 ring-2 ring-offset-0 ring-indigo-400'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
              ]"
              :title="icon"
            >
              <PhosphorIcon :size="24" :weight="form.icon === icon ? 'bold' : 'regular'">{{ icon }}</PhosphorIcon>
            </button>
          </div>
          <p v-if="errors.icon" class="mt-1 text-sm text-red-600">{{ errors.icon }}</p>
        </div>

        <!-- Color Selection -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-3">
            Couleur
          </label>
          <div class="grid grid-cols-7 gap-3">
            <button
              v-for="color in availableColors"
              :key="color"
              type="button"
              @click="form.color = color"
              :class="[
                'w-8 h-8 rounded-lg border transition-all duration-200',
                form.color === color
                  ? 'border-slate-400 ring-1 ring-offset-1 ring-slate-400 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300',
                colorMap[color],
              ]"
              :title="color"
            ></button>
          </div>
          <p v-if="errors.color" class="mt-1 text-sm text-red-600">{{ errors.color }}</p>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 pt-6">
          <button
            type="submit"
            class="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
          >
            {{ isEditMode ? 'Mettre à jour' : 'Créer la catégorie' }}
          </button>
          <button
            type="button"
            @click="handleCancel"
            class="flex-1 px-4 py-3 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
