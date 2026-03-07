<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const props = defineProps({
    isCollapsed: Boolean,
    isHovered:   Boolean,
})
const emit = defineEmits(['update:isHovered'])

const route         = useRoute()
const authStore     = useAuthStore()
const settingsStore = useSettingsStore()
const active        = ref(null)

const navGroups = [
    {
        title: 'Recruitment',
        items: [
            {
                label: 'Dashboard',
                icon:  'chart-line',
                to:    '/admin/dashboard',
            },
            {
                label: 'Hiring',
                icon:  'briefcase',
                key:   'hiring',
                sub: [
                    { label: 'Job Vacancies',      icon: 'file-plus',  to: '/admin/vacancies'   },
                    { label: 'Applicants',         icon: 'users',      to: '/admin/applicants'  },
                    { label: 'Evaluations',        icon: 'list-check',  to: '/admin/evaluations' },
                    { label: 'Rubrics',            icon: 'percentage',  to: '/admin/rubrics'     },
                    { label: 'Qualified Registry', icon: 'verified',    to: '/admin/rqa'         },
                ],
            },
        ],
    },
    {
        title: 'Administration',
        items: [
            {
                label: 'Accounts',
                icon:  'user-plus',
                key:   'accounts',
                sub: [
                    { label: 'User List',           icon: 'users',   to: '/admin/user-list'         },
                    { label: 'Roles & Permissions', icon: 'shield',  to: '/admin/roles-permissions' },
                    { label: 'Audit Logs',          icon: 'history', to: '/admin/audit-logs'        },
                ],
            },
            { label: 'Announcements', icon: 'megaphone', to: '/admin/announcements' },
            { label: 'Settings',      icon: 'cog',       to: '/admin/settings'      },
        ],
    },
]

// Auto-open the group whose child matches the current route
watch(() => route.path, (path) => {
    for (const g of navGroups) {
        for (const item of g.items) {
            if (item.sub?.some(s => s.to === path)) {
                active.value = item.key
                return
            }
        }
    }
    active.value = null
}, { immediate: true })

const toggle    = (key) => { active.value = active.value === key ? null : key }
const expanded  = computed(() => !props.isCollapsed || props.isHovered)

const isSubActive = (item) => item.sub?.some(s => s.to === route.path)
</script>

