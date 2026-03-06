<script setup>
const props = defineProps({
    variant: { type: String, default: 'rect' }, // rect|text|circle|card|row
    lines:   { type: Number, default: 3 },
    count:   { type: Number, default: 1 },
    width:   { type: String, default: '100%' },
    height:  { type: String, default: '2.5rem' },
    class:   String,
})
</script>

<template>
    <!-- Circle -->
    <div v-if="variant === 'circle'"
        class="rounded-full bg-[var(--bg-app)] animate-pulse flex-shrink-0"
        :style="{ width, height: width }">
    </div>

    <!-- Multi-line text -->
    <div v-else-if="variant === 'text'" class="flex flex-col gap-2 w-full">
        <div
            v-for="i in lines" :key="i"
            class="bg-[var(--bg-app)] rounded animate-pulse h-3"
            :style="{ width: i === lines && lines > 1 ? '65%' : '100%' }">
        </div>
    </div>

    <!-- Card skeleton -->
    <div v-else-if="variant === 'card'"
        class="bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5 flex flex-col gap-4">
        <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] animate-pulse flex-shrink-0"></div>
            <div class="flex-1 flex flex-col gap-2">
                <div class="h-3 bg-[var(--bg-app)] rounded animate-pulse w-2/3"></div>
                <div class="h-2.5 bg-[var(--bg-app)] rounded animate-pulse w-1/2"></div>
            </div>
        </div>
        <div class="h-7 bg-[var(--bg-app)] rounded-lg animate-pulse"></div>
        <div class="flex gap-2">
            <div class="h-2.5 bg-[var(--bg-app)] rounded animate-pulse flex-1"></div>
            <div class="h-2.5 bg-[var(--bg-app)] rounded animate-pulse flex-1"></div>
            <div class="h-2.5 bg-[var(--bg-app)] rounded animate-pulse w-1/4"></div>
        </div>
    </div>

    <!-- Table row skeleton -->
    <div v-else-if="variant === 'row'" class="flex flex-col gap-3 w-full">
        <div v-for="i in count" :key="i"
            class="flex items-center gap-4 px-4 py-3 rounded-lg bg-[var(--surface)] border border-[var(--border-main)]">
            <div class="w-8 h-8 rounded-full bg-[var(--bg-app)] animate-pulse flex-shrink-0"></div>
            <div class="flex-1 flex flex-col gap-2">
                <div class="h-3 bg-[var(--bg-app)] rounded animate-pulse w-2/5"></div>
                <div class="h-2.5 bg-[var(--bg-app)] rounded animate-pulse w-1/3"></div>
            </div>
            <div class="h-6 w-16 bg-[var(--bg-app)] rounded-full animate-pulse flex-shrink-0"></div>
        </div>
    </div>

    <!-- Default rect -->
    <div v-else
        class="bg-[var(--bg-app)] rounded-lg animate-pulse"
        :style="{ width, height }">
    </div>
</template>
