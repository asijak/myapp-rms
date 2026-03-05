<script setup>
import { ref, reactive } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useToast } from 'primevue/usetoast';
import apiClient from '@/api/axios';

// Cropper Imports
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

const authStore = useAuthStore();
const toast = useToast();
// UI State
const showSettingsModal = ref(false)
const showUserDropdown = ref(false)
const uploading = ref(false)
const isSaving = ref(false)


// Cropping Logic
const fileInput = ref(null);
const selectedImage = ref(null);
const cropperRef = ref(null);

// Password Form
const passwordData = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
});

const navLinks = [
    { name: 'Dashboard', to: '/user/dashboard', icon: 'pi-home' },
    { name: 'Applications', to: '/user/applications', icon: 'pi-folder-open' },
    { name: 'Find Jobs', to: '/vacancies', icon: 'pi-search' },
];

const triggerFileSelect = () => fileInput.value.click();


const onFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;


    if (file.size > 10 * 1024 * 1024) {
        toast.add({ severity: 'error', summary: 'File Too Large', detail: 'Max size is 10MB', life: 3000 });
        return;
    }

    if (file.type === 'image/gif') {

        uploadOriginalFile(file);
    } else {
        selectedImage.value = URL.createObjectURL(file);
    }
};


const uploadOriginalFile = async (file) => {
    const formData = new FormData();

    formData.append('avatar', file, file.name);

    uploading.value = true;
    try {

        const { data } = await apiClient.patch('/auth/update-avatar', formData);
        if (data.status === 'success') {
            updateUserInStore(data.user);
        }
    } catch (err) {
        console.error("Upload Error:", err.response?.data || err.message);
        toast.add({
            severity: 'error',
            summary: 'Upload Failed',
            detail: err.response?.data?.message || 'Server connection error'
        });
    } finally {
        uploading.value = false;

        if (fileInput.value) fileInput.value.value = '';
    }
};


const uploadCroppedImage = async () => {
    const result = cropperRef.value.getResult();
    if (!result || !result.canvas) return;

    result.canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('avatar', blob, 'avatar.jpg');

        uploading.value = true;
        try {
            const { data } = await apiClient.patch('/auth/update-avatar', formData);
            if (data.status === 'success') {
                updateUserInStore(data.user);
            }
        } catch (err) {
            toast.add({ severity: 'error', summary: 'Upload Failed', detail: err.response?.data?.message });
        } finally {
            uploading.value = false;
        }
    }, 'image/jpeg', 0.9);
};

// 4. CENTRAL STORE UPDATE
const updateUserInStore = (userData) => {
    const updatedUser = { ...userData };
    updatedUser.avatarUrl = `${updatedUser.avatarUrl}?t=${Date.now()}`;
    authStore.user = updatedUser;

    toast.add({ severity: 'success', summary: 'Success', detail: 'Profile picture updated', life: 3000 });
    selectedImage.value = null;
};

