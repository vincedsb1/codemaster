<script setup lang="ts">
import { computed, onMounted, unref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuizStore } from '@/stores/useQuizStore'
import { useStatsStore } from '@/stores/useStatsStore'

const router = useRouter()
const quizStore = useQuizStore()
const statsStore = useStatsStore()

// ============ COMPUTED VALUES ============

const session = computed(() => quizStore.activeSession)
const score = computed(() => Math.round(session.value?.notePourcentage || 0))
const correctAnswers = computed(() => {
  if (!session.value) return 0
  return session.value.questions.filter(q => q.estCorrecte).length
})
const totalQuestions = computed(() => session.value?.nbQuestions || 0)
const averageScore = computed(() => Math.round(unref(statsStore.globalStats)?.moyenneGlobale || 0))
const currentStreak = computed(() => unref(statsStore.globalStats)?.streakActuel || 0)

// Score vs Moyenne
const isAboveAverage = computed(() => score.value > averageScore.value)
const scoreDifference = computed(() => Math.abs(score.value - averageScore.value))
const comparisonSymbol = computed(() => (isAboveAverage.value ? '▲' : (score.value === averageScore.value ? '=' : '▼')))

// Couleurs basées sur score
const scoreColorClass = computed(() => {
  if (score.value >= 80) return 'text-green-600'
  if (score.value >= 50) return 'text-amber-600'
  return 'text-red-600'
})

const scoreColor = computed(() => {
  if (score.value >= 80) return '#10b981'
  if (score.value >= 50) return '#f59e0b'
  return '#ef4444'
})

const scoreDasharray = computed(() => {
  const circumference = 2 * Math.PI * 90
  return (score.value / 100) * circumference
})

// Messages personnalisés
const congratulationsMessage = computed(() => {
  if (score.value >= 90) return '🚀 Excellent! Vous êtes une superstar!'
  if (score.value >= 80) return '👏 Très bien! Continuez!'
  if (score.value >= 60) return '💪 Pas mal! Il y a du potentiel!'
  if (score.value >= 40) return '📚 Continuez à pratiquer!'
  return '🎯 Gardez la tête haute et essayez encore!'
})

const comparisonMessage = computed(() => {
  if (isAboveAverage.value) {
    return `Vous êtes ${scoreDifference.value}% au-dessus de la moyenne! 📈`
  } else if (score.value === averageScore.value) {
    return 'Vous êtes à la moyenne! 📊'
  } else {
    return `Vous êtes ${scoreDifference.value}% en dessous de la moyenne. Continuez! 📖`
  }
})

const comparisonClass = computed(() => {
  if (isAboveAverage.value) return 'bg-green-50'
  if (score.value === averageScore.value) return 'bg-blue-50'
  return 'bg-blue-50'
})

const comparisonTextColor = computed(() => {
  if (isAboveAverage.value) return 'text-green-700'
  if (score.value === averageScore.value) return 'text-blue-700'
  return 'text-blue-700'
})

// Badges
const newBadges = computed(() => statsStore.newlyUnlockedBadges || [])

// Streak
const isPrimaryQuizOfDay = computed(() => {
  if (!session.value) return false
  const today = new Date().toISOString().split('T')[0]
  return session.value.dateJour === today && currentStreak.value > 0
})

// Confetti
const shouldShowConfetti = computed(() => isAboveAverage.value)

// ============ LIFECYCLE ============

onMounted(async () => {
  await statsStore.loadStats()

  // Déclencher confetti après 500ms (laisse les animations se charger)
  setTimeout(() => {
    createConfetti()
  }, 500)
})

// ============ METHODS ============

function createConfetti() {
  if (!shouldShowConfetti.value) return

  const container = document.getElementById('confetti-container')
  if (!container) return

  const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8']
  const pieces = 50

  for (let i = 0; i < pieces; i++) {
    const piece = document.createElement('div')
    piece.className = 'confetti-piece'
    piece.style.left = `${Math.random() * 100}%`
    piece.style.top = `${Math.random() * 50}%`
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]!
    piece.style.animationDelay = `${Math.random() * 0.5}s`
    piece.style.animationDuration = `${Math.random() * 2 + 2}s`
    container.appendChild(piece)

    // Cleanup
    setTimeout(() => piece.remove(), 5000)
  }
}

async function goHome() {
  quizStore.clearActiveSession()
  await router.push({ name: 'home' })
}

async function replayQuiz() {
  const params = quizStore.getReplayParams()
  if (!params) return

  quizStore.clearActiveSession()
  await quizStore.createQuizSession(params.categories, params.difficulty, params.count)
  await router.push({ name: 'quiz-active' })
}
</script>

