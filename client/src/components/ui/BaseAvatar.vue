<script setup>
import { computed } from 'vue'

const props = defineProps({
    src:    String,
    name:   String,
    size:   { type: String, default: 'md' }, // xs|sm|md|lg|xl|2xl
    online: { type: Boolean, default: undefined }, // undefined = no indicator
    square: Boolean,
    alt:    String,
})

const SIZES = {
    xs:  { box: 'w-6  h-6',  text: 'text-[9px]',  dot: 'w-1.5 h-1.5 border'   },
    sm:  { box: 'w-8  h-8',  text: 'text-xs',      dot: 'w-2   h-2   border'   },
    md:  { box: 'w-9  h-9',  text: 'text-sm',      dot: 'w-2.5 h-2.5 border-2' },
    lg:  { box: 'w-12 h-12', text: 'text-base',    dot: 'w-3   h-3   border-2' },
    xl:  { box: 'w-16 h-16', text: 'text-xl',      dot: 'w-3.5 h-3.5 border-2' },
    '2xl': { box: 'w-20 h-20', text: 'text-2xl',   dot: 'w-4   h-4   border-2' },
}

const PALETTE = [
    'bg-blue-100   text-blue-700',
    'bg-violet-100 text-violet-700',
    'bg-green-100  text-green-700',
    'bg-amber-100  text-amber-700',
    'bg-rose-100   text-rose-700',
    'bg-cyan-100   text-cyan-700',
    'bg-indigo-100 text-indigo-700',
    'bg-emerald-100 text-emerald-700',
]

const initials = computed(() => {
    if (!props.name) return '?'
    const parts = props.name.trim().split(/\s+/)
    if (parts.length === 1) return parts[0][0].toUpperCase()
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
})

const color = computed(() => {
    if (!props.name) return 'bg-slate-100 text-slate-500'
    let hash = 0
    for (const ch of props.name) hash = ch.charCodeAt(0) + ((hash << 5) - hash)
    return PALETTE[Math.abs(hash) % PALETTE.length]
})

const s = computed(() => SIZES[props.size] ?? SIZES.md)
</script>

<template>
    <div class="relative inline-flex flex-shrink-0">
        <div :class="[s.box, props.square ? 'rounded-lg' : 'rounded-full', 'overflow-hidden border border-[var(--border-main)]']">
            <img
                v-if="src"
                :src="src"
                :alt="alt || name"
                class="w-full h-full object-cover" />
            <div
                v-else
                :class="['w-full h-full flex items-center justify-center font-bold', color]">
                <span :class="s.text">{{ initials }}</span>
            </div>
        </div>

        <span
            v-if="online !== undefined"
            :class="[
                'absolute -bottom-0.5 -right-0.5 rounded-full border-[var(--surface)]',
                s.dot,
                online ? 'bg-green-500' : 'bg-slate-400',
            ]">
        </span>
    </div>
</template>
