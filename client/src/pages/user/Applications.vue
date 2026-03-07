<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import apiClient from '@/api/axios'
import ApplicantCoverPagePdf from '@/components/ApplicantCoverPagePdf.vue'

const applications = ref([])
const loading      = ref(false)
const error        = ref('')
const searchQuery  = ref('')
const filterStatus = ref('')
const selectedApp  = ref(null)
const showModal    = ref(false)

// ── Cover PDF ─────────────────────────────────────────────────────────────
const showCoverPdf = ref(false)

// ── Edit mode ──────────────────────────────────────────────────────────────
const editMode     = ref(false)
const editProfile  = ref(null)
const editLoading  = ref(false)
const editSaving   = ref(false)
const editError    = ref('')
const selEdu       = ref([])
const selElig      = ref([])
const selTrn       = ref([])
const selExp       = ref([])
const perfRating   = ref({ score: '', adjective: '', periodCovered: '' })

onMounted(fetchApplications)
onActivated(fetchApplications)

async function fetchApplications() {
    loading.value = true
    error.value   = ''
    try {
        const { data } = await apiClient.get('/v1/applications/my-applications')
        applications.value = data.data || []
    } catch (err) {
        error.value = err.response?.data?.message || 'Failed to load applications.'
    } finally {
        loading.value = false
    }
}

const filtered = computed(() => {
    let list = [...applications.value]
    if (searchQuery.value) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(a => a.job?.positionTitle?.toLowerCase().includes(q))
    }
    if (filterStatus.value) list = list.filter(a => a.status === filterStatus.value)
    return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
})

const statusConfig = {
    applied:               { label: 'Applied',            class: 'bg-amber-100 text-amber-700 border-amber-200',    icon: 'pi-clock' },
    verifying:             { label: 'Under Verification', class: 'bg-blue-100 text-blue-700 border-blue-200',       icon: 'pi-search' },
    comparative_assessment:{ label: 'For Assessment',     class: 'bg-purple-100 text-purple-700 border-purple-200', icon: 'pi-chart-bar' },
    ranked:                { label: 'Ranked',             class: 'bg-green-100 text-green-700 border-green-200',    icon: 'pi-check-circle' },
    disqualified:          { label: 'Disqualified',       class: 'bg-red-100 text-red-600 border-red-200',          icon: 'pi-times-circle' },
}

const trackLabel = { teaching: 'Teaching', teaching_related: 'Teaching-Related', non_teaching: 'Non-Teaching' }
const formatDate  = (d) => d ? new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'

const canEdit = computed(() => selectedApp.value && !selectedApp.value.isVerified)

const openApp = (app) => {
    selectedApp.value = app
    editMode.value    = false
    editError.value   = ''
    showModal.value   = true
}

const closeModal = () => {
    showModal.value = false
    editMode.value  = false
}

// ── Start edit — load profile, pre-select matching items ───────────────────
const startEdit = async () => {
    editLoading.value = true
    editError.value   = ''
    try {
        const { data } = await apiClient.get('/v1/profile/me')
        editProfile.value = data.data || null
        const p  = editProfile.value
        const ad = selectedApp.value.applicantData || {}

        // Pre-select profile items that are currently in the application snapshot
        selEdu.value  = (p?.education  || []).map((e, i) =>
            (ad.education  || []).some(a => a.degree === e.degree && a.school === e.school) ? i : -1
        ).filter(i => i !== -1)
        selElig.value = (p?.eligibility || []).map((e, i) =>
            (ad.eligibility || []).some(a => a.name === e.name) ? i : -1
        ).filter(i => i !== -1)
        selTrn.value  = (p?.training   || []).map((e, i) =>
            (ad.training   || []).some(a => a.title === e.title) ? i : -1
        ).filter(i => i !== -1)
        selExp.value  = (p?.experience || []).map((e, i) =>
            (ad.experience || []).some(a => a.position === e.position && a.company === e.company) ? i : -1
        ).filter(i => i !== -1)

        // If nothing matched, default to all selected
        if (!selEdu.value.length  && p?.education?.length)   selEdu.value  = p.education.map((_, i) => i)
        if (!selElig.value.length && p?.eligibility?.length) selElig.value = p.eligibility.map((_, i) => i)
        if (!selTrn.value.length  && p?.training?.length)    selTrn.value  = p.training.map((_, i) => i)
        if (!selExp.value.length  && p?.experience?.length)  selExp.value  = p.experience.map((_, i) => i)

        perfRating.value = {
            score:         ad.performanceRating?.score         ?? p?.performanceRating?.score         ?? '',
            adjective:     ad.performanceRating?.adjective     ?? p?.performanceRating?.adjective     ?? '',
            periodCovered: ad.performanceRating?.periodCovered ?? p?.performanceRating?.periodCovered ?? '',
        }
        editMode.value = true
    } catch {
        editError.value = 'Failed to load your profile. Please try again.'
    } finally {
        editLoading.value = false
    }
}

