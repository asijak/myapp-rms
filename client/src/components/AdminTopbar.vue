<script setup>
import { ref, reactive, onMounted, inject } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRoute } from 'vue-router'
import apiClient from '@/api/axios'

const props = defineProps({ isCollapsed: { type: Boolean, required: true } })
const emit = defineEmits(['update:isCollapsed'])

const authStore = useAuthStore()
const route = useRoute()
const toast = inject('$toast')

const isDark = ref(false)
const showNotifications = ref(false)
const showUserDropdown = ref(false)
const showSettingsModal = ref(false)
const uploading = ref(false)
const isSaving = ref(false)
const fileInput = ref(null)
const showCurrentPw = ref(false)
const showNewPw = ref(false)
const showConfirmPw = ref(false)

const notifications = ref([
    { id: 1, title: 'New Application Received', time: '2 mins ago' },
    { id: 2, title: 'System Update Available', time: '1 hour ago' },
])

const passwordData = reactive({ currentPassword: '', newPassword: '', confirmPassword: '' })

onMounted(() => {
    isDark.value = localStorage.getItem('theme') === 'dark' || document.documentElement.classList.contains('dark')
})

const toggleTheme = () => {
    isDark.value = !isDark.value
    document.documentElement.classList.toggle('dark', isDark.value)
    localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

const triggerFileSelect = () => fileInput.value?.click()

const onFileSelect = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
        toast.fire({ icon: 'error', title: 'File too large', text: 'Max size is 10MB.' })
        return
    }
    const formData = new FormData()
    formData.append('avatar', file, file.name)
    uploading.value = true
    try {
        const { data } = await apiClient.patch('/auth/update-avatar', formData)
        authStore.user = { ...data.user, avatarUrl: `${data.user.avatarUrl}?t=${Date.now()}` }
        toast.fire({ icon: 'success', title: 'Photo updated' })
        showSettingsModal.value = false
    } catch {
        toast.fire({ icon: 'error', title: 'Upload failed' })
    } finally {
        uploading.value = false
        if (fileInput.value) fileInput.value.value = ''
    }
}

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.fire({ icon: 'warning', title: 'Passwords do not match' })
        return
    }
    if (passwordData.newPassword.length < 8) {
        toast.fire({ icon: 'warning', title: 'Password must be at least 8 characters' })
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
        toast.fire({ icon: 'error', title: 'Update failed', text: err.response?.data?.message || 'An error occurred.' })
    } finally {
        isSaving.value = false }
}
</script>

