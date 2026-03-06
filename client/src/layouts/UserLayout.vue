<script setup>
import { ref, reactive, inject } from 'vue'
import { useRoute, useRouter, RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import apiClient from '@/api/axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const toast = inject('$toast')

// ─── UI State ──────────────────────────────────────────────────────────────
const showSettingsModal = ref(false)
const showDropdown = ref(false)
const uploading = ref(false)
const isSaving = ref(false)
const showCurrentPw = ref(false)
const showNewPw = ref(false)
const showConfirmPw = ref(false)
const settingsTab = ref('avatar') // 'avatar' | 'password'

// ─── Avatar Upload ─────────────────────────────────────────────────────────
const fileInput = ref(null)

const triggerFileSelect = () => fileInput.value?.click()

const onFileSelect = async (event) => {
    const file = event.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        toast.fire({ icon: 'error', title: 'File Too Large', text: 'Max size is 10MB.' })
        return
    }
    const formData = new FormData()
    formData.append('avatar', file, file.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', formData)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
        toast.fire({ icon: 'success', title: 'Photo updated' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Upload Failed', text: err.response?.data?.message || 'Server error.' })
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

// ─── Password Change ────────────────────────────────────────────────────────
const passwordData = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.fire({ icon: 'warning', title: 'Mismatch', text: 'Passwords do not match.' })
        return
    }
    if (passwordData.newPassword.length < 8) {
        toast.fire({ icon: 'warning', title: 'Too short', text: 'Password must be at least 8 characters.' })
        return
    }
    isSaving.value = true
    try {
        await apiClient.patch('/auth/update-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword,
        })
        toast.fire({ icon: 'success', title: 'Password updated' })
        showSettingsModal.value = false
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
        toast.fire({ icon: 'error', title: 'Update Failed', text: err.response?.data?.message || 'Update failed.' })
    } finally {
        isSaving.value = false
    }
}

const openSettings = (tab = 'avatar') => {
    settingsTab.value = tab
    showDropdown.value = false
    showSettingsModal.value = true
}

// ─── Nav ────────────────────────────────────────────────────────────────────
const navLinks = [
    { name: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { name: 'My Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { name: 'Job Vacancies', to: '/vacancies', icon: 'pi-briefcase' },
]
</script>

<template>
    <div class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased">

        <!-- ── Header ─────────────────────────────────────────────────── -->
        <header class="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border-main)] h-16 flex items-center px-4 sm:px-6 lg:px-8 justify-between">

            <!-- Logo -->
            <div class="flex items-center gap-8">
                <router-link to="/" class="flex items-center gap-3 group">
                    <div class="w-9 h-9 rounded-lg bg-[var(--text-main)] flex items-center justify-center">
                        <i class="pi pi-shield text-[var(--surface)] text-base"></i>
                    </div>
                    <span class="text-sm font-bold tracking-tight text-[var(--text-main)] hidden sm:block">
                        RSP <span class="font-normal text-[var(--text-muted)]">Portal</span>
                    </span>
                </router-link>

                <!-- Nav Links -->
                <nav class="hidden md:flex items-center gap-1">
                    <router-link v-for="link in navLinks" :key="link.to" :to="link.to"
                        class="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        :class="route.path === link.to
                            ? 'bg-[var(--bg-app)] text-[var(--text-main)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)]'">
                        <i class="pi text-xs" :class="link.icon"></i>
                        {{ link.name }}
                    </router-link>
                </nav>
            </div>

            <!-- Right: User Menu -->
            <div class="flex items-center gap-3">
                <!-- Avatar + Dropdown -->
                <div class="relative">
                    <button @click="showDropdown = !showDropdown"
                        class="flex items-center gap-2 p-1 pl-2 rounded-full hover:bg-[var(--bg-app)] transition-colors border border-transparent hover:border-[var(--border-main)]">
                        <span class="hidden sm:block text-sm font-medium text-[var(--text-main)] max-w-[120px] truncate">
                            {{ authStore.user?.username }}
                        </span>
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=E2E8F0&color=334155&bold=true`"
                            :alt="authStore.user?.username"
                            class="w-8 h-8 rounded-full object-cover border border-[var(--border-main)]" />
                        <i class="pi pi-chevron-down text-[10px] text-[var(--text-muted)]"></i>
                    </button>

                    <!-- Dropdown -->
                    <div v-if="showDropdown"
                        class="absolute right-0 mt-2 w-56 bg-[var(--surface)] rounded-xl shadow-xl border border-[var(--border-main)] z-50 overflow-hidden animate-fade-in"
                        v-click-outside="() => showDropdown = false">

                        <div class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                            <p class="text-sm font-bold text-[var(--text-main)] truncate capitalize">{{ authStore.user?.username }}</p>
                            <p class="text-xs text-[var(--text-muted)] truncate">{{ authStore.user?.email }}</p>
                        </div>

                        <div class="p-1.5 flex flex-col gap-0.5">
                            <button @click="openSettings('avatar')"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left">
                                <i class="pi pi-user text-[var(--text-muted)] text-sm"></i> Profile Settings
                            </button>
                            <button @click="openSettings('password')"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left">
                                <i class="pi pi-lock text-[var(--text-muted)] text-sm"></i> Change Password
                            </button>
                            <div class="h-px bg-[var(--border-main)] my-1"></div>
                            <button @click="authStore.logout()"
                                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
                                <i class="pi pi-power-off text-sm"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- ── Breadcrumb ─────────────────────────────────────────────── -->
        <div class="bg-[var(--surface)] border-b border-[var(--border-main)]">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                <i class="pi pi-home text-[9px]"></i>
                <span>Applicant Workspace</span>
                <i class="pi pi-angle-right text-[9px]"></i>
                <span class="text-[var(--text-main)]">{{ $route.name || 'Overview' }}</span>
            </div>
        </div>

        <!-- ── Page Content ───────────────────────────────────────────── -->
        <main class="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <RouterView v-slot="{ Component }">
                <transition name="page-fade" mode="out-in">
                    <KeepAlive>
                        <component :is="Component" :key="$route.name" />
                    </KeepAlive>
                </transition>
            </RouterView>
        </main>

        <!-- ── Footer ────────────────────────────────────────────────── -->
        <footer class="border-t border-[var(--border-main)] bg-[var(--surface)] mt-auto">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-[var(--text-muted)]">
                <p>© {{ new Date().getFullYear() }} DepEd Division of Guihulngan City</p>
                <div class="flex gap-5">
                    <a href="#" class="hover:text-[var(--text-main)] transition-colors">Privacy</a>
                    <a href="#" class="hover:text-[var(--text-main)] transition-colors">Support</a>
                </div>
            </div>
        </footer>
    </div>

    <!-- ── Settings Modal ─────────────────────────────────────────────────── -->
    <Teleport to="body">
        <div v-if="showSettingsModal"
            class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in"
            @click.self="showSettingsModal = false">

            <div class="bg-[var(--surface)] border border-[var(--border-main)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in">

                <!-- Header -->
                <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                    <h3 class="text-base font-bold text-[var(--text-main)]">Account Settings</h3>
                    <button @click="showSettingsModal = false" class="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                    <button v-for="tab in ['avatar', 'password']" :key="tab" @click="settingsTab = tab"
                        :class="['flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-colors',
                            settingsTab === tab
                                ? 'text-[var(--text-main)] border-b-2 border-[var(--text-main)] bg-[var(--surface)]'
                                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]']">
                        <i :class="['pi mr-1.5 text-[11px]', tab === 'avatar' ? 'pi-user' : 'pi-lock']"></i>
                        {{ tab === 'avatar' ? 'Profile Photo' : 'Password' }}
                    </button>
                </div>

                <!-- Tab: Avatar -->
                <div v-if="settingsTab === 'avatar'" class="p-6 flex flex-col items-center gap-4">
                    <div class="relative group cursor-pointer" @click="triggerFileSelect">
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'U')}&background=E2E8F0&color=334155&bold=true`"
                            class="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-main)]" />
                        <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                            <i v-if="!uploading" class="pi pi-camera text-white text-xl"></i>
                            <i v-else class="pi pi-spin pi-spinner text-white text-xl"></i>
                        </div>
                    </div>
                    <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="onFileSelect" />
                    <button @click="triggerFileSelect" :disabled="uploading"
                        class="h-9 px-5 rounded-lg bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
                        <i v-if="uploading" class="pi pi-spin pi-spinner text-xs"></i>
                        <i v-else class="pi pi-upload text-xs"></i>
                        {{ uploading ? 'Uploading...' : 'Upload Photo' }}
                    </button>
                    <p class="text-xs text-[var(--text-muted)]">JPG, PNG, GIF · Max 10MB</p>
                </div>

                <!-- Tab: Password -->
                <div v-if="settingsTab === 'password'" class="p-6 flex flex-col gap-4">
                    <div v-if="authStore.user?.googleId"
                        class="flex items-start gap-3 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-700">
                        <i class="pi pi-info-circle mt-0.5 flex-shrink-0"></i>
                        <p class="text-sm">Your account uses Google Sign-In. Manage your password in Google account settings.</p>
                    </div>
                    <template v-else>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Current Password</label>
                            <div class="relative">
                                <input v-model="passwordData.currentPassword" :type="showCurrentPw ? 'text' : 'password'" placeholder="••••••••"
                                    class="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)]" />
                                <button type="button" @click="showCurrentPw = !showCurrentPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                    <i :class="['pi text-sm', showCurrentPw ? 'pi-eye-slash' : 'pi-eye']"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">New Password</label>
                            <div class="relative">
                                <input v-model="passwordData.newPassword" :type="showNewPw ? 'text' : 'password'" placeholder="Min. 8 characters"
                                    class="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)]" />
                                <button type="button" @click="showNewPw = !showNewPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                    <i :class="['pi text-sm', showNewPw ? 'pi-eye-slash' : 'pi-eye']"></i>
                                </button>
                            </div>
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Confirm Password</label>
                            <div class="relative">
                                <input v-model="passwordData.confirmPassword" :type="showConfirmPw ? 'text' : 'password'" placeholder="••••••••"
                                    class="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm text-[var(--text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--text-main)]/10 focus:border-[var(--text-main)]" />
                                <button type="button" @click="showConfirmPw = !showConfirmPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                    <i :class="['pi text-sm', showConfirmPw ? 'pi-eye-slash' : 'pi-eye']"></i>
                                </button>
                            </div>
                        </div>
                        <button @click="handlePasswordUpdate" :disabled="isSaving"
                            class="w-full h-10 mt-2 bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                            <i v-if="isSaving" class="pi pi-spin pi-spinner text-sm"></i>
                            <i v-else class="pi pi-save text-sm"></i>
                            {{ isSaving ? 'Saving...' : 'Update Password' }}
                        </button>
                    </template>
                </div>

            </div>
        </div>
    </Teleport>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
.page-fade-enter-from { opacity: 0; transform: translateY(6px); }
.page-fade-leave-to { opacity: 0; transform: translateY(-6px); }

.animate-fade-in { animation: fadeIn 0.15s ease-out; }
.animate-zoom-in { animation: zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1); }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes zoomIn {
    from { opacity: 0; transform: scale(0.96) translateY(-8px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
}
</style>
