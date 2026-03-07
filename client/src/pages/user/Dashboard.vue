<script setup>
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

const router    = useRouter()
const authStore = useAuthStore()

// ── Profile summary ──────────────────────────────────────────────
const profile        = ref(null)
const loadingProfile = ref(false)

const profileComplete = computed(() => {
    const p = profile.value
    if (!p) return 0
    let filled = 0
    if (p.name?.firstName && p.name?.lastName) filled++
    if (p.contact?.phone || p.contact?.email) filled++
    if (p.address?.barangay) filled++
    if (p.education?.length) filled++
    if (p.eligibility?.length) filled++
    if (p.training?.length) filled++
    if (p.experience?.length) filled++
    return Math.round((filled / 7) * 100)
})

async function loadProfile() {
    loadingProfile.value = true
    try {
        const { data } = await apiClient.get('/v1/profile/me')
        profile.value = data.data || null
    } catch { /* no profile yet */ }
    finally { loadingProfile.value = false }
}

const applications = ref([])
const loadingApps = ref(false)

async function loadApplications() {
    loadingApps.value = true
    try {
        const { data } = await apiClient.get('/v1/applications/my-applications')
        applications.value = data.data || []
    } catch {
        // silently fail — user may have no applications yet
    } finally {
        loadingApps.value = false
    }
}

onMounted(() => { loadApplications(); loadProfile() })
onActivated(() => { loadApplications(); loadProfile() })

const totalApps = computed(() => applications.value.length)
const pendingApps = computed(() => applications.value.filter(a => a.status === 'applied').length)
const activeApps = computed(() => applications.value.filter(a => ['verifying', 'comparative_assessment'].includes(a.status)).length)
const recentApps = computed(() => [...applications.value].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3))

