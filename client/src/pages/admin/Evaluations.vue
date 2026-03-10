<script setup>
import { ref, reactive, computed, onMounted, inject, watch } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppCard, AppDrawer, AppInput, AppTextarea, AppPageHeader, AppModal } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

const toast = inject('$toast')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ──────────────────────────────────────────────────────────────────
const jobs = ref([])
const applications = ref([])
const rubrics = ref([])
const loading = ref(false)
const searchQuery = ref('')

// ── PICKER STATE ─────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')

// Focus Mode: Scoring state
const selectedApp = ref(null)
const showScorecard = ref(false)
const saving = ref(false)

// Dynamic Rating Object
const rating = ref({})
const panelMembers = ref('')
const remarks = ref('')

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: applications.value.length,
  draft: applications.value.filter(a => a.status !== 'ranked').length,
  finalized: applications.value.filter(a => a.status === 'ranked').length,
}))

const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const activeRubric = computed(() => {
  if (!selectedJob.value) return null
  return rubrics.value.find(r => r.category === selectedJob.value.hiringTrack) || null
})

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j => 
    j.positionTitle.toLowerCase().includes(q) || 
    (j.positionCode || '').toLowerCase().includes(q)
  )
})

const filtered = computed(() => {
  let list = applications.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => fullName(a).toLowerCase().includes(q) || (a.applicationCode || '').toLowerCase().includes(q))
  }
  return list
})

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchInitialData = async () => {
  const [jobsRes, rubricsRes] = await Promise.all([
    apiClient.get('/v1/jobs'),
    apiClient.get('/v1/rubrics')
  ])
  jobs.value = jobsRes.data.data
  rubrics.value = rubricsRes.data.data
  if (selectedJobId.value) loadApplications()
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  loadApplications()
}

const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data.filter(a => ['comparative_assessment', 'ranked', 'appointed'].includes(a.status))
  } finally {
    loading.value = false
  }
}

const openScoring = (app) => {
  selectedApp.value = app
  
  // Initialize dynamic rating object based on rubric criteria
  const r = app.hrRating || {}
  const newRating = {}
  
  if (activeRubric.value) {
    activeRubric.value.criteria.forEach(c => {
      newRating[c.key] = r[c.key] || 0
    })
  }
  
  rating.value = newRating
  panelMembers.value = r.panelMembers || ''
  remarks.value = r.remarks || ''
  showScorecard.value = true
}

const liveTotal = computed(() => {
  return Object.values(rating.value).reduce((s, v) => s + (Number(v) || 0), 0)
})

const partATotal = computed(() => {
  if (!activeRubric.value) return 0
  return activeRubric.value.criteria
    .filter(c => !c.isPotential)
    .reduce((s, c) => s + (Number(rating.value[c.key]) || 0), 0)
})

const partBTotal = computed(() => {
  if (!activeRubric.value) return 0
  return activeRubric.value.criteria
    .filter(c => c.isPotential)
    .reduce((s, c) => s + (Number(rating.value[c.key]) || 0), 0)
})

const submitEval = async (finalize = false) => {
  saving.value = true
  try {
    const payload = { 
      hrRating: { 
        ...rating.value, 
        panelMembers: panelMembers.value, 
        remarks: remarks.value 
      }, 
      finalize 
    }
    await apiClient.patch(`/v1/applications/${selectedApp.value._id}/evaluate`, payload)
    toast.fire({ icon: 'success', title: finalize ? 'Scores Published' : 'Draft Saved' })
    showScorecard.value = false
    loadApplications()
  } finally {
    saving.value = false
  }
}

const fullName = (app) => {
  const p = app.applicantData?.personalInfo
  if (!p) return 'Unknown Candidate'
  return [p.firstName, p.middleName, p.lastName, p.suffix].filter(Boolean).join(' ')
}

