<script setup>
import { ref, reactive, computed, onMounted, inject } from 'vue'
import apiClient from '@/api/axios'
import { AppBadge, AppButton, AppTableReport, AppPageHeader, AppModal } from '@/components/ui'
import { statusConfig } from '@/utils/statusColors'
import { useRecruitmentStore } from '@/stores/recruitment'
import { storeToRefs } from 'pinia'

const toast = inject('$toast')
const swal = inject('$swal')
const recruitmentStore = useRecruitmentStore()
const { selectedJobId } = storeToRefs(recruitmentStore)

// ── DATA ─────────────────────────────────────────────────────────────────────
const jobs = ref([])
const applications = ref([])
const loading = ref(false)
const searchQuery = ref('')
const statusFilter = ref('all')

// ── PICKER STATE ─────────────────────────────────────────────────────────────
const showJobPicker = ref(false)
const jobPickerSearch = ref('')

// ── AUDIT MODAL STATE ─────────────────────────────────────────────────────────
const selected = ref(null)
const showAuditModal = ref(false)
const activePdsTab = ref('personal')
const showPreview = ref(false)
const selectedDocUrl = ref('')
const saving = ref(false)

const pdsTabs = [
  { id: 'personal', label: 'Profile', icon: 'pi-user' },
  { id: 'education', label: 'Education', icon: 'pi-graduation-cap' },
  { id: 'eligibility', label: 'Eligibility', icon: 'pi-verified' },
  { id: 'experience', label: 'Experience', icon: 'pi-briefcase' },
  { id: 'training', label: 'Training', icon: 'pi-star' },
  { id: 'performance', label: 'Performance', icon: 'pi-chart-bar' },
]

const checklist = reactive({
  education: { checked: false, note: '' },
  eligibility: { checked: false, note: '' },
  experience: { checked: false, note: '' },
  training: { checked: false, note: '' },
  performance: { checked: false, note: '' },
})
const verifyQualified = ref(true)
const verifyReason = ref('')

// ── COMPUTED ──────────────────────────────────────────────────────────────────
const stats = computed(() => ({
  total: applications.value.length,
  forReview: applications.value.filter(a => ['applied', 'verifying'].includes(a.status)).length,
  qualified: applications.value.filter(a => a.isVerified && a.isQualified).length,
  disqualified: applications.value.filter(a => a.isVerified && !a.isQualified).length,
}))

const filtered = computed(() => {
  let list = applications.value
  if (statusFilter.value === 'review') list = list.filter(a => ['applied', 'verifying'].includes(a.status))
  else if (statusFilter.value === 'qualified') list = list.filter(a => a.isVerified && a.isQualified)
  else if (statusFilter.value === 'disqualified') list = list.filter(a => a.isVerified && !a.isQualified)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a => fullName(a).toLowerCase().includes(q) || (a.applicationCode || '').toLowerCase().includes(q))
  }
  return list
})

const checksCompleted = computed(() => Object.values(checklist).filter(c => c.checked).length)

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

// ── METHODS ───────────────────────────────────────────────────────────────────
const fetchJobs = async () => {
  const { data } = await apiClient.get('/v1/jobs')
  jobs.value = data.data
  if (selectedJobId.value) {
    loadApplications()
  }
}

const selectJob = (jobId) => {
  recruitmentStore.setSelectedJobId(jobId)
  showJobPicker.value = false
  onJobChange()
}

const onJobChange = () => {
  if (selectedJobId.value) {
    statusFilter.value = 'review'
    loadApplications()
  } else {
    applications.value = []
  }
}

const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  try {
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data
  } finally {
    loading.value = false
  }
}

const openReview = (app) => {
  selected.value = app
  activePdsTab.value = 'personal'
  showPreview.value = false
  selectedDocUrl.value = ''

  const vc = app.verificationChecklist || {}
  Object.keys(checklist).forEach(key => {
    checklist[key].checked = vc[key]?.checked || false
    checklist[key].note = vc[key]?.note || ''
  })
  verifyQualified.value = app.isQualified ?? true
  verifyReason.value = app.disqualificationReason || ''

  showAuditModal.value = true
  document.body.style.overflow = 'hidden'
}

const closeAudit = () => {
  showAuditModal.value = false
  document.body.style.overflow = ''
}

