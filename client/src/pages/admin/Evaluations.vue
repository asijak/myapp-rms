<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/api/axios'

// ── Data ──────────────────────────────────────────────────────────────────
const jobs          = ref([])
const applications  = ref([])
const loading       = ref(false)
const saving        = ref(false)
const selectedJobId = ref('')
const searchQuery   = ref('')
const filterStatus  = ref('comparative_assessment')
const selectedApp   = ref(null)

// Rubric weights per category
const rubricWeights = ref({})

const loadRubrics = async () => {
  try {
    const { data } = await apiClient.get('/v1/rubrics')
    for (const r of (data.data || [])) rubricWeights.value[r.category] = r.weights || {}
  } catch { /* non-critical */ }
}

const currentRubric = computed(() => {
  if (!selectedApp.value) return null
  const track = selectedApp.value.submittedTo?.hiringTrack || selectedApp.value._jobTrack
  return rubricWeights.value[track] || null
})

// ── HR Rating form ────────────────────────────────────────────────────────
const rating = reactive({
  educationPoints:          0,
  trainingPoints:           0,
  experiencePoints:         0,
  performancePoints:        0,
  outstandingAccomplishments: 0,
  appEducationPoints:       0,
  appLearningPoints:        0,
  potentialPoints: { writtenTest: 0, bei: 0, workSample: 0 },
  remarks: '',
})

const totalScore = computed(() =>
  (Number(rating.educationPoints) || 0) +
  (Number(rating.trainingPoints) || 0) +
  (Number(rating.experiencePoints) || 0) +
  (Number(rating.performancePoints) || 0) +
  (Number(rating.outstandingAccomplishments) || 0) +
  (Number(rating.appEducationPoints) || 0) +
  (Number(rating.appLearningPoints) || 0) +
  (Number(rating.potentialPoints.writtenTest) || 0) +
  (Number(rating.potentialPoints.bei) || 0) +
  (Number(rating.potentialPoints.workSample) || 0)
)

// ── Item relevance state ───────────────────────────────────────────────────
const relevanceMap = reactive({
  education:   [],
  eligibility: [],
  training:    [],
  experience:  [],
  performance: { isRelevant: true, note: '' },
})

function initRelevance(app) {
  const ad = app.applicantData || {}
  const ir = app.itemRelevance  || {}

  ;['education', 'eligibility', 'training', 'experience'].forEach(section => {
    const items  = ad[section] || []
    const stored = ir[section] || []
    relevanceMap[section] = items.map((_, i) => {
      const found = stored.find(s => s.index === i)
      return { isRelevant: found ? found.isRelevant : true, note: found?.note || '' }
    })
  })
  relevanceMap.performance = {
    isRelevant: ir.performance?.isRelevant ?? true,
    note:       ir.performance?.note       ?? '',
  }
}

function buildItemRelevancePayload() {
  const build = (section) =>
    relevanceMap[section].map((r, i) => ({ index: i, isRelevant: r.isRelevant, note: r.note }))
  return {
    education:   build('education'),
    eligibility: build('eligibility'),
    training:    build('training'),
    experience:  build('experience'),
    performance: { isRelevant: relevanceMap.performance.isRelevant, note: relevanceMap.performance.note },
  }
}

// ── Lookups ───────────────────────────────────────────────────────────────
const statusConfig = {
  applied:                { label: 'Applied',        cls: 'bg-blue-50 text-blue-700 border-blue-200'       },
  verifying:              { label: 'Verifying',      cls: 'bg-amber-50 text-amber-700 border-amber-200'    },
  comparative_assessment: { label: 'For Assessment', cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  ranked:                 { label: 'Ranked',         cls: 'bg-green-50 text-green-700 border-green-200'    },
  disqualified:           { label: 'Disqualified',   cls: 'bg-red-50 text-red-600 border-red-200'          },
}
const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

// ── Helpers ───────────────────────────────────────────────────────────────
const fullName = (app) => {
  const p = app.applicantData?.personalInfo
  if (!p?.firstName) return app.submittedBy?.username || '—'
  return [p.firstName, p.middleName ? `${p.middleName.charAt(0)}.` : '', p.lastName, p.suffix].filter(Boolean).join(' ')
}

// ── Load ──────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await apiClient.get('/v1/jobs')
    jobs.value = data.data || []
  } catch { /* silent */ }
  loadRubrics()
})

