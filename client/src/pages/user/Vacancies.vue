<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useJobs } from '@/composables/useJobs'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/ApplicantCoverPagePdf.vue'

const router    = useRouter()
const authStore = useAuthStore()

const { jobs, loading, error, fetchJobs } = useJobs()
const searchQuery = ref('')
const filterTrack = ref('')
const filterType  = ref('')

// ── Modal state ─────────────────────────────────────────────────────
const selectedJob     = ref(null)
const modalStep       = ref('detail')   // 'detail' | 'update_prompt' | 'review' | 'success'
const showModal       = ref(false)
const submittedApp    = ref(null)   // holds the API response after successful apply
const showCoverPdf    = ref(false)

// Review step
const profile       = ref(null)
const loadingProfile = ref(false)
const applying      = ref(false)
const applyError    = ref('')

// Curated selections (indices the user keeps checked)
const selEdu  = ref([])
const selElig = ref([])
const selTrn  = ref([])
const selExp  = ref([])
const perfRating = ref({ score: '', adjective: '', periodCovered: '' })

onMounted(() => fetchJobs({ status: 'published' }))
onActivated(() => fetchJobs({ status: 'published' }))
const handleSearch = () => fetchJobs({ status: 'published', search: searchQuery.value })

// ── Open job detail ──────────────────────────────────────────────────
const openJob = (job) => {
  selectedJob.value  = job
  modalStep.value    = 'detail'
  applyError.value   = ''
  showModal.value    = true
}

const closeModal = () => {
  showModal.value   = false
  applyError.value  = ''
  profile.value     = null
}

// ── Start apply — show update profile prompt ─────────────────────────
const startApply = () => {
  if (!authStore.isAuthenticated) {
    router.push({ path: '/auth/login', query: { redirect: '/vacancies' } })
    return
  }
  applyError.value = ''
  modalStep.value  = 'update_prompt'
}

// ── Continue apply — load profile then switch to review ──────────────
const continueApply = async () => {
  loadingProfile.value = true
  applyError.value     = ''
  try {
    const { data } = await apiClient.get('/v1/profile/me')
    profile.value = data.data || null

    // Pre-select all items by default
    const p = profile.value
    selEdu.value  = p?.education?.map((_, i) => i)   || []
    selElig.value = p?.eligibility?.map((_, i) => i)  || []
    selTrn.value  = p?.training?.map((_, i) => i)     || []
    selExp.value  = p?.experience?.map((_, i) => i)   || []
    perfRating.value = {
      score:         p?.performanceRating?.score         ?? '',
      adjective:     p?.performanceRating?.adjective     ?? '',
      periodCovered: p?.performanceRating?.periodCovered ?? '',
    }
    modalStep.value = 'review'
  } catch {
    applyError.value = 'Failed to load your profile. Please complete your profile first.'
  } finally {
    loadingProfile.value = false
  }
}

// ── Toggle helper ───────────────────────────────────────────────────
const toggle = (arr, idx) => {
  const i = arr.indexOf(idx)
  if (i === -1) arr.push(idx)
  else arr.splice(i, 1)
}

// ── Submit application ──────────────────────────────────────────────
const submitApplication = async () => {
  applying.value   = true
  applyError.value = ''

  const p = profile.value
  const personalInfo = p ? {
    firstName: p.name?.firstName, middleName: p.name?.middleName,
    lastName:  p.name?.lastName,  suffix:     p.name?.suffix,
    sex: p.sex, birthDate: p.birthDate, civilStatus: p.civilStatus,
    contact: p.contact, address: p.address,
  } : {}

  const applicantData = {
    personalInfo,
    education:         p?.education?.filter((_, i) => selEdu.value.includes(i))   || [],
    eligibility:       p?.eligibility?.filter((_, i) => selElig.value.includes(i)) || [],
    training:          p?.training?.filter((_, i) => selTrn.value.includes(i))     || [],
    experience:        p?.experience?.filter((_, i) => selExp.value.includes(i))   || [],
    performanceRating: {
      score:         perfRating.value.score         ? Number(perfRating.value.score) : null,
      adjective:     perfRating.value.adjective     || '',
      periodCovered: perfRating.value.periodCovered || '',
    },
  }

  try {
    const { data } = await apiClient.post('/v1/applications/apply', {
      jobId: selectedJob.value._id,
      category: selectedJob.value.hiringTrack,
      applicantData,
    })
    // Merge job info into response so print utility can access it
    submittedApp.value = { ...data.data, job: selectedJob.value }
    modalStep.value = 'success'
  } catch (err) {
    applyError.value = err.response?.data?.message || 'Failed to submit application.'
  } finally {
    applying.value = false
  }
}

