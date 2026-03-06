<script setup>
const props = defineProps({
    variant: { type: String, default: 'neutral' }, // neutral|primary|success|warning|danger|info|purple|gold
    size:    { type: String, default: 'md' },       // sm|md|lg
    dot:     Boolean,
})

const VARIANTS = {
    neutral: { badge: 'bg-slate-100 text-slate-600 border-slate-200',  dot: 'bg-slate-500'  },
    primary: { badge: 'bg-blue-50 text-blue-700 border-blue-200',       dot: 'bg-blue-600'   },
    success: { badge: 'bg-green-50 text-green-700 border-green-200',    dot: 'bg-green-500'  },
    warning: { badge: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500'  },
    danger:  { badge: 'bg-red-50 text-red-600 border-red-200',          dot: 'bg-red-500'    },
    info:    { badge: 'bg-sky-50 text-sky-700 border-sky-200',          dot: 'bg-sky-500'    },
    purple:  { badge: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    gold:    { badge: 'bg-amber-50 text-amber-700 border-amber-200',    dot: 'bg-amber-500'  },
    orange:  { badge: 'bg-orange-50 text-orange-700 border-orange-200', dot: 'bg-orange-500' },
}

const SIZES = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-[11px] px-2   py-0.5 gap-1.5',
    lg: 'text-xs     px-2.5 py-1   gap-2',
}

const cfg = VARIANTS[props.variant] ?? VARIANTS.neutral
</script>

<template>
    <span :class="[
        'inline-flex items-center rounded-full border font-semibold whitespace-nowrap',
        SIZES[size] ?? SIZES.md,
        cfg.badge,
    ]">
        <span v-if="dot" :class="['rounded-full flex-shrink-0', cfg.dot, size === 'sm' ? 'w-1.5 h-1.5' : 'w-1.5 h-1.5']"></span>
        <slot />
    </span>
</template>