const filtered = computed(() => {
  let list = [...applications.value]
  if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      a.submittedBy?.username?.toLowerCase().includes(q) ||
      a.applicantData?.personalInfo?.lastName?.toLowerCase().includes(q) ||
      a.applicationCode?.toLowerCase().includes(q)
    )
  }
  return list
})

const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value  = true
  selectedApp.value = null
  applications.value = []
  try {
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data || []
  } catch { /* silent */ }
  finally { loading.value = false }
}

// ── Open applicant for evaluation ─────────────────────────────────────────
const openEval = (app) => {
  const job = jobs.value.find(j => j._id === selectedJobId.value)
  selectedApp.value = { ...app, submittedTo: job || app.submittedTo, _jobTrack: job?.hiringTrack }

  const r = app.hrRating || {}
  rating.educationPoints             = r.educationPoints             ?? 0
  rating.trainingPoints              = r.trainingPoints              ?? 0
  rating.experiencePoints            = r.experiencePoints            ?? 0
  rating.performancePoints           = r.performancePoints           ?? 0
  rating.outstandingAccomplishments  = r.outstandingAccomplishments  ?? 0
  rating.appEducationPoints          = r.appEducationPoints          ?? 0
  rating.appLearningPoints           = r.appLearningPoints           ?? 0
  rating.potentialPoints.writtenTest = r.potentialPoints?.writtenTest ?? 0
  rating.potentialPoints.bei         = r.potentialPoints?.bei         ?? 0
  rating.potentialPoints.workSample  = r.potentialPoints?.workSample  ?? 0
  rating.remarks                     = r.remarks || ''

  initRelevance(app)
}

const closeEval = () => { selectedApp.value = null }

// ── Submit Evaluation ──────────────────────────────────────────────────────
const submitEval = async (finalize = false) => {
  if (!selectedApp.value) return
  saving.value = true
  try {
    const { data } = await apiClient.patch(
      `/v1/applications/${selectedApp.value._id}/evaluate`,
      {
        hrRating: {
          educationPoints:           Number(rating.educationPoints),
          trainingPoints:            Number(rating.trainingPoints),
          experiencePoints:          Number(rating.experiencePoints),
          performancePoints:         Number(rating.performancePoints),
          outstandingAccomplishments: Number(rating.outstandingAccomplishments),
          appEducationPoints:        Number(rating.appEducationPoints),
          appLearningPoints:         Number(rating.appLearningPoints),
          potentialPoints: {
            writtenTest: Number(rating.potentialPoints.writtenTest),
            bei:         Number(rating.potentialPoints.bei),
            workSample:  Number(rating.potentialPoints.workSample),
          },
          remarks: rating.remarks,
        },
        itemRelevance: buildItemRelevancePayload(),
        finalize,
      }
    )
    const updated = data.data
    const idx = applications.value.findIndex(a => a._id === updated._id)
    if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...updated }
    selectedApp.value = { ...selectedApp.value, ...updated }
  } catch { /* silent */ }
  finally { saving.value = false }
}

// Relevance toggle helper
const relevanceClass = (isRelevant) => isRelevant !== false
  ? 'border-[var(--border-main)]'
  : 'border-red-200 bg-red-50/40'

