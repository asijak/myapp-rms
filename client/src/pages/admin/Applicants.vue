<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import apiClient from '@/api/axios'

// ── Data ──────────────────────────────────────────────────────────────────
const jobs         = ref([])
const applications = ref([])
const loading      = ref(false)
const saving       = ref(false)
const selectedJobId = ref('')
const searchQuery  = ref('')
const filterStatus = ref('')

// Rubric weights keyed by category
const rubricWeights = ref({})

const loadRubrics = async () => {
  try {
    const { data } = await apiClient.get('/v1/rubrics')
    for (const r of (data.data || [])) {
      rubricWeights.value[r.category] = r.weights || {}
    }
  } catch { /* non-critical */ }
}

// Max points for active application's hiring track
const currentRubric = computed(() => {
  const job = applications.value.find(a => a._id === selected.value?._id)
  const track = job?.submittedTo?.hiringTrack || selected.value?.submittedTo?.hiringTrack
  return rubricWeights.value[track] || null
})

// Modal
const showModal  = ref(false)
const modalTab   = ref('info')
const selected   = ref(null)

const modalTabs = [
  { id: 'info',   label: 'Applicant Info', icon: 'pi-user'         },
  { id: 'verify', label: 'Verification',   icon: 'pi-check-square' },
]

// Verification checklist form
const checklist = reactive({
  education:   { checked: false, note: '' },
  training:    { checked: false, note: '' },
  experience:  { checked: false, note: '' },
  eligibility: { checked: false, note: '' },
  performance: { checked: false, note: '' },
})
const verifyQualified = ref(true)
const verifyReason    = ref('')
const verifySubmitting = ref(false)

const checklistItems = [
  { key: 'education',   label: 'Education',               icon: 'pi-graduation-cap' },
  { key: 'eligibility', label: 'Eligibility',             icon: 'pi-verified'       },
  { key: 'training',    label: 'Training & Seminars',     icon: 'pi-star'           },
  { key: 'experience',  label: 'Work Experience',         icon: 'pi-briefcase'      },
  { key: 'performance', label: 'Performance Rating',      icon: 'pi-chart-bar'      },
]

const allChecked = computed(() => checklistItems.every(item => checklist[item.key].checked))

const submitVerification = async () => {
  if (!selected.value) return
  verifySubmitting.value = true
  try {
    const payload = {
      verificationChecklist: {
        education:   { checked: checklist.education.checked,   note: checklist.education.note   },
        training:    { checked: checklist.training.checked,    note: checklist.training.note    },
        experience:  { checked: checklist.experience.checked,  note: checklist.experience.note  },
        eligibility: { checked: checklist.eligibility.checked, note: checklist.eligibility.note },
        performance: { checked: checklist.performance.checked, note: checklist.performance.note },
      },
      isQualified:            verifyQualified.value,
      disqualificationReason: verifyQualified.value ? '' : verifyReason.value,
      isVerified:             true,
    }
    const { data } = await apiClient.patch(`/v1/applications/${selected.value._id}/status`, payload)
    const idx = applications.value.findIndex(a => a._id === selected.value._id)
    if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...data.data }
    selected.value = { ...selected.value, ...data.data }
  } catch { /* handled silently */ }
  finally { verifySubmitting.value = false }
}

// HR rating form
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

// Status form
const statusForm = reactive({
  status:                 '',
  isQualified:            true,
  disqualificationReason: '',
  isVerified:             false,
})

// ── Lookups ───────────────────────────────────────────────────────────────
const statusConfig = {
  applied:                { label: 'Applied',        cls: 'bg-blue-50 text-blue-700 border-blue-200',       icon: 'pi-clock'        },
  verifying:              { label: 'Verifying',      cls: 'bg-amber-50 text-amber-700 border-amber-200',    icon: 'pi-search'       },
  comparative_assessment: { label: 'For Assessment', cls: 'bg-purple-50 text-purple-700 border-purple-200', icon: 'pi-chart-bar'    },
  ranked:                 { label: 'Ranked',         cls: 'bg-green-50 text-green-700 border-green-200',    icon: 'pi-check-circle' },
  disqualified:           { label: 'Disqualified',   cls: 'bg-red-50 text-red-600 border-red-200',          icon: 'pi-times-circle' },
}

const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
const formatPeso = (n) => n != null ? `₱${Number(n).toLocaleString()}` : '—'

