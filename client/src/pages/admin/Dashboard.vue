<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { StatCard, EmptyState } from '@/components/ui'
import apiClient from '@/api/axios'

const router = useRouter()

const authStore = useAuthStore()
const loading = ref(false)

const stats = ref({ totalJobs: 0, publishedJobs: 0, totalUsers: 0, totalApplications: 0 })
const recentJobs = ref([])

onMounted(async () => {
    loading.value = true
    try {
        const [jobsRes, usersRes] = await Promise.allSettled([
            apiClient.get('/v1/jobs'),
            apiClient.get('/v1/users'),
        ])
        if (jobsRes.status === 'fulfilled') {
            const jobs = jobsRes.value.data.data || []
            stats.value.totalJobs = jobs.length
            stats.value.totalApplications = jobs.reduce((s, j) => s + (j.applications?.length || 0), 0)
            stats.value.publishedJobs = jobs.filter(j => j.status === 'published').length
            recentJobs.value = [...jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
        }
        if (usersRes.status === 'fulfilled') {
            stats.value.totalUsers = (usersRes.value.data.data || []).length
        }
    } finally {
        loading.value = false
    }
})

const statusConfig = {
    published: { label: 'Published', cls: 'bg-green-50 text-green-700 border-green-200' },
    draft:     { label: 'Draft',     cls: 'bg-slate-100 text-slate-500 border-slate-200' },
    closed:    { label: 'Closed',    cls: 'bg-red-50 text-red-600 border-red-200' },
    archived:  { label: 'Archived', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const trackConfig = {
    teaching:         { label: 'Teaching',         cls: 'bg-blue-50 text-blue-700' },
    teaching_related: { label: 'Teaching-Related', cls: 'bg-purple-50 text-purple-700' },
    non_teaching:     { label: 'Non-Teaching',     cls: 'bg-orange-50 text-orange-700' },
}

const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const quickLinks = [
    { label: 'Manage Vacancies', desc: 'Post and manage job openings', icon: 'pi-briefcase', to: '/admin/vacancies',  accent: 'text-[var(--color-primary)] bg-[var(--color-primary-light)] border-blue-200'   },
    { label: 'User Accounts',    desc: 'Manage roles and access',      icon: 'pi-users',     to: '/admin/user-list',  accent: 'text-green-600 bg-green-50 border-green-200'  },
    { label: 'Applicants',       desc: 'Review and process applicants',icon: 'pi-folder',    to: '/admin/applicants', accent: 'text-purple-600 bg-purple-50 border-purple-200' },
    { label: 'Evaluations',      desc: 'Rate applicants for ranking',   icon: 'pi-chart-bar',to: '/admin/evaluations', accent: 'text-sky-600 bg-sky-50 border-sky-200' },
]

const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
}
</script>

<template>
    <div class="flex flex-col gap-6 animate-fade-in-up">

        <!-- ── Welcome Banner ──────────────────────────────────────── -->
        <div class="relative overflow-hidden bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl px-6 py-5">
            <!-- Subtle background accent -->
            <div class="absolute inset-0 pointer-events-none"
                style="background: radial-gradient(ellipse at top left, rgba(29,78,216,0.05) 0%, transparent 60%);"></div>

            <div class="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); box-shadow: 0 4px 12px rgba(29,78,216,0.3);">
                        <i class="pi pi-shield text-white text-base" aria-hidden="true"></i>
                    </div>
                    <div>
                        <p class="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                            Administration Panel
                        </p>
                        <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight mt-0.5">
                            {{ greeting() }}, <span class="text-[var(--color-primary)] capitalize">{{ authStore.user?.username }}</span>
                        </h1>
                    </div>
                </div>
                <div class="flex items-center gap-2 text-xs text-[var(--text-muted)] bg-[var(--bg-app)] border border-[var(--border-main)] px-4 py-2.5 rounded-xl shrink-0 self-start sm:self-auto">
                    <i class="pi pi-calendar text-[11px] text-[var(--color-primary)]" aria-hidden="true"></i>
                    {{ new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }}
                </div>
            </div>
        </div>

        <!-- ── Stat Cards ──────────────────────────────────────────── -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
                title="Total Vacancies"
                :value="stats.totalJobs"
                icon="briefcase"
                iconColor="blue"
                description="All job postings"
                :loading="loading"
                to="/admin/vacancies" />
            <StatCard
                title="Published"
                :value="stats.publishedJobs"
                icon="send"
                iconColor="green"
                description="Live on portal"
                :loading="loading"
                to="/admin/vacancies" />
            <StatCard
                title="Applications"
                :value="stats.totalApplications"
                icon="folder-open"
                iconColor="purple"
                description="Total submitted"
                :loading="loading"
                to="/admin/applicants" />
            <StatCard
                title="Registered Users"
                :value="stats.totalUsers"
                icon="users"
                iconColor="amber"
                description="System accounts"
                :loading="loading"
                to="/admin/user-list" />
        </div>

        <!-- ── Main Grid ───────────────────────────────────────────── -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

            <!-- Recent Vacancies ──────────────────────────────── -->
            <div class="lg:col-span-2 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">

                <!-- Card Header -->
                <div class="px-5 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="w-7 h-7 rounded-lg bg-[var(--color-primary-light)] border border-blue-200 flex items-center justify-center">
                            <i class="pi pi-clock text-[var(--color-primary)] text-[11px]" aria-hidden="true"></i>
                        </div>
                        <h2 class="text-sm font-bold text-[var(--text-main)]">Recent Vacancies</h2>
                    </div>
                    <router-link to="/admin/vacancies"
                        class="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--color-primary)] transition-colors group">
                        View all
                        <i class="pi pi-arrow-right text-[9px] group-hover:translate-x-0.5 transition-transform" aria-hidden="true"></i>
                    </router-link>
                </div>

                <!-- Loading skeleton -->
                <div v-if="loading" class="p-5 flex flex-col gap-3" aria-busy="true">
                    <div v-for="i in 4" :key="i"
                        class="h-14 rounded-xl bg-[var(--bg-app)] animate-pulse"
                        :style="{ animationDelay: `${i * 80}ms` }"></div>
                </div>

                <!-- Empty state -->
                <EmptyState
                    v-else-if="recentJobs.length === 0"
                    icon="briefcase"
                    title="No vacancies yet"
                    description="Post your first job vacancy to get started."
                    action-label="Create Vacancy"
                    @action="router.push('/admin/vacancies')"
                    compact />

                <!-- Job list -->
                <div v-else class="divide-y divide-[var(--border-main)]">
                    <router-link v-for="job in recentJobs" :key="job._id"
                        to="/admin/vacancies"
                        class="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-app)] transition-colors group">

                        <!-- Track indicator dot -->
                        <div :class="['w-2 h-2 rounded-full flex-shrink-0',
                            job.hiringTrack === 'teaching' ? 'bg-blue-400' :
                            job.hiringTrack === 'teaching_related' ? 'bg-purple-400' : 'bg-orange-400'
                        ]"></div>

                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-[var(--text-main)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                                {{ job.positionTitle }}
                            </p>
                            <div class="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span :class="['text-[10px] font-semibold px-2 py-0.5 rounded-full', trackConfig[job.hiringTrack]?.cls || 'bg-slate-100 text-slate-600']">
                                    {{ trackConfig[job.hiringTrack]?.label || job.hiringTrack }}
                                </span>
                                <span class="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                                    <i class="pi pi-map-marker text-[9px]"></i>{{ job.placeOfAssignment }}
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center gap-3 flex-shrink-0">
                            <span :class="['text-[10px] font-semibold px-2.5 py-[3px] rounded-full border capitalize',
                                statusConfig[job.status]?.cls || 'bg-slate-100 text-slate-500 border-slate-200']">
                                {{ statusConfig[job.status]?.label || job.status }}
                            </span>
                            <span class="text-[10px] text-[var(--text-muted)] hidden sm:block whitespace-nowrap">
                                {{ formatDate(job.createdAt) }}
                            </span>
                        </div>
                    </router-link>
                </div>
            </div>

            <!-- Quick Access ──────────────────────────────────── -->
            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">

                <div class="px-5 py-4 border-b border-[var(--border-main)] flex items-center gap-2.5">
                    <div class="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center">
                        <i class="pi pi-th-large text-amber-600 text-[11px]" aria-hidden="true"></i>
                    </div>
                    <h2 class="text-sm font-bold text-[var(--text-main)]">Quick Access</h2>
                </div>

                <div class="p-3 flex flex-col gap-1.5">
                    <router-link v-for="link in quickLinks" :key="link.to" :to="link.to"
                        class="group flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-[var(--border-main)] hover:bg-[var(--bg-app)] transition-all">

                        <div :class="['w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105', link.accent]">
                            <i :class="['pi text-sm', link.icon]" aria-hidden="true"></i>
                        </div>

                        <div class="flex-1 min-w-0">
                            <p class="text-sm font-semibold text-[var(--text-main)] leading-tight">{{ link.label }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] truncate mt-0.5">{{ link.desc }}</p>
                        </div>

                        <i class="pi pi-angle-right text-sm text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-150" aria-hidden="true"></i>
                    </router-link>
                </div>

                <!-- System tip -->
                <div class="mx-3 mb-3 p-3 rounded-xl bg-[var(--color-primary-light)] border border-blue-200">
                    <p class="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary)] mb-1">Workflow Tip</p>
                    <p class="text-xs text-[var(--color-primary)] leading-relaxed opacity-80">
                        Applicants must be <strong>verified</strong> before they can proceed to comparative assessment.
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>
