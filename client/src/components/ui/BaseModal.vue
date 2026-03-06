<script setup>
import { watch, onUnmounted } from 'vue'

const props = defineProps({
    modelValue: Boolean,
    title:      String,
    subtitle:   String,
    size:       { type: String, default: 'md' }, // sm|md|lg|xl|full
    closable:   { type: Boolean, default: true },
    scrollable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'close'])

const close = () => {
    if (!props.closable) return
    emit('update:modelValue', false)
    emit('close')
}

const SIZES = {
    sm:   'max-w-md',
    md:   'max-w-lg',
    lg:   'max-w-2xl',
    xl:   'max-w-4xl',
    full: 'max-w-[95vw]',
}

watch(() => props.modelValue, (v) => {
    document.body.style.overflow = v ? 'hidden' : ''
})

onUnmounted(() => { document.body.style.overflow = '' })

const onKeydown = (e) => { if (e.key === 'Escape') close() }
watch(() => props.modelValue, (v) => {
    if (v) window.addEventListener('keydown', onKeydown)
    else   window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition-opacity duration-200 ease-out"
            leave-active-class="transition-opacity duration-150 ease-in"
            enter-from-class="opacity-0"
            leave-to-class="opacity-0">
            <div
                v-if="modelValue"
                class="fixed inset-0 z-50 flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                @click.self="close">

                <!-- Backdrop -->
                <div class="absolute inset-0 bg-black/40 backdrop-blur-[2px]" @click="close"></div>

                <!-- Panel -->
                <div :class="[
                    'relative w-full bg-[var(--surface)] rounded-2xl',
                    'border border-[var(--border-main)]',
                    'shadow-2xl shadow-black/20',
                    'flex flex-col overflow-hidden max-h-[90vh]',
                    'animate-zoom-in',
                    SIZES[size] ?? SIZES.md,
                ]">
                    <!-- Header -->
                    <div
                        v-if="title || $slots.header"
                        class="flex items-start justify-between px-6 py-4 border-b border-[var(--border-main)] flex-shrink-0 gap-4">
                        <slot name="header">
                            <div>
                                <h3 class="text-base font-bold text-[var(--text-main)] leading-tight">{{ title }}</h3>
                                <p v-if="subtitle" class="text-xs text-[var(--text-muted)] mt-0.5">{{ subtitle }}</p>
                            </div>
                        </slot>
                        <button
                            v-if="closable"
                            @click="close"
                            class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] transition-colors"
                            aria-label="Close">
                            <i class="pi pi-times text-sm"></i>
                        </button>
                    </div>

                    <!-- Body -->
                    <div :class="['flex-1 px-6 py-5', scrollable ? 'overflow-y-auto custom-scrollbar' : '']">
                        <slot />
                    </div>

                    <!-- Footer -->
                    <div
                        v-if="$slots.footer"
                        class="px-6 py-4 border-t border-[var(--border-main)] flex-shrink-0 bg-[var(--bg-app)]">
                        <slot name="footer" />
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>
