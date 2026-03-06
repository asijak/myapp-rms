<script setup>
const props = defineProps({
    hoverable: Boolean,
    padding:   { type: String, default: 'md' }, // none|sm|md|lg|xl
    as:        { type: String, default: 'div' },
    flush:     Boolean,  // removes border
    to:        String,   // makes it a router-link
})

const PAD = { none: '', sm: 'p-4', md: 'p-5', lg: 'p-6', xl: 'p-8' }
</script>

<template>
    <component
        :is="to ? 'router-link' : as"
        v-bind="to ? { to } : {}"
        :class="[
            'bg-[var(--surface)] rounded-xl',
            !flush ? 'border border-[var(--border-main)]' : '',
            PAD[padding],
            hoverable || to ? [
                'cursor-pointer transition-all duration-200 ease-out',
                'hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/8 hover:border-[var(--border-strong)]',
            ] : '',
        ]">
        <slot />
    </component>
</template>
