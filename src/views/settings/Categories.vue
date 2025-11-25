<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div>
      <h1 class="text-2xl font-bold">Gestion des catégories</h1>
      <p class="text-slate-600">Créer, modifier ou supprimer des catégories</p>
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
import { ref } from 'vue'
import type { Category } from '@/types/models'
import { useDataStore } from '@/stores/useDataStore'
import FormCategorie from '@/components/settings/FormCategorie.vue'
import ListeCategories from '@/components/settings/ListeCategories.vue'

const dataStore = useDataStore()
const editingCategory = ref<Category | null>(null)

const handleSaveCategory = async (category: Category) => {
  try {
    if (editingCategory.value?.id) {
      await dataStore.updateCategory(category)
    } else {
      await dataStore.addCategory(category)
    }
    editingCategory.value = null
  } catch (err) {
    console.error('Erreur lors de la sauvegarde de la catégorie:', err)
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
