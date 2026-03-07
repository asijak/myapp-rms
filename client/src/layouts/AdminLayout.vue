<script setup>
import { ref } from 'vue'
import AdminSidebar from '@/components/AdminSidebar.vue'
import AdminTopbar from '@/components/AdminTopbar.vue'

const isCollapsed = ref(false)
const isHovered = ref(false)
</script>

<template>
    <div class="flex h-screen bg-[var(--bg-app)] text-[var(--text-main)] font-sans antialiased selection:bg-[var(--color-primary-light)] selection:text-[var(--color-primary-dark)]">

        <AdminSidebar v-model:isHovered="isHovered" :isCollapsed="isCollapsed" />

        <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
            <AdminTopbar v-model:isCollapsed="isCollapsed" />

            <main class="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                <div class="max-w-[88rem] mx-auto w-full">
                    <router-view v-slot="{ Component, route }">
                        <transition name="page-fade" mode="out-in">
                            <component :is="Component" :key="route.path" />
                        </transition>
                    </router-view>
                </div>
            </main>
        </div>
    </div>
</template>
