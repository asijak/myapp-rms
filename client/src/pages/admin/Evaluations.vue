<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppCard, AppDrawer, AppPageHeader, AppModal } from '@/components/ui'
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
const evalTab = ref('credentials')
const saving = ref(false)

const evalTabs = [
  { id: 'credentials', label: 'A. Credentials', icon: 'pi-file' },
  { id: 'potential',   label: 'B. Potential',   icon: 'pi-bolt' },
  { id: 'finalize',    label: 'Summary',        icon: 'pi-check-circle' },
]

const rating = reactive({
  panelMembers: '',
  educationPoints: 0,
  trainingPoints: 0,
  experiencePoints: 0,
  performancePoints: 0,
  outstandingAccomplishments: 0,
  appEducationPoints: 0,
  appLearningPoints: 0,
  potentialPoints: { writtenTest: 0, bei: 0, workSample: 0 },
  remarks: '',
})

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const selectedJob = computed(() => jobs.value.find(j => j._id === selectedJobId.value) || null)

const filteredJobs = computed(() => {
  if (!jobPickerSearch.value) return jobs.value
  const q = jobPickerSearch.value.toLowerCase()
  return jobs.value.filter(j => 
    j.positionTitle.toLowerCase().includes(q) || 
    (j.positionCode || '').toLowerCase().includes(q) ||
    j.placeOfAssignment.toLowerCase().includes(q)
  )
})

// ── METHODS ───────────────────────────────────────────────────────────────
const fetchInitialData = async () => {
  const [jobsRes, rubricsRes] = await Promise.all([
    apiClient.get('/v1/jobs'),
    apiClient.get('/v1/rubrics')
  ])
  jobs.value = jobsRes.data.data
  rubrics.value = rubricsRes.data.data
  if (selectedJobId.value) {
    loadApplications()
  }
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
    applications.value = data.data.filter(a => ['comparative_assessment', 'ranked'].includes(a.status))
  } finally {
    loading.value = false
  }
}

const openScoring = (app) => {
  selectedApp.value = app
  evalTab.value = 'credentials'
  
  const r = app.hrRating || {}
  rating.panelMembers = r.panelMembers || ''
  rating.educationPoints = r.educationPoints || 0
  rating.trainingPoints = r.trainingPoints || 0
  rating.experiencePoints = r.experiencePoints || 0
  rating.performancePoints = r.performancePoints || 0
  rating.outstandingAccomplishments = r.outstandingAccomplishments || 0
  rating.appEducationPoints = r.appEducationPoints || 0
  rating.appLearningPoints = r.appLearningPoints || 0
  rating.potentialPoints = {
    writtenTest: r.potentialPoints?.writtenTest || 0,
    bei: r.potentialPoints?.bei || 0,
    workSample: r.potentialPoints?.workSample || 0
  }
  rating.remarks = r.remarks || ''
  showScorecard.value = true
}

const activeRubric = computed(() => {
  if (!selectedApp.value) return null
  const track = selectedApp.value.submittedTo?.hiringTrack || selectedApp.value.category
  return rubrics.value.find(r => r.category === track) || null
})

const liveTotal = computed(() => {
  const r = rating
  return (
    Number(r.educationPoints || 0) + Number(r.trainingPoints || 0) + Number(r.experiencePoints || 0) +
    Number(r.performancePoints || 0) + Number(r.outstandingAccomplishments || 0) + Number(r.appEducationPoints || 0) +
    Number(r.appLearningPoints || 0) + Number(r.potentialPoints.writtenTest || 0) + Number(r.potentialPoints.bei || 0) +
    Number(r.potentialPoints.workSample || 0)
  )
})

const submitEval = async (finalize = false) => {
  saving.value = true
  try {
    const payload = { hrRating: rating, finalize }
    await apiClient.patch(`/v1/applications/${selectedApp.value._id}/evaluate`, payload)
    toast.fire({ icon: 'success', title: finalize ? 'Scores Published' : 'Draft Saved' })
    showScorecard.value = false
    loadApplications()
  } finally {
    saving.value = false
  }
}

onMounted(fetchInitialData)

const filtered = computed(() => {
  let list = applications.value
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => (a.applicantData?.personalInfo?.lastName || '').toLowerCase().includes(q) || a.applicationCode.toLowerCase().includes(q))
  }
  return list
})

