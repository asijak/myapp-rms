<script setup>
const props = defineProps({
    modelValue: String,
    tabs:       { type: Array, default: () => [] }, // [{key, label, icon?, badge?}]
    variant:    { type: String, default: 'line' },  // line|pill
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
    <!-- ── Line variant ── -->
    <div
        v-if="variant === 'line'"
        class="flex border-b border-[var(--border-main)] gap-0"
        role="tablist">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :aria-selected="modelValue === tab.key"
            :disabled="tab.disabled"
            @click="!tab.disabled && emit('update:modelValue', tab.key)"
            :class="[
                'relative flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold',
                'transition-colors duration-150 select-none -mb-px border-b-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-primary-ring)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                modelValue === tab.key
                    ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text-main)] hover:border-[var(--border-strong)]',
            ]">
            <i v-if="tab.icon" :class="['pi', `pi-${tab.icon}`, 'text-[11px]']"></i>
            {{ tab.label }}
            <span
                v-if="tab.badge !== undefined"
                :class="[
                    'text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center',
                    modelValue === tab.key
                        ? 'bg-[var(--color-primary-light)] text-[var(--color-primary)]'
                        : 'bg-[var(--bg-app)] text-[var(--text-muted)]',
                ]">
                {{ tab.badge }}
            </span>
        </button>
    </div>

    <!-- ── Pill variant ── -->
    <div
        v-else-if="variant === 'pill'"
        class="flex gap-1 p-1 bg-[var(--bg-app)] rounded-xl border border-[var(--border-main)]"
        role="tablist">
        <button
            v-for="tab in tabs"
            :key="tab.key"
            role="tab"
            :aria-selected="modelValue === tab.key"
            :disabled="tab.disabled"
            @click="!tab.disabled && emit('update:modelValue', tab.key)"
            :class="[
                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg',
                'transition-all duration-150 select-none flex-1 justify-center',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-ring)]',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                modelValue === tab.key
                    ? 'bg-[var(--surface)] text-[var(--text-main)] shadow-sm shadow-black/5'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]',
            ]">
            <i v-if="tab.icon" :class="['pi', `pi-${tab.icon}`, 'text-[10px]']"></i>
            {{ tab.label }}
        </button>
    </div>
</template>
