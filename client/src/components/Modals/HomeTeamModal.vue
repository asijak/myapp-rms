<script setup>
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

defineProps({
    visible: Boolean,
    member: Object
});

defineEmits(['update:visible']);
</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)" :focusTrap="false" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[32px] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.25)]" class="max-w-sm w-full mx-4" style="font-family: 'Avenir', sans-serif;">
        <div class="bg-white text-center flex flex-col">
            <div class="w-full h-36 bg-gradient-to-br from-violet-50 to-teal-50 flex items-end justify-center relative">
                <Button icon="pi pi-times" severity="secondary" rounded text class="absolute top-4 right-4 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all duration-300 hover:rotate-90 z-10" @click="$emit('update:visible', false)" />
                
                <div class="relative translate-y-1/2 group">
                    <div class="absolute inset-0 bg-violet-400 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <img :src="member?.image" class="relative w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg transition-transform duration-500 group-hover:scale-105" alt="Team Member" />
                </div>
            </div>

            <div class="pt-20 p-8 pb-10">
                <h2 class="text-2xl font-black text-gray-900 tracking-tight">{{ member?.name }}</h2>
                
                <div class="inline-block mt-2 mb-6">
                    <span class="text-[10px] font-black uppercase tracking-[0.2em] text-teal-700 bg-teal-50 px-4 py-1.5 rounded-full border border-teal-100/50">
                        {{ member?.role }}
                    </span>
                </div>

                <p class="text-gray-600 text-base leading-relaxed font-medium mb-8">
                    {{ member?.bio }}
                </p>

                <a :href="`mailto:${member?.email}`" class="inline-flex items-center justify-center gap-3 py-3 px-6 rounded-2xl bg-gray-50 text-gray-700 text-sm font-bold border border-gray-100 hover:bg-violet-600 hover:text-white hover:border-violet-600 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 group">
                    <i class="pi pi-envelope text-violet-500 group-hover:text-white transition-colors"></i> 
                    {{ member?.email }}
                </a>
            </div>
        </div>
    </Dialog>
</template>