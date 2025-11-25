<template>
  <div class="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
    <h2 class="text-lg font-semibold mb-4">
      {{ categorie ? 'Modifier la catégorie' : 'Ajouter une catégorie' }}
    </h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Label -->
      <div>
        <label for="label" class="block text-sm font-medium text-slate-700 mb-1">
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
        <label for="icon" class="block text-sm font-medium text-slate-700 mb-2">
          Icône
        </label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="icon in availableIcons"
            :key="icon"
            type="button"
            @click="form.icon = icon"
            :class="[
              'p-3 border-2 rounded-lg transition flex items-center justify-center',
              form.icon === icon
                ? 'border-indigo-500 bg-indigo-50'
                : 'border-slate-200 hover:border-slate-300',
            ]"
            :title="icon"
          >
            <PhosphorIcon :size="24">{{ icon }}</PhosphorIcon>
          </button>
        </div>
        <p v-if="errors.icon" class="mt-1 text-sm text-red-600">{{ errors.icon }}</p>
      </div>

      <!-- Color Selection -->
      <div>
        <label class="block text-sm font-medium text-slate-700 mb-2">
          Couleur
        </label>
        <div class="grid grid-cols-7 gap-2">
          <button
            v-for="color in availableColors"
            :key="color"
            type="button"
            @click="form.color = color"
            :class="[
              'w-10 h-10 rounded-lg border-2 transition',
              form.color === color ? 'border-slate-800' : 'border-slate-300',
              `bg-${color}-500`,
            ]"
            :title="color"
          ></button>
        </div>
        <p v-if="errors.color" class="mt-1 text-sm text-red-600">{{ errors.color }}</p>
      </div>

      <!-- Buttons -->
      <div class="flex gap-2 pt-4">
        <button
          type="submit"
          class="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
        >
          {{ categorie ? 'Mettre à jour' : 'Ajouter' }}
        </button>
        <button
          type="button"
          @click="$emit('cancel')"
          class="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 transition font-medium"
        >
          Annuler
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { Category } from '@/types/models'

interface Props {
  categorie: Category | null
  allCategories: Category[]
}

interface FormData {
  label: string
  icon: string
  color: string
}

const props = withDefaults(defineProps<Props>(), {
  categorie: null,
})

const emit = defineEmits<{
  submit: [category: Category]
  cancel: []
}>()

const availableIcons = [
  'Code',
  'React',
  'Rocket',
  'Cpu',
  'Palette',
  'Database',
  'Chat',
  'Calculator',
  'Microscope',
  'Globe',
  'Lightning',
  'BookOpen',
  'MoonStars',
  'Bug',
  'Wine',
  'Sparkle',
]

const availableColors = [
  'slate',
  'red',
  'orange',
  'amber',
  'yellow',
  'lime',
  'green',
  'emerald',
  'teal',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'pink',
]

const form = ref<FormData>({
  label: '',
  icon: 'Code',
  color: 'blue',
})

const errors = ref<Record<string, string>>({})

watch(
  () => props.categorie,
  (newCat) => {
    if (newCat) {
      form.value = {
        label: newCat.label,
        icon: newCat.icon,
        color: newCat.color,
      }
    } else {
      form.value = {
        label: '',
        icon: 'Code',
        color: 'blue',
      }
    }
    errors.value = {}
  },
  { immediate: true }
)

const validate = (): boolean => {
  errors.value = {}

  if (!form.value.label.trim()) {
    errors.value.label = 'Le label est requis'
  }

  // Check label uniqueness (excluding current category if editing)
  const isDuplicate = props.allCategories.some(
    (c) => c.label === form.value.label && c.id !== props.categorie?.id
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

const handleSubmit = () => {
  if (!validate()) return

  const category: Category = {
    id: props.categorie?.id || `cat_${Date.now()}`,
    label: form.value.label,
    icon: form.value.icon,
    color: form.value.color as any,
  }

  emit('submit', category)
}
</script>
