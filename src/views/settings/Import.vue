<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/useDataStore'
import { useStatsStore } from '@/stores/useStatsStore'
import { sessionRepository } from '@/db/repositories'
import { useRouter } from 'vue-router'
import {
  getLoadedCategoriesState,
  markCategoryAsLoaded,
  markCategoryAsError,
  getTotalQuestionsLoaded,
  type LoadedCategory,
} from '@/services/categoryLoadingService'
import { loadQuestionsFromJsonFile } from '@/db/loaders/questionsLoader'
import { questionRepository } from '@/db/repositories'

const router = useRouter()
const dataStore = useDataStore()
const statsStore = useStatsStore()

// Import message state
const importMessage = ref('')
const importError = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

// Category loading state
const loadedCategoriesState = ref<Record<string, LoadedCategory>>({})
const isLoading = ref(false)
const currentLoadingCategory = ref<string | null>(null)
const currentProgress = ref({ loaded: 0, total: 0 })
const globalProgress = ref({ loaded: 0, total: 0 })
const categoryError = ref<string | null>(null)
const loadingAll = ref(false)
const cancelLoading = ref(false)

// Computed
const categoriesList = computed(() => {
  return Object.entries(loadedCategoriesState.value).map(([file, data]) => ({
    file,
    ...data,
  }))
})

const loadedCategoryCount = computed(() => {
  return Object.values(loadedCategoriesState.value).filter(cat => cat.loaded).length
})

const totalCategoryCount = computed(() => {
  return Object.keys(loadedCategoriesState.value).length
})

const totalQuestionsLoaded = computed(() => {
  return getTotalQuestionsLoaded(loadedCategoriesState.value)
})

// Lifecycle
onMounted(() => {
  loadedCategoriesState.value = getLoadedCategoriesState()
  console.log('[Import] Loaded categories state:', loadedCategoriesState.value)
})

// Methods for JSON file upload
async function handleFileUpload(event: Event) {
  console.log('[Import] handleFileUpload called')
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  console.log('[Import] File selected:', file?.name)
  if (!file) return

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      console.log('[Import] File read, parsing JSON...')
      const json: Array<Record<string, unknown>> = JSON.parse(e.target?.result as string)
      console.log('[Import] JSON parsed, questions count:', json.length)

      // Store JSON in sessionStorage and navigate to category selection page
      sessionStorage.setItem('pendingImportJson', JSON.stringify(json))
      console.log('[Import] Navigating to category selection')
      router.push({ name: 'settings-select-category' })
    } catch (err) {
      console.error('[Import] Error parsing JSON:', err)
      importMessage.value = err instanceof Error ? err.message : 'Erreur lors du parsing du JSON'
      importError.value = true
      target.value = ''
    }
  }
  reader.readAsText(file)
}

