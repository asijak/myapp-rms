<script setup>
const props = defineProps({
    title:     String,
    subtitle:  String,
    backTo:    String,
    backLabel: { type: String, default: 'Back' },
    border:    Boolean, // adds bottom border + margin
})
</script>

<template>
    <div :class="[
        'flex flex-col sm:flex-row sm:items-start justify-between gap-4',
        border ? 'pb-5 mb-6 border-b border-[var(--border-main)]' : '',
    ]">
        <!-- Left: title + back -->
        <div class="flex flex-col gap-1.5 min-w-0">
            <router-link
                v-if="backTo"
                :to="backTo"
                class="w-fit flex items-center gap-1.5 text-[11px] font-semibold text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors mb-0.5">
                <i class="pi pi-arrow-left text-[10px]"></i>
                {{ backLabel }}
            </router-link>

            <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-xl font-bold text-[var(--text-main)] tracking-tight leading-tight">
                    {{ title }}
                </h1>
                <slot name="badge" />
            </div>

            <p v-if="subtitle" class="text-sm text-[var(--text-muted)] leading-relaxed">{{ subtitle }}</p>
        </div>

        <!-- Right: action buttons -->
        <div v-if="$slots.actions" class="flex items-center gap-2 flex-shrink-0">
            <slot name="actions" />
        </div>
    </div>
</template>
