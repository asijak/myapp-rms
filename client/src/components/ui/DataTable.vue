<script setup>
import { ref, computed } from 'vue'
import SkeletonLoader from './SkeletonLoader.vue'
import EmptyState from './EmptyState.vue'

const props = defineProps({
    columns: {
        type: Array,
        default: () => [],
        // [{key, label, sortable?, width?, align?, class?}]
    },
    rows:       { type: Array,    default: () => [] },
    loading:    Boolean,
    searchable: Boolean,
    rowKey:     { type: String, default: '_id' },
    stickyHeader: Boolean,
    emptyIcon:    { type: String, default: 'table' },
    emptyTitle:   { type: String, default: 'No data found' },
    emptyDescription: String,
    skeletonRows: { type: Number, default: 5 },
    compact:    Boolean,
})

const emit = defineEmits(['row-click', 'sort'])

const search  = ref('')
const sortKey = ref('')
const sortDir = ref('asc')

const filtered = computed(() => {
    let list = [...props.rows]
    if (props.searchable && search.value) {
        const q = search.value.toLowerCase()
        list = list.filter(row =>
            Object.values(row).some(v => String(v ?? '').toLowerCase().includes(q))
        )
    }
    if (sortKey.value) {
        list.sort((a, b) => {
            const vA = a[sortKey.value] ?? ''
            const vB = b[sortKey.value] ?? ''
            const cmp = String(vA).localeCompare(String(vB), undefined, { numeric: true })
            return sortDir.value === 'asc' ? cmp : -cmp
        })
    }
    return list
})

const toggleSort = (col) => {
    if (!col.sortable) return
    if (sortKey.value === col.key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = col.key
        sortDir.value = 'asc'
    }
    emit('sort', { key: sortKey.value, dir: sortDir.value })
}

const sortIcon = (col) => {
    if (sortKey.value !== col.key) return 'pi-sort'
    return sortDir.value === 'asc' ? 'pi-sort-up' : 'pi-sort-down'
}

const cellPad = computed(() => props.compact ? 'px-4 py-2.5' : 'px-4 py-3.5')
</script>

<template>
    <div class="flex flex-col gap-0 bg-[var(--surface)] border border-[var(--border-main)] rounded-xl overflow-hidden">

        <!-- Toolbar -->
        <div v-if="searchable || $slots.toolbar" class="px-4 py-3 border-b border-[var(--border-main)] flex items-center gap-3 flex-wrap">
            <slot name="toolbar" />
            <div v-if="searchable" class="relative flex-1 min-w-[180px] max-w-xs">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-xs pointer-events-none"></i>
                <input
                    v-model="search"
                    type="text"
                    placeholder="Search..."
                    class="w-full h-8 pl-8 pr-3 rounded-lg border border-[var(--border-main)] bg-[var(--bg-app)] text-sm text-[var(--text-main)] placeholder:text-[var(--text-faint)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-ring)]/25 focus:border-[var(--color-primary)]" />
            </div>
            <slot name="toolbar-right" />
        </div>

        <!-- Loading skeletons -->
        <div v-if="loading" class="divide-y divide-[var(--border-main)]">
            <div v-for="i in skeletonRows" :key="i"
                :class="[cellPad, 'flex items-center gap-4']">
                <div class="w-8 h-8 rounded-full bg-[var(--bg-app)] animate-pulse flex-shrink-0"></div>
                <div class="flex-1 flex flex-col gap-2">
                    <div class="h-3 bg-[var(--bg-app)] rounded animate-pulse w-2/5"></div>
                    <div class="h-2.5 bg-[var(--bg-app)] rounded animate-pulse w-1/3"></div>
                </div>
                <div class="h-6 w-16 bg-[var(--bg-app)] rounded-full animate-pulse"></div>
            </div>
        </div>

        <!-- Empty state -->
        <EmptyState
            v-else-if="filtered.length === 0"
            :icon="emptyIcon"
            :title="emptyTitle"
            :description="emptyDescription"
            compact />

        <!-- Table -->
        <div v-else class="overflow-x-auto">
            <table class="w-full text-sm border-collapse">
                <thead>
                    <tr class="border-b border-[var(--border-main)] bg-[var(--bg-app)]">
                        <th
                            v-for="col in columns"
                            :key="col.key"
                            :class="[
                                cellPad,
                                'text-left font-semibold text-[11px] uppercase tracking-wider text-[var(--text-muted)]',
                                col.sortable ? 'cursor-pointer hover:text-[var(--text-main)] select-none' : '',
                                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
                                col.class ?? '',
                            ]"
                            :style="col.width ? { width: col.width } : {}"
                            @click="toggleSort(col)">
                            <span class="flex items-center gap-1.5" :class="col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : ''">
                                {{ col.label }}
                                <i v-if="col.sortable" :class="['pi text-[9px]', sortIcon(col)]"></i>
                            </span>
                        </th>
                    </tr>
                </thead>

                <tbody class="divide-y divide-[var(--border-main)]">
                    <tr
                        v-for="row in filtered"
                        :key="row[rowKey]"
                        :class="[
                            'transition-colors hover:bg-[var(--bg-app)]',
                            $attrs.onRowClick || $listeners?.['row-click'] ? 'cursor-pointer' : '',
                        ]"
                        @click="emit('row-click', row)">
                        <td
                            v-for="col in columns"
                            :key="col.key"
                            :class="[
                                cellPad,
                                'text-[var(--text-main)]',
                                col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : '',
                                col.cellClass ?? '',
                            ]">
                            <slot :name="`cell-${col.key}`" :row="row" :value="row[col.key]">
                                {{ row[col.key] ?? '—' }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Footer slot (pagination, counts, etc.) -->
        <div v-if="$slots.footer" class="px-4 py-3 border-t border-[var(--border-main)] bg-[var(--bg-app)]">
            <slot name="footer" />
        </div>
    </div>
</template>