async function resetStats() {
  if (!confirm('Vraiment tout effacer ? (Les questions restent)')) return

  try {
    // Clear sessions
    await sessionRepository.clear()

    // Reset badges
    await dataStore.resetBadges()

    // Reload stats
    await statsStore.loadStats()

    alert('Statistiques remises à zéro.')
  } catch (err) {
    alert(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation')
  }
}

// Methods for category loading
async function loadCategory(categoryFile: string) {
  try {
    isLoading.value = true
    currentLoadingCategory.value = categoryFile
    currentProgress.value = { loaded: 0, total: 0 }
    categoryError.value = null

    const onProgress = (loaded: number, total: number) => {
      currentProgress.value = { loaded, total }
    }

    const questions = await loadQuestionsFromJsonFile(categoryFile, onProgress)

    if (questions.length > 0) {
      // Save to IndexedDB
      console.log(`[Import] Saving ${questions.length} questions to IndexedDB for ${categoryFile}...`)
      console.log(`[Import] Sample question:`, questions[0])
      await questionRepository.saveMany(questions)
      console.log(`[Import] Successfully saved ${questions.length} questions to IndexedDB`)

      // Mark as loaded
      loadedCategoriesState.value = markCategoryAsLoaded(
        categoryFile,
        questions.length,
        loadedCategoriesState.value
      )

      // Verify questions were saved
      const verifyCount = await questionRepository.getAll()
      console.log(`[Import] Verified: ${verifyCount.length} total questions now in IndexedDB`)
      console.log(`[Import] Store has ${dataStore.questions.length} questions before reload`)

      // Reload questions in the store
      console.log(`[Import] Reloading questions in store...`)
      await dataStore.reloadQuestions()
      console.log(`[Import] Store now has ${dataStore.questions.length} questions after reload`)

      // Show a quick summary of categories loaded
      const categorySet = new Set(dataStore.questions.map((q) => q.categorie))
      console.log(`[Import] Categories in store: ${Array.from(categorySet).join(', ')}`)

      console.log(`[Import] Category ${categoryFile} loaded with ${questions.length} questions`)
    } else {
      throw new Error(`No questions found in ${categoryFile}.json`)
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[Import] Error loading category ${categoryFile}:`, err)

    loadedCategoriesState.value = markCategoryAsError(
      categoryFile,
      errorMsg,
      loadedCategoriesState.value
    )

    categoryError.value = `Erreur lors du chargement de ${categoryFile}: ${errorMsg}`
  } finally {
    isLoading.value = false
    currentLoadingCategory.value = null
  }
}

async function retryCategory(categoryFile: string) {
  // Reset error
  const existing = loadedCategoriesState.value[categoryFile]
  if (!existing) return

  loadedCategoriesState.value = {
    ...loadedCategoriesState.value,
    [categoryFile]: {
      categoryId: existing.categoryId,
      categoryLabel: existing.categoryLabel,
      loaded: existing.loaded,
      questionCount: existing.questionCount,
      loadedAt: existing.loadedAt,
    },
  }
  await loadCategory(categoryFile)
}

async function loadAllCategories() {
  try {
    loadingAll.value = true
    cancelLoading.value = false
    categoryError.value = null

    const categoriesToLoad = Object.keys(loadedCategoriesState.value).filter(
      cat => {
        const category = loadedCategoriesState.value[cat]
        return category && !category.loaded
      }
    )

    for (let i = 0; i < categoriesToLoad.length; i++) {
      if (cancelLoading.value) break

      const categoryFile = categoriesToLoad[i]
      if (!categoryFile) continue
      currentLoadingCategory.value = categoryFile

      try {
        const onProgress = (loaded: number, total: number) => {
          currentProgress.value = { loaded, total }
          // Calculate global progress
          const previousLoaded = getTotalQuestionsLoaded(loadedCategoriesState.value)
          globalProgress.value = {
            loaded: previousLoaded + loaded,
            total: 120, // Estimated total
          }
        }

        const questions = await loadQuestionsFromJsonFile(categoryFile, onProgress)

        if (questions.length > 0) {
          console.log(`[Import] [AddAll] Saving ${questions.length} questions from ${categoryFile}...`)
          await questionRepository.saveMany(questions)
          console.log(`[Import] [AddAll] Saved ${questions.length} questions from ${categoryFile}`)

          loadedCategoriesState.value = markCategoryAsLoaded(
            categoryFile,
            questions.length,
            loadedCategoriesState.value
          )

          // Verify total
          const allQuestions = await questionRepository.getAll()
          console.log(`[Import] [AddAll] Total questions in IndexedDB: ${allQuestions.length}`)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        loadedCategoriesState.value = markCategoryAsError(
          categoryFile,
          errorMsg,
          loadedCategoriesState.value
        )
        console.error(`[Import] Error loading ${categoryFile}:`, err)
      }
    }

    // Reload questions once at the end of "add all"
    console.log(`[Import] [AddAll] Reloading all questions in store...`)
    await dataStore.reloadQuestions()

    console.log(`[Import] [AddAll] Final verification:`)
    console.log(`[Import] [AddAll] - Store has ${dataStore.questions.length} questions`)

    const finalCategories = new Set(dataStore.questions.map((q) => q.categorie))
    console.log(`[Import] [AddAll] - Categories loaded: ${Array.from(finalCategories).join(', ')}`)
    console.log(`[Import] [AddAll] ✓ IMPORT COMPLETE - Refresh Home to see categories`)
  } finally {
    loadingAll.value = false
    currentLoadingCategory.value = null
  }
}

function cancelLoadAll() {
  cancelLoading.value = true
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="space-y-2 pt-6 px-4">
      <h1 class="text-2xl font-bold">Gestion des données</h1>
      <p class="text-slate-600 text-sm">
        Charger les catégories de questions, importer des questions personnalisées, ou gérer vos
        statistiques
      </p>
    </div>

    <div class="px-4 space-y-6 pb-4">
      <!-- Catégories Disponibles -->
      <div class="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-900">
            📁 Catégories Disponibles ({{ loadedCategoryCount }}/{{ totalCategoryCount }})
          </h2>
        </div>

        <!-- Categories List -->
        <div class="space-y-2">
          <div
            v-for="category in categoriesList"
            :key="category.file"
            class="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200"
          >
            <div class="flex-1">
              <p class="font-medium text-slate-900 capitalize">{{ category.categoryLabel }}</p>
              <p v-if="category.loaded" class="text-sm text-slate-500">
                ✓ {{ category.questionCount }} questions
              </p>
              <p v-else-if="category.error" class="text-sm text-red-600">
                ❌ {{ category.error }}
              </p>
            </div>

            <!-- Progress Bar during loading -->
            <div v-if="currentLoadingCategory === category.file" class="flex-1 mx-4">
              <div class="text-xs text-slate-600 mb-1">
                {{ currentProgress.loaded }}/{{ currentProgress.total }}
              </div>
              <div class="w-full bg-slate-200 rounded-full h-2">
                <div
                  class="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                  :style="{
                    width:
                      currentProgress.total > 0
                        ? `${(currentProgress.loaded / currentProgress.total) * 100}%`
                        : '0%',
                  }"
                ></div>
              </div>
            </div>

            <!-- Button -->
            <div class="ml-4">
              <button
                v-if="category.loaded"
                disabled
                class="px-4 py-2 bg-slate-300 text-slate-600 rounded-lg font-medium cursor-not-allowed opacity-60"
              >
                ✓
              </button>
              <button
                v-else-if="category.error"
                @click="retryCategory(category.file)"
                class="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition"
              >
                Retry
              </button>
              <button
                v-else
                @click="loadCategory(category.file)"
                :disabled="isLoading || loadingAll"
                class="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <!-- Global Error -->
        <div v-if="categoryError" class="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {{ categoryError }}
        </div>

        <!-- Load All Button -->
        <div class="pt-4 border-t border-slate-200">
          <button
            v-if="!loadingAll"
            @click="loadAllCategories"
            :disabled="loadedCategoryCount === totalCategoryCount || isLoading"
            class="w-full px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Ajouter tout
          </button>
          <button
            v-else
            @click="cancelLoadAll"
            class="w-full px-6 py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition"
          >
            Annuler
          </button>
        </div>

        <!-- Global Progress Bar during "Add All" -->
        <div v-if="loadingAll" class="space-y-3 pt-4 border-t border-slate-200">
          <div>
            <p class="text-sm font-medium text-slate-900 mb-2">
              Catégories: {{ loadedCategoryCount + (currentLoadingCategory ? 1 : 0) }}/{{
                totalCategoryCount
              }}
            </p>
            <div class="w-full bg-slate-200 rounded-full h-3">
              <div
                class="bg-blue-600 h-3 rounded-full transition-all duration-300"
                :style="{
                  width: `${((loadedCategoryCount + (currentLoadingCategory ? 1 : 0)) / totalCategoryCount) * 100}%`,
                }"
              ></div>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-slate-900 mb-2">
              Questions: {{ totalQuestionsLoaded }}/120
            </p>
            <div class="w-full bg-slate-200 rounded-full h-3">
              <div
                class="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                :style="{ width: `${(totalQuestionsLoaded / 120) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Import Section -->
      <div class="bg-white p-4 rounded-xl border border-slate-200 space-y-4">
        <h3 class="font-bold text-slate-700">📤 Importer des questions</h3>
        <p class="text-sm text-slate-500">
          Le fichier doit être un JSON valide contenant un tableau de questions.
        </p>
        <input
          ref="fileInput"
          type="file"
          accept=".json"
          @change="handleFileUpload"
          class="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        <p
          v-if="importMessage"
          :class="importError ? 'text-red-500' : 'text-green-500'"
          class="text-sm font-bold"
        >
          {{ importMessage }}
        </p>
      </div>

      <!-- Danger Zone -->
      <div class="bg-red-50 p-4 rounded-xl border border-red-100 space-y-4">
        <h3 class="font-bold text-red-800">⚠️ Zone de danger</h3>
        <button
          @click="resetStats"
          class="w-full py-2 px-4 bg-white border border-red-200 text-red-600 rounded-lg font-bold hover:bg-red-100 transition"
        >
          Réinitialiser toutes les stats
        </button>
      </div>
    </div>
  </div>
</template>