<template>
    <div>
        <header class="h-16 bg-[var(--surface)] border-b border-[var(--border-main)] flex items-center justify-between px-6 z-30 flex-shrink-0">

            <!-- Left: Toggle + Breadcrumb -->
            <div class="flex items-center gap-3">
                <button @click="emit('update:isCollapsed', !isCollapsed)"
                    class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                    <i class="pi pi-bars text-sm"></i>
                </button>
                <div class="h-4 w-px bg-[var(--border-main)] hidden sm:block"></div>
                <nav class="hidden sm:flex items-center gap-2 text-sm">
                    <span class="text-[var(--text-muted)]">Admin</span>
                    <i class="pi pi-angle-right text-[10px] text-[var(--text-muted)]"></i>
                    <span class="font-semibold text-[var(--text-main)] capitalize">{{ route.name || 'Dashboard' }}</span>
                </nav>
            </div>

            <!-- Right: Actions -->
            <div class="flex items-center gap-1">

                <!-- Theme Toggle -->
                <button @click="toggleTheme"
                    class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors"
                    :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
                    <i :class="['pi text-sm', isDark ? 'pi-sun' : 'pi-moon']"></i>
                </button>

                <!-- Notifications -->
                <div class="relative">
                    <button @click="showNotifications = !showNotifications; showUserDropdown = false"
                        class="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors relative">
                        <i class="pi pi-bell text-sm"></i>
                        <span class="absolute top-2 right-2.5 w-1.5 h-1.5 bg-[var(--color-solar)] rounded-full"></span>
                    </button>
                    <div v-if="showNotifications"
                        v-click-outside="() => showNotifications = false"
                        class="absolute right-0 mt-2 w-72 bg-[var(--surface)] shadow-xl border border-[var(--border-main)] rounded-xl z-50 overflow-hidden animate-fade-in">
                        <div class="px-4 py-3 border-b border-[var(--border-main)] flex justify-between items-center">
                            <span class="text-sm font-bold text-[var(--text-main)]">Notifications</span>
                            <button class="text-xs text-[var(--text-muted)] hover:text-[var(--text-main)]">Mark all read</button>
                        </div>
                        <div v-for="n in notifications" :key="n.id"
                            class="px-4 py-3 border-b border-[var(--border-main)] last:border-0 flex items-start gap-3 hover:bg-[var(--bg-app)] cursor-pointer transition-colors">
                            <div class="w-7 h-7 rounded-lg bg-[var(--bg-app)] border border-[var(--border-main)] flex items-center justify-center flex-shrink-0 mt-0.5">
                                <i class="pi pi-info-circle text-xs text-[var(--text-muted)]"></i>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-[var(--text-main)]">{{ n.title }}</p>
                                <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ n.time }}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="w-px h-5 bg-[var(--border-main)] mx-1"></div>

                <!-- User Avatar Dropdown -->
                <div class="relative">
                    <button @click="showUserDropdown = !showUserDropdown; showNotifications = false"
                        class="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-[var(--bg-app)] transition-colors">
                        <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'A')}&background=EAB308&color=000&bold=true`"
                            class="w-8 h-8 rounded-full object-cover border border-[var(--border-main)]" />
                        <span class="hidden md:block text-sm font-medium text-[var(--text-main)] max-w-[100px] truncate capitalize">
                            {{ authStore.user?.username }}
                        </span>
                        <i class="pi pi-chevron-down text-[9px] text-[var(--text-muted)]"></i>
                    </button>

                    <div v-if="showUserDropdown"
                        v-click-outside="() => showUserDropdown = false"
                        class="absolute right-0 mt-2 w-52 bg-[var(--surface)] shadow-xl border border-[var(--border-main)] rounded-xl z-50 overflow-hidden animate-fade-in">
                        <div class="px-4 py-3 border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                            <p class="text-sm font-bold text-[var(--text-main)] truncate capitalize">{{ authStore.user?.username }}</p>
                            <p class="text-xs text-[var(--text-muted)] truncate mt-0.5">{{ authStore.user?.email }}</p>
                        </div>
                        <div class="p-1.5 flex flex-col gap-0.5">
                            <button @click="showSettingsModal = true; showUserDropdown = false"
                                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors text-left">
                                <i class="pi pi-user text-[var(--text-muted)] text-sm"></i> Account Settings
                            </button>
                            <div class="h-px bg-[var(--border-main)] my-1"></div>
                            <button @click="authStore.logout()"
                                class="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left">
                                <i class="pi pi-sign-out text-sm"></i> Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <!-- Settings Modal -->
        <Teleport to="body">
            <div v-if="showSettingsModal"
                class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
                @click.self="showSettingsModal = false">

                <div class="w-full max-w-md bg-[var(--surface)] rounded-2xl shadow-2xl border border-[var(--border-main)] overflow-hidden animate-zoom-in">
                    <!-- Header -->
                    <div class="px-6 py-4 border-b border-[var(--border-main)] flex items-center justify-between">
                        <div>
                            <h3 class="text-base font-bold text-[var(--text-main)]">Account Settings</h3>
                            <p class="text-xs text-[var(--text-muted)] mt-0.5">Update your photo and password</p>
                        </div>
                        <button @click="showSettingsModal = false"
                            class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                            <i class="pi pi-times text-sm"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div class="p-6 flex flex-col gap-6">
                        <!-- Avatar -->
                        <div class="flex flex-col items-center gap-3">
                            <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] self-start">Profile Photo</p>
                            <div class="relative group cursor-pointer" @click="triggerFileSelect">
                                <img :src="authStore.user?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(authStore.user?.username || 'A')}&background=EAB308&color=000&bold=true`"
                                    class="w-20 h-20 rounded-full object-cover border-2 border-[var(--border-main)]" />
                                <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <i v-if="!uploading" class="pi pi-camera text-white text-lg"></i>
                                    <i v-else class="pi pi-spin pi-spinner text-white text-lg"></i>
                                </div>
                            </div>
                            <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="onFileSelect" />
                            <p class="text-xs text-[var(--text-muted)]">Click to upload · JPG, PNG · Max 10MB</p>
                        </div>

                        <!-- Password -->
                        <div v-if="!authStore.user?.googleId" class="flex flex-col gap-3">
                            <p class="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Change Password</p>
                            <div class="relative">
                                <input v-model="passwordData.currentPassword" :type="showCurrentPw ? 'text' : 'password'"
                                    placeholder="Current password"
                                    class="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-solar)]/20 focus:border-[var(--color-solar)] transition-shadow" />
                                <button type="button" @click="showCurrentPw = !showCurrentPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                    <i :class="['pi text-sm', showCurrentPw ? 'pi-eye-slash' : 'pi-eye']"></i>
                                </button>
                            </div>
                            <div class="grid grid-cols-2 gap-3">
                                <div class="relative">
                                    <input v-model="passwordData.newPassword" :type="showNewPw ? 'text' : 'password'"
                                        placeholder="New password"
                                        class="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-solar)]/20 focus:border-[var(--color-solar)] transition-shadow" />
                                    <button type="button" @click="showNewPw = !showNewPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                        <i :class="['pi text-sm', showNewPw ? 'pi-eye-slash' : 'pi-eye']"></i>
                                    </button>
                                </div>
                                <div class="relative">
                                    <input v-model="passwordData.confirmPassword" :type="showConfirmPw ? 'text' : 'password'"
                                        placeholder="Confirm password"
                                        class="w-full h-10 pl-3 pr-10 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-solar)]/20 focus:border-[var(--color-solar)] transition-shadow" />
                                    <button type="button" @click="showConfirmPw = !showConfirmPw" class="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                                        <i :class="['pi text-sm', showConfirmPw ? 'pi-eye-slash' : 'pi-eye']"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div v-if="authStore.user?.googleId"
                            class="flex items-start gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400">
                            <i class="pi pi-info-circle mt-0.5 flex-shrink-0 text-sm"></i>
                            <p class="text-sm">Google account — manage password through Google.</p>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div class="px-6 py-4 border-t border-[var(--border-main)] bg-[var(--bg-app)] flex justify-end gap-3">
                        <button @click="showSettingsModal = false"
                            class="px-4 py-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                            Cancel
                        </button>
                        <button v-if="!authStore.user?.googleId" @click="handlePasswordUpdate" :disabled="isSaving"
                            class="px-5 py-2 bg-[var(--text-main)] text-[var(--surface)] text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity">
                            <i v-if="isSaving" class="pi pi-spin pi-spinner text-xs"></i>
                            {{ isSaving ? 'Saving...' : 'Save Changes' }}
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>
