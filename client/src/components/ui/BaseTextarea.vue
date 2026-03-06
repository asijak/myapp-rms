<script setup>
import { computed } from 'vue'

const props = defineProps({
    modelValue:  { type: String, default: '' },
    label:       String,
    placeholder: String,
    hint:        String,
    error:       String,
    disabled:    Boolean,
    required:    Boolean,
    rows:        { type: Number, default: 3 },
    resize:      Boolean,
    maxlength:   Number,
    id:          String,
})

const emit = defineEmits(['update:modelValue'])

const uid = props.id || `textarea-${Math.random().toString(36).slice(2, 8)}`

const classes = computed(() => [
    'w-full px-3 py-2.5 rounded-lg border bg-[var(--surface)]',
    'text-sm text-[var(--text-main)] font-medium leading-relaxed',
    'placeholder:text-[var(--text-faint)]',
    'transition-all duration-150',
    'focus:outline-none focus:ring-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-[var(--bg-app)]',
    props.resize ? 'resize-y' : 'resize-none',
    props.error
        ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
        : 'border-[var(--border-main)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary-ring)]/25',
])
</script>

<template>
    <div class="flex flex-col gap-1.5">
        <div v-if="label || maxlength" class="flex items-center justify-between">
            <label v-if="label" :for="uid"
                class="text-xs font-semibold text-[var(--text-sub)] leading-none select-none">
                {{ label }}<span v-if="required" class="text-red-500 ml-0.5">*</span>
            </label>
            <span v-if="maxlength" class="text-[11px] text-[var(--text-muted)]">
                {{ (modelValue || '').length }}/{{ maxlength }}
            </span>
        </div>

        <textarea
            :id="uid"
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :required="required"
            :rows="rows"
            :maxlength="maxlength"
            :class="classes"
            @input="emit('update:modelValue', $event.target.value)">
        </textarea>

        <p v-if="error"     role="alert" class="text-[11px] font-medium text-red-500">{{ error }}</p>
        <p v-else-if="hint" class="text-[11px] text-[var(--text-muted)]">{{ hint }}</p>
    </div>
</template>
