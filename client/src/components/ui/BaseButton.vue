<script setup>
import { computed } from 'vue'

const props = defineProps({
    variant:   { type: String,  default: 'primary' }, // primary|secondary|ghost|danger|danger-ghost|outline|gold
    size:      { type: String,  default: 'md' },       // xs|sm|md|lg|xl
    loading:   Boolean,
    disabled:  Boolean,
    icon:      String,   // left icon (pi name without 'pi-')
    iconRight: String,   // right icon
    full:      Boolean,  // full width
    as:        { type: String, default: 'button' },
    to:        String,   // for router-link
    type:      { type: String, default: 'button' },
})

const emit = defineEmits(['click'])

const SIZES = {
    xs: 'h-7  px-2.5 text-[11px] gap-1',
    sm: 'h-8  px-3   text-xs     gap-1.5',
    md: 'h-9  px-4   text-sm     gap-2',
    lg: 'h-10 px-5   text-sm     gap-2',
    xl: 'h-11 px-6   text-base   gap-2.5',
}

const ICON_SIZES = {
    xs: 'text-[10px]',
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-[13px]',
    xl: 'text-sm',
}

const VARIANTS = {
    primary:      'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm shadow-blue-900/15 focus-visible:ring-[var(--color-primary-ring)]',
    secondary:    'bg-[var(--surface)] text-[var(--text-main)] border border-[var(--border-main)] hover:bg-[var(--bg-app)] hover:border-[var(--border-strong)] shadow-sm shadow-black/5 focus-visible:ring-[var(--color-primary-ring)]',
    ghost:        'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-app)] focus-visible:ring-[var(--color-primary-ring)]',
    danger:       'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-900/15 focus-visible:ring-red-400',
    'danger-ghost': 'text-red-600 hover:bg-red-50 hover:text-red-700 focus-visible:ring-red-400',
    outline:      'border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary-light)] focus-visible:ring-[var(--color-primary-ring)]',
    gold:         'bg-[var(--color-gold)] text-white hover:opacity-90 shadow-sm shadow-amber-900/15 focus-visible:ring-amber-400',
}

const tag = computed(() => props.to ? 'router-link' : props.as)

const classes = computed(() => [
    'inline-flex items-center justify-center font-semibold rounded-lg',
    'transition-all duration-150 ease-in-out select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    'active:scale-[0.97]',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
    SIZES[props.size] ?? SIZES.md,
    VARIANTS[props.variant] ?? VARIANTS.primary,
    props.full ? 'w-full' : '',
])
</script>

<template>
    <component
        :is="tag"
        v-bind="tag === 'button' ? { type, disabled: disabled || loading } : { to }"
        :class="classes"
        @click="emit('click', $event)">
        <i v-if="loading"             :class="['pi pi-spin pi-spinner', ICON_SIZES[size]]"></i>
        <i v-else-if="icon"           :class="['pi', `pi-${icon}`, ICON_SIZES[size]]"></i>
        <slot />
        <i v-if="iconRight && !loading" :class="['pi', `pi-${iconRight}`, ICON_SIZES[size]]"></i>
    </component>
</template>