<template>
  <div v-if="!quizStore.isQuizFinished" class="flex items-center justify-center h-full">
    <p>Quiz non trouvé.</p>
  </div>

  <div v-else class="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4 flex flex-col animate-[pageEnter_0.5s_ease-out_forwards]">
    <!-- Container principal -->
    <div class="max-w-2xl mx-auto w-full space-y-8 py-8">

      <!-- 1. Header Ludique -->
      <div class="text-center space-y-2">
        <div class="text-6xl mb-4">🎉</div>
        <h1 class="text-4xl font-bold text-slate-900">Quiz Terminé!</h1>
        <p class="text-xl text-slate-600">{{ congratulationsMessage }}</p>
      </div>

      <!-- 2. Section Score -->
      <div class="bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <!-- Score Circle SVG -->
        <div class="flex justify-center relative h-64">
          <svg width="200" height="200" class="transform -rotate-90">
            <!-- Background circle -->
            <circle cx="100" cy="100" r="90" fill="none" stroke="#e2e8f0" stroke-width="8"/>
            <!-- Progress circle -->
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              :stroke="scoreColor"
              stroke-width="8"
              class="animate-[scoreCounter_2s_ease-out_forwards]"
              :style="{ strokeDasharray: `${scoreDasharray}, ${2 * Math.PI * 90}` }"
            />
          </svg>
          <div class="absolute flex flex-col items-center justify-center">
            <div class="text-5xl font-bold" :class="scoreColorClass">{{ score }}%</div>
            <div class="text-sm text-slate-500">Score</div>
          </div>
        </div>

        <!-- Résumé -->
        <div class="text-center space-y-2">
          <p class="text-2xl font-semibold text-slate-800">
            {{ correctAnswers }} / {{ totalQuestions }} réponses correctes
          </p>
          <p class="text-slate-600">Excellente tentative!</p>
        </div>
      </div>

      <!-- 3. Comparaison Moyenne -->
      <div class="bg-white rounded-2xl shadow-xl p-8 space-y-4">
        <h2 class="text-lg font-semibold text-slate-900">Comparaison vs Moyenne</h2>
        <div class="grid grid-cols-2 gap-4">
          <!-- Score actuel -->
          <div class="text-center p-4 bg-indigo-50 rounded-lg">
            <div class="text-3xl font-bold text-indigo-600">{{ score }}%</div>
            <div class="text-sm text-slate-600">Votre score</div>
          </div>
          <!-- Moyenne -->
          <div class="text-center p-4 bg-slate-50 rounded-lg">
            <div class="text-3xl font-bold text-slate-600">{{ averageScore }}%</div>
            <div class="text-sm text-slate-600">Moyenne</div>
          </div>
        </div>

        <!-- Message comparaison -->
        <div class="text-center p-4 rounded-lg" :class="comparisonClass">
          <p class="font-semibold" :class="comparisonTextColor">
            {{ comparisonSymbol }} {{ comparisonMessage }}
          </p>
        </div>
      </div>

      <!-- 4. Section Streak (conditionnel) -->
      <div v-if="isPrimaryQuizOfDay" class="bg-orange-50 rounded-2xl shadow-xl p-8 space-y-4 border-2 border-orange-200 animate-[pageEnter_0.7s_ease-out_forwards]">
        <div class="text-center space-y-2">
          <div class="text-6xl animate-[fireGlowPulse_2s_ease-in-out_infinite]">🔥</div>
          <h2 class="text-2xl font-bold text-orange-700">STREAK: {{ currentStreak }} jours</h2>
          <p class="text-orange-600">Continuez demain pour garder votre streak! 💪</p>
        </div>
      </div>

      <!-- 5. Section Badges Débloqués -->
      <div v-if="newBadges.length > 0" class="bg-yellow-50 rounded-2xl shadow-xl p-8 space-y-6 border-2 border-yellow-200">
        <div class="text-center">
          <div class="text-5xl mb-2">🏆</div>
          <h2 class="text-2xl font-bold text-yellow-700">Nouveaux Badges!</h2>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="(badge, index) in newBadges"
            :key="badge.id"
            class="bg-white rounded-lg p-4 text-center animate-[badgePop_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
            :style="{ animationDelay: `${index * 150}ms` }"
          >
            <div class="text-4xl mb-2">{{ badge.icon }}</div>
            <p class="font-semibold text-slate-900">{{ badge.nom }}</p>
            <p class="text-sm text-slate-600">{{ badge.description }}</p>
          </div>
        </div>
      </div>

      <!-- 6. Actions -->
      <div class="flex gap-4 pt-4">
        <button
          @click="goHome"
          class="flex-1 px-6 py-3 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition"
        >
          Accueil
        </button>
        <button
          @click="replayQuiz"
          class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <span>Rejouer</span>
          <span>🔄</span>
        </button>
      </div>

    </div>

    <!-- Confetti Container (si score > moyenne) -->
    <div v-if="shouldShowConfetti" id="confetti-container" class="fixed inset-0 pointer-events-none"></div>

  </div>
</template>