// ── Computed ──────────────────────────────────────────────────────────────
const filtered = computed(() => {
  let list = [...applications.value]
  if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(a =>
      a.submittedBy?.username?.toLowerCase().includes(q) ||
      a.submittedBy?.email?.toLowerCase().includes(q) ||
      a.applicantData?.personalInfo?.firstName?.toLowerCase().includes(q) ||
      a.applicantData?.personalInfo?.lastName?.toLowerCase().includes(q) ||
      a.applicationCode?.toLowerCase().includes(q)
    )
  }
  return list
})

const totalScore = computed(() => {
  const r = rating
  return (
    (Number(r.educationPoints) || 0) +
    (Number(r.trainingPoints) || 0) +
    (Number(r.experiencePoints) || 0) +
    (Number(r.performancePoints) || 0) +
    (Number(r.outstandingAccomplishments) || 0) +
    (Number(r.appEducationPoints) || 0) +
    (Number(r.appLearningPoints) || 0) +
    (Number(r.potentialPoints?.writtenTest) || 0) +
    (Number(r.potentialPoints?.bei) || 0) +
    (Number(r.potentialPoints?.workSample) || 0)
  )
})

// ── Load jobs + rubrics ───────────────────────────────────────────────────
onMounted(async () => {
  try {
    const { data } = await apiClient.get('/v1/jobs')
    jobs.value = data.data || []
  } catch { /* silent */ }
  loadRubrics()
})

// ── Load applicants for selected job ─────────────────────────────────────
const loadApplications = async () => {
  if (!selectedJobId.value) return
  loading.value = true
  applications.value = []
  try {
    const { data } = await apiClient.get(`/v1/applications/job/${selectedJobId.value}`)
    applications.value = data.data || []
  } catch { applications.value = [] }
  finally { loading.value = false }
}

// ── Open applicant detail modal ───────────────────────────────────────────
const openDetail = async (app) => {
  const job = jobs.value.find(j => j._id === selectedJobId.value)
  selected.value = { ...app, submittedTo: job || app.submittedTo }
  modalTab.value = 'info'
  showModal.value = true

  const r = app.hrRating || {}
  rating.educationPoints           = r.educationPoints           ?? 0
  rating.trainingPoints            = r.trainingPoints            ?? 0
  rating.experiencePoints          = r.experiencePoints          ?? 0
  rating.performancePoints         = r.performancePoints         ?? 0
  rating.outstandingAccomplishments = r.outstandingAccomplishments ?? 0
  rating.appEducationPoints        = r.appEducationPoints        ?? 0
  rating.appLearningPoints         = r.appLearningPoints         ?? 0
  rating.potentialPoints.writtenTest = r.potentialPoints?.writtenTest ?? 0
  rating.potentialPoints.bei         = r.potentialPoints?.bei         ?? 0
  rating.potentialPoints.workSample  = r.potentialPoints?.workSample  ?? 0
  rating.remarks                   = r.remarks || ''

  statusForm.status                 = app.status || 'applied'
  statusForm.isQualified            = app.isQualified ?? true
  statusForm.disqualificationReason = app.disqualificationReason || ''
  statusForm.isVerified             = app.isVerified || false

  const vc = app.verificationChecklist || {}
  for (const item of checklistItems) {
    checklist[item.key].checked = vc[item.key]?.checked || false
    checklist[item.key].note    = vc[item.key]?.note    || ''
  }
  verifyQualified.value = app.isQualified ?? true
  verifyReason.value    = app.disqualificationReason || ''
}

// ── Save HR rating ────────────────────────────────────────────────────────
const saveRating = async () => {
  if (!selected.value) return
  saving.value = true
  try {
    const { data } = await apiClient.patch(`/v1/applications/${selected.value._id}/rating`, {
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
    })
    const idx = applications.value.findIndex(a => a._id === selected.value._id)
    if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...data.data }
    selected.value = { ...selected.value, ...data.data }
  } catch { /* silent */ }
  finally { saving.value = false }
}

// ── Save status ───────────────────────────────────────────────────────────
const saveStatus = async () => {
  if (!selected.value) return
  saving.value = true
  try {
    const payload = {
      status:    statusForm.status,
      isQualified: statusForm.isQualified,
      disqualificationReason: statusForm.isQualified ? '' : statusForm.disqualificationReason,
      isVerified: statusForm.isVerified,
    }
    const { data } = await apiClient.patch(`/v1/applications/${selected.value._id}/status`, payload)
    const idx = applications.value.findIndex(a => a._id === selected.value._id)
    if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...data.data }
    selected.value = { ...selected.value, ...data.data }
  } catch { /* silent */ }
  finally { saving.value = false }
}

