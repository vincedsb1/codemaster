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
      // Load questions from DB
      let qs = await questionRepository.getAll()

      if (qs.length === 0) {
        // First time: load defaults
        await questionRepository.saveMany(DEFAULT_QUESTIONS)
        qs = DEFAULT_QUESTIONS
      }

      questions.value = qs

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
      // Validation
      if (!Array.isArray(json)) {
        throw new Error('Le fichier doit contenir un tableau JSON')
      }

      if (json.length === 0) {
        throw new Error('Le fichier est vide')
      }

      const firstQuestion = json[0] as Record<string, unknown>
      if (
        !firstQuestion.intitule ||
        !firstQuestion.reponses ||
        firstQuestion.indexBonneReponse === undefined ||
        !firstQuestion.difficulte
      ) {
        throw new Error('Format invalide : propriétés requises manquantes')
      }

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

      // Clear and reload
      await questionRepository.clear()
      await questionRepository.saveMany(normalized)
      questions.value = normalized

      return { success: true, count: normalized.length }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'import'
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
      badges.value = newBadges
      await metaRepository.saveBadges(newBadges)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour des badges'
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
      // Validate label is unique
      const existing = categories.value.find((c) => c.label === category.label)
      if (existing) {
        throw new Error(`Une catégorie avec le label "${category.label}" existe déjà`)
      }

      // Save to DB
      await categoryRepository.save(category)
      categories.value.push(category)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de l\'ajout de la catégorie'
      throw error.value
    }
  }

  async function updateCategory(category: Category) {
    try {
      // Validate label is unique (excluding current category)
      const existing = categories.value.find((c) => c.label === category.label && c.id !== category.id)
      if (existing) {
        throw new Error(`Une catégorie avec le label "${category.label}" existe déjà`)
      }

      // Find old category to get old label
      const oldCategory = categories.value.find((c) => c.id === category.id)
      if (!oldCategory) {
        throw new Error('Catégorie non trouvée')
      }

      // Update questions with new label if label changed
      if (oldCategory.label !== category.label) {
        questions.value = questions.value.map((q) =>
          q.categorie === oldCategory.label ? { ...q, categorie: category.label } : q,
        )
        await questionRepository.saveMany(questions.value)
      }

      // Update category in DB
      await categoryRepository.update(category)

      // Update in state
      const idx = categories.value.findIndex((c) => c.id === category.id)
      if (idx !== -1) {
        categories.value[idx] = category
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la catégorie'
      throw error.value
    }
  }

  async function deleteCategory(categoryId: string) {
    try {
      const category = categories.value.find((c) => c.id === categoryId)
      if (!category) {
        throw new Error('Catégorie non trouvée')
      }

      // Delete questions in this category
      questions.value = questions.value.filter((q) => q.categorie !== category.label)
      await questionRepository.saveMany(questions.value)

      // Delete category from DB
      await categoryRepository.delete(categoryId)

      // Remove from state
      categories.value = categories.value.filter((c) => c.id !== categoryId)
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
  }
})
