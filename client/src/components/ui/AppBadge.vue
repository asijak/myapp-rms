<!--
  AppBadge — Semantic status badge with refined visual weight
  ─────────────────────────────────────────────────────────────
  Design: semi-transparent background + colored text + hairline border
  Effect: feels airy without being washed out — Linear/Vercel style

  Variants:  primary | success | danger | warning | gold | neutral | dark
             applied | verifying | assessment | ranked | disqualified
-->
<script setup>
defineOptions({ name: 'AppBadge' })

const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v) => [
      'primary', 'secondary', 'success', 'danger', 'warning',
      'gold', 'neutral', 'dark', 'info',
      'applied', 'verifying', 'assessment', 'ranked', 'disqualified',
    ].includes(v),
  },
  size:       { type: String, default: 'md', validator: (v) => ['sm', 'md', 'lg'].includes(v) },
  dot:        { type: Boolean, default: false },
  pulseDot:   { type: Boolean, default: false },  // animated ping dot
  icon:       { type: String, default: '' },
  pill:       { type: Boolean, default: true },
  interactive:{ type: Boolean, default: false },  // clickable badge with hover
})

// Precise color triplets: bg | text | border
const variants = {
  primary:      'bg-blue-50   text-blue-700  border-blue-200',
  secondary:    'bg-slate-100 text-slate-600 border-slate-200',
  success:      'bg-green-50  text-green-700 border-green-200',
  danger:       'bg-red-50    text-red-600   border-red-200',
  warning:      'bg-amber-50  text-amber-700 border-amber-200',
  gold:         'bg-amber-50  text-amber-700 border-amber-200',
  neutral:      'bg-slate-100 text-slate-500 border-slate-200',
  dark:         'bg-slate-800 text-white      border-slate-700',
  info:         'bg-blue-50   text-blue-700  border-blue-200',
  // Application-specific — distinct enough to distinguish at a glance
  applied:      'bg-blue-50   text-blue-700  border-blue-200',
  verifying:    'bg-amber-50  text-amber-700 border-amber-200',
  assessment:   'bg-sky-50    text-sky-700   border-sky-200',
  ranked:       'bg-green-50  text-green-700 border-green-200',
  disqualified: 'bg-red-50    text-red-600   border-red-200',
}

const dotColors = {
  primary:      'bg-blue-500',
  success:      'bg-green-500',
  ranked:       'bg-green-500',
  danger:       'bg-red-500',
  disqualified: 'bg-red-500',
  warning:      'bg-amber-500',
  gold:         'bg-amber-500',
  verifying:    'bg-amber-500',
  assessment:   'bg-sky-500',
  applied:      'bg-blue-500',
}

const sizes = {
  sm: 'text-[10px] px-2   py-[2px]  gap-1   font-semibold',
  md: 'text-[11px] px-2.5 py-[3px]  gap-1.5 font-semibold',
  lg: 'text-xs     px-3   py-[5px]  gap-2   font-semibold',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center border whitespace-nowrap leading-none',
      variants[variant] ?? variants.neutral,
      sizes[size],
      pill ? 'rounded-full' : 'rounded-md',
      interactive ? 'cursor-pointer transition-all hover:brightness-95 active:scale-95' : '',
    ]"
    style="letter-spacing: 0.01em;">

    <!-- Pulse dot (live / active indicator) -->
    <span v-if="pulseDot" class="relative flex h-1.5 w-1.5 shrink-0">
      <span :class="['absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping', dotColors[variant] ?? 'bg-current']"></span>
      <span :class="['relative inline-flex rounded-full h-1.5 w-1.5', dotColors[variant] ?? 'bg-current']"></span>
    </span>

    <!-- Static dot -->
    <span v-else-if="dot"
      :class="['w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant] ?? 'bg-current']">
    </span>

    <!-- Icon -->
    <i v-if="icon" :class="['pi', icon, size === 'sm' ? 'text-[9px]' : 'text-[10px]']" aria-hidden="true"></i>

    <!-- Label -->
    <slot />
  </span>
</template>
