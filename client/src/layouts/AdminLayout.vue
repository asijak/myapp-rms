<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import AdminTopbar from '@/components/AdminTopbar.vue'

// --- CUSTOM TOAST SYSTEM ---
const toastData = ref({ show: false, title: '', message: '', type: 'success' })
const showToast = (title, message, type = 'success') => {
    toastData.value = { show: true, title, message, type }
    setTimeout(() => { toastData.value.show = false }, 3000)
}

// Global UI State
const isCollapsed = ref(false)
const isHovered = ref(false)
</script>

<template>
    <div
        class="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans selection:bg-[var(--color-solar)] selection:text-black">

        <div class="fixed top-4 right-4 z-[200] transition-all duration-300 transform"
            :class="toastData.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'">
            <div class="bg-[var(--surface)] border-l-4 rounded-lg shadow-xl p-4 flex items-start gap-3 w-80 border border-y-[var(--border-main)] border-r-[var(--border-main)]"
                :class="toastData.type === 'error' ? 'border-l-rose-500' : 'border-l-[var(--color-solar)]'">
                <div class="flex-1">
                    <h4 class="text-sm font-bold text-[var(--text-main)]">{{ toastData.title }}</h4>
                    <p class="text-xs text-[var(--text-muted)] mt-0.5">{{ toastData.message }}</p>
                </div>
                <button @click="toastData.show = false" class="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>

        <AdminSidebar v-model:isHovered="isHovered" :isCollapsed="isCollapsed" />

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

            <AdminTopbar v-model:isCollapsed="isCollapsed" @show-toast="showToast" />

            <main class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                <router-view v-slot="{ Component }">
                    <transition name="page-fade" mode="out-in">
                        <div class="max-w-7xl mx-auto w-full">
                            <component :is="Component" />
                        </div>
                    </transition>
                </router-view>
            </main>
        </div>
    </div>
</template>

<style scoped>
.page-fade-enter-active,
.page-fade-leave-active {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.page-fade-enter-from {
    opacity: 0;
    transform: translateY(8px);
}

.page-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>