// ── Helpers ───────────────────────────────────────────────────────────────
const applicantFullName = (app) => {
  const p = app.applicantData?.personalInfo
  if (!p?.firstName) return app.submittedBy?.username || '—'
  return [p.firstName, p.middleName ? `${p.middleName.charAt(0)}.` : '', p.lastName, p.suffix].filter(Boolean).join(' ')
}

const checkedCount = computed(() => checklistItems.filter(i => checklist[i.key].checked).length)
</script>

<template>
  <div class="flex flex-col gap-6">

    <!-- ── Header ─────────────────────────────────────────────────── -->
    <div>
      <h1 class="text-2xl font-bold text-[var(--text-main)] tracking-tight">Applicants List</h1>
      <p class="text-sm text-[var(--text-muted)] mt-0.5">View, verify, and manage applicants per job vacancy.</p>
    </div>

    <!-- ── Toolbar ────────────────────────────────────────────────── -->
    <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
      <select v-model="selectedJobId" @change="loadApplications"
        class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] flex-1 cursor-pointer">
        <option value="">— Select a Job Vacancy —</option>
        <option v-for="job in jobs" :key="job._id" :value="job._id">
          {{ job.positionTitle }} ({{ job.placeOfAssignment }})
        </option>
      </select>
      <select v-model="filterStatus"
        class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)] min-w-[150px] cursor-pointer">
        <option value="">All Statuses</option>
        <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">{{ cfg.label }}</option>
      </select>
      <div class="relative">
        <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-xs pointer-events-none"></i>
        <input v-model="searchQuery" type="search" placeholder="Search applicant..."
          class="w-full sm:w-52 h-9 pl-8 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/30 focus:border-[var(--color-primary)]" />
      </div>
    </div>

    <!-- ── States ─────────────────────────────────────────────────── -->
    <div v-if="!selectedJobId"
      class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
        <i class="pi pi-briefcase text-2xl text-[var(--text-muted)]"></i>
      </div>
      <div class="text-center">
        <p class="text-sm font-semibold text-[var(--text-main)]">Select a job vacancy</p>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">Choose a vacancy from the dropdown above to view its applicants</p>
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
        <p class="text-sm font-semibold text-[var(--text-main)]">
          {{ searchQuery || filterStatus ? 'No applicants match your filters' : 'No applicants yet' }}
        </p>
        <p class="text-xs text-[var(--text-muted)] mt-0.5">
          {{ searchQuery || filterStatus ? 'Try adjusting your search or status filter' : 'Applicants will appear here once they submit their applications' }}
        </p>
      </div>
    </div>

    <!-- ── Table ──────────────────────────────────────────────────── -->
    <div v-else class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
      <div class="px-5 py-3.5 border-b border-[var(--border-main)] flex items-center justify-between">
        <p class="text-sm font-semibold text-[var(--text-main)]">
          {{ filtered.length }} applicant{{ filtered.length !== 1 ? 's' : '' }}
        </p>
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
              <th class="px-5 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Verified</th>
              <th class="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Applied</th>
              <th class="px-5 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--border-main)]">
            <tr v-for="app in filtered" :key="app._id"
              class="hover:bg-[var(--bg-app)] transition-colors cursor-pointer group"
              @click="openDetail(app)">
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-3">
                  <img :src="app.submittedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(app.submittedBy?.username || 'A')}&background=1d4ed8&color=fff&bold=true`"
                    class="w-8 h-8 rounded-full object-cover border border-[var(--border-main)] flex-shrink-0" />
                  <div class="min-w-0">
                    <p class="font-semibold text-[var(--text-main)] truncate">{{ applicantFullName(app) }}</p>
                    <p class="text-xs text-[var(--text-muted)] truncate">{{ app.submittedBy?.email }}</p>
                  </div>
                </div>
              </td>
              <td class="px-5 py-3.5 font-mono text-xs text-[var(--text-muted)]">{{ app.applicationCode || '—' }}</td>
              <td class="px-5 py-3.5">
                <span :class="['inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-[3px] rounded-full border',
                  statusConfig[app.status]?.cls || 'bg-slate-100 text-slate-500 border-slate-200']">
                  <i :class="['pi text-[9px]', statusConfig[app.status]?.icon || 'pi-circle']"></i>
                  {{ statusConfig[app.status]?.label || app.status }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <span :class="['text-sm font-bold tabular-nums', app.totalScore > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--text-faint)]']">
                  {{ app.totalScore > 0 ? app.totalScore.toFixed(2) : '—' }}
                </span>
              </td>
              <td class="px-5 py-3.5 text-center">
                <span v-if="app.isVerified"
                  class="inline-flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-[2px] rounded-full">
                  <i class="pi pi-check text-[9px]"></i> Yes
                </span>
                <span v-else class="text-[10px] text-[var(--text-faint)]">Pending</span>
              </td>
              <td class="px-5 py-3.5 text-xs text-[var(--text-muted)]">{{ formatDate(app.createdAt) }}</td>
              <td class="px-5 py-3.5">
                <i class="pi pi-angle-right text-sm text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ── Detail Modal ───────────────────────────────────────────── -->
    <Teleport to="body">
    <Transition name="fade">
    <div v-if="showModal && selected"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      @click.self="showModal = false">

      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]">

        <!-- Modal header -->
        <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center gap-4 flex-shrink-0">
          <img :src="selected.submittedBy?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(applicantFullName(selected))}&background=1d4ed8&color=fff&bold=true`"
            class="w-10 h-10 rounded-full object-cover border border-[var(--border-main)] flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-bold text-[var(--text-main)] truncate">{{ applicantFullName(selected) }}</h2>
            <p class="text-[10px] text-[var(--text-muted)] mt-0.5 font-mono">{{ selected.applicationCode }}</p>
          </div>
          <div class="flex items-center gap-2 flex-shrink-0">
            <span :class="['inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-[3px] rounded-full border',
              statusConfig[selected.status]?.cls || 'bg-slate-100 text-slate-500 border-slate-200']">
              {{ statusConfig[selected.status]?.label || selected.status }}
            </span>
            <button @click="showModal = false"
              class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
              <i class="pi pi-times text-sm"></i>
            </button>
          </div>
        </div>

        <!-- Modal tabs -->
        <div class="flex border-b border-[var(--border-main)] flex-shrink-0">
          <button v-for="tab in modalTabs" :key="tab.id" @click="modalTab = tab.id"
            :class="['flex items-center gap-2 px-5 py-3 text-xs font-semibold border-b-2 transition-colors',
              modalTab === tab.id
                ? 'border-[var(--color-primary)] text-[var(--color-primary)] bg-[var(--color-primary-light)]/30'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-main)]']">
            <i :class="['pi text-[10px]', tab.icon]"></i>{{ tab.label }}
          </button>
        </div>

        <!-- Modal body -->
        <div class="overflow-y-auto flex-1 custom-scrollbar">

          <!-- ── TAB: Applicant Info ─────────────────────────────── -->
          <div v-if="modalTab === 'info'" class="p-6 flex flex-col gap-6">

            <!-- Personal info -->
            <div>
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Personal Information</p>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div v-for="[label, val] in [
                  ['First Name',    selected.applicantData?.personalInfo?.firstName],
                  ['Middle Name',   selected.applicantData?.personalInfo?.middleName],
                  ['Last Name',     selected.applicantData?.personalInfo?.lastName],
                  ['Suffix',        selected.applicantData?.personalInfo?.suffix],
                  ['Sex',           selected.applicantData?.personalInfo?.sex],
                  ['Civil Status',  selected.applicantData?.personalInfo?.civilStatus],
                  ['Birth Date',    formatDate(selected.applicantData?.personalInfo?.birthDate)],
                  ['Phone',         selected.applicantData?.personalInfo?.contact?.phone],
                  ['Email',         selected.applicantData?.personalInfo?.contact?.email],
                ]" :key="label"
                  class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)]">
                  <p class="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{{ label }}</p>
                  <p class="text-sm text-[var(--text-main)] truncate font-medium">{{ val || '—' }}</p>
                </div>
              </div>
            </div>

            <!-- Education -->
            <div v-if="selected.applicantData?.education?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Education</p>
              <div class="flex flex-col gap-2">
                <div v-for="(edu, i) in selected.applicantData.education" :key="i"
                  class="border border-[var(--border-main)] rounded-xl p-3.5">
                  <p class="text-sm font-semibold text-[var(--text-main)]">{{ edu.degree || edu.level || '—' }}</p>
                  <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ edu.school }}{{ edu.yearGraduated ? ` · ${edu.yearGraduated}` : '' }}</p>
                </div>
              </div>
            </div>

            <!-- Eligibility -->
            <div v-if="selected.applicantData?.eligibility?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Eligibility</p>
              <div class="flex flex-col gap-2">
                <div v-for="(el, i) in selected.applicantData.eligibility" :key="i"
                  class="border border-[var(--border-main)] rounded-xl p-3.5 grid grid-cols-2 gap-x-4 gap-y-1">
                  <div class="col-span-2"><p class="text-sm font-semibold text-[var(--text-main)]">{{ el.name || '—' }}</p></div>
                  <div><p class="text-[9px] text-[var(--text-muted)]">Place of Exam</p><p class="text-xs font-medium text-[var(--text-main)]">{{ el.placeOfExam || '—' }}</p></div>
                  <div><p class="text-[9px] text-[var(--text-muted)]">Rating</p><p class="text-xs font-medium text-[var(--text-main)]">{{ el.rating || '—' }}</p></div>
                </div>
              </div>
            </div>

            <!-- Training -->
            <div v-if="selected.applicantData?.training?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Training &amp; Seminars</p>
              <div class="flex flex-col gap-2">
                <div v-for="(tr, i) in selected.applicantData.training" :key="i"
                  class="border border-[var(--border-main)] rounded-xl p-3.5">
                  <p class="text-sm font-semibold text-[var(--text-main)]">{{ tr.title }}</p>
                  <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ tr.provider }}{{ tr.hours ? ` · ${tr.hours}h` : '' }}</p>
                </div>
              </div>
            </div>

            <!-- Experience -->
            <div v-if="selected.applicantData?.experience?.length">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Work Experience</p>
              <div class="flex flex-col gap-2">
                <div v-for="(exp, i) in selected.applicantData.experience" :key="i"
                  class="border border-[var(--border-main)] rounded-xl p-3.5">
                  <div class="flex items-start justify-between gap-2">
                    <div>
                      <p class="text-sm font-semibold text-[var(--text-main)]">{{ exp.position }}</p>
                      <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ exp.company }}{{ exp.months ? ` · ${exp.months} mo.` : '' }}</p>
                    </div>
                    <span v-if="exp.isGovernment"
                      class="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex-shrink-0">
                      Gov't
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Performance Rating -->
            <div v-if="selected.applicantData?.performanceRating?.score">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Performance Rating</p>
              <div class="border border-[var(--border-main)] rounded-xl p-4 flex items-center gap-4">
                <p class="text-3xl font-extrabold text-[var(--color-primary)] tabular-nums">{{ selected.applicantData.performanceRating.score }}</p>
                <div>
                  <p class="text-sm font-semibold text-[var(--text-main)]">{{ selected.applicantData.performanceRating.adjective }}</p>
                  <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ selected.applicantData.performanceRating.periodCovered }}</p>
                </div>
              </div>
            </div>

            <div v-if="!selected.applicantData?.education?.length && !selected.applicantData?.training?.length && !selected.applicantData?.experience?.length"
              class="text-center py-8 text-[var(--text-muted)]">
              <i class="pi pi-info-circle text-2xl mb-2 block text-slate-300"></i>
              <p class="text-sm">No qualification data submitted yet.</p>
            </div>
          </div>

          <!-- ── TAB: Verification ───────────────────────────────── -->
          <div v-if="modalTab === 'verify'" class="p-6 flex flex-col gap-5">

            <!-- Status banner -->
            <div v-if="selected.isVerified"
              class="flex items-center gap-3 p-3.5 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm">
              <i class="pi pi-verified text-base shrink-0"></i>
              <div>
                <p class="font-semibold">Application verified and locked</p>
                <p class="text-xs opacity-75 mt-0.5">No further changes can be made to the verification.</p>
              </div>
            </div>
            <div v-else
              class="flex items-start gap-3 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 text-sm">
              <i class="pi pi-info-circle text-base shrink-0 mt-0.5"></i>
              <p>Check each area against the applicant's physical documents. Once submitted, the application will be locked for editing.</p>
            </div>

            <!-- Checklist -->
            <div class="flex flex-col gap-2">
              <div v-for="item in checklistItems" :key="item.key"
                class="border rounded-xl overflow-hidden transition-colors"
                :class="checklist[item.key].checked ? 'border-green-200' : 'border-[var(--border-main)]'">
                <div
                  :class="['flex items-center gap-3 px-4 py-3 transition-colors',
                    !selected.isVerified ? 'cursor-pointer' : '',
                    checklist[item.key].checked ? 'bg-green-50' : 'hover:bg-[var(--bg-app)]']"
                  @click="!selected.isVerified && (checklist[item.key].checked = !checklist[item.key].checked)">
                  <!-- Custom checkbox -->
                  <div :class="['w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 transition-all',
                    checklist[item.key].checked ? 'bg-green-500 border-green-500' : 'border-[var(--border-main)] bg-[var(--surface)]']">
                    <i v-if="checklist[item.key].checked" class="pi pi-check text-white text-[10px]"></i>
                  </div>
                  <i :class="['pi text-sm flex-shrink-0', item.icon,
                    checklist[item.key].checked ? 'text-green-600' : 'text-[var(--text-muted)]']"></i>
                  <span :class="['text-sm font-semibold flex-1',
                    checklist[item.key].checked ? 'text-green-700' : 'text-[var(--text-main)]']">
                    {{ item.label }}
                  </span>
                  <span :class="['text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0',
                    checklist[item.key].checked
                      ? 'text-green-600 bg-green-100 border-green-200'
                      : 'text-[var(--text-faint)] bg-[var(--bg-app)] border-[var(--border-main)]']">
                    {{ checklist[item.key].checked ? 'Verified' : 'Pending' }}
                  </span>
                </div>
                <!-- Note -->
                <div v-if="checklist[item.key].checked && !selected.isVerified"
                  class="px-4 pb-3 pt-1 border-t border-green-100 bg-green-50/50">
                  <input v-model="checklist[item.key].note" type="text"
                    placeholder="Optional note (e.g. Original TOR submitted)..."
                    class="w-full h-8 px-3 text-xs rounded-lg bg-white border border-green-200 focus:outline-none focus:ring-1 focus:ring-green-300 text-[var(--text-main)]" />
                </div>
                <div v-if="selected.isVerified && checklist[item.key].note"
                  class="px-4 pb-3 pt-1 border-t border-[var(--border-main)] bg-[var(--bg-app)]">
                  <p class="text-xs text-[var(--text-muted)] italic">{{ checklist[item.key].note }}</p>
                </div>
              </div>
            </div>

            <!-- Progress bar -->
            <div class="flex items-center gap-3">
              <div class="flex-1 h-1.5 bg-[var(--border-main)] rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full transition-all duration-300"
                  :style="{ width: `${(checkedCount / checklistItems.length) * 100}%` }"></div>
              </div>
              <span class="text-xs font-semibold text-[var(--text-muted)] flex-shrink-0 tabular-nums">
                {{ checkedCount }}/{{ checklistItems.length }} verified
              </span>
            </div>

            <!-- Qualification determination -->
            <div v-if="!selected.isVerified">
              <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Qualification Determination</p>
              <div class="grid grid-cols-2 gap-3 mb-3">
                <button @click="verifyQualified = true"
                  :class="['h-10 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    verifyQualified
                      ? 'bg-green-500 border-green-500 text-white shadow-sm'
                      : 'border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)]']">
                  <i class="pi pi-check-circle text-sm"></i> Qualified
                </button>
                <button @click="verifyQualified = false"
                  :class="['h-10 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2',
                    !verifyQualified
                      ? 'bg-red-500 border-red-500 text-white shadow-sm'
                      : 'border-[var(--border-main)] text-[var(--text-muted)] hover:bg-[var(--bg-app)]']">
                  <i class="pi pi-times-circle text-sm"></i> Not Qualified
                </button>
              </div>
              <div v-if="!verifyQualified" class="flex flex-col gap-1.5">
                <label class="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">Reason for Disqualification <span class="text-red-500">*</span></label>
                <textarea v-model="verifyReason" rows="3" class="input resize-none"
                  placeholder="State the specific reason (e.g. Does not meet education requirement)..."></textarea>
              </div>
            </div>
          </div>

        </div>

        <!-- Modal footer -->
        <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3 flex-shrink-0">
          <button @click="showModal = false" class="btn-secondary h-9 px-4 text-sm">Close</button>
          <button v-if="modalTab === 'verify' && !selected.isVerified"
            @click="submitVerification"
            :disabled="verifySubmitting || (!verifyQualified && !verifyReason.trim())"
            class="btn-primary h-9 px-5 text-sm disabled:opacity-50 flex items-center gap-2">
            <i v-if="verifySubmitting" class="pi pi-spin pi-spinner text-xs"></i>
            <i v-else class="pi pi-lock text-xs"></i>
            {{ verifySubmitting ? 'Submitting...' : 'Submit Verification' }}
          </button>
        </div>
      </div>
    </div>
    </Transition>
    </Teleport>
  </div>
</template>