<template>
    <aside
        @mouseenter="$emit('update:isHovered', true)"
        @mouseleave="$emit('update:isHovered', false)"
        :class="[expanded ? 'w-64' : 'w-[4.5rem]']"
        class="flex flex-col h-full shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
               bg-[#0b1628] border-r border-white/5 z-30 overflow-hidden"
        role="navigation"
        aria-label="Admin navigation">

        <!-- ── Brand ──────────────────────────────────────────── -->
        <div class="h-16 flex items-center px-4 border-b border-white/5 shrink-0 gap-3 overflow-hidden">
            <div class="w-9 h-9 rounded-xl shrink-0 overflow-hidden"
                :class="settingsStore.resolvedLogoUrl ? '' : 'bg-[var(--color-primary)] flex items-center justify-center shadow-lg shadow-blue-900/50'">
                <img v-if="settingsStore.resolvedLogoUrl"
                    :src="settingsStore.resolvedLogoUrl"
                    alt="System Logo"
                    class="w-full h-full object-cover" />
                <i v-else class="pi pi-shield text-white text-base" aria-hidden="true"></i>
            </div>
            <Transition name="label-fade">
                <div v-if="expanded" class="flex flex-col leading-tight overflow-hidden">
                    <span class="text-white font-bold text-sm tracking-tight whitespace-nowrap">{{ settingsStore.systemName }}</span>
                    <span class="text-white/40 text-[10px] font-semibold tracking-widest uppercase whitespace-nowrap">{{ settingsStore.systemSubName }}</span>
                </div>
            </Transition>
        </div>

        <!-- ── Navigation ─────────────────────────────────────── -->
        <nav class="flex-1 overflow-y-auto custom-scrollbar py-4 px-2.5 flex flex-col gap-5">
            <div v-for="group in navGroups" :key="group.title">

                <!-- Group label / divider -->
                <Transition name="label-fade">
                    <p v-if="expanded"
                        class="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-2 px-2.5 select-none">
                        {{ group.title }}
                    </p>
                </Transition>
                <div v-if="!expanded" class="h-px bg-white/8 mx-2 mb-3"></div>

                <ul class="flex flex-col gap-0.5" role="list">
                    <li v-for="item in group.items" :key="item.label">

                        <!-- ── Direct link ── -->
                        <router-link
                            v-if="!item.sub"
                            :to="item.to"
                            :title="!expanded ? item.label : undefined"
                            :aria-current="route.path === item.to ? 'page' : undefined"
                            :class="[
                                'flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative',
                                route.path === item.to
                                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-blue-900/40'
                                    : 'text-white/50 hover:text-white hover:bg-white/6',
                            ]">
                            <i :class="['pi shrink-0 text-[15px]', `pi-${item.icon}`]" aria-hidden="true"></i>
                            <Transition name="label-fade">
                                <span v-if="expanded" class="text-[13px] font-semibold truncate">{{ item.label }}</span>
                            </Transition>
                            <!-- Active dot when collapsed -->
                            <span
                                v-if="!expanded && route.path === item.to"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"
                                aria-hidden="true">
                            </span>
                        </router-link>

                        <!-- ── Dropdown group ── -->
                        <div v-else>
                            <button
                                @click="toggle(item.key)"
                                :title="!expanded ? item.label : undefined"
                                :aria-expanded="active === item.key ? 'true' : 'false'"
                                :class="[
                                    'w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl transition-all duration-150 group relative',
                                    active === item.key || isSubActive(item)
                                        ? 'text-white bg-white/8'
                                        : 'text-white/50 hover:text-white hover:bg-white/6',
                                ]">
                                <i :class="['pi shrink-0 text-[15px]', `pi-${item.icon}`]" aria-hidden="true"></i>
                                <Transition name="label-fade">
                                    <span v-if="expanded" class="text-[13px] font-semibold truncate flex-1 text-left">{{ item.label }}</span>
                                </Transition>
                                <Transition name="label-fade">
                                    <i v-if="expanded"
                                        :class="[
                                            'pi pi-chevron-down text-[9px] transition-transform duration-200 shrink-0 text-white/30',
                                            active === item.key ? 'rotate-180 !text-white/60' : '',
                                        ]"
                                        aria-hidden="true">
                                    </i>
                                </Transition>
                                <!-- Active dot when collapsed and a sub-item is active -->
                                <span
                                    v-if="!expanded && isSubActive(item)"
                                    class="absolute right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[var(--color-gold)]"
                                    aria-hidden="true">
                                </span>
                            </button>

                            <!-- Sub-items -->
                            <Transition name="slide-down">
                                <ul
                                    v-if="active === item.key && expanded"
                                    class="mt-1 ml-3.5 pl-3.5 border-l border-white/8 flex flex-col gap-0.5"
                                    role="list">
                                    <li v-for="sub in item.sub" :key="sub.to">
                                        <router-link
                                            :to="sub.to"
                                            :aria-current="route.path === sub.to ? 'page' : undefined"
                                            :class="[
                                                'flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-150',
                                                route.path === sub.to
                                                    ? 'text-[var(--color-gold)] bg-white/5 font-semibold'
                                                    : 'text-white/40 hover:text-white/80 hover:bg-white/5',
                                            ]">
                                            <i :class="['pi text-[11px]', `pi-${sub.icon}`]" aria-hidden="true"></i>
                                            {{ sub.label }}
                                        </router-link>
                                    </li>
                                </ul>
                            </Transition>
                        </div>
                    </li>
                </ul>
            </div>
        </nav>

        <!-- ── User Profile (expanded) ────────────────────────── -->
        <div class="p-3 border-t border-white/5 shrink-0">
            <Transition name="label-fade">
                <div v-if="expanded" class="flex items-center gap-2.5 px-2.5 py-2 rounded-xl hover:bg-white/5 transition-colors cursor-default">
                    <div class="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-[var(--color-primary)] flex items-center justify-center">
                        <img v-if="authStore.user?.avatarUrl" :src="authStore.user?.avatarUrl" :alt="authStore.user?.username" class="w-full h-full object-cover" />
                        <span v-else class="text-[11px] font-bold text-white uppercase">{{ authStore.user?.username?.charAt(0) || 'U' }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[12px] font-semibold text-white/80 truncate capitalize">{{ authStore.user?.username }}</p>
                        <p class="text-[10px] text-white/30 truncate">{{ authStore.user?.email }}</p>
                    </div>
                    <span class="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0"></span>
                </div>
            </Transition>
            <div v-if="!expanded" class="flex justify-center py-1">
                <div class="w-8 h-8 rounded-full shrink-0 overflow-hidden bg-[var(--color-primary)] flex items-center justify-center">
                    <img v-if="authStore.user?.avatarUrl" :src="authStore.user?.avatarUrl" :alt="authStore.user?.username" class="w-full h-full object-cover" />
                    <span v-else class="text-[11px] font-bold text-white uppercase">{{ authStore.user?.username?.charAt(0) || 'U' }}</span>
                </div>
            </div>
        </div>
    </aside>
</template>