// ── Computed ────────────────────────────────────────────────────────
const filteredJobs = computed(() => {
  let list = [...jobs.value]
  if (filterTrack.value) list = list.filter(j => j.hiringTrack === filterTrack.value)
  if (filterType.value)  list = list.filter(j => j.employmentType === filterType.value)
  return list
})


const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const trackClass  = {
  teaching:         'bg-blue-100 text-blue-700 border-blue-200',
  teaching_related: 'bg-purple-100 text-purple-700 border-purple-200',
  non_teaching:     'bg-orange-100 text-orange-700 border-orange-200',
}
const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' }) : null
const isExpired  = (d) => d && new Date(d) < new Date()
const fmtShort   = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
</script>

<template>
  <div class="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans px-4 py-10">
    <div class="max-w-5xl mx-auto flex flex-col gap-8">

      <!-- Header -->
      <div class="text-center">
        <h1 class="text-3xl font-bold text-[var(--text-main)] tracking-tight">Job Vacancies</h1>
        <p class="text-[var(--text-muted)] mt-2">Browse available positions at DepEd GNC.</p>
      </div>

      <!-- Search & Filters -->
      <div class="flex flex-col sm:flex-row gap-3">
        <div class="relative flex-1">
          <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
          <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Search positions..."
            class="w-full h-10 pl-9 pr-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
        </div>
        <select v-model="filterTrack" class="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:outline-none appearance-none cursor-pointer">
          <option value="">All Tracks</option>
          <option value="teaching">Teaching</option>
          <option value="teaching_related">Teaching-Related</option>
          <option value="non_teaching">Non-Teaching</option>
        </select>
        <select v-model="filterType" class="h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:outline-none appearance-none cursor-pointer">
          <option value="">All Types</option>
          <option value="permanent">Permanent</option>
          <option value="contractual">Contractual</option>
          <option value="job order">Job Order</option>
          <option value="casual">Casual</option>
        </select>
      </div>

      <!-- Loading / Error / Empty -->
      <div v-if="loading" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div v-for="i in 4" :key="i" class="h-40 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
      </div>
      <div v-else-if="error" class="text-center py-16 text-[var(--text-muted)]">
        <i class="pi pi-exclamation-circle text-4xl text-slate-300 mb-3 block"></i>
        <p class="text-sm">{{ error }}</p>
      </div>
      <div v-else-if="filteredJobs.length === 0" class="text-center py-16 text-[var(--text-muted)]">
        <i class="pi pi-briefcase text-4xl text-slate-300 mb-3 block"></i>
        <p class="text-sm font-medium">No vacancies found</p>
        <p class="text-xs mt-1">Check back later for new openings.</p>
      </div>

      <!-- Job Cards -->
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button v-for="job in filteredJobs" :key="job._id" @click="openJob(job)"
          class="text-left bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div>
              <p class="font-bold text-[var(--text-main)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">{{ job.positionTitle }}</p>
              <p class="text-xs text-[var(--text-muted)] mt-1">{{ job.positionCode }} · {{ job.placeOfAssignment }}</p>
            </div>
            <span :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0', trackClass[job.hiringTrack] || 'bg-gray-100 text-gray-600 border-gray-200']">
              {{ trackLabel[job.hiringTrack] || job.hiringTrack }}
            </span>
          </div>
          <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
            <span class="flex items-center gap-1"><i class="pi pi-chart-bar text-[10px]"></i> SG-{{ job.salaryGrade }}</span>
            <span class="flex items-center gap-1"><i class="pi pi-money-bill text-[10px]"></i> ₱{{ Number(job.salary).toLocaleString() }}/mo</span>
            <span class="flex items-center gap-1 capitalize"><i class="pi pi-briefcase text-[10px]"></i> {{ job.employmentType }}</span>
            <span class="flex items-center gap-1"><i class="pi pi-users text-[10px]"></i> {{ job.noOfVacancy }} slot{{ job.noOfVacancy !== 1 ? 's' : '' }}</span>
          </div>
          <div v-if="job.deadline" class="mt-3 pt-3 border-t border-[var(--border-main)]">
            <p :class="['text-xs flex items-center gap-1', isExpired(job.deadline) ? 'text-red-500 font-medium' : 'text-[var(--text-muted)]']">
              <i class="pi pi-calendar text-[10px]"></i>
              {{ isExpired(job.deadline) ? 'Deadline passed: ' : 'Apply by: ' }}{{ formatDate(job.deadline) }}
            </p>
          </div>
        </button>
      </div>

      <p v-if="!loading && filteredJobs.length > 0" class="text-center text-xs text-[var(--text-muted)]">
        Showing {{ filteredJobs.length }} open position{{ filteredJobs.length !== 1 ? 's' : '' }}
      </p>
    </div>

    <!-- ── Modal ──────────────────────────────────────────────────────── -->
    <Teleport to="body">
    <div v-if="showModal && selectedJob"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
      @click.self="closeModal">

      <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden animate-zoom-in max-h-[92vh]">

        <!-- ══ STEP 1: Job Detail ══════════════════════════════════════ -->
        <template v-if="modalStep === 'detail'">
          <div class="px-6 py-5 border-b border-[var(--border-main)] flex items-start justify-between gap-4 flex-shrink-0">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full border', trackClass[selectedJob.hiringTrack] || 'bg-gray-100 text-gray-600 border-gray-200']">
                  {{ trackLabel[selectedJob.hiringTrack] }}
                </span>
                <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-green-100 text-green-700 border-green-200 capitalize">{{ selectedJob.employmentType }}</span>
              </div>
              <h2 class="text-lg font-bold text-[var(--text-main)]">{{ selectedJob.positionTitle }}</h2>
              <p class="text-sm text-[var(--text-muted)] mt-0.5">{{ selectedJob.positionCode }} · {{ selectedJob.placeOfAssignment }}</p>
            </div>
            <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0 mt-1">
              <i class="pi pi-times text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto custom-scrollbar flex-1 p-6 flex flex-col gap-6">
            <div class="grid grid-cols-3 gap-3">
              <div class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)] text-center">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Salary Grade</p>
                <p class="text-lg font-bold text-[var(--text-main)]">SG-{{ selectedJob.salaryGrade }}</p>
              </div>
              <div class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)] text-center">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Monthly</p>
                <p class="text-lg font-bold text-[var(--text-main)]">₱{{ Number(selectedJob.salary).toLocaleString() }}</p>
              </div>
              <div class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)] text-center">
                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Slots</p>
                <p class="text-lg font-bold text-[var(--text-main)]">{{ selectedJob.noOfVacancy }}</p>
              </div>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">Description</p>
              <p class="text-sm text-[var(--text-main)] leading-relaxed">{{ selectedJob.description }}</p>
            </div>
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Qualification Standards</p>
              <div class="flex flex-col divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                <div v-for="(val, key) in selectedJob.qualifications" :key="key" class="flex gap-4 px-4 py-3 bg-[var(--bg-app)]">
                  <span class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] w-24 flex-shrink-0 pt-0.5 capitalize">{{ key }}</span>
                  <span class="text-sm text-[var(--text-main)]">{{ val }}</span>
                </div>
              </div>
            </div>
            <div v-if="selectedJob.deadline"
              :class="['flex items-center gap-3 p-4 rounded-xl border', isExpired(selectedJob.deadline) ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700']">
              <i class="pi pi-calendar text-lg flex-shrink-0"></i>
              <div>
                <p class="text-xs font-semibold">{{ isExpired(selectedJob.deadline) ? 'Application Period Closed' : 'Application Deadline' }}</p>
                <p class="text-sm font-bold">{{ formatDate(selectedJob.deadline) }}</p>
              </div>
            </div>
          </div>

          <div v-if="applyError" class="mx-6 mb-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <i class="pi pi-exclamation-circle flex-shrink-0"></i>{{ applyError }}
          </div>

          <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center flex-shrink-0">
            <button @click="closeModal" class="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">Close</button>
            <button @click="startApply" :disabled="loadingProfile"
              class="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
              <i :class="['pi text-xs', loadingProfile ? 'pi-spin pi-spinner' : 'pi-arrow-right']"></i>
              {{ loadingProfile ? 'Loading...' : 'Apply Now' }}
            </button>
          </div>
        </template>

        <!-- ══ STEP 1.5: Update Profile Prompt ═══════════════════════ -->
        <template v-else-if="modalStep === 'update_prompt'">
          <div class="px-6 py-5 border-b border-[var(--border-main)] flex items-start justify-between gap-4 flex-shrink-0">
            <h2 class="text-base font-bold text-[var(--text-main)]">Before You Apply</h2>
            <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0">
              <i class="pi pi-times text-lg"></i>
            </button>
          </div>

          <div class="p-8 flex flex-col items-center gap-6 text-center flex-1">
            <div class="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
              <i class="pi pi-id-card text-[var(--color-primary)] text-2xl"></i>
            </div>
            <div>
              <p class="text-sm font-bold text-[var(--text-main)]">Would you like to update your application profile?</p>
              <p class="text-xs text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                Make sure your education, eligibility, training, and experience are up to date before submitting. A complete profile strengthens your application.
              </p>
            </div>
            <div class="flex gap-3 w-full max-w-xs">
              <router-link to="/user/profile"
                class="flex-1 h-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold hover:bg-[var(--surface)] transition-colors flex items-center justify-center gap-2">
                <i class="pi pi-user-edit text-xs"></i> Update Profile
              </router-link>
              <button @click="continueApply" :disabled="loadingProfile"
                class="flex-1 h-10 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <i :class="['pi text-xs', loadingProfile ? 'pi-spin pi-spinner' : 'pi-arrow-right']"></i>
                {{ loadingProfile ? 'Loading...' : 'Continue' }}
              </button>
            </div>
            <p class="text-xs text-[var(--text-muted)]">
              Clicking "Continue" will proceed directly to applying without updating.
            </p>
          </div>
        </template>

        <!-- ══ STEP 2: Review & Select Data ═══════════════════════════ -->
        <template v-else-if="modalStep === 'review'">
          <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between flex-shrink-0">
            <div>
              <h2 class="text-base font-bold text-[var(--text-main)]">Review Your Application Data</h2>
              <p class="text-xs text-[var(--text-muted)] mt-0.5">Select which items to include. All are pre-selected by default.</p>
            </div>
            <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)]">
              <i class="pi pi-times text-lg"></i>
            </button>
          </div>

          <div class="overflow-y-auto custom-scrollbar flex-1 p-6 flex flex-col gap-6">

            <!-- No profile warning -->
            <div v-if="!profile" class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
              <i class="pi pi-exclamation-triangle mt-0.5 shrink-0"></i>
              <div>
                <p class="font-semibold">Profile not complete</p>
                <p class="text-xs mt-0.5">Your personal information will not be included. Please complete your profile after submitting.</p>
              </div>
            </div>

            <!-- ── Education ── -->
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <i class="pi pi-graduation-cap"></i> Education
                <span class="font-normal normal-case">({{ selEdu.length }}/{{ profile?.education?.length || 0 }} selected)</span>
              </p>
              <div v-if="!profile?.education?.length" class="text-xs text-[var(--text-faint)] italic">No education entries in your profile.</div>
              <div v-else class="flex flex-col gap-2">
                <label v-for="(edu, i) in profile.education" :key="i"
                  :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    selEdu.includes(i) ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30' : 'border-[var(--border-main)] hover:bg-[var(--bg-app)]']">
                  <input type="checkbox" :checked="selEdu.includes(i)" @change="toggle(selEdu, i)"
                    class="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ edu.degree || edu.level || 'No degree specified' }}</p>
                    <p class="text-xs text-[var(--text-muted)] truncate">{{ edu.school }} {{ edu.yearGraduated ? `· ${edu.yearGraduated}` : '' }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- ── Eligibility ── -->
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <i class="pi pi-verified"></i> Eligibility
                <span class="font-normal normal-case">({{ selElig.length }}/{{ profile?.eligibility?.length || 0 }} selected)</span>
              </p>
              <div v-if="!profile?.eligibility?.length" class="text-xs text-[var(--text-faint)] italic">No eligibility entries in your profile.</div>
              <div v-else class="flex flex-col gap-2">
                <label v-for="(el, i) in profile.eligibility" :key="i"
                  :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    selElig.includes(i) ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30' : 'border-[var(--border-main)] hover:bg-[var(--bg-app)]']">
                  <input type="checkbox" :checked="selElig.includes(i)" @change="toggle(selElig, i)"
                    class="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ el.name || 'Unnamed eligibility' }}</p>
                    <p class="text-xs text-[var(--text-muted)]">{{ el.placeOfExam }} {{ el.dateOfExam ? `· ${fmtShort(el.dateOfExam)}` : '' }} {{ el.rating ? `· Rating: ${el.rating}` : '' }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- ── Training ── -->
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <i class="pi pi-star"></i> Training & Seminars
                <span class="font-normal normal-case">({{ selTrn.length }}/{{ profile?.training?.length || 0 }} selected)</span>
              </p>
              <div v-if="!profile?.training?.length" class="text-xs text-[var(--text-faint)] italic">No training entries in your profile.</div>
              <div v-else class="flex flex-col gap-2">
                <label v-for="(tr, i) in profile.training" :key="i"
                  :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    selTrn.includes(i) ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30' : 'border-[var(--border-main)] hover:bg-[var(--bg-app)]']">
                  <input type="checkbox" :checked="selTrn.includes(i)" @change="toggle(selTrn, i)"
                    class="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ tr.title || 'Untitled training' }}</p>
                    <p class="text-xs text-[var(--text-muted)]">{{ tr.provider }} {{ tr.hours ? `· ${tr.hours} hrs` : '' }} {{ tr.dateIssued ? `· ${fmtShort(tr.dateIssued)}` : '' }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- ── Experience ── -->
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <i class="pi pi-briefcase"></i> Work Experience
                <span class="font-normal normal-case">({{ selExp.length }}/{{ profile?.experience?.length || 0 }} selected)</span>
              </p>
              <div v-if="!profile?.experience?.length" class="text-xs text-[var(--text-faint)] italic">No experience entries in your profile.</div>
              <div v-else class="flex flex-col gap-2">
                <label v-for="(exp, i) in profile.experience" :key="i"
                  :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    selExp.includes(i) ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]/30' : 'border-[var(--border-main)] hover:bg-[var(--bg-app)]']">
                  <input type="checkbox" :checked="selExp.includes(i)" @change="toggle(selExp, i)"
                    class="mt-0.5 w-4 h-4 rounded accent-[var(--color-primary)]" />
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ exp.position || 'Unnamed position' }}</p>
                    <p class="text-xs text-[var(--text-muted)]">{{ exp.company }} {{ exp.months ? `· ${exp.months} mo.` : '' }} {{ exp.isGovernment ? '· Government' : '' }}</p>
                  </div>
                </label>
              </div>
            </div>

            <!-- ── Performance Rating ── -->
            <div>
              <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                <i class="pi pi-chart-bar"></i> Latest Performance Rating
              </p>
              <div class="border border-[var(--border-main)] rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Numerical Score</label>
                  <input v-model="perfRating.score" type="number" step="0.001" min="0" max="5" class="input" placeholder="e.g. 4.500" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Adjectival Rating</label>
                  <input v-model="perfRating.adjective" class="input" placeholder="e.g. Outstanding" />
                </div>
                <div class="flex flex-col gap-1.5">
                  <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Period Covered</label>
                  <input v-model="perfRating.periodCovered" class="input" placeholder="e.g. Jan–Dec 2024" />
                </div>
              </div>
              <p class="text-[11px] text-[var(--text-faint)] mt-1.5">Leave blank if not applicable.</p>
            </div>

          </div>

          <div v-if="applyError" class="mx-6 mb-2 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            <i class="pi pi-exclamation-circle flex-shrink-0"></i>{{ applyError }}
          </div>

          <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-between items-center flex-shrink-0">
            <button @click="modalStep = 'detail'" class="text-sm text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1.5">
              <i class="pi pi-arrow-left text-xs"></i> Back
            </button>
            <button @click="submitApplication" :disabled="applying"
              class="bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white px-6 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
              <i :class="['pi text-xs', applying ? 'pi-spin pi-spinner' : 'pi-send']"></i>
              {{ applying ? 'Submitting...' : 'Submit Application' }}
            </button>
          </div>
        </template>

        <!-- ══ STEP 3: Success ════════════════════════════════════════ -->
        <template v-else-if="modalStep === 'success'">
          <div class="p-10 flex flex-col items-center gap-6 text-center">
            <div class="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <i class="pi pi-check-circle text-3xl text-emerald-500"></i>
            </div>
            <div>
              <h2 class="text-lg font-bold text-[var(--text-main)]">Application Submitted!</h2>
              <p class="text-sm text-[var(--text-muted)] mt-1 max-w-sm">
                Your application for <strong>{{ selectedJob.positionTitle }}</strong> has been received.
              </p>
              <div v-if="submittedApp?.applicationCode"
                class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[var(--color-primary)] text-sm font-mono font-bold">
                <i class="pi pi-qrcode text-xs"></i>
                {{ submittedApp.applicationCode }}
              </div>
            </div>

            <!-- Cover prompt -->
            <div class="w-full max-w-sm bg-[var(--bg-app)] border border-[var(--border-main)] rounded-xl p-4 text-left flex flex-col gap-3">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0">
                  <i class="pi pi-file-pdf text-[var(--color-primary)] text-sm"></i>
                </div>
                <div>
                  <p class="text-sm font-semibold text-[var(--text-main)]">Application Cover Sheet</p>
                  <p class="text-xs text-[var(--text-muted)] mt-0.5">
                    Preview, download, or print the A4 cover sheet to attach to your physical folder when submitting to the Division.
                  </p>
                </div>
              </div>
              <button @click="showCoverPdf = true"
                class="w-full h-10 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                <i class="pi pi-eye text-xs"></i> Preview &amp; Download Cover
              </button>
            </div>

            <div class="flex gap-3">
              <button @click="closeModal"
                class="h-10 px-5 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors">
                Later
              </button>
              <router-link to="/user/applications" class="btn-primary h-10 px-5 text-sm flex items-center gap-2">
                <i class="pi pi-folder-open text-xs"></i> My Applications
              </router-link>
            </div>
          </div>
        </template>

      </div>
    </div>
    </Teleport>

    <!-- Cover PDF preview/download -->
    <ApplicantCoverPagePdf
      v-if="showCoverPdf && submittedApp"
      :app="submittedApp"
      @close="showCoverPdf = false"
    />
  </div>
</template>
