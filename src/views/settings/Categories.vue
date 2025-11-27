<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="space-y-2 pt-6">
      <h1 class="text-2xl font-bold px-4">Gestion des catégories</h1>
      <p class="text-slate-600 text-sm px-4">Créer, modifier ou supprimer des catégories</p>
    </div>

    <!-- Formulaire d'ajout/édition -->
    <FormCategorie
      :categorie="editingCategory"
      :all-categories="dataStore.allCategories"
      @submit="handleSaveCategory"
      @cancel="editingCategory = null"
    />

    <!-- Liste des catégories -->
    <ListeCategories
      :categories="dataStore.allCategories"
      :questions="dataStore.questions"
      @edit="editingCategory = $event"
      @delete="handleDeleteCategory"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue'
import type { Category } from '@/types/models'
import { useDataStore } from '@/stores/useDataStore'
import FormCategorie from '@/components/settings/FormCategorie.vue'
import ListeCategories from '@/components/settings/ListeCategories.vue'

const dataStore = useDataStore()
const editingCategory = ref<Category | null>(null)

const handleSaveCategory = async (category: Category) => {
  try {
    console.log('=== handleSaveCategory ===')
    console.log('Input category:', category)
    console.log('Input category type:', typeof category)
    console.log('Input category keys:', Object.keys(category))

    // Use toRaw to unwrap Vue reactivity, then extract plain values
    const raw = toRaw(category)
    console.log('After toRaw:', raw)
    console.log('Raw type:', typeof raw)

    const cleanCategory: Category = {
      id: raw.id,
      label: raw.label,
      icon: raw.icon,
      color: raw.color,
    }

    console.log('cleanCategory:', cleanCategory)
    console.log('cleanCategory stringified:', JSON.stringify(cleanCategory))

    if (editingCategory.value?.id) {
      console.log('Updating category with ID:', editingCategory.value.id)
      // Make sure we're using a clean version for comparison too
      const rawEditingCat = toRaw(editingCategory.value)
      cleanCategory.id = rawEditingCat.id
      await dataStore.updateCategory(cleanCategory)
    } else {
      console.log('Adding new category')
      await dataStore.addCategory(cleanCategory)
    }
    editingCategory.value = null
    console.log('Success!')
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la catégorie:', err)
    console.error('Stack:', err instanceof Error ? err.stack : 'N/A')
  }
}

const handleDeleteCategory = async (categoryId: string) => {
  if (
    confirm(
      'Êtes-vous sûr? Toutes les questions de cette catégorie seront supprimées.'
    )
  ) {
    try {
      await dataStore.deleteCategory(categoryId)
    } catch (err) {
      console.error('Erreur lors de la suppression de la catégorie:', err)
    }
  }
}
</script>