const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        toast.add({ severity: 'error', detail: 'Passwords do not match', life: 3000 });
        return;
    }

    isSaving.value = true;
    try {
        await apiClient.patch('/auth/update-password', {
            currentPassword: passwordData.currentPassword,
            newPassword: passwordData.newPassword
        });

        toast.add({ severity: 'success', summary: 'Success', detail: 'Password updated', life: 3000 });
        showSettingsModal.value = false;
        Object.assign(passwordData, { currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
        toast.add({ severity: 'error', detail: err.response?.data?.message || 'Update failed', life: 4000 });
    } finally {
        isSaving.value = false;
    }
};
</script>

<template>
    <<<<<<< Updated upstream <div
        class="min-h-screen flex flex-col bg-slate-50 font-inter text-sm text-slate-600 antialiased">
        <Toast />

        <header
            class="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 h-14 flex items-center px-4 sm:px-6 lg:px-8 justify-between">
            <div class="flex items-center gap-6">
                <router-link to="/" class="flex items-center gap-2.5 group">
                    <div
                        class="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-500 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
                        <i class="pi pi-send text-white text-[10px]"></i>
                    </div>
                    <span class="text-[15px] font-bold tracking-tight text-slate-800">
                        RSP <span class="text-sky-600 font-medium">Portal</span>
                        =======
                        <div
                            class="min-h-screen flex flex-col bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased selection:bg-[var(--color-solar)] selection:text-black">
                            <Toast />

                            <header
                                class="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border-main)] h-16 flex items-center px-6 justify-between transition-all">
                                <div class="flex items-center gap-8 h-full">
                                    <router-link to="/" class="flex items-center gap-3 group">
                                        <div
                                            class="w-9 h-9 rounded-xl bg-[#0F172A] dark:bg-[var(--color-solar)] flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-active:scale-95">
                                            <i class="pi pi-file-edit text-white dark:text-black text-sm"></i>
                                        </div>
                                        <span class="text-base font-bold tracking-tight text-[var(--text-main)]">
                                            RSP <span class="text-[var(--text-muted)] font-medium">Portal</span>
                                            >>>>>>> Stashed changes
                                        </span>
                                    </router-link>

                                    <nav class="hidden md:flex items-center gap-1">
                                        <router-link v-for="link in navLinks" :key="link.to" :to="link.to" <<<<<<<
                                            Updated upstream
                                            class="flex items-center gap-2 px-4 h-14 rounded-md text-slate-500 font-semibold text-[13px] transition-all hover:text-sky-600 hover:bg-slate-50 aria-[current=page]:text-sky-600 aria-[current=page]:bg-sky-50/50">
                                            <i class="pi text-[11px]" :class="link.icon"></i>
                                            <span>{{ link.name }}</span>
                                            =======
                                            class="relative flex items-center gap-2 px-4 h-full text-[var(--text-muted)]
                                            font-medium text-sm transition-colors hover:text-[var(--text-main)]
                                            hover:bg-[var(--bg-app)] aria-[current=page]:text-[var(--text-main)]
                                            aria-[current=page]:font-semibold overflow-hidden group">
                                            <i class="pi text-xs transition-transform group-hover:-translate-y-px"
                                                :class="link.icon"></i>
                                            <span>{{ link.name }}</span>
                                            <div
                                                class="absolute bottom-0 left-0 w-full h-[2px] bg-[var(--text-main)] rounded-t-full scale-x-0 opacity-0 aria-[current=page]:scale-x-100 aria-[current=page]:opacity-100 transition-all duration-300 origin-center">
                                            </div>
                                            >>>>>>> Stashed changes
                                        </router-link>
                                    </nav>
                                </div>

                                <div class="flex items-center gap-3">
                                    <<<<<<< Updated upstream <Button icon="pi pi-bell" severity="secondary"
                                        variant="text" size="small" class="!w-9 !h-9 rounded-full" />

                                    <div class="h-8 w-px bg-slate-200"></div>

                                    <div class="relative group">
                                        <button
                                            class="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                                            <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                                                class="!w-8 !h-8 border border-slate-200 shadow-sm" />
                                            <i class="pi pi-chevron-down text-[10px] text-slate-400"></i>
                                        </button>

                                        <div
                                            class="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-50 overflow-hidden">
                                            <div class="p-4 border-b border-slate-50 bg-slate-50/50">
                                                <p class="text-[13px] font-bold text-slate-800 truncate capitalize">{{
                                                    authStore.user?.username }}</p>
                                                <p class="text-[11px] text-slate-500 truncate">{{ authStore.user?.email
                                                    }}</p>
                                            </div>

                                            <div class="p-1.5">
                                                <button @click="showSettingsModal = true"
                                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-slate-50 hover:text-sky-600 transition-colors">
                                                    <i class="pi pi-cog text-[14px]"></i>
                                                    <span class="text-[12px] font-semibold">Settings</span>
                                                    =======
                                                    <button
                                                        class="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors relative">
                                                        <i class="pi pi-bell"></i>
                                                        <span
                                                            class="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[var(--surface)]"></span>
                                                    </button>

                                                    <div class="h-5 w-[1px] bg-[var(--border-main)] hidden sm:block">
                                                    </div>

                                                    <div class="relative">
                                                        <button @click="showUserDropdown = !showUserDropdown"
                                                            @blur="setTimeout(() => showUserDropdown = false, 200)"
                                                            class="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg hover:bg-[var(--bg-app)] transition-colors border border-transparent focus:outline-none focus:border-[var(--border-main)] group">
                                                            <img :src="authStore.user?.avatarUrl"
                                                                class="w-8 h-8 rounded-md bg-[var(--bg-app)] object-cover border border-[var(--border-main)]" />
                                                            <i class="pi pi-chevron-down text-[10px] text-[var(--text-muted)] hidden sm:block transition-transform duration-300"
                                                                :class="{ 'rotate-180': showUserDropdown }"></i>
                                                        </button>

                                                        <div :class="[
                                                            'absolute right-0 mt-2 w-56 bg-[var(--surface)] border border-[var(--border-main)] shadow-xl rounded-xl transition-all overflow-hidden z-50',
                                                            showUserDropdown ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
                                                        ]">
                                                            <div class="p-4 border-b border-[var(--border-main)]">
                                                                <p
                                                                    class="text-sm font-semibold text-[var(--text-main)] truncate capitalize">
                                                                    {{
                                                                    authStore.user?.username }}</p>
                                                                <p
                                                                    class="text-xs text-[var(--text-muted)] truncate mt-0.5">
                                                                    {{ authStore.user?.email }}</p>
                                                            </div>
                                                            <div class="p-2">
                                                                <button @click="showSettingsModal = true"
                                                                    class="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-main)] flex items-center gap-3 transition-colors">
                                                                    <i class="pi pi-cog text-[var(--text-muted)]"></i>
                                                                    Account Settings
                                                                    >>>>>>> Stashed changes
                                                                </button>

                                                                <div class="h-px bg-slate-100 my-1"></div>

                                                                <button @click="authStore.logout" <<<<<<< Updated
                                                                    upstream
                                                                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                                                    <i class="pi pi-power-off text-[14px]"></i>
                                                                    <span class="text-[12px] font-bold">Logout</span>
                                                                    =======
                                                                    class="w-full text-left px-3 py-2 text-sm rounded-lg
                                                                    hover:bg-rose-50 dark:hover:bg-rose-500/10
                                                                    text-rose-600 dark:text-rose-400 flex items-center
                                                                    gap-3 transition-colors mt-1">
                                                                    <i class="pi pi-power-off"></i> Sign Out
                                                                    >>>>>>> Stashed changes
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                            </div>
                            </header>

                            <<<<<<< Updated upstream <div
                                class="bg-white/80 backdrop-blur-sm border-b border-slate-200">
                                <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
                                    <div
                                        class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                                        <span>Applicant Workspace</span>
                                        <i class="pi pi-angle-right text-[8px]"></i>
                                        <span class="text-sky-600">{{ $route.name || 'Overview' }}</span>
                                        =======
                                        <div
                                            class="bg-[var(--surface)] border-b border-[var(--border-main)] relative z-20">
                                            <div class="max-w-7xl mx-auto px-6 py-3">
                                                <div
                                                    class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-muted)]">
                                                    <span>Applicant Workspace</span>
                                                    <i class="pi pi-angle-right text-[8px] opacity-50"></i>
                                                    <span class="text-[var(--text-main)]">{{ $route.name || 'Overview'
                                                        }}</span>
                                                    >>>>>>> Stashed changes
                                                </div>
                                            </div>
                                        </div>

                                        <main class="max-w-7xl mx-auto px-6 py-8 flex-1 w-full">
                                            <slot />
                                        </main>

                                        <<<<<<< Updated upstream <Dialog v-model:visible="showSettingsModal" modal
                                            header="Account Settings" :style="{ width: '30rem' }" class="font-inter">
                                            <div v-if="authStore.user">
                                                <div v-if="selectedImage" class="space-y-4 pt-2">
                                                    <div
                                                        class="border rounded-xl overflow-hidden bg-slate-900 h-64 shadow-inner">
                                                        <cropper ref="cropperRef" class="h-full" :src="selectedImage"
                                                            :stencil-props="{ aspectRatio: 1 }" />
                                                    </div>
                                                    <div class="flex justify-end gap-2">
                                                        <Button label="Cancel" severity="secondary" text
                                                            @click="selectedImage = null" class="!text-xs" />
                                                        <Button label="Upload Photo" :loading="uploading"
                                                            severity="primary" @click="uploadCroppedImage"
                                                            class="!text-xs !bg-sky-600 !border-none px-6" />
                                                    </div>
                                                </div>

                                                <div v-else class="space-y-6 pt-4">
                                                    <div class="flex flex-col items-center gap-3">
                                                        <div class="relative group cursor-pointer"
                                                            @click="triggerFileSelect">
                                                            <Avatar :image="authStore.user?.avatarUrl" shape="circle"
                                                                class="!w-20 !h-20 border-2 border-white shadow-md bg-slate-100" />
                                                            <div
                                                                class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                                                <i v-if="!uploading"
                                                                    class="pi pi-camera text-white"></i>
                                                                <i v-else class="pi pi-spin pi-spinner text-white"></i>
                                                            </div>
                                                        </div>
                                                        <input type="file" ref="fileInput" class="hidden"
                                                            accept="image/*" @change="onFileSelect" />
                                                        <p class="text-[10px] font-bold text-slate-400 uppercase">
                                                            {{ uploading ? 'Uploading Animation...' : 'Change Profile
                                                            Picture' }}
                                                        </p>
                                                    </div>

                                                    <div class="h-px bg-slate-100"></div>

                                                    <div class="space-y-4">
                                                        <p
                                                            class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                            Security Settings</p>

                                                        <div v-if="authStore.user?.googleId"
                                                            class="p-4 bg-sky-50 rounded-xl border border-sky-100 flex items-start gap-3">
                                                            <i class="pi pi-google text-sky-600 mt-0.5"></i>
                                                            <p class="text-[11px] text-sky-700 leading-relaxed">
                                                                Your account is secured via Google. Passwords are
                                                                managed in your Google security
                                                                settings.
                                                            </p>
                                                        </div>

                                                        <div v-else class="space-y-3">
                                                            <div class="flex flex-col gap-1.5">
                                                                <label
                                                                    class="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Current
                                                                    Password</label>
                                                                <InputText v-model="passwordData.currentPassword"
                                                                    type="password" size="small" class="!bg-slate-50" />
                                                            </div>
                                                            <div class="flex flex-col gap-1.5">
                                                                <label
                                                                    class="text-[11px] font-bold text-slate-500 uppercase tracking-tight">New
                                                                    Password</label>
                                                                <InputText v-model="passwordData.newPassword"
                                                                    type="password" size="small" class="!bg-slate-50" />
                                                            </div>
                                                            <div class="flex flex-col gap-1.5">
                                                                <label
                                                                    class="text-[11px] font-bold text-slate-500 uppercase tracking-tight">Confirm
                                                                    New
                                                                    Password</label>
                                                                <InputText v-model="passwordData.confirmPassword"
                                                                    type="password" size="small" class="!bg-slate-50" />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div class="flex justify-end gap-2 pt-4">
                                                        <Button label="Close" severity="secondary" text
                                                            @click="showSettingsModal = false" class="!text-xs" />
                                                        <Button v-if="!authStore.user?.googleId" label="Update Security"
                                                            :loading="isSaving" severity="primary"
                                                            @click="handlePasswordUpdate"
                                                            class="!text-xs !bg-sky-600 !border-none px-6" />
                                                    </div>
                                                </div>
                                            </div>
                                            </Dialog>

                                            <footer class="border-t border-slate-200 bg-white mt-auto">
                                                <div
                                                    class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <p>© 2026 DepEd Guihulngan Division</p>
                                                    <div class="flex gap-6">
                                                        <a href="#"
                                                            class="hover:text-sky-600 transition-colors">Privacy</a>
                                                        <a href="#"
                                                            class="hover:text-sky-600 transition-colors">Support</a>
                                                    </div>
                                                </div>
                                            </footer>
                                            =======
                                            <footer class="mt-auto">
                                                <div
                                                    class="max-w-7xl mx-auto px-6 py-6 border-t border-[var(--border-main)] flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
                                                    <p>© 2026 DepEd Guihulngan Division SDO</p>
                                                    <div class="flex gap-6">
                                                        <a href="#"
                                                            class="hover:text-[var(--text-main)] transition-colors">Privacy
                                                            Policy</a>
                                                        <a href="#"
                                                            class="hover:text-[var(--text-main)] transition-colors">Applicant
                                                            Support</a>
                                                    </div>
                                                </div>
                                            </footer>

                                            <div v-if="showSettingsModal"
                                                class="fixed inset-0 z-[100] flex items-center justify-center p-4">
                                                <div @click="showSettingsModal = false"
                                                    class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
                                                </div>

                                                <div
                                                    class="relative w-full max-w-md bg-[var(--surface)] border border-[var(--border-main)] shadow-2xl rounded-2xl overflow-hidden animate-zoom-in">
                                                    <div
                                                        class="px-6 py-4 border-b border-[var(--border-main)] flex justify-between items-center bg-[var(--surface)]">
                                                        <h3 class="text-base font-bold text-[var(--text-main)]">Account
                                                            Settings</h3>
                                                        <button @click="showSettingsModal = false"
                                                            class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-app)] text-[var(--text-muted)] transition-colors">
                                                            <i class="pi pi-times text-sm"></i>
                                                        </button>
                                                    </div>

                                                    <div class="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                                                        <div v-if="authStore.user">

                                                            <div v-if="selectedImage" class="space-y-4 animate-fade-in">
                                                                <p
                                                                    class="text-xs font-semibold text-[var(--text-main)]">
                                                                    Adjust Profile Picture</p>
                                                                <div
                                                                    class="border border-[var(--border-main)] rounded-xl overflow-hidden bg-slate-900 h-64">
                                                                    <cropper ref="cropperRef" class="h-full"
                                                                        :src="selectedImage"
                                                                        :stencil-props="{ aspectRatio: 1 }" />
                                                                </div>
                                                                <div class="flex justify-end gap-3 pt-2">
                                                                    <button @click="selectedImage = null"
                                                                        class="px-4 py-2 text-sm font-semibold border border-[var(--border-main)] bg-[var(--surface)] hover:bg-[var(--bg-app)] text-[var(--text-main)] rounded-lg transition-colors">
                                                                        Cancel
                                                                    </button>
                                                                    <button @click="uploadCroppedImage"
                                                                        :disabled="uploading"
                                                                        class="px-4 py-2 text-sm font-semibold bg-[#0F172A] dark:bg-[var(--color-solar)] dark:text-black text-white rounded-lg hover:brightness-110 transition-all flex items-center gap-2">
                                                                        <i v-if="uploading"
                                                                            class="pi pi-spin pi-spinner text-xs"></i>
                                                                        {{ uploading ? 'Uploading...' : 'Save Photo' }}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            <div v-else class="space-y-8">
                                                                <div class="flex flex-col items-center gap-4">
                                                                    <div class="relative group cursor-pointer"
                                                                        @click="triggerFileSelect">
                                                                        <img :src="authStore.user?.avatarUrl"
                                                                            class="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-main)] shadow-sm transition-transform duration-300 group-hover:scale-105" />
                                                                        <div
                                                                            class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                                                            <i v-if="!uploading"
                                                                                class="pi pi-camera text-white text-xl"></i>
                                                                            <i v-else
                                                                                class="pi pi-spin pi-spinner text-white text-xl"></i>
                                                                        </div>
                                                                    </div>
                                                                    <input type="file" ref="fileInput" class="hidden"
                                                                        accept="image/*" @change="onFileSelect" />
                                                                    <button
                                                                        class="text-xs font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors"
                                                                        @click="triggerFileSelect">
                                                                        {{ uploading ? 'Uploading...' : 'Change Profile
                                                                        Picture' }}
                                                                    </button>
                                                                </div>

                                                                <div class="h-px bg-[var(--border-main)]"></div>

                                                                <div class="space-y-4">
                                                                    <p
                                                                        class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">
                                                                        Security
                                                                    </p>

                                                                    <div v-if="authStore.user?.googleId"
                                                                        class="p-4 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)] flex items-start gap-4">
                                                                        <div
                                                                            class="bg-[var(--surface)] p-2 rounded-lg border border-[var(--border-main)]">
                                                                            <i
                                                                                class="pi pi-google text-[var(--text-main)] text-base"></i>
                                                                        </div>
                                                                        <div>
                                                                            <p
                                                                                class="text-sm font-semibold text-[var(--text-main)]">
                                                                                Google Account</p>
                                                                            <p
                                                                                class="text-xs text-[var(--text-muted)] leading-relaxed mt-1">
                                                                                Your account is secured via Google.
                                                                                Passwords are managed in your Google
                                                                                security settings.
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    <div v-else class="space-y-4">
                                                                        <div class="space-y-1.5">
                                                                            <label
                                                                                class="text-xs font-medium text-[var(--text-muted)]">Current
                                                                                Password</label>
                                                                            <input
                                                                                v-model="passwordData.currentPassword"
                                                                                type="password"
                                                                                class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--text-main)] focus:ring-1 focus:ring-[var(--text-main)] outline-none transition-all" />
                                                                        </div>
                                                                        <div class="space-y-1.5">
                                                                            <label
                                                                                class="text-xs font-medium text-[var(--text-muted)]">New
                                                                                Password</label>
                                                                            <input v-model="passwordData.newPassword"
                                                                                type="password"
                                                                                class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--text-main)] focus:ring-1 focus:ring-[var(--text-main)] outline-none transition-all" />
                                                                        </div>
                                                                        <div class="space-y-1.5">
                                                                            <label
                                                                                class="text-xs font-medium text-[var(--text-muted)]">Confirm
                                                                                Password</label>
                                                                            <input
                                                                                v-model="passwordData.confirmPassword"
                                                                                type="password"
                                                                                class="w-full h-10 px-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)] text-sm focus:border-[var(--text-main)] focus:ring-1 focus:ring-[var(--text-main)] outline-none transition-all" />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div v-if="!selectedImage"
                                                        class="px-6 py-4 bg-[var(--bg-app)] border-t border-[var(--border-main)] flex justify-end gap-3">
                                                        <button @click="showSettingsModal = false"
                                                            class="px-5 py-2 text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
                                                            Close
                                                        </button>
                                                        <button v-if="!authStore.user?.googleId"
                                                            @click="handlePasswordUpdate" :disabled="isSaving"
                                                            class="px-5 py-2 bg-[#0F172A] dark:bg-[var(--color-solar)] dark:text-black text-white text-sm font-semibold rounded-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center gap-2">
                                                            <i v-if="isSaving"
                                                                class="pi pi-spin pi-spinner text-xs"></i>
                                                            {{ isSaving ? 'Saving...' : 'Update Security' }}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            >>>>>>> Stashed changes
                                    </div>
</template>

<style scoped>
<<<<<<< Updated upstream @reference "@/assets/main.css";

.font-inter {
    font-family: 'Inter', sans-serif;

    =======.animate-fade-in {
        animation: fadeIn 0.2s ease-out;
    }

    .animate-zoom-in {
        animation: zoomIn 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }

        to {
            opacity: 1;
        }
    }

    @keyframes zoomIn {
        from {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
        }

        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }

    /* Custom Scrollbar for Modal */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
    }

    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }

    .custom-scrollbar::-webkit-scrollbar-thumb {
        background-color: var(--border-main);
        border-radius: 20px;
        >>>>>>>Stashed changes
    }</style>