const getPlaceName = (place) => {
  if (!place) return 'No Station'
  if (Array.isArray(place)) {
    return place.map(p => typeof p === 'object' ? p.name : p).filter(Boolean).join(', ')
  }
  if (typeof place === 'object') return place.name || 'No Station'
  return place
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

watch(selectedJobId, () => {
  loadApplications()
})

onMounted(fetchInitialData)

const isLocked = computed(() => selectedApp.value?.status === 'ranked' || selectedApp.value?.status === 'appointed')
</script>

<template>
  <div class="flex flex-col gap-5 h-full">
    <AppPageHeader title="Merit Assessment" subtitle="Track-specific scoring based on official DepEd rubrics." icon="pi-list-check" />

    <!-- Selection Toolbar -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-3.5 flex flex-col lg:flex-row gap-3">
      <button @click="showJobPicker = true"
        class="flex items-center gap-3 px-4 h-10 bg-[var(--bg-app)] border border-[var(--border-main)] hover:border-[var(--color-primary)] rounded-lg transition-all text-left flex-1 group">
        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
          <i class="pi pi-briefcase text-xs"></i>
        </div>
        <div class="flex-1 min-w-0">
          <p v-if="selectedJob" class="text-xs font-bold text-[var(--text-main)] truncate uppercase tracking-tight">{{ selectedJob.positionTitle }}</p>
          <p v-if="selectedJob" class="text-[10px] text-[var(--text-muted)] font-mono truncate">{{ selectedJob.positionCode }} &bull; {{ getPlaceName(selectedJob.placeOfAssignment) }}</p>
          <p v-else class="text-xs font-semibold text-[var(--text-faint)]">Select a vacancy to begin assessment...</p>
        </div>
        <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)] transition-colors"></i>
      </button>

      <div v-if="selectedJobId" class="relative w-full lg:w-64 group">
        <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none group-focus-within:text-[var(--color-primary)] transition-colors z-10"></i>
        <input v-model="searchQuery" type="search" placeholder="Search..."
          class="w-full h-10 pl-10 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold uppercase tracking-tight
                 text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 
                 focus:border-[var(--color-primary)] transition-all" />
      </div>
    </div>

    <!-- Applicant Table -->
    <div v-if="selectedJobId" class="flex-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl shadow-sm overflow-hidden flex flex-col">
      <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-black uppercase text-[var(--text-faint)] tracking-widest">
        <div class="col-span-5">Candidate</div>
        <div class="col-span-3 text-center">Current Total Score</div>
        <div class="col-span-2 text-center">Status</div>
        <div class="col-span-2 text-right">Action</div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
        <div v-if="loading" class="p-8 flex justify-center"><i class="pi pi-spin pi-spinner text-2xl text-[var(--text-faint)]"></i></div>
        <div v-else-if="filtered.length === 0" class="py-20 text-center opacity-40">
          <i class="pi pi-inbox text-4xl mb-3 block"></i>
          <p class="text-xs font-black uppercase tracking-widest">No qualified applicants found</p>
        </div>
        <div v-for="app in filtered" :key="app._id" class="grid grid-cols-12 px-6 py-4 items-center hover:bg-[var(--bg-app)] transition-colors group">
          <div class="col-span-5 flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-xs font-black text-[var(--color-primary)]">
              {{ app.applicantData?.personalInfo?.lastName?.charAt(0) }}
            </div>
            <div>
              <p class="text-sm font-bold text-[var(--text-main)] truncate uppercase leading-tight">{{ fullName(app) }}</p>
              <p class="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{{ app.applicationCode }}</p>
            </div>
          </div>
          <div class="col-span-3 text-center">
            <span class="text-xl font-black tabular-nums text-[var(--color-primary)]">{{ (app.totalScore || 0).toFixed(2) }}</span>
          </div>
          <div class="col-span-2 flex justify-center">
            <AppBadge :variant="app.status === 'ranked' ? 'success' : 'gold'" size="xs">{{ app.status === 'ranked' ? 'Evaluated' : 'Pending' }}</AppBadge>
          </div>
          <div class="col-span-2 text-right">
            <AppButton variant="secondary" size="xs" @click="openScoring(app)">
              <i :class="['pi text-[10px] mr-1.5', app.status === 'ranked' ? 'pi-eye' : 'pi-pencil']"></i>
              {{ app.status === 'ranked' ? 'Review' : 'Score' }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Scoring Drawer -->
    <AppDrawer :show="showScorecard" :title="selectedApp ? fullName(selectedApp) : ''" subtitle="Official Assessment Scorecard" size="xl" @close="showScorecard = false">
      <div v-if="selectedApp && activeRubric" class="flex flex-col h-full overflow-hidden">
        
        <!-- Score Banner -->
        <div class="bg-[var(--color-navy)] rounded-2xl p-6 text-white flex justify-between items-center shadow-xl mb-8 relative overflow-hidden">
          <div class="flex items-center gap-6 relative z-10">
            <div class="w-20 h-20 rounded-2xl bg-[var(--color-primary)] flex flex-col items-center justify-center border border-white/10">
              <span class="text-2xl font-black tabular-nums leading-none">{{ liveTotal.toFixed(2) }}</span>
              <span class="text-[9px] font-black uppercase tracking-widest opacity-60 mt-1">Total Pts</span>
            </div>
            <div>
              <h2 class="text-lg font-black uppercase tracking-tight leading-none">{{ activeRubric.title }}</h2>
              <div class="flex gap-3 mt-3">
                <span class="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">Part A: {{ partATotal.toFixed(2) }}</span>
                <span class="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">Part B: {{ partBTotal.toFixed(2) }}</span>
              </div>
            </div>
          </div>
          <div class="flex gap-2 relative z-10">
            <AppButton v-if="!isLocked" variant="secondary" size="sm" class="!bg-white/10 !text-white !border-white/20" @click="submitEval(false)" :loading="saving">Draft</AppButton>
            <AppButton v-if="!isLocked" variant="primary" size="sm" @click="submitEval(true)" :loading="saving">Finalize & Rank</AppButton>
          </div>
          <div class="absolute right-0 bottom-0 opacity-10 translate-x-1/4 translate-y-1/4"><i class="pi pi-verified text-[160px]"></i></div>
        </div>

        <!-- Dynamic Inputs -->
        <div class="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-12">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <div class="space-y-6">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] border-b border-[var(--border-main)] pb-2 flex items-center gap-2">
                <i class="pi pi-file"></i> Part A: Credentials
              </h3>
              <div v-for="c in activeRubric.criteria.filter(x => !x.isPotential)" :key="c.key" class="bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-2xl hover:border-[var(--color-primary-ring)] transition-all">
                <div class="flex justify-between items-center mb-2">
                  <label class="text-[10px] font-black uppercase text-[var(--text-muted)]">{{ c.label }}</label>
                  <span class="text-[9px] font-bold text-[var(--text-faint)]">Max: {{ c.maxPoints }}</span>
                </div>
                <input v-model.number="rating[c.key]" type="number" step="0.01" :max="c.maxPoints" :disabled="isLocked"
                  class="w-full h-12 text-center text-2xl font-black bg-[var(--bg-app)] rounded-xl outline-none border-2 border-transparent focus:border-[var(--color-primary)] transition-all tabular-nums" />
              </div>
            </div>

            <div class="space-y-6">
              <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 border-b border-amber-100 pb-2 flex items-center gap-2">
                <i class="pi pi-bolt"></i> Part B: Potential
              </h3>
              <div v-for="c in activeRubric.criteria.filter(x => x.isPotential)" :key="c.key" class="bg-amber-50/30 border border-amber-100 p-4 rounded-2xl hover:border-amber-300 transition-all">
                <div class="flex justify-between items-center mb-2">
                  <label class="text-[10px] font-black uppercase text-amber-800">{{ c.label }}</label>
                  <span class="text-[9px] font-bold text-amber-600/60">Max: {{ c.maxPoints }}</span>
                </div>
                <input v-model.number="rating[c.key]" type="number" step="0.01" :max="c.maxPoints" :disabled="isLocked"
                  class="w-full h-12 text-center text-2xl font-black bg-white rounded-xl outline-none border-2 border-transparent focus:border-amber-400 transition-all tabular-nums text-amber-700" />
              </div>
            </div>

          </div>

          <!-- Remarks -->
          <div class="mt-10 space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-faint)] border-b border-[var(--border-main)] pb-2">Consensus Remarks</h3>
            <textarea v-model="remarks" :disabled="isLocked" rows="4" class="w-full p-4 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 transition-all resize-none"></textarea>
          </div>
        </div>

      </div>
    </AppDrawer>

    <!-- ── JOB PICKER MODAL (Refined) ────────────────────────────────────────── -->
    <AppModal v-model="showJobPicker" title="Select Assessment Vacancy" icon="pi-briefcase" width="max-w-2xl">
      <div class="flex flex-col gap-4">
        <!-- Search bar -->
        <div class="relative group">
          <i class="pi pi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none group-focus-within:text-[var(--color-primary)] transition-colors z-10"></i>
          <input 
            v-model="jobPickerSearch" 
            placeholder="Search by position, code, or station..." 
            class="w-full h-11 pl-10 pr-4 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] text-sm font-bold uppercase tracking-tight
                   text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 
                   focus:border-[var(--color-primary)] transition-all"
            autofocus
          />
        </div>

        <!-- Vacancy List -->
        <div class="max-h-[440px] overflow-y-auto pr-1 custom-scrollbar min-h-[320px] relative">
          <div v-if="filteredJobs.length > 0" class="space-y-2 pb-4 px-0.5">
            <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
              class="w-full p-4 rounded-2xl border transition-all text-left flex items-start justify-between gap-4 group relative overflow-hidden"
              :class="selectedJobId === job._id
                ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/20 shadow-sm ring-1 ring-[var(--color-primary-ring)]/20'
                : 'border-[var(--border-main)] bg-[var(--surface)] hover:border-[var(--color-primary)] hover:bg-[var(--bg-app)]/40 hover:shadow-md'">
              
              <!-- Selection Indicator -->
              <div v-if="selectedJobId === job._id" 
                class="absolute top-0 right-0 w-8 h-8 bg-[var(--color-primary)] flex items-center justify-center rounded-bl-xl shadow-sm animate-fade-in">
                <i class="pi pi-check text-white text-[10px] font-black"></i>
              </div>

              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-2">
                  <span :class="['text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-widest',
                    job.hiringTrack === 'teaching' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                    job.hiringTrack === 'teaching_related' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                    'bg-slate-50 text-slate-600 border-slate-200']">
                    {{ job.hiringTrack.replace('_', ' ') }}
                  </span>
                  <span class="text-[9px] text-[var(--text-faint)] font-bold uppercase tracking-tighter flex items-center gap-1">
                    <i class="pi pi-calendar text-[8px]"></i> {{ formatDate(job.createdAt) }}
                  </span>
                </div>

                <h4 class="text-sm font-black text-[var(--text-main)] truncate uppercase group-hover:text-[var(--color-primary)] transition-colors leading-tight tracking-tight">
                  {{ job.positionTitle }}
                </h4>
                
                <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2">
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    <i class="pi pi-tag text-[9px]"></i>
                    <span class="font-mono text-[var(--text-main)]">{{ job.positionCode }}</span>
                  </div>
                  <div class="flex items-center gap-1.5 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-tight">
                    <i class="pi pi-map-marker text-[9px]"></i>
                    <span class="truncate max-w-[220px]">{{ getPlaceName(job.placeOfAssignment) }}</span>
                  </div>
                </div>
              </div>

              <div class="flex flex-col items-end justify-between self-stretch flex-shrink-0 py-0.5">
                <AppBadge :variant="job.status" size="sm" class="font-black uppercase tracking-widest text-[8px]">
                  {{ job.status }}
                </AppBadge>
                
                <div class="flex items-center gap-3">
                  <div class="text-right">
                    <p class="text-[8px] font-black text-[var(--text-faint)] uppercase leading-none mb-1">Qualified</p>
                    <p class="text-xs font-black text-[var(--color-primary)] tabular-nums leading-none">{{ job.applications?.filter(a => a.isQualified).length || 0 }}</p>
                  </div>
                  <div class="w-px h-5 bg-[var(--border-main)]"></div>
                  <div class="text-right">
                    <p class="text-[8px] font-black text-[var(--text-faint)] uppercase leading-none mb-1">Slots</p>
                    <p class="text-xs font-black text-[var(--text-main)] tabular-nums leading-none">{{ job.noOfVacancy || 0 }}</p>
                  </div>
                </div>
              </div>
            </button>
          </div>

          <!-- No results state -->
          <div v-else class="absolute inset-0 flex flex-col items-center justify-center text-center p-8">
            <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center mb-4">
              <i class="pi pi-search-minus text-2xl text-[var(--text-faint)]"></i>
            </div>
            <h5 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">No Vacancies Found</h5>
            <p class="text-[11px] text-[var(--text-muted)] mt-1.5 max-w-[240px] font-medium leading-relaxed">
              Try different keywords or browse all recruitment posts.
            </p>
            <AppButton variant="secondary" size="sm" class="mt-5" @click="jobPickerSearch = ''">Clear Search</AppButton>
          </div>
        </div>
      </div>
    </AppModal>

  </div>
</template>
