<template>
  <div class="space-y-6 pb-20">
    <!-- En-tête -->
    <div class="space-y-2 pt-6 px-4">
      <h1 class="text-2xl font-bold">Gestion des catégories</h1>
      <p class="text-slate-600 text-sm">Gérez vos catégories de questions</p>
    </div>

    <!-- Liste des catégories -->
    <ListeCategories
      :categories="dataStore.allCategories"
      :questions="dataStore.questions"
      @category-click="handleCategoryClick"
      @delete="handleDeleteCategory"
    />

    <!-- FAB (Floating Action Button) -->
    <button
      @click="handleCreateCategory"
      class="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition flex items-center justify-center active:scale-95"
      title="Créer une catégorie"
    >
      <PhosphorIcon :size="24">Plus</PhosphorIcon>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/useDataStore'
import ListeCategories from '@/components/settings/ListeCategories.vue'

const router = useRouter()
const dataStore = useDataStore()

const handleCreateCategory = () => {
  router.push({ name: 'category-edit' })
}

const handleCategoryClick = (categoryId: string) => {
  router.push({ name: 'category-edit', query: { id: categoryId } })
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