const toggle = (arr, idx) => {
    const i = arr.indexOf(idx)
    if (i === -1) arr.push(idx)
    else arr.splice(i, 1)
}

// ── Save edited applicant data ─────────────────────────────────────────────
const saveEdit = async () => {
    editSaving.value = true
    editError.value  = ''
    const p = editProfile.value
    const personalInfo = p ? {
        firstName: p.name?.firstName, middleName: p.name?.middleName,
        lastName:  p.name?.lastName,  suffix:     p.name?.suffix,
        sex: p.sex, birthDate: p.birthDate, civilStatus: p.civilStatus,
        contact: p.contact, address: p.address,
    } : {}

    const applicantData = {
        personalInfo,
        education:         p?.education?.filter((_, i)  => selEdu.value.includes(i))  || [],
        eligibility:       p?.eligibility?.filter((_, i) => selElig.value.includes(i)) || [],
        training:          p?.training?.filter((_, i)   => selTrn.value.includes(i))   || [],
        experience:        p?.experience?.filter((_, i)  => selExp.value.includes(i))  || [],
        performanceRating: {
            score:         perfRating.value.score ? Number(perfRating.value.score) : null,
            adjective:     perfRating.value.adjective     || '',
            periodCovered: perfRating.value.periodCovered || '',
        },
    }

    try {
        const { data } = await apiClient.patch(
            `/v1/applications/${selectedApp.value._id}/applicant-data`,
            { applicantData }
        )
        const updated = { ...selectedApp.value, applicantData: data.data.applicantData, updatedAt: data.data.updatedAt }
        selectedApp.value = updated
        const idx = applications.value.findIndex(a => a._id === updated._id)
        if (idx !== -1) applications.value[idx] = { ...applications.value[idx], ...updated }
        editMode.value = false
    } catch (err) {
        editError.value = err.response?.data?.message || 'Failed to save changes.'
    } finally {
        editSaving.value = false
    }
}
</script>

<template>
    <div class="flex flex-col gap-6">

        <!-- ── Header ──────────────────────────────────────────────────── -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
                <h1 class="text-2xl font-bold text-[var(--text-main)]">My Applications</h1>
                <p class="text-sm text-[var(--text-muted)]">Track the status of all your submitted applications.</p>
            </div>
            <div class="flex items-center gap-2">
                <span class="px-3 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm font-medium text-[var(--text-muted)]">
                    <i class="pi pi-folder-open mr-1.5"></i>{{ filtered.length }} application{{ filtered.length !== 1 ? 's' : '' }}
                </span>
                <button @click="fetchApplications"
                    class="p-2 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
                    title="Refresh">
                    <i :class="['pi pi-refresh text-sm', { 'animate-spin': loading }]"></i>
                </button>
            </div>
        </div>

        <!-- ── Filters ─────────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm pointer-events-none"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by position title..."
                    class="w-full h-9 pl-9 pr-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-muted)]/60 focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)] transition-shadow" />
            </div>
            <select v-model="filterStatus"
                class="h-9 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] text-sm text-[var(--text-main)] focus:outline-none appearance-none cursor-pointer min-w-[140px]">
                <option value="">All Statuses</option>
                <option v-for="(cfg, key) in statusConfig" :key="key" :value="key">{{ cfg.label }}</option>
            </select>
        </div>

        <!-- ── Error ───────────────────────────────────────────────────── -->
        <div v-if="error"
            class="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <i class="pi pi-exclamation-circle flex-shrink-0"></i>
            {{ error }}
        </div>

        <!-- ── Loading ─────────────────────────────────────────────────── -->
        <div v-else-if="loading" class="flex flex-col gap-3">
            <div v-for="i in 4" :key="i" class="h-20 rounded-xl bg-[var(--surface)] border border-[var(--border-main)] animate-pulse"></div>
        </div>

        <!-- ── Empty ───────────────────────────────────────────────────── -->
        <div v-else-if="filtered.length === 0"
            class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl py-20 flex flex-col items-center gap-4 text-[var(--text-muted)]">
            <i class="pi pi-folder-open text-4xl text-slate-300"></i>
            <div class="text-center">
                <p class="text-sm font-medium">No applications found</p>
                <p class="text-xs mt-1">{{ searchQuery || filterStatus ? 'Try adjusting your filters.' : 'You haven\'t applied to any positions yet.' }}</p>
            </div>
            <router-link v-if="!searchQuery && !filterStatus" to="/vacancies"
                class="h-9 px-5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                <i class="pi pi-briefcase text-xs"></i> Browse Vacancies
            </router-link>
        </div>

        <!-- ── Application Cards ───────────────────────────────────────── -->
        <div v-else class="flex flex-col gap-3">
            <div v-for="app in filtered" :key="app._id"
                @click="openApp(app)"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all group">

                <!-- Status Icon -->
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border', statusConfig[app.status]?.class || 'bg-slate-100 text-slate-600 border-slate-200']">
                    <i :class="['pi text-sm', statusConfig[app.status]?.icon || 'pi-file']"></i>
                </div>

                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {{ app.job?.positionTitle || 'Position' }}
                    </p>
                    <div class="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-[var(--text-muted)]">
                        <span v-if="app.job?.placeOfAssignment" class="flex items-center gap-1">
                            <i class="pi pi-map-marker text-[9px]"></i>{{ app.job.placeOfAssignment }}
                        </span>
                        <span v-if="app.job?.hiringTrack" class="flex items-center gap-1">
                            <i class="pi pi-tag text-[9px]"></i>{{ trackLabel[app.job.hiringTrack] || app.job.hiringTrack }}
                        </span>
                        <span class="flex items-center gap-1">
                            <i class="pi pi-calendar text-[9px]"></i>Applied {{ formatDate(app.createdAt) }}
                        </span>
                    </div>
                </div>

                <!-- Status Badge -->
                <div class="flex items-center gap-3 flex-shrink-0">
                    <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border', statusConfig[app.status]?.class || 'bg-slate-100 text-slate-600 border-slate-200']">
                        {{ statusConfig[app.status]?.label || app.status }}
                    </span>
                    <i class="pi pi-angle-right text-sm text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity"></i>
                </div>
            </div>
        </div>

        <!-- ── Application Detail Modal ──────────────────────────────────────── -->
        <Teleport to="body">
        <div v-if="showModal && selectedApp"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            @click.self="closeModal">

            <div :class="['bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full flex flex-col overflow-hidden animate-zoom-in max-h-[90vh] transition-all', editMode ? 'max-w-2xl' : 'max-w-lg']">

                <!-- Header -->
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-start justify-between gap-4 flex-shrink-0">
                    <div>
                        <h3 class="text-base font-bold text-[var(--text-main)]">
                            {{ editMode ? 'Edit Application Data' : (selectedApp.job?.positionTitle || 'Application Details') }}
                        </h3>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">
                            {{ editMode ? 'Select which items to include from your profile.' : `Code: ${selectedApp.applicationCode || selectedApp._id?.slice(-8).toUpperCase()}` }}
                        </p>
                    </div>
                    <button @click="closeModal" class="text-[var(--text-muted)] hover:text-[var(--text-main)] flex-shrink-0">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- ── VIEW MODE ────────────────────────────────────────── -->
                <template v-if="!editMode">
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-5 custom-scrollbar">

                    <!-- Status -->
                    <div :class="['flex items-center gap-3 p-4 rounded-xl border', statusConfig[selectedApp.status]?.class || 'bg-slate-100 border-slate-200']">
                        <i :class="['pi text-xl', statusConfig[selectedApp.status]?.icon || 'pi-file']"></i>
                        <div>
                            <p class="text-xs font-semibold uppercase tracking-wider opacity-70">Application Status</p>
                            <p class="text-base font-bold">{{ statusConfig[selectedApp.status]?.label || selectedApp.status }}</p>
                        </div>
                        <span v-if="selectedApp.isVerified" class="ml-auto flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/60 border border-current">
                            <i class="pi pi-lock text-[9px]"></i> Locked
                        </span>
                    </div>

                    <!-- Job Details -->
                    <div v-if="selectedApp.job">
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Position Details</p>
                        <div class="grid grid-cols-2 gap-3">
                            <div v-for="[label, val] in [
                                ['Position', selectedApp.job.positionTitle],
                                ['Position Code', selectedApp.job.positionCode],
                                ['Assignment', selectedApp.job.placeOfAssignment],
                                ['Track', trackLabel[selectedApp.job.hiringTrack] || selectedApp.job.hiringTrack],
                                ['Salary Grade', `SG-${selectedApp.job.salaryGrade}`],
                                ['Monthly Salary', `\u20b1${Number(selectedApp.job.salary).toLocaleString()}`],
                            ]" :key="label"
                                class="bg-[var(--bg-app)] rounded-xl p-3 border border-[var(--border-main)]">
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{{ label }}</p>
                                <p class="text-sm font-medium text-[var(--text-main)] truncate">{{ val }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Submitted Data Summary -->
                    <div v-if="selectedApp.applicantData">
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Submitted Data</p>
                        <div class="flex flex-col divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                            <div v-for="[label, count] in [
                                ['Education entries',    selectedApp.applicantData.education?.length   || 0],
                                ['Eligibility entries',  selectedApp.applicantData.eligibility?.length || 0],
                                ['Training entries',     selectedApp.applicantData.training?.length    || 0],
                                ['Experience entries',   selectedApp.applicantData.experience?.length  || 0],
                            ]" :key="label" class="flex justify-between items-center px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs text-[var(--text-muted)]">{{ label }}</span>
                                <span class="text-xs font-bold text-[var(--text-main)]">{{ count }}</span>
                            </div>
                            <div class="flex justify-between items-center px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs text-[var(--text-muted)]">Performance Rating</span>
                                <span class="text-xs font-bold text-[var(--text-main)]">
                                    {{ selectedApp.applicantData.performanceRating?.score ? `${selectedApp.applicantData.performanceRating.score} — ${selectedApp.applicantData.performanceRating.adjective || ''}` : 'Not provided' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Timeline -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Timeline</p>
                        <div class="flex flex-col divide-y divide-[var(--border-main)] border border-[var(--border-main)] rounded-xl overflow-hidden">
                            <div class="flex justify-between px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs text-[var(--text-muted)]">Date Applied</span>
                                <span class="text-xs font-semibold text-[var(--text-main)]">{{ formatDate(selectedApp.createdAt) }}</span>
                            </div>
                            <div class="flex justify-between px-4 py-3 bg-[var(--bg-app)]">
                                <span class="text-xs text-[var(--text-muted)]">Last Updated</span>
                                <span class="text-xs font-semibold text-[var(--text-main)]">{{ formatDate(selectedApp.updatedAt) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer (view) -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between gap-3 flex-shrink-0 flex-wrap">
                    <button @click="closeModal"
                        class="h-10 px-5 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors">
                        Close
                    </button>
                    <div class="flex items-center gap-2">
                        <!-- Cover Sheet -->
                        <button @click="showCoverPdf = true"
                            class="h-10 px-4 rounded-lg border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold transition-colors flex items-center gap-2">
                            <i class="pi pi-file-pdf text-xs"></i> Cover Sheet
                        </button>
                        <!-- Edit (only if not locked) -->
                        <button v-if="canEdit" @click="startEdit" :disabled="editLoading"
                            class="h-10 px-4 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                            <i :class="['pi text-xs', editLoading ? 'pi-spin pi-spinner' : 'pi-pencil']"></i>
                            {{ editLoading ? 'Loading...' : 'Edit Application' }}
                        </button>
                        <span v-else-if="selectedApp.isVerified" class="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                            <i class="pi pi-lock text-[10px]"></i> Locked by HR
                        </span>
                    </div>
                </div>
                </template>

                <!-- ── EDIT MODE ────────────────────────────────────────── -->
                <template v-else>
                <div class="overflow-y-auto flex-1 p-6 flex flex-col gap-6 custom-scrollbar">

                    <!-- Error -->
                    <div v-if="editError" class="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                        <i class="pi pi-exclamation-circle flex-shrink-0"></i>{{ editError }}
                    </div>

                    <!-- No profile warning -->
                    <div v-if="!editProfile" class="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        <i class="pi pi-exclamation-triangle mt-0.5 shrink-0"></i>
                        <p>Your profile could not be loaded. Your submitted data is shown as-is.</p>
                    </div>

                    <!-- Education -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-graduation-cap"></i> Education
                            <span class="font-normal normal-case">({{ selEdu.length }}/{{ editProfile?.education?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.education?.length" class="text-xs text-[var(--text-faint)] italic">No education entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(edu, i) in editProfile.education" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selEdu.includes(i) ? 'border-blue-300 bg-blue-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-blue-200']">
                                <input type="checkbox" :checked="selEdu.includes(i)" @change="toggle(selEdu, i)" class="mt-0.5 accent-[var(--color-primary)]" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ edu.degree || edu.level }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ edu.school }}{{ edu.yearGraduated ? ` · ${edu.yearGraduated}` : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Eligibility -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-verified"></i> Eligibility
                            <span class="font-normal normal-case">({{ selElig.length }}/{{ editProfile?.eligibility?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.eligibility?.length" class="text-xs text-[var(--text-faint)] italic">No eligibility entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(elig, i) in editProfile.eligibility" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selElig.includes(i) ? 'border-purple-300 bg-purple-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-purple-200']">
                                <input type="checkbox" :checked="selElig.includes(i)" @change="toggle(selElig, i)" class="mt-0.5 accent-purple-600" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ elig.name }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ elig.placeOfExam }}{{ elig.rating ? ` · Rating: ${elig.rating}` : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Training -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-book"></i> Training &amp; Seminars
                            <span class="font-normal normal-case">({{ selTrn.length }}/{{ editProfile?.training?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.training?.length" class="text-xs text-[var(--text-faint)] italic">No training entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(trn, i) in editProfile.training" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selTrn.includes(i) ? 'border-amber-300 bg-amber-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-amber-200']">
                                <input type="checkbox" :checked="selTrn.includes(i)" @change="toggle(selTrn, i)" class="mt-0.5 accent-amber-500" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ trn.title }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ trn.provider }}{{ trn.hours ? ` · ${trn.hours}h` : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Experience -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-briefcase"></i> Work Experience
                            <span class="font-normal normal-case">({{ selExp.length }}/{{ editProfile?.experience?.length || 0 }} selected)</span>
                        </p>
                        <div v-if="!editProfile?.experience?.length" class="text-xs text-[var(--text-faint)] italic">No experience entries in your profile.</div>
                        <div v-else class="flex flex-col gap-2">
                            <label v-for="(exp, i) in editProfile.experience" :key="i"
                                :class="['flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                                    selExp.includes(i) ? 'border-green-300 bg-green-50' : 'border-[var(--border-main)] bg-[var(--bg-app)] hover:border-green-200']">
                                <input type="checkbox" :checked="selExp.includes(i)" @change="toggle(selExp, i)" class="mt-0.5 accent-green-600" />
                                <div class="min-w-0">
                                    <p class="text-sm font-semibold text-[var(--text-main)]">{{ exp.position }}</p>
                                    <p class="text-xs text-[var(--text-muted)]">{{ exp.company }}{{ exp.months ? ` · ${exp.months} mo` : '' }}{{ exp.isGovernment ? ' · Gov\'t' : '' }}</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Performance Rating -->
                    <div>
                        <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-2">
                            <i class="pi pi-star"></i> Latest Performance Rating
                        </p>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-xl border border-[var(--border-main)] bg-[var(--bg-app)]">
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Score (e.g. 4.5)</label>
                                <input v-model="perfRating.score" type="number" step="0.001" min="1" max="5" placeholder="Optional"
                                    class="input text-sm" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Adjective Rating</label>
                                <input v-model="perfRating.adjective" type="text" placeholder="e.g. Very Satisfactory"
                                    class="input text-sm" />
                            </div>
                            <div class="flex flex-col gap-1">
                                <label class="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Period Covered</label>
                                <input v-model="perfRating.periodCovered" type="text" placeholder="e.g. Jan-Dec 2024"
                                    class="input text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer (edit) -->
                <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex items-center justify-between gap-3 flex-shrink-0">
                    <button @click="editMode = false"
                        class="h-10 px-5 rounded-lg border border-[var(--border-main)] text-sm font-semibold text-[var(--text-main)] hover:bg-[var(--surface)] transition-colors">
                        Cancel
                    </button>
                    <button @click="saveEdit" :disabled="editSaving"
                        class="h-10 px-5 rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-dark)] disabled:opacity-60 text-white text-sm font-semibold transition-colors flex items-center gap-2">
                        <i :class="['pi text-xs', editSaving ? 'pi-spin pi-spinner' : 'pi-check']"></i>
                        {{ editSaving ? 'Saving...' : 'Save Changes' }}
                    </button>
                </div>
                </template>

            </div>
        </div>
        </Teleport>

        <!-- Cover PDF preview/download -->
        <ApplicantCoverPagePdf
            v-if="showCoverPdf && selectedApp"
            :app="selectedApp"
            @close="showCoverPdf = false"
        />
    </div>
</template>