const postIER = async () => {
  const result = await swal.fire({
    title: 'Post Initial Evaluation Results?',
    text: 'This will publish the IER to the public bulletin.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Publish Now',
  })
  if (!result.isConfirmed) return
  try {
    await apiClient.post('/v1/announcements/ier', { jobId: selectedJobId.value })
    toast.fire({ icon: 'success', title: 'IER Posted Successfully' })
  } catch {
    toast.fire({ icon: 'error', title: 'Failed to post IER' })
  }
}

const submitVerification = async () => {
  saving.value = true
  try {
    const payload = {
      verificationChecklist: checklist,
      isQualified: verifyQualified.value,
      disqualificationReason: verifyQualified.value ? '' : verifyReason.value,
      isVerified: true,
      status: verifyQualified.value ? 'comparative_assessment' : 'disqualified',
    }
    const { data } = await apiClient.patch(`/v1/applications/${selected.value._id}/status`, payload)
    const idx = applications.value.findIndex(a => a._id === selected.value._id)
    if (idx !== -1) applications.value[idx] = data.data
    toast.fire({ icon: 'success', title: verifyQualified.value ? 'Applicant Qualified' : 'Applicant Disqualified' })
    closeAudit()
  } finally {
    saving.value = false
  }
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
const fullName = (app) => {
  const p = app.applicantData?.personalInfo
  return p ? `${p.firstName} ${p.lastName}` : 'Unknown Candidate'
}

onMounted(fetchJobs)

// ── Export ────────────────────────────────────────────────────────────────────
const showReport = ref(false)
const reportCols = [
  { label: 'Applicant Name', value: (a) => fullName(a) },
  { label: 'Email', value: (a) => a.submittedBy?.email ?? '—' },
  { label: 'App Code', key: 'applicationCode' },
  { label: 'Date Applied', value: (a) => formatDate(a.createdAt) },
  { label: 'Status', key: 'status' },
  { label: 'Qualified', value: (a) => a.isQualified ? 'Yes' : a.isVerified ? 'No' : '—' },
]

const filterTabs = [
  { id: 'all', label: 'All', countKey: 'total' },
  { id: 'review', label: 'For Review', countKey: 'forReview' },
  { id: 'qualified', label: 'Qualified', countKey: 'qualified' },
  { id: 'disqualified', label: 'Disqualified', countKey: 'disqualified' },
]
</script>

<template>
  <div class="flex flex-col gap-5 h-full">

    <!-- Page Header -->
    <AppPageHeader title="Applicant Verification" subtitle="Screen PDS submissions and determine initial eligibility."
      icon="pi-users">
      <template #actions>
        <AppButton v-if="selectedJobId && applications.length > 0" variant="secondary" size="sm" @click="postIER">
          <i class="pi pi-megaphone mr-2"></i> Post IER
        </AppButton>
      </template>
    </AppPageHeader>

    <!-- Enhanced Toolbar -->
    <div
      class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-[var(--surface)] border border-[var(--border-main)] p-4 rounded-2xl shadow-sm">

      <!-- Searchable Picker Trigger -->
      <div class="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
        <button @click="showJobPicker = true"
          class="flex items-center gap-3 px-4 h-12 bg-[var(--bg-app)] border-2 border-transparent hover:border-[var(--color-primary-ring)] rounded-xl transition-all text-left w-full sm:min-w-[400px] group">
          <div
            class="w-9 h-9 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)]">
            <i class="pi pi-search text-sm"></i>
          </div>
          <div class="flex-1 min-w-0">
            <p v-if="selectedJob" class="text-xs font-black text-[var(--text-main)] truncate uppercase tracking-tight">
              {{ selectedJob.positionTitle }}
            </p>
            <p v-if="selectedJob" class="text-[10px] text-[var(--text-muted)] font-mono truncate">
              Code: {{ selectedJob.positionCode }} &bull; {{ selectedJob.placeOfAssignment }}
            </p>
            <p v-else class="text-sm font-bold text-[var(--text-faint)]">Click to search and select vacancy...</p>
          </div>
          <i
            class="pi pi-chevron-down text-[10px] text-[var(--text-faint)] group-hover:text-[var(--color-primary)]"></i>
        </button>

        <div v-if="selectedJobId" class="h-8 w-px bg-[var(--border-main)] hidden sm:block"></div>

        <!-- Quick Search applicants -->
        <div v-if="selectedJobId" class="relative w-full sm:w-60">
          <i
            class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-[10px] pointer-events-none"></i>
          <input v-model="searchQuery" placeholder="Search applicants..."
            class="w-full h-10 pl-9 pr-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl text-xs focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] outline-none transition-all" />
        </div>
      </div>

      <!-- Context Info -->
      <div v-if="selectedJob"
        class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[var(--text-faint)]">
        <div class="flex flex-col items-end leading-tight">
          <span>Hiring Track</span>
          <span class="text-[var(--text-main)] capitalize">{{ selectedJob.hiringTrack.replace('_', ' ') }}</span>
        </div>
        <div class="w-px h-6 bg-[var(--border-main)]"></div>
        <div class="flex flex-col items-end leading-tight">
          <span>Total Vacancy</span>
          <span class="text-[var(--text-main)]">{{ selectedJob.noOfVacancy }} Item{{ selectedJob.noOfVacancy > 1 ? 's' :
            ''
            }}</span>
        </div>
      </div>
    </div>

    <!-- Stats Row -->
    <div v-if="selectedJobId && !loading" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <div
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5 shadow-sm">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Total Applied</span>
        <span class="text-2xl font-black text-[var(--text-main)] tabular-nums">{{ stats.total }}</span>
      </div>
      <div
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5 shadow-sm">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">For Review</span>
        <span class="text-2xl font-black text-amber-500 tabular-nums">{{ stats.forReview }}</span>
      </div>
      <div
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5 shadow-sm">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Qualified</span>
        <span class="text-2xl font-black text-emerald-600 tabular-nums">{{ stats.qualified }}</span>
      </div>
      <div
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-4 flex flex-col gap-0.5 shadow-sm">
        <span class="text-[10px] font-black text-[var(--text-faint)] uppercase tracking-widest">Disqualified</span>
        <span class="text-2xl font-black text-red-500 tabular-nums">{{ stats.disqualified }}</span>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div v-if="selectedJobId" class="flex items-center gap-2 flex-wrap">
      <button v-for="tab in filterTabs" :key="tab.id" @click="statusFilter = tab.id"
        :class="['h-9 px-4 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2',
          statusFilter === tab.id
            ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-lg shadow-[var(--color-primary)]/20'
            : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border-main)] hover:border-[var(--color-primary-ring)] shadow-sm']">
        {{ tab.label }}
        <span v-if="stats[tab.countKey] !== undefined" :class="['px-1.5 py-0.5 rounded-full text-[9px] font-black tabular-nums',
          statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[var(--bg-app)] text-[var(--text-muted)]']">
          {{ stats[tab.countKey] }}
        </span>
      </button>
    </div>

    <!-- Applicant Table -->
    <div v-if="selectedJobId"
      class="flex-1 overflow-hidden flex flex-col min-h-0 bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-sm">

      <!-- Table Header -->
      <div
        class="grid grid-cols-12 px-6 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)] text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest flex-shrink-0">
        <div class="col-span-4">Candidate</div>
        <div class="col-span-3">Application Code</div>
        <div class="col-span-2 text-center">Initial Status</div>
        <div class="col-span-3 text-right">Actions</div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto custom-scrollbar divide-y divide-[var(--border-main)]">

        <!-- Rows -->
        <div v-for="app in filtered" :key="app._id"
          class="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-[var(--bg-app)] transition-colors cursor-default">

          <div class="col-span-4 flex items-center gap-3">
            <div
              class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] border border-[var(--border-main)] flex items-center justify-center text-xs font-black text-[var(--color-primary)] overflow-hidden flex-shrink-0">
              <img v-if="app.submittedBy?.avatarUrl" :src="app.submittedBy.avatarUrl"
                class="w-full h-full object-cover" />
              <span v-else>{{ fullName(app).charAt(0) }}</span>
            </div>
            <div class="min-w-0">
              <p class="text-sm font-bold text-[var(--text-main)] truncate uppercase">{{ fullName(app) }}</p>
              <p class="text-[10px] text-[var(--text-muted)] truncate lowercase">{{ app.submittedBy?.email }}</p>
            </div>
          </div>

          <div class="col-span-3">
            <p class="font-mono text-[11px] text-[var(--text-muted)] tracking-tighter">{{ app.applicationCode }}</p>
          </div>

          <div class="col-span-2 flex justify-center">
            <div v-if="app.isVerified"
              :class="['w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm', app.isQualified ? 'bg-emerald-500' : 'bg-red-400']"
              :title="app.isQualified ? 'Qualified' : 'Disqualified'">
            </div>
            <div v-else class="w-2.5 h-2.5 rounded-full bg-amber-400 flex-shrink-0 shadow-sm" title="Pending Review">
            </div>
          </div>

          <div class="col-span-3 text-right">
            <button @click="openReview(app)"
              :class="['h-8 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5',
                app.isVerified
                  ? 'bg-[var(--bg-app)] border border-[var(--border-main)] text-[var(--text-muted)] hover:border-[var(--color-primary-ring)] hover:text-[var(--text-main)]'
                  : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-md shadow-[var(--color-primary)]/10']">
              <i :class="['pi', app.isVerified ? 'pi-eye' : 'pi-shield']" class="text-[10px]"></i>
              {{ app.isVerified ? 'View Audit' : 'Audit Record' }}
            </button>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="!loading && filtered.length === 0"
          class="flex flex-col items-center justify-center py-16 gap-3 text-[var(--text-muted)]">
          <i class="pi pi-inbox text-3xl text-[var(--text-faint)]"></i>
          <p class="text-sm font-bold text-[var(--text-sub)] uppercase tracking-widest">No applicants found</p>
        </div>
      </div>
    </div>

    <!-- Empty: no job selected -->
    <div v-else class="flex-1 flex flex-col items-center justify-center text-center gap-3">
      <div
        class="w-16 h-16 rounded-3xl bg-[var(--surface)] border border-[var(--border-main)] flex items-center justify-center shadow-sm animate-bounce-subtle">
        <i class="pi pi-briefcase text-2xl text-[var(--color-primary)]/40"></i>
      </div>
      <h3 class="text-base font-black text-[var(--text-main)] uppercase tracking-tight">Select a Vacancy to Begin</h3>
      <p class="text-sm text-[var(--text-muted)] max-w-xs leading-relaxed font-medium">Use the "Vacancy Picker" to
        select a
        recruitment post.</p>
      <AppButton variant="primary" size="sm" class="mt-4" @click="showJobPicker = true">
        <i class="pi pi-search mr-2"></i> Find Vacancy
      </AppButton>
    </div>

    <!-- ── JOB PICKER MODAL ─────────────────────────────────────────────────── -->
    <AppModal v-model="showJobPicker" title="Select Recruitment Vacancy" icon="pi-search" width="max-w-2xl">
      <div class="p-1 space-y-4">
        <div class="relative">
          <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"></i>
          <input v-model="jobPickerSearch" placeholder="Filter by position, code, or station..."
            class="w-full h-12 pl-11 pr-4 bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] outline-none transition-all font-bold text-sm uppercase tracking-tight" />
        </div>

        <div class="max-h-[450px] overflow-y-auto pr-1 space-y-2 custom-scrollbar">
          <button v-for="job in filteredJobs" :key="job._id" @click="selectJob(job._id)"
            class="w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between gap-4 group"
            :class="selectedJobId === job._id
              ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30 shadow-md'
              : 'border-[var(--bg-app)] bg-[var(--bg-app)] hover:border-[var(--border-main)] hover:bg-[var(--surface)] hover:shadow-sm'">

            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1.5">
                <span
                  class="text-[9px] font-black px-1.5 py-0.5 rounded bg-[var(--color-primary-light)] text-[var(--color-primary)] uppercase tracking-widest border border-[var(--color-primary)]/10">{{
                    job.hiringTrack }}</span>
                <span class="text-[10px] text-[var(--text-faint)] font-bold uppercase tracking-tighter">{{
                  formatDate(job.createdAt) }}</span>
              </div>
              <h4
                class="text-sm font-black text-[var(--text-main)] truncate uppercase group-hover:text-[var(--color-primary)] transition-colors">
                {{ job.positionTitle }}</h4>
              <p class="text-[10px] text-[var(--text-muted)] font-mono mt-1 uppercase">{{ job.positionCode }} &bull; {{
                job.placeOfAssignment }}</p>
            </div>

            <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
              <div
                class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] shadow-xs">
                <i class="pi pi-users text-[10px] text-[var(--color-primary)]"></i>
                <span class="text-[10px] font-black text-[var(--text-main)] tabular-nums">
                  {{ job.applications?.length || 0 }}
                </span>
              </div>
              <AppBadge :variant="job.status" size="xs" class="uppercase font-black tracking-widest">{{ job.status }}
              </AppBadge>
            </div>
          </button>
        </div>
      </div>
    </AppModal>

    <!-- ── FULL-SCREEN AUDIT MODAL (DE-REFACTORED FROM HUB) ───────────────────── -->
    <Teleport to="body">
      <div v-if="showAuditModal && selected"
        class="fixed inset-0 z-50 flex flex-col bg-[var(--bg-app)] animate-fade-in">

        <header
          class="bg-[var(--surface)] border-b border-[var(--border-main)] px-6 py-3.5 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div class="flex items-center gap-4">
            <div
              class="w-9 h-9 rounded-xl bg-[var(--color-primary-light)] flex items-center justify-center text-[var(--color-primary)] font-black text-sm border border-[var(--color-primary)]/10 shadow-sm">
              {{ fullName(selected).charAt(0) }}
            </div>
            <div>
              <h2 class="text-sm font-black text-[var(--text-main)] uppercase tracking-tight">{{ fullName(selected) }}
              </h2>
              <p class="text-[10px] font-mono text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">{{
                selected.applicationCode }}</p>
            </div>
          </div>
          <button @click="closeAudit"
            class="w-9 h-9 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-all">
            <i class="pi pi-times text-sm"></i>
          </button>
        </header>

        <div class="flex-1 flex overflow-hidden">
          <!-- PDS Pane -->
          <div class="flex-1 flex flex-col overflow-hidden border-r border-[var(--border-main)]">
            <div
              class="bg-[var(--surface)] border-b border-[var(--border-main)] px-5 py-3 flex items-center justify-between">
              <div class="flex gap-1 overflow-x-auto no-scrollbar">
                <button v-for="tab in pdsTabs" :key="tab.id" @click="activePdsTab = tab.id"
                  :class="['h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 border',
                    activePdsTab === tab.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-md' : 'bg-[var(--bg-app)] text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]']">
                  <i :class="['pi text-[10px]', tab.icon]"></i>{{ tab.label }}
                </button>
              </div>
              <button @click="showPreview = !showPreview"
                class="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest border bg-[var(--bg-app)] text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)]">
                <i :class="['pi', showPreview ? 'pi-eye-slash' : 'pi-file-pdf']" class="mr-1.5"></i>{{ showPreview ?
                  'Hide
                Files' : 'View Files' }}
              </button>
            </div>

            <div class="flex-1 flex overflow-hidden bg-white">
              <div
                :class="['overflow-y-auto custom-scrollbar p-10 transition-all duration-500', showPreview ? 'w-1/2' : 'w-full']">
                <!-- Content... (Personal info grid etc) -->
                <div class="space-y-10 max-w-3xl mx-auto">
                  <section v-if="activePdsTab === 'personal'">
                    <div class="flex items-center gap-3 mb-8 border-b border-[var(--border-main)] pb-4">
                      <div class="w-1.5 h-6 bg-[var(--color-primary)] rounded-full"></div>
                      <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.2em]">Personal
                        Information</h3>
                    </div>
                    <div class="grid grid-cols-2 gap-x-12 gap-y-8">
                      <div
                        v-for="[l, v] in [['First Name', selected.applicantData.personalInfo.firstName], ['Last Name', selected.applicantData.personalInfo.lastName], ['Birth Date', formatDate(selected.applicantData.personalInfo.birthDate)]]"
                        :key="l">
                        <p class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest opacity-60">
                          {{ l
                          }}</p>
                        <p class="text-sm font-black text-[var(--text-main)] mt-1.5 uppercase">{{ v || '—' }}</p>
                      </div>
                    </div>
                  </section>
                  <section v-else
                    class="py-24 text-center text-[var(--text-faint)] italic uppercase tracking-widest text-[10px]">
                    Accessing specialized records...</section>
                </div>
              </div>
              <div v-if="showPreview" class="w-1/2 border-l-4 border-[var(--border-main)] bg-[#2c2c2c] flex flex-col">
                <div v-if="selected?.attachments?.length" class="p-3 bg-black/20 flex gap-2 overflow-x-auto">
                  <button v-for="file in selected.attachments" :key="file._id" @click="selectedDocUrl = file.fileUrl"
                    :class="[selectedDocUrl === file.fileUrl ? 'bg-[var(--color-primary)] text-white' : 'bg-white/10 text-white/60']"
                    class="px-4 py-2 rounded-lg text-[9px] font-black uppercase whitespace-nowrap">{{ file.type
                    }}</button>
                </div>
                <iframe v-if="selectedDocUrl" :src="selectedDocUrl" class="w-full h-full border-none"></iframe>
              </div>
            </div>
          </div>

          <!-- Sidebar Audit -->
          <aside
            class="w-96 flex flex-col bg-[var(--surface)] border-l border-[var(--border-main)] overflow-y-auto custom-scrollbar shadow-2xl">
            <div class="p-8 border-b border-[var(--border-main)] bg-[var(--bg-app)]/30">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-[10px] font-black text-[var(--text-main)] uppercase tracking-[0.15em]">Verification
                  Audit
                </h3>
                <span class="text-xs font-black tabular-nums">{{ checksCompleted }} / 5</span>
              </div>
              <div class="h-2.5 bg-[var(--border-main)] rounded-full overflow-hidden shadow-inner">
                <div class="h-full rounded-full transition-all duration-700 bg-[var(--color-primary)]"
                  :style="{ width: `${(checksCompleted / 5) * 100}%` }"></div>
              </div>
            </div>

            <div class="flex-1 p-6 space-y-3">
              <div v-for="key in ['education', 'eligibility', 'experience', 'training', 'performance']" :key="key"
                class="p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]/50 group transition-all">
                <div class="flex items-start gap-4">
                  <button @click="checklist[key].checked = !checklist[key].checked"
                    :class="['w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all', checklist[key].checked ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-[var(--border-main)] text-transparent']"><i
                      class="pi pi-check text-[10px] font-black"></i></button>
                  <div class="flex-1">
                    <p class="text-[10px] font-black uppercase tracking-widest capitalize"
                      :class="checklist[key].checked ? 'text-emerald-700' : 'text-[var(--text-sub)]'">{{ key }} Verified
                    </p>
                    <input v-model="checklist[key].note" placeholder="Audit note..."
                      class="w-full mt-1.5 text-[10px] bg-transparent border-none p-0 italic focus:ring-0" />
                  </div>
                </div>
              </div>
            </div>

            <div class="p-6 bg-[var(--bg-app)]/50 border-t border-[var(--border-main)] space-y-5">
              <div class="grid grid-cols-2 gap-4">
                <button @click="verifyQualified = true"
                  :class="['h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all', verifyQualified ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-white border-[var(--border-main)] text-[var(--text-faint)]']"><i
                    class="pi pi-check-circle text-xl"></i><span
                    class="text-[9px] font-black uppercase">Qualified</span></button>
                <button @click="verifyQualified = false"
                  :class="['h-16 rounded-2xl border-2 flex flex-col items-center justify-center gap-2 transition-all', !verifyQualified ? 'bg-red-500 border-red-500 text-white shadow-lg' : 'bg-white border-[var(--border-main)] text-[var(--text-faint)]']"><i
                    class="pi pi-times-circle text-xl"></i><span
                    class="text-[9px] font-black uppercase">Disqualify</span></button>
              </div>
              <textarea v-if="!verifyQualified" v-model="verifyReason" placeholder="State rejection grounds..."
                class="w-full h-24 p-4 bg-white border border-[var(--border-main)] rounded-2xl text-[11px] font-medium outline-none resize-none focus:border-red-300"></textarea>
              <AppButton variant="primary" block size="lg" :loading="saving"
                :disabled="verifyQualified && checksCompleted < 5" @click="submitVerification"
                class="h-14 font-black uppercase tracking-widest text-[10px] shadow-xl">{{ verifyQualified ? 'Certify as
                Qualified' : 'Confirm Rejection' }}</AppButton>
            </div>
          </aside>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--border-main);
  border-radius: 10px;
}

.animate-bounce-subtle {
  animation: bounce-subtle 3s infinite;
}

@keyframes bounce-subtle {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-8px);
  }
}
</style>