const statusConfig = {
    applied:                { label: 'Applied',            class: 'bg-amber-100 text-amber-700 border-amber-200' },
    verifying:              { label: 'Verifying',          class: 'bg-blue-100 text-blue-700 border-blue-200' },
    comparative_assessment: { label: 'For Assessment',     class: 'bg-purple-100 text-purple-700 border-purple-200' },
    ranked:                 { label: 'Ranked',             class: 'bg-green-100 text-green-700 border-green-200' },
    disqualified:           { label: 'Disqualified',       class: 'bg-red-100 text-red-600 border-red-200' },
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const memberSince = computed(() => {
    if (!authStore.user?.lastLogin) return '—'
    return new Date(authStore.user.lastLogin).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
})
</script>

<template>
    <div class="flex flex-col gap-8">

        <!-- ── Welcome Banner ─────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl p-6 sm:p-8 relative overflow-hidden">
            <div class="absolute -top-12 -right-12 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div class="absolute -bottom-12 -left-12 w-48 h-48 bg-slate-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div class="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div class="flex items-center gap-5">
                    <div class="relative flex-shrink-0">
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=E2E8F0&color=334155&bold=true`"
                            class="w-16 h-16 rounded-full object-cover border-2 border-[var(--border-main)] shadow-sm" />
                        <span class="absolute bottom-0.5 right-0.5 w-4 h-4 bg-green-500 border-2 border-[var(--surface)] rounded-full"></span>
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Welcome back</p>
                        <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight capitalize">
                            {{ authStore.user?.username || 'Applicant' }}
                        </h1>
                        <div class="flex flex-wrap items-center gap-2 mt-2">
                            <span class="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-green-50 text-green-700 border-green-200">
                                <i class="pi pi-shield text-[10px]"></i> Verified
                            </span>
                            <span class="text-xs text-[var(--text-muted)] border border-[var(--border-main)] px-2.5 py-1 rounded-full bg-[var(--bg-app)]">
                                {{ authStore.user?.email }}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3">
                    <router-link to="/vacancies"
                        class="h-10 px-5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2">
                        <i class="pi pi-briefcase text-xs"></i> Browse Jobs
                    </router-link>
                    <router-link to="/user/applications"
                        class="h-10 px-5 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-[var(--text-main)] text-sm font-semibold hover:bg-[var(--surface)] transition-colors flex items-center gap-2">
                        <i class="pi pi-folder-open text-xs"></i> Applications
                    </router-link>
                </div>
            </div>
        </div>

        <!-- ── Stats ───────────────────────────────────────────────────── -->
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center">
                    <i class="pi pi-file-edit text-[var(--text-muted)]"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">{{ loadingApps ? '—' : totalApps }}</p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">Total Applications</p>
                </div>
            </div>

            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3">
                <div class="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <i class="pi pi-clock text-amber-600"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">{{ loadingApps ? '—' : pendingApps }}</p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">Awaiting Review</p>
                </div>
            </div>

            <div class="col-span-2 sm:col-span-1 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-3">
                <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <i class="pi pi-search text-[var(--color-primary)]"></i>
                </div>
                <div>
                    <p class="text-2xl font-bold text-[var(--text-main)]">{{ loadingApps ? '—' : activeApps }}</p>
                    <p class="text-xs font-medium text-[var(--text-muted)] mt-0.5">Verifying / For Assessment</p>
                </div>
            </div>
        </div>

        <!-- ── Recent Applications ────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                <h2 class="text-sm font-bold text-[var(--text-main)]">Recent Applications</h2>
                <router-link to="/user/applications" class="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors flex items-center gap-1">
                    View all <i class="pi pi-arrow-right text-[10px]"></i>
                </router-link>
            </div>

            <div v-if="loadingApps" class="p-6 flex flex-col gap-3">
                <div v-for="i in 3" :key="i" class="h-14 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
            </div>

            <div v-else-if="recentApps.length === 0" class="py-14 flex flex-col items-center gap-3 text-[var(--text-muted)]">
                <i class="pi pi-folder-open text-3xl text-slate-300"></i>
                <p class="text-sm font-medium">No applications yet</p>
                <router-link to="/vacancies"
                    class="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                    Browse open vacancies <i class="pi pi-arrow-right text-[10px]"></i>
                </router-link>
            </div>

            <div v-else class="divide-y divide-[var(--border-main)]">
                <div v-for="app in recentApps" :key="app._id" class="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--bg-app)] transition-colors">
                    <div class="min-w-0">
                        <p class="text-sm font-semibold text-[var(--text-main)] truncate">
                            {{ app.job?.positionTitle || 'Position' }}
                        </p>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">Applied {{ formatDate(app.createdAt) }}</p>
                    </div>
                    <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full border flex-shrink-0', statusConfig[app.status]?.class || 'bg-slate-100 text-slate-600 border-slate-200']">
                        {{ statusConfig[app.status]?.label || app.status }}
                    </span>
                </div>
            </div>
        </div>

        <!-- ── Quick Links ─────────────────────────────────────────────── -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <router-link to="/vacancies"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 hover:border-blue-300 hover:shadow-sm transition-all group">
                <div class="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <i class="pi pi-briefcase text-[var(--color-primary)]"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-[var(--text-main)]">Browse Vacancies</p>
                    <p class="text-xs text-[var(--text-muted)]">Explore open positions</p>
                </div>
                <i class="pi pi-arrow-right text-[var(--text-muted)] ml-auto text-sm"></i>
            </router-link>

            <router-link to="/user/applications"
                class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex items-center gap-4 hover:border-green-300 hover:shadow-sm transition-all group">
                <div class="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <i class="pi pi-folder-open text-green-600"></i>
                </div>
                <div>
                    <p class="text-sm font-bold text-[var(--text-main)]">My Applications</p>
                    <p class="text-xs text-[var(--text-muted)]">Track your submissions</p>
                </div>
                <i class="pi pi-arrow-right text-[var(--text-muted)] ml-auto text-sm"></i>
            </router-link>
        </div>

        <!-- ── Application Profile ────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl overflow-hidden">
            <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                <h2 class="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
                    <i class="pi pi-id-card text-[var(--text-muted)] text-xs"></i> My Application Profile
                </h2>
                <router-link to="/user/profile"
                    class="text-xs font-semibold text-[var(--color-primary)] hover:underline flex items-center gap-1">
                    <i class="pi pi-pencil text-[10px]"></i> Edit Profile
                </router-link>
            </div>

            <!-- Loading -->
            <div v-if="loadingProfile" class="p-6 flex flex-col gap-3">
                <div class="h-4 w-48 rounded bg-[var(--bg-app)] animate-pulse"></div>
                <div class="h-3 w-full rounded bg-[var(--bg-app)] animate-pulse"></div>
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-[var(--bg-app)] animate-pulse"></div>
                </div>
            </div>

            <!-- No Profile Yet -->
            <div v-else-if="!profile" class="p-8 flex flex-col items-center gap-4 text-center">
                <div class="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
                    <i class="pi pi-exclamation-triangle text-amber-500 text-xl"></i>
                </div>
                <div>
                    <p class="text-sm font-semibold text-[var(--text-main)]">Profile not set up yet</p>
                    <p class="text-xs text-[var(--text-muted)] mt-1">Complete your application profile before applying to any vacancy.</p>
                </div>
                <router-link to="/user/profile" class="btn-primary h-9 px-5 text-sm flex items-center gap-2">
                    <i class="pi pi-user-edit text-xs"></i> Complete My Profile
                </router-link>
            </div>

            <!-- Profile Summary -->
            <div v-else class="p-6 flex flex-col gap-5">
                <!-- Name & contact -->
                <div class="flex items-start gap-4">
                    <div class="w-12 h-12 rounded-full bg-[var(--color-primary-light)] border border-blue-200 flex items-center justify-center flex-shrink-0">
                        <i class="pi pi-user text-[var(--color-primary)]"></i>
                    </div>
                    <div class="min-w-0">
                        <p class="text-sm font-bold text-[var(--text-main)] capitalize">
                            {{ [profile.name?.firstName, profile.name?.middleName, profile.name?.lastName].filter(Boolean).join(' ') || 'Name not set' }}
                        </p>
                        <p class="text-xs text-[var(--text-muted)] mt-0.5">
                            {{ profile.contact?.phone || profile.contact?.email || 'No contact info' }}
                        </p>
                        <p v-if="profile.address?.barangay" class="text-xs text-[var(--text-muted)]">
                            {{ [profile.address.barangay, profile.address.municipality, profile.address.province].filter(Boolean).join(', ') }}
                        </p>
                    </div>
                </div>

                <!-- Completeness bar -->
                <div class="flex flex-col gap-1.5">
                    <div class="flex items-center justify-between">
                        <span class="text-xs font-semibold text-[var(--text-muted)]">Profile Completeness</span>
                        <span :class="['text-xs font-bold', profileComplete >= 80 ? 'text-green-600' : profileComplete >= 50 ? 'text-amber-600' : 'text-red-500']">
                            {{ profileComplete }}%
                        </span>
                    </div>
                    <div class="h-2 rounded-full bg-[var(--bg-app)] overflow-hidden">
                        <div class="h-full rounded-full transition-all duration-500"
                            :class="profileComplete >= 80 ? 'bg-green-500' : profileComplete >= 50 ? 'bg-amber-400' : 'bg-red-400'"
                            :style="{ width: profileComplete + '%' }">
                        </div>
                    </div>
                </div>

                <!-- Counts grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div v-for="item in [
                        { label: 'Education',    count: profile.education?.length   || 0, icon: 'pi-graduation-cap', color: 'bg-blue-50 border-blue-200 text-[var(--color-primary)]' },
                        { label: 'Eligibility',  count: profile.eligibility?.length || 0, icon: 'pi-verified',       color: 'bg-purple-50 border-purple-200 text-purple-600' },
                        { label: 'Trainings',    count: profile.training?.length    || 0, icon: 'pi-book',           color: 'bg-amber-50 border-amber-200 text-amber-600' },
                        { label: 'Experience',   count: profile.experience?.length  || 0, icon: 'pi-briefcase',      color: 'bg-green-50 border-green-200 text-green-600' },
                    ]" :key="item.label"
                        class="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border bg-[var(--bg-app)]">
                        <div :class="['w-8 h-8 rounded-lg border flex items-center justify-center', item.color]">
                            <i :class="['pi text-sm', item.icon]"></i>
                        </div>
                        <p class="text-lg font-bold text-[var(--text-main)] leading-none">{{ item.count }}</p>
                        <p class="text-[10px] font-medium text-[var(--text-muted)]">{{ item.label }}</p>
                    </div>
                </div>

                <!-- Incomplete nudge -->
                <div v-if="profileComplete < 100"
                    class="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700">
                    <i class="pi pi-info-circle flex-shrink-0"></i>
                    <p class="text-xs">Your profile is incomplete. A complete profile improves your application.</p>
                    <router-link to="/user/profile" class="ml-auto text-xs font-bold underline whitespace-nowrap">Update now</router-link>
                </div>
            </div>
        </div>

    </div>
</template>
