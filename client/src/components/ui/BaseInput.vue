<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue:  { type: [String, Number], default: '' },
    label:       String,
    placeholder: String,
    hint:        String,
    error:       String,
    type:        { type: String, default: 'text' },
    icon:        String,
    iconRight:   String,
    disabled:    Boolean,
    required:    Boolean,
    size:        { type: String, default: 'md' }, // sm|md|lg
    id:          String,
})

const emit = defineEmits(['update:modelValue'])

const uid = props.id || `input-${Math.random().toString(36).slice(2, 8)}`

const inputClasses = computed(() => [
    'w-full rounded-lg border bg-[var(--surface)] text-[var(--text-main)]',
    'placeholder:text-[var(--text-faint)] font-medium',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-app)]',
    props.size === 'sm' ? 'h-8 text-xs'   : '',
    props.size === 'lg' ? 'h-11 text-base' : '',
    props.size === 'md' || !['sm','lg'].includes(props.size) ? 'h-9 text-sm' : '',
    props.icon      ? 'pl-9' : 'pl-3',
    props.iconRight || props.error ? 'pr-9' : 'pr-3',
    props.error
        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
        : 'border-[var(--border-main)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-ring)]/25',
])
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <label v-if="label" :for="uid"
            class="text-xs font-semibold text-[var(--text-sub)] leading-none select-none">
            {{ label }}<span v-if="required" class="text-red-500 ml-0.5" aria-hidden="true">*</span>
        </label>

        <div class="relative">
            <i v-if="icon"
                :class="['pi', `pi-${icon}`, 'absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-sm pointer-events-none']">
            </i>

            <input
                :id="uid"
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :required="required"
                :class="inputClasses"
                :aria-invalid="!!error"
                :aria-describedby="error ? `${uid}-error` : hint ? `${uid}-hint` : undefined"
                @input="emit('update:modelValue', $event.target.value)" />

            <i v-if="error"
                class="pi pi-exclamation-circle absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm pointer-events-none">
            </i>
            <i v-else-if="iconRight"
                :class="['pi', `pi-${iconRight}`, 'absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)] text-sm pointer-events-none']">
            </i>
        </div>

        <p v-if="error" :id="`${uid}-error`" role="alert" class="text-[11px] font-medium text-red-500 flex items-center gap-1">
            {{ error }}
        </p>
        <p v-else-if="hint" :id="`${uid}-hint`" class="text-[11px] text-[var(--text-muted)]">
            {{ hint }}
        </p>
    </div>
</template>