const catATotal = computed(() =>
  Number(rating.educationPoints    || 0) + Number(rating.trainingPoints       || 0) +
  Number(rating.experiencePoints   || 0) + Number(rating.performancePoints    || 0) +
  Number(rating.outstandingAccomplishments || 0) + Number(rating.appEducationPoints || 0) +
  Number(rating.appLearningPoints  || 0)
)
const catBTotal = computed(() =>
  Number(rating.potentialPoints.writtenTest || 0) + Number(rating.potentialPoints.bei || 0) +
  Number(rating.potentialPoints.workSample  || 0)
)

const isLocked = computed(() => selectedApp.value?.status === 'ranked' && selectedApp.value?.isEvaluated)
const scoreClasses = "w-full h-12 px-4 text-xl font-black bg-[var(--bg-app)] border-2 border-[var(--border-main)] rounded-xl focus:border-[var(--color-primary)] transition-all tabular-nums text-center disabled:opacity-60 disabled:cursor-not-allowed";
</script>

<template>
  <div class="flex flex-col gap-6 h-full">
    <AppPageHeader title="Assessment Board" subtitle="Score applicants based on rubric criteria and potential points." icon="pi-list-check" />

    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-2xl shadow-sm">
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        <button @click="showJobPicker = true"
          class="flex items-center gap-3 px-4 h-12 bg-[var(--bg-app)] border-2 border-transparent hover:border-[var(--color-primary-ring)] rounded-xl transition-all text-left w-full sm:min-w-[400px] group">
          <div class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
            <i class="pi pi-search text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p v-if="selectedJob" class="text-xs font-black text-[var(--text-main)] truncate uppercase tracking-tight">{{ selectedJob.positionTitle }}</p>
            <p v-if="selectedJob" class="text-[10px] text-[var(--text-muted)] font-mono truncate">{{ selectedJob.positionCode }} &bull; {{ selectedJob.placeOfAssignment }}</p>
            <p v-else class="text-sm font-bold text-[var(--text-faint)]">Search vacancy for scoring...</p>
          </div>
          <i class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)]"></i>
        </button>

        <div v-if="selectedJobId" class="h-8 w-px bg-[var(--border-main)] hidden sm:block"></div>

        <div v-if="selectedJobId" class="relative w-full sm:w-64">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px]"></i>
          <input v-model="searchQuery" placeholder="Filter applicants..."
            class="w-full h-10 pl-9 pr-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-[11px] font-black focus:ring-2 focus:ring-[var(--color-primary-ring)] outline-none" />
        </div>
      </div>

      <div v-if="selectedJob" class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
        <div class="flex flex-col items-end leading-tight">
          <span>Hiring Track</span>
          <span class="text-[var(--text-main)] uppercase">{{ selectedJob.hiringTrack.replace('_', ' ') }}</span>
        </div>
        <div class="w-px h-6 bg-[var(--border-main)]"></div>
        <div class="flex flex-col items-end leading-tight">
          <span>Finalized</span>
          <span class="text-emerald-600 tabular-nums font-bold">{{ applications.filter(a => a.status === 'ranked').length }} / {{ applications.length }}</span>
        </div>
      </div>
    </div>

    <div v-if="selectedJobId" class="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm">
      <div class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
        <div class="col-span-5">Applicant</div>
        <div class="col-span-3 text-center">Merit Points</div>
        <div class="col-span-2 text-center">Phase</div>
        <div class="col-span-2 text-right">Actions</div>
      </div>

      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">
        <div v-for="app in filtered" :key="app._id" class="grid grid-cols-12 px-6 py-4 items-center group hover:bg-[var(--bg-app)] transition-colors cursor-default">
          <div class="col-span-5 flex items-center gap-4">
            <div class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] text-[var(--color-primary)] flex items-center justify-center text-xs font-black shadow-xs">{{ app.applicantData.personalInfo.lastName.charAt(0) }}</div>
            <div class="min-w-0">
              <p class="text-sm font-black text-[var(--text-main)] uppercase truncate">{{ app.applicantData.personalInfo.firstName }} {{ app.applicantData.personalInfo.lastName }}</p>
              <p class="text-[10px] text-[var(--text-muted)] font-mono tracking-tight uppercase">{{ app.applicationCode }}</p>
            </div>
          </div>
          <div class="col-span-3 text-center"><span class="text-xl font-black text-[var(--color-primary)] tabular-nums">{{ app.totalScore?.toFixed(2) || '0.00' }}</span></div>
          <div class="col-span-2 text-center">
            <AppBadge :variant="app.status === 'ranked' ? 'success' : 'neutral'" size="sm" class="uppercase">{{ app.status === 'ranked' ? 'Finalized' : 'Draft' }}</AppBadge>
          </div>
          <div class="col-span-2 text-right">
            <AppButton size="xs" :variant="app.status === 'ranked' ? 'ghost' : 'primary'" @click="openScoring(app)" class="h-8 px-4 text-[10px] font-black uppercase tracking-widest">
              <i :class="['pi mr-1.5', app.status === 'ranked' ? 'pi-eye' : 'pi-pencil']"></i>{{ app.status === 'ranked' ? 'View' : 'Score' }}
            </AppButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Job Picker -->
    <AppModal v-model="showJobPicker" title="Select Assessment Vacancy" icon="pi-search" width="max-w-2xl">
      <div class="p-1 space-y-4">
        <input v-model="jobPickerSearch" placeholder="Filter vacancies..." class="w-full h-12 px-5 bg-[var(--bg-app)] border-2 border-[var(--border-main)] rounded-xl text-sm font-bold focus:border-[var(--color-primary)] outline-none transition-all uppercase tracking-tight" />
        <div class="max-h-[400px] overflow-y-auto custom-scrollbar space-y-2">
          <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)" class="w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between group" :class="selectedJobId === job._id ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 shadow-md' : 'border-[var(--bg-app)] bg-[var(--bg-app)] hover:border-[var(--border-main)]'">
            <div class="flex-1 min-w-0">
              <span class="text-[9px] font-black text-[var(--color-primary)] uppercase tracking-widest">{{ job.hiringTrack }}</span>
              <h4 class="text-sm font-black text-[var(--text-main)] truncate uppercase mt-1">{{ job.positionTitle }}</h4>
              <p class="text-[10px] text-[var(--text-muted)] font-mono">{{ job.positionCode }} &bull; {{ job.placeOfAssignment }}</p>
            </div>
            <AppBadge :variant="job.status" size="xs" class="uppercase">{{ job.status }}</AppBadge>
          </button>
        </div>
      </div>
    </AppModal>

    <!-- Original Scoring Drawer -->
    <AppDrawer :show="showScorecard" :title="selectedApp ? `${selectedApp.applicantData.personalInfo.firstName} ${selectedApp.applicantData.personalInfo.lastName}` : ''" subtitle="HRMPSB Assessment Board" size="xl" @close="showScorecard = false">
      <div class="flex flex-col gap-8 py-4">
        <div class="sticky top-0 z-10 p-5 rounded-xl bg-[var(--color-navy)] text-white shadow-2xl flex justify-between items-center transition-all">
          <div class="flex items-center gap-6">
            <div class="w-16 h-16 rounded-2xl bg-[var(--color-primary)] flex flex-col items-center justify-center shadow-lg border border-white/10">
              <span class="text-lg font-black tabular-nums leading-none">{{ liveTotal.toFixed(1) }}</span>
              <span class="text-[8px] font-black uppercase tracking-widest opacity-70 mt-0.5">Total</span>
            </div>
            <div>
              <p class="text-[10px] font-black uppercase tracking-widest opacity-50">Board Consensus Score</p>
              <h2 class="text-base font-black mt-0.5 tracking-tight uppercase">{{ activeRubric?.title || 'Assessment' }}</h2>
            </div>
          </div>
          <div class="flex gap-2">
            <AppButton v-if="!isLocked" variant="ghost" size="sm" @click="submitEval(false)" :loading="saving" class="text-white hover:bg-white/10">Save Draft</AppButton>
            <AppButton v-if="!isLocked" variant="primary" size="sm" @click="submitEval(true)" :loading="saving">Finalize &amp; Rank</AppButton>
            <AppButton v-else variant="secondary" size="sm" @click="showScorecard = false">Close</AppButton>
          </div>
        </div>
        <!-- (Rest of fields matching original Turn 24 structure) -->
        <AppCard class="card-raised p-6 border-[var(--border-main)]">
          <h3 class="text-xs font-black text-[var(--text-main)] uppercase tracking-widest mb-4">Board Remarks</h3>
          <textarea v-model="rating.remarks" class="w-full p-4 bg-[var(--bg-app)] border-2 border-[var(--border-main)] rounded-2xl text-sm font-bold min-h-[140px] focus:border-[var(--color-primary)] transition-all resize-none outline-none" :disabled="isLocked"></textarea>
        </AppCard>
      </div>
    </AppDrawer>
  </div>
</template>
