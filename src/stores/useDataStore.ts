/**
 * Data Store - Manages static data (Questions, Badges, Categories)
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Question, Badge, Category, Difficulty } from '@/types/models'
import { DEFAULT_QUESTIONS, DEFAULT_BADGES, DEFAULT_CATEGORIES } from '@/types/constants'
import { questionRepository, metaRepository, categoryRepository } from '@/db/repositories'

export const useDataStore = defineStore('data', () => {
  // State
  const questions = ref<Question[]>([])
  const badges = ref<Badge[]>([])
  const categories = ref<Category[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Actions
  async function initData() {
    isLoading.value = true
    error.value = null

    try {
      // Load questions from DB (JSON loading happens via Import.vue)
      console.log('[DataStore] initData() started, loading questions from IndexedDB...')
      const qs = await questionRepository.getAll()
      questions.value = qs
      console.log(`[DataStore] ✓ Loaded ${qs.length} questions from IndexedDB`)
      if (qs.length === 0) {
        console.warn('[DataStore] ⚠️ No questions found in IndexedDB. User needs to load them via /settings/import')
      }

      // Load badges from meta store
      let bdgs = await metaRepository.getBadges()

      if (bdgs.length === 0) {
        // First time: load defaults
        await metaRepository.saveBadges(DEFAULT_BADGES)
        bdgs = DEFAULT_BADGES
      }

      badges.value = bdgs

      // Load categories from DB
      let cats = await categoryRepository.getAll()

      if (cats.length === 0) {
        // First time: load defaults
        await categoryRepository.saveMany(DEFAULT_CATEGORIES)
        cats = DEFAULT_CATEGORIES
      }

      categories.value = cats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des données'
      console.error('Data init error:', err)
    } finally {
      isLoading.value = false
    }
  }

  async function importQuestions(json: Array<Record<string, unknown>>, targetCategory?: string) {
    error.value = null

    try {
      console.log('[DataStore] importQuestions called with', json.length, 'questions, targetCategory:', targetCategory)

      // Validation
      if (!Array.isArray(json)) {
        throw new Error('Le fichier doit contenir un tableau JSON')
      }

      if (json.length === 0) {
        throw new Error('Le fichier est vide')
      }

      console.log('[DataStore] Validation passed, first question:', json[0])

      const firstQuestion = json[0] as Record<string, unknown>
      if (
        !firstQuestion.intitule ||
        !firstQuestion.reponses ||
        firstQuestion.indexBonneReponse === undefined ||
        !firstQuestion.difficulte
      ) {
        throw new Error('Format invalide : propriétés requises manquantes')
      }

      console.log('[DataStore] Format validation passed')

      // Normalize and save
      const normalized: Question[] = json.map((q, idx) => {
        const question = q as Record<string, unknown>
        return {
          id: (question.id as string) || `imported-${Date.now()}-${idx}`,
          intitule: question.intitule as string,
          reponses: question.reponses as string[],
          indexBonneReponse: question.indexBonneReponse as number,
          explication: (question.explication as string) || '',
          categorie: (targetCategory || (question.categorie as string) || 'Sans catégorie') as string,
          difficulte: (question.difficulte as string) as Exclude<Difficulty, 'random'>,
          countApparition: 0,
          countBonneReponse: 0,
        }
      })

      console.log('[DataStore] Normalized', normalized.length, 'questions')

      // Deep clone to remove any Vue proxies
      const cleanedQuestions = JSON.parse(JSON.stringify(normalized))
      console.log('[DataStore] Questions cleaned, ready for DB')

      // Clear and reload
      console.log('[DataStore] Clearing question repository...')
      await questionRepository.clear()
      console.log('[DataStore] Question repository cleared')

      console.log('[DataStore] Saving', cleanedQuestions.length, 'questions to repository...')
      await questionRepository.saveMany(cleanedQuestions)
      console.log('[DataStore] Questions saved to repository')

      questions.value = cleanedQuestions
      console.log('[DataStore] Questions updated in state, total:', questions.value.length)

      return { success: true, count: cleanedQuestions.length }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'import'
      console.error('[DataStore] Import error:', err)
      throw error.value
    }
  }

  async function resetBadges() {
    try {
      const resetBadges = badges.value.map((b) => ({
        ...b,
        statut: 'verrouille' as const,
        dateDebloque: null,
      }))
      await metaRepository.saveBadges(resetBadges)
      badges.value = resetBadges
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation'
      throw error.value
    }
  }

  async function updateBadges(newBadges: Badge[]) {
    try {
      console.log('[DataStore] updateBadges called with', newBadges.length, 'badges')
      badges.value = newBadges

      // Deep clone to remove any Vue proxies
      const cleanedBadges = JSON.parse(JSON.stringify(newBadges))
      console.log('[DataStore] Badges cleaned, saving to repository...')

      await metaRepository.saveBadges(cleanedBadges)
      console.log('[DataStore] Badges saved successfully')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des badges'
      console.error('[DataStore] Error updating badges:', err)
      throw error.value
    }
  }

  // Categories management actions
  async function loadCategories() {
    try {
      const cats = await categoryRepository.getAll()
      categories.value = cats
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors du chargement des catégories'
      throw error.value
    }
  }

  async function addCategory(category: Category) {
    try {
      console.log('[Store] addCategory called with:', category)

      // Deep clone to remove any Proxy objects
      const cleanCat: Category = JSON.parse(JSON.stringify({
        id: String(category.id),
        label: String(category.label),
        icon: String(category.icon),
        color: String(category.color),
      })) as Category

      console.log('[Store] cleanCat after JSON:', cleanCat)

      // Validate label is unique
      const existing = categories.value.find((c) => c.label === cleanCat.label)
      if (existing) {
        throw new Error(`Une catégorie avec le label "${cleanCat.label}" existe déjà`)
      }

      // Save to DB
      console.log('[Store] Calling categoryRepository.save...')
      await categoryRepository.save(cleanCat)
      console.log('[Store] Save successful')
      categories.value.push(cleanCat)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la catégorie'
      throw error.value
    }
  }

  async function updateCategory(category: Category) {
    try {
      console.log('[Store] updateCategory called with:', category)

      // Deep clone to remove any Proxy objects
      const cleanCat: Category = JSON.parse(JSON.stringify({
        id: String(category.id),
        label: String(category.label),
        icon: String(category.icon),
        color: String(category.color),
      })) as Category

      console.log('[Store] cleanCat after JSON:', cleanCat)
      console.log('[Store] Current categories in store:', categories.value)

      // Validate label is unique (excluding current category)
      const existing = categories.value.find((c) => c.label === cleanCat.label && c.id !== cleanCat.id)
      if (existing) {
        throw new Error(`Une catégorie avec le label "${cleanCat.label}" existe déjà`)
      }

      // Find old category to get old label
      const oldCategory = categories.value.find((c) => c.id === cleanCat.id)
      console.log('[Store] oldCategory found:', oldCategory)
      if (!oldCategory) {
        throw new Error('Catégorie non trouvée')
      }

      // Update questions with new label if label changed
      if (oldCategory.label !== cleanCat.label) {
        console.log('[Store] Label changed, updating questions...')
        questions.value = questions.value.map((q) =>
          q.categorie === oldCategory.label ? { ...q, categorie: cleanCat.label } : q,
        )
        // Deep clone questions to remove Proxies before saving
        const cleanQuestions = JSON.parse(JSON.stringify(questions.value))
        console.log('[Store] Calling questionRepository.saveMany with cleaned questions')
        await questionRepository.saveMany(cleanQuestions)
        console.log('[Store] Questions saved successfully')
      }

      // Update category in DB
      console.log('[Store] Calling categoryRepository.update with:', cleanCat)
      await categoryRepository.update(cleanCat)
      console.log('[Store] Update successful')

      // Update in state
      const idx = categories.value.findIndex((c) => c.id === cleanCat.id)
      if (idx !== -1) {
        categories.value[idx] = cleanCat
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la catégorie'
      throw error.value
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      console.log('[Store] deleteCategory called with ID:', categoryId)
      console.log('[Store] Categories before:', categories.value)

      const category = categories.value.find((c) => c.id === categoryId)
      if (!category) {
        throw new Error('Catégorie non trouvée')
      }

      console.log('[Store] Found category:', category)

      // Delete questions in this category
      questions.value = questions.value.filter((q) => q.categorie !== category.label)

      // Deep clone questions to remove Proxies before saving
      const cleanQuestions = JSON.parse(JSON.stringify(questions.value))
      console.log('[Store] Saving cleaned questions...')
      await questionRepository.saveMany(cleanQuestions)

      // Delete category from DB
      console.log('[Store] Deleting category from DB...')
      await categoryRepository.delete(categoryId)
      console.log('[Store] Category deleted from DB')

      // Remove from state using splice to ensure reactivity
      const idx = categories.value.findIndex((c) => c.id === categoryId)
      console.log('[Store] Category index to remove:', idx)
      if (idx !== -1) {
        console.log('[Store] Removing category at index:', idx)
        categories.value.splice(idx, 1)
        console.log('[Store] Categories after splice:', categories.value)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la suppression de la catégorie'
      throw error.value
    }
  }

  function getCategoryByLabel(label: string): Category | undefined {
    return categories.value.find((c) => c.label === label)
  }

  async function resetCategories() {
    try {
      await categoryRepository.clear()
      await categoryRepository.saveMany(DEFAULT_CATEGORIES)
      categories.value = DEFAULT_CATEGORIES
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la réinitialisation des catégories'
      throw error.value
    }
  }

  /**
   * Reload questions from IndexedDB (called after import)
   */
  async function reloadQuestions() {
    try {
      console.log('[DataStore] reloadQuestions() called...')
      const qs = await questionRepository.getAll()
      questions.value = qs
      console.log(`[DataStore] ✓ Reloaded ${qs.length} questions from IndexedDB`)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Error reloading questions'
      console.error('[DataStore] Error reloading questions:', err)
      throw error.value
    }
  }

  // Getters
  const allCategories = computed(() => categories.value)

  return {
    // State
    questions,
    badges,
    categories,
    isLoading,
    error,

    // Getters
    allCategories,

    // Actions
    initData,
    importQuestions,
    resetBadges,
    updateBadges,
    loadCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    getCategoryByLabel,
    resetCategories,
    reloadQuestions,
  }
})
