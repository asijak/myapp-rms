<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue:  { type: [String, Number], default: '' },
    label:       String,
    placeholder: String,
    hint:        String,
    error:       String,
    disabled:    Boolean,
    required:    Boolean,
    size:        { type: String, default: 'md' },
    options:     { type: Array, default: () => [] }, // [{value, label, disabled?}]
    id:          String,
})

const emit = defineEmits(['update:modelValue'])

const uid = props.id || `select-${Math.random().toString(36).slice(2, 8)}`

const selectClasses = computed(() => [
    'w-full rounded-lg border bg-[var(--surface)] text-[var(--text-main)]',
    'appearance-none cursor-pointer pl-3 pr-9 font-medium',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-app)]',
    props.size === 'sm' ? 'h-8 text-xs'   : '',
    props.size === 'lg' ? 'h-11 text-base' : '',
    !['sm', 'lg'].includes(props.size) ? 'h-9 text-sm' : '',
    props.error
        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
        : 'border-[var(--border-main)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-ring)]/25',
])
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <label v-if="label" :for="uid"
            class="text-xs font-semibold text-[var(--text-sub)] leading-none select-none">
            {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
        </label>

        <div class="relative">
            <select
                :id="uid"
                :value="modelValue"
                :disabled="disabled"
                :required="required"
                :class="selectClasses"
                @change="emit('update:modelValue', $event.target.value)">
                <option v-if="placeholder" value="" disabled :selected="modelValue === '' || modelValue === null || modelValue === undefined">
                    {{ placeholder }}
                </option>
                <slot>
                    <option
                        v-for="opt in options"
                        :key="opt.value"
                        :value="opt.value"
                        :disabled="opt.disabled">
                        {{ opt.label }}
                    </option>
                </slot>
            </select>
            <i class="pi pi-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-[10px] pointer-events-none"></i>
        </div>

        <p v-if="error"  role="alert" class="text-[11px] font-medium text-red-500">{{ error }}</p>
        <p v-else-if="hint" class="text-[11px] text-[var(--text-muted)]">{{ hint }}</p>
    </div>
</template>
