<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

const navLinks = [
    { name: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { name: 'Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { name: 'Find Jobs', to: '/vacancies', icon: 'pi-search' },
];
</script>

<template>
    <div class="min-h-screen flex flex-col bg-slate-50 font-inter text-sm text-slate-600 antialiased">

        <!-- HEADER -->
        <header
            class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 lg:px-8 justify-between">
            <!-- Logo + Nav -->
            <div class="flex items-center gap-6">
                <router-link to="/" class="flex items-center gap-2.5 group">
                    <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                        <i class="pi pi-send text-white text-[10px]"></i>
                    </div>
                    <span class="text-[15px] font-bold tracking-tight text-slate-800">
                        RSP <span class="text-sky-600 font-medium">Portal</span>
                    </span>
                </router-link>

                <!-- Desktop Nav -->
                <nav class="hidden md:flex items-center gap-1">
                    <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
                        class="flex items-center gap-2 px-4 h-14 rounded-md text-slate-500 font-semibold text-[13px] transition-all hover:text-sky-600 hover:bg-slate-50 aria-[current=page]:text-sky-600 aria-[current=page]:bg-sky-50/50">
                        <i class="pi text-[11px]" :class="link.icon"></i>
                        <span>{{ link.name }}</span>
                    </router-link>
                </nav>
            </div>

            <!-- Actions + User -->
            <div class="flex items-center gap-2.5">
                <Button icon="pi pi-bell" severity="secondary" variant="text" size="small"
                    class="!w-9 !h-9 rounded-full hover:bg-slate-100" />

                <div class="h-5 w-px bg-slate-200 mx-1"></div>


                <!-- User Avatar Dropdown -->
                <div class="relative group">
                    <button class="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full
                 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition">
                        <!-- Name + Role -->
                        <div class="hidden sm:block text-right leading-tight">
                            <p class="text-[13px] font-semibold text-slate-800 capitalize">
                                {{ authStore.user?.username || 'Applicant' }}
                            </p>
                            <p class="text-[11px] text-slate-400 uppercase tracking-wide">
                                Candidate
                            </p>
                        </div>

                        <!-- Avatar -->
                        <Avatar
                            :image="authStore.user?.avatar || `https://ui-avatars.com/api/?name=${authStore.user?.username}`"
                            shape="circle" class="!w-9 !h-9 border-2 border-white shadow-sm ring-1 ring-slate-200" />

                        <!-- Chevron -->
                        <i class="pi pi-chevron-down text-[11px] text-slate-400 hidden sm:block"></i>
                    </button>

                    <!-- Dropdown Menu -->
                    <div class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-3
              opacity-0 invisible group-hover:opacity-100 group-hover:visible
              translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50">
                        <div class="grid grid-cols-2 gap-2">
                            <!-- Profile -->
                            <router-link to="/user/profile"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition">
                                <i class="pi pi-user text-sky-600 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-slate-700">Profile</span>
                            </router-link>

                            <!-- Applications / Status -->
                            <router-link to="/user/applications"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition">
                                <i class="pi pi-copy text-emerald-600 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-slate-700">Status</span>
                            </router-link>

                            <!-- Settings -->
                            <router-link to="/settings"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-slate-50 transition">
                                <i class="pi pi-cog text-slate-500 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-slate-700">Settings</span>
                            </router-link>

                            <!-- Logout -->
                            <button @click="authStore.logout"
                                class="flex flex-col items-center justify-center p-3 rounded-lg hover:bg-red-50 transition">
                                <i class="pi pi-power-off text-red-600 mb-1 text-lg"></i>
                                <span class="text-[11px] font-bold uppercase text-red-600">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Breadcrumb / Page Name -->
        <div class="bg-white/90 backdrop-blur border-b border-slate-200/60">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
                <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    <span>Candidate Workspace</span>
                    <i class="pi pi-angle-right text-[8px]"></i>
                    <span class="text-sky-600 font-extrabold">
                        {{ $route.name || 'Overview' }}
                    </span>
                </div>
            </div>
        </div>

        <!-- MAIN SLOT -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
            <slot />
        </main>

        <!-- FOOTER -->
        <footer class="border-t border-slate-200 bg-white">
            <div
                class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <p>© 2026 DepEd Guihulngan Division</p>
                <div class="flex gap-6">
                    <a href="#" class="hover:text-sky-600 transition-colors">Privacy</a>
                    <a href="#" class="hover:text-sky-600 transition-colors">Support</a>
                </div>
            </div>
        </footer>

    </div>
</template>

<style scoped>
@reference "@/assets/main.css";

:deep(.p-button.p-button-sm) {
    @apply !text-[11px] !py-1.5 !px-3;
}
</style>