const relevanceBtnClass = (isRelevant) => isRelevant !== false
  ? 'bg-[var(--bg-app)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-red-300 hover:text-red-500'
  : 'bg-red-50 text-red-600 border-red-200'
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- ── Header ──────────────────────────────────────────────────── -->
    <div class="flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row">
      <div>
        <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Comparative Assessment</h1>
        <p class="text-sm text-[var(--text-muted)] mt-0.5">Rate and evaluate applicants for ranking.</p>
      </div>
      <button v-if="selectedApp" @click="closeEval"
        class="btn-secondary h-9 px-4 text-sm flex items-center gap-2 self-start sm:self-auto">
        <i class="pi pi-arrow-left text-xs"></i> Back to List
      </button>
    </div>

    <!-- ── Toolbar ─────────────────────────────────────────────────── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
      <select v-model="selectedJobId" @change="loadApplications"
        class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] flex-1 cursor-pointer">
        <option value="">— Select a Job Vacancy —</option>
        <option v-for="job in jobs" :key="job._id" :value="job._id">
          {{ job.positionTitle }} ({{ job.placeOfAssignment }})
        </option>
      </select>
      <select v-model="filterStatus"
        class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] min-w-[160px] cursor-pointer">
        <option value="">All Statuses</option>
        <option value="comparative_assessment">For Assessment</option>
        <option value="ranked">Ranked</option>
      </select>
      <div class="relative">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none"></i>
        <input v-model="searchQuery" type="search" placeholder="Search applicant..."
          class="w-full sm:w-52 h-9 pl-8 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)]" />
      </div>
    </div>

    <!-- ── Empty / Loading / List ──────────────────────────────────── -->
    <template v-if="!selectedApp">
      <div v-if="!selectedJobId"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
          <i class="pi pi-briefcase text-2xl text-[var(--text-muted)]"></i>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-[var(--text-main)]">Select a job vacancy</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Choose a vacancy to begin evaluation</p>
        </div>
      </div>

      <div v-else-if="loading" class="flex flex-col gap-3">
        <div v-for="i in 4" :key="i"
          class="h-16 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"
          :style="{ animationDelay: `${i * 60}ms` }"></div>
      </div>

      <div v-else-if="filtered.length === 0"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
          <i class="pi pi-users text-2xl text-[var(--text-muted)]"></i>
        </div>
        <div class="text-center">
          <p class="text-sm font-semibold text-[var(--text-main)]">No applicants ready for assessment</p>
          <p class="text-xs text-[var(--text-muted)] mt-0.5">Applicants must be verified first before appearing here.</p>
        </div>
      </div>

      <div v-else class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
        <div class="px-5 py-3.5 border-b border-[var(--border-main)] flex items-center justify-between">
          <p class="text-sm font-semibold text-[var(--text-main)]">{{ filtered.length }} applicant{{ filtered.length !== 1 ? 's' : '' }}</p>
          <button @click="loadApplications"
            class="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors">
            <i class="pi pi-refresh text-[11px]"></i> Refresh
          </button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Applicant</th>
                <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Code</th>
                <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Status</th>
                <th class="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Score</th>
                <th class="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Evaluated</th>
                <th class="px-5 py-3 w-24"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--border-main)]">
              <tr v-for="app in filtered" :key="app._id"
                class="hover:bg-[var(--bg-app)] transition-colors cursor-pointer group"
                @click="openEval(app)">
                <td class="px-5 py-3.5">
                  <div class="flex items-center gap-3">
                    <img :src="app.submittedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.submittedBy?.username || 'A')}&background=1d4ed8&color=fff&bold=true`"
                      class="w-8 h-8 rounded-full object-cover border border-[var(--border-main)] flex-shrink-0" />
                    <div>
                      <p class="font-semibold text-[var(--text-main)]">{{ fullName(app) }}</p>
                      <p class="text-xs text-[var(--text-muted)]">{{ app.submittedBy?.email }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-5 py-3.5 font-mono text-xs text-[var(--text-muted)]">{{ app.applicationCode || '—' }}</td>
                <td class="px-5 py-3.5">
                  <span :class="['text-[10px] font-semibold px-2.5 py-[3px] rounded-full border', statusConfig[app.status]?.cls || 'bg-slate-100 text-slate-500 border-slate-200']">
                    {{ statusConfig[app.status]?.label || app.status }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <span :class="['text-sm font-bold tabular-nums', app.totalScore > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']">
                    {{ app.totalScore > 0 ? app.totalScore.toFixed(2) : '—' }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <span v-if="app.isEvaluated"
                    class="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-[2px] rounded-full">
                    <i class="pi pi-check text-[9px]"></i> Done
                  </span>
                  <span v-else class="text-[10px] text-[var(--text-faint)]">Pending</span>
                </td>
                <td class="px-5 py-3.5">
                  <span class="text-xs font-semibold text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Evaluate <i class="pi pi-arrow-right text-[10px]"></i>
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ── Evaluation Panel ────────────────────────────────────────── -->
    <template v-else>

      <!-- Applicant header -->
      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl px-5 py-4 flex items-center gap-4">
        <img :src="selectedApp.submittedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedApp.submittedBy?.username || 'A')}&background=1d4ed8&color=fff&bold=true`"
          class="w-10 h-10 rounded-full object-cover border border-[var(--border-main)] flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="font-bold text-[var(--text-main)] truncate">{{ fullName(selectedApp) }}</p>
          <p class="text-xs text-[var(--text-muted)] font-mono">{{ selectedApp.applicationCode }}</p>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <span :class="['text-[10px] font-semibold px-2.5 py-[3px] rounded-full border', statusConfig[selectedApp.status]?.cls]">
            {{ statusConfig[selectedApp.status]?.label }}
          </span>
          <span v-if="selectedApp.isEvaluated"
            class="inline-flex items-center gap-1.5 text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2.5 py-[3px] rounded-full">
            <i class="pi pi-check-circle text-[9px]"></i> Evaluated
          </span>
        </div>
      </div>

      <!-- Live score banner -->
      <div class="relative overflow-hidden rounded-xl border border-blue-200"
        style="background: linear-gradient(135deg, var(--color-primary-light) 0%, #dbeafe 100%);">
        <div class="flex items-center justify-between px-6 py-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-wider text-[var(--color-primary)] opacity-70">Total Score — Live Preview</p>
            <p class="text-4xl font-extrabold text-[var(--color-primary)] tabular-nums mt-0.5">{{ totalScore.toFixed(2) }}</p>
          </div>
          <div class="w-16 h-16 rounded-2xl bg-white/60 border border-blue-200 flex items-center justify-center">
            <i class="pi pi-chart-bar text-[var(--color-primary)] text-2xl"></i>
          </div>
        </div>
      </div>

      <!-- Side-by-side panels -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        <!-- ── LEFT: Applicant Data ───────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden flex flex-col">
          <div class="px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center">
              <i class="pi pi-user text-[var(--text-muted)] text-xs"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-[var(--text-main)]">Applicant Data</p>
              <p class="text-[10px] text-[var(--text-muted)]">Toggle items as "Not Relevant" with an optional note.</p>
            </div>
          </div>
          <div class="overflow-y-auto flex flex-col gap-5 p-5 max-h-[70vh] custom-scrollbar">

            <!-- Education -->
            <div v-if="selectedApp.applicantData?.education?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Education</p>
              <div class="flex flex-col gap-2">
                <div v-for="(edu, i) in selectedApp.applicantData.education" :key="i"
                  :class="['border rounded-xl overflow-hidden transition-colors', relevanceClass(relevanceMap.education[i]?.isRelevant)]">
                  <div class="p-3 flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--text-main)]">{{ edu.degree || edu.level }}</p>
                      <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ edu.school }}{{ edu.yearGraduated ? ` · ${edu.yearGraduated}` : '' }}</p>
                    </div>
                    <button @click="relevanceMap.education[i].isRelevant = !relevanceMap.education[i].isRelevant"
                      :class="['flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap', relevanceBtnClass(relevanceMap.education[i]?.isRelevant)]">
                      {{ relevanceMap.education[i]?.isRelevant !== false ? 'Relevant' : 'Not Relevant' }}
                    </button>
                  </div>
                  <div v-if="relevanceMap.education[i]?.isRelevant === false" class="px-3 pb-3">
                    <input v-model="relevanceMap.education[i].note" type="text" placeholder="Reason (optional)..."
                      class="w-full h-8 px-3 text-xs rounded-lg bg-white border border-red-200 focus:outline-none focus:ring-1 focus:ring-red-300" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Eligibility -->
            <div v-if="selectedApp.applicantData?.eligibility?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Eligibility</p>
              <div class="flex flex-col gap-2">
                <div v-for="(el, i) in selectedApp.applicantData.eligibility" :key="i"
                  :class="['border rounded-xl overflow-hidden transition-colors', relevanceClass(relevanceMap.eligibility[i]?.isRelevant)]">
                  <div class="p-3 flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--text-main)]">{{ el.name }}</p>
                      <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ el.placeOfExam }}{{ el.rating ? ` · Rating: ${el.rating}` : '' }}</p>
                    </div>
                    <button @click="relevanceMap.eligibility[i].isRelevant = !relevanceMap.eligibility[i].isRelevant"
                      :class="['flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap', relevanceBtnClass(relevanceMap.eligibility[i]?.isRelevant)]">
                      {{ relevanceMap.eligibility[i]?.isRelevant !== false ? 'Relevant' : 'Not Relevant' }}
                    </button>
                  </div>
                  <div v-if="relevanceMap.eligibility[i]?.isRelevant === false" class="px-3 pb-3">
                    <input v-model="relevanceMap.eligibility[i].note" type="text" placeholder="Reason (optional)..."
                      class="w-full h-8 px-3 text-xs rounded-lg bg-white border border-red-200 focus:outline-none focus:ring-1 focus:ring-red-300" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Training -->
            <div v-if="selectedApp.applicantData?.training?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Training &amp; Seminars</p>
              <div class="flex flex-col gap-2">
                <div v-for="(tr, i) in selectedApp.applicantData.training" :key="i"
                  :class="['border rounded-xl overflow-hidden transition-colors', relevanceClass(relevanceMap.training[i]?.isRelevant)]">
                  <div class="p-3 flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--text-main)]">{{ tr.title }}</p>
                      <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ tr.provider }}{{ tr.hours ? ` · ${tr.hours}h` : '' }}</p>
                    </div>
                    <button @click="relevanceMap.training[i].isRelevant = !relevanceMap.training[i].isRelevant"
                      :class="['flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap', relevanceBtnClass(relevanceMap.training[i]?.isRelevant)]">
                      {{ relevanceMap.training[i]?.isRelevant !== false ? 'Relevant' : 'Not Relevant' }}
                    </button>
                  </div>
                  <div v-if="relevanceMap.training[i]?.isRelevant === false" class="px-3 pb-3">
                    <input v-model="relevanceMap.training[i].note" type="text" placeholder="Reason (optional)..."
                      class="w-full h-8 px-3 text-xs rounded-lg bg-white border border-red-200 focus:outline-none focus:ring-1 focus:ring-red-300" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Experience -->
            <div v-if="selectedApp.applicantData?.experience?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Work Experience</p>
              <div class="flex flex-col gap-2">
                <div v-for="(exp, i) in selectedApp.applicantData.experience" :key="i"
                  :class="['border rounded-xl overflow-hidden transition-colors', relevanceClass(relevanceMap.experience[i]?.isRelevant)]">
                  <div class="p-3 flex items-start justify-between gap-2">
                    <div class="min-w-0">
                      <p class="text-sm font-semibold text-[var(--text-main)]">{{ exp.position }}</p>
                      <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ exp.company }}{{ exp.months ? ` · ${exp.months} mo.` : '' }}{{ exp.isGovernment ? " · Gov't" : '' }}</p>
                    </div>
                    <button @click="relevanceMap.experience[i].isRelevant = !relevanceMap.experience[i].isRelevant"
                      :class="['flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors whitespace-nowrap', relevanceBtnClass(relevanceMap.experience[i]?.isRelevant)]">
                      {{ relevanceMap.experience[i]?.isRelevant !== false ? 'Relevant' : 'Not Relevant' }}
                    </button>
                  </div>
                  <div v-if="relevanceMap.experience[i]?.isRelevant === false" class="px-3 pb-3">
                    <input v-model="relevanceMap.experience[i].note" type="text" placeholder="Reason (optional)..."
                      class="w-full h-8 px-3 text-xs rounded-lg bg-white border border-red-200 focus:outline-none focus:ring-1 focus:ring-red-300" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Rating -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">Performance Rating</p>
              <div :class="['border rounded-xl p-3.5 transition-colors', relevanceClass(relevanceMap.performance.isRelevant)]">
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <template v-if="selectedApp.applicantData?.performanceRating?.score">
                      <p class="text-2xl font-extrabold text-[var(--color-primary)] tabular-nums">{{ selectedApp.applicantData.performanceRating.score }}</p>
                      <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ selectedApp.applicantData.performanceRating.adjective }} · {{ selectedApp.applicantData.performanceRating.periodCovered }}</p>
                    </template>
                    <p v-else class="text-xs text-[var(--text-faint)] italic">No performance rating submitted.</p>
                  </div>
                  <button @click="relevanceMap.performance.isRelevant = !relevanceMap.performance.isRelevant"
                    :class="['flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors', relevanceBtnClass(relevanceMap.performance.isRelevant)]">
                    {{ relevanceMap.performance.isRelevant ? 'Relevant' : 'Not Relevant' }}
                  </button>
                </div>
                <div v-if="!relevanceMap.performance.isRelevant" class="mt-2.5">
                  <input v-model="relevanceMap.performance.note" type="text" placeholder="Reason (optional)..."
                    class="w-full h-8 px-3 text-xs rounded-lg bg-white border border-red-200 focus:outline-none focus:ring-1 focus:ring-red-300" />
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- ── RIGHT: HR Rating Form ──────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden flex flex-col">
          <div class="px-5 py-3.5 border-b border-[var(--border-main)] bg-[var(--bg-app)] flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center">
              <i class="pi pi-pencil text-[var(--text-muted)] text-xs"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-[var(--text-main)]">HR Rating — MSP Point System</p>
              <p class="text-[10px] text-[var(--text-muted)]">Enter scores per criterion. Total auto-calculates above.</p>
            </div>
          </div>
          <div class="p-5 flex flex-col gap-5 overflow-y-auto max-h-[70vh] custom-scrollbar">

            <!-- Main criteria -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Criteria Points</p>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="field in [
                  { key: 'educationPoints',            label: 'Education',                  rubricKey: 'education'                  },
                  { key: 'trainingPoints',             label: 'Training (last 5 yrs)',      rubricKey: 'training'                   },
                  { key: 'experiencePoints',           label: 'Experience',                 rubricKey: 'experience'                 },
                  { key: 'performancePoints',          label: 'Performance (recent 1 yr)',  rubricKey: 'performance'                },
                  { key: 'outstandingAccomplishments', label: 'Outstanding Accomplishments', rubricKey: 'outstandingAccomplishments' },
                  { key: 'appEducationPoints',         label: 'App. Education',             rubricKey: 'appEducation'               },
                  { key: 'appLearningPoints',          label: 'App. Learning',              rubricKey: 'appLearning'                },
                ]" :key="field.key" class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{{ field.label }}</label>
                    <span v-if="currentRubric?.[field.rubricKey] != null"
                      class="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.5 rounded">
                      max {{ currentRubric[field.rubricKey] }}
                    </span>
                  </div>
                  <input v-model.number="rating[field.key]" type="number" step="0.01" min="0"
                    :max="currentRubric?.[field.rubricKey] ?? undefined"
                    class="input" />
                </div>
              </div>
            </div>

            <!-- Potential Points -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Potential Points</p>
              <div class="grid grid-cols-3 gap-3">
                <div v-for="field in [
                  { key: 'writtenTest', label: 'Written Test' },
                  { key: 'bei',         label: 'BEI'          },
                  { key: 'workSample',  label: 'Work Sample'  },
                ]" :key="field.key" class="flex flex-col gap-1.5">
                  <div class="flex items-center justify-between">
                    <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">{{ field.label }}</label>
                    <span v-if="currentRubric?.potential?.[field.key] != null"
                      class="text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-light)] px-1.5 py-0.5 rounded">
                      max {{ currentRubric.potential[field.key] }}
                    </span>
                  </div>
                  <input v-model.number="rating.potentialPoints[field.key]" type="number" step="0.01" min="0"
                    :max="currentRubric?.potential?.[field.key] ?? undefined"
                    class="input" />
                </div>
              </div>
            </div>

            <!-- Remarks -->
            <div class="flex flex-col gap-1.5">
              <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Remarks / Notes</label>
              <textarea v-model="rating.remarks" rows="3" class="input resize-none"
                placeholder="Optional remarks for this evaluation..."></textarea>
            </div>

            <!-- Action buttons -->
            <div class="flex flex-col gap-2 pt-2 border-t border-[var(--border-main)]">
              <button @click="submitEval(true)" :disabled="saving"
                class="btn-primary w-full h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                <i :class="['pi text-xs', saving ? 'pi-spin pi-spinner' : 'pi-check-circle']"></i>
                {{ saving ? 'Submitting...' : (selectedApp.isEvaluated ? 'Update Evaluation' : 'Submit Evaluation') }}
              </button>
              <button @click="submitEval(false)" :disabled="saving"
                class="btn-secondary w-full h-9 text-sm flex items-center justify-center gap-2 disabled:opacity-60">
                <i class="pi pi-save text-xs"></i> Save Progress
              </button>
              <p class="text-[10px] text-[var(--text-faint)] text-center leading-relaxed">
                <strong>Submit Evaluation</strong> finalizes the rating and sets status to <strong>Ranked</strong>.<br>
                <strong>Save Progress</strong> stores the rating without finalizing.
              </p>
            </div>

          </div>
        </div>

      </div>
    </template>

  </div>
</template>
