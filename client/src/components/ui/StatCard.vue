<script setup>
const props = defineProps({
    title:      String,
    value:      [String, Number],
    icon:       String,
    iconColor:  { type: String, default: 'blue' }, // blue|green|purple|amber|red|slate|gold
    trend:      Number,       // positive = up, negative = down, undefined = hidden
    trendLabel: String,       // e.g. 'vs last month'
    description: String,      // alternative to trend
    prefix:     String,       // e.g. '₱'
    suffix:     String,       // e.g. '%'
    loading:    Boolean,
    to:         String,       // makes card a link
})

const ICON_COLORS = {
    blue:   'bg-blue-50 text-[var(--color-primary)] border-blue-100',
    green:  'bg-green-50 text-green-600 border-green-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    amber:  'bg-amber-50 text-amber-600 border-amber-100',
    red:    'bg-red-50 text-red-600 border-red-100',
    slate:  'bg-slate-100 text-slate-600 border-slate-200',
    gold:   'bg-amber-50 text-amber-600 border-amber-100',
    cyan:   'bg-cyan-50 text-cyan-600 border-cyan-100',
}
</script>

<template>
    <component
        :is="to ? 'router-link' : 'div'"
        :to="to"
        :class="[
            'bg-[var(--surface)] border border-[var(--border-main)] rounded-xl p-5',
            'transition-all duration-200',
            to ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md hover:shadow-black/8 hover:border-[var(--border-strong)]' : '',
        ]">

        <!-- Skeleton loader -->
        <div v-if="loading" class="flex flex-col gap-4">
            <div class="flex items-start justify-between">
                <div class="flex flex-col gap-2 flex-1">
                    <div class="h-3 w-20 bg-[var(--bg-app)] rounded animate-pulse"></div>
                    <div class="h-7 w-14 bg-[var(--bg-app)] rounded-lg animate-pulse"></div>
                    <div class="h-3 w-28 bg-[var(--bg-app)] rounded animate-pulse"></div>
                </div>
                <div class="w-10 h-10 rounded-xl bg-[var(--bg-app)] animate-pulse flex-shrink-0"></div>
            </div>
        </div>

        <!-- Content -->
        <div v-else class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
                <!-- Label -->
                <p class="text-[11px] font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2 select-none">
                    {{ title }}
                </p>

                <!-- Value -->
                <p class="text-2xl font-bold text-[var(--text-main)] leading-none tabular-nums">
                    <span v-if="prefix" class="text-base font-semibold text-[var(--text-muted)]">{{ prefix }}</span>
                    {{ value }}
                    <span v-if="suffix" class="text-base font-semibold text-[var(--text-muted)]">{{ suffix }}</span>
                </p>

                <!-- Trend / Description -->
                <div class="flex items-center gap-2 mt-2 min-h-[1.25rem]">
                    <template v-if="trend !== undefined">
                        <span :class="[
                            'inline-flex items-center gap-0.5 text-[11px] font-bold',
                            trend > 0  ? 'text-green-600' :
                            trend < 0  ? 'text-red-500'   : 'text-[var(--text-muted)]',
                        ]">
                            <i :class="['pi text-[10px]',
                                trend > 0 ? 'pi-arrow-up-right' :
                                trend < 0 ? 'pi-arrow-down-right' : 'pi-minus'
                            ]"></i>
                            {{ Math.abs(trend) }}%
                        </span>
                        <span v-if="trendLabel" class="text-[11px] text-[var(--text-muted)]">{{ trendLabel }}</span>
                    </template>
                    <span v-else-if="description" class="text-[11px] text-[var(--text-muted)]">{{ description }}</span>
                </div>
            </div>

            <!-- Icon -->
            <div
                v-if="icon"
                :class="[
                    'w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0',
                    ICON_COLORS[iconColor] ?? ICON_COLORS.blue,
                ]">
                <i :class="['pi text-base', `pi-${icon}`]"></i>
            </div>
        </div>
    </component>
</template>
