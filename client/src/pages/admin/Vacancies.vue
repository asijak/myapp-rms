<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA FOR DEPED VACANCIES ---
const vacancies = ref([
    { id: 'VAC-001', title: 'Teacher I (Elementary)', category: 'Teaching', slots: 5, status: 'Published', date: '2026-03-01' },
    { id: 'VAC-002', title: 'Administrative Officer II', category: 'Non-Teaching', slots: 1, status: 'Draft', date: '2026-03-04' },
    { id: 'VAC-003', title: 'Teacher I (Secondary - Math)', category: 'Teaching', slots: 3, status: 'Published', date: '2026-02-28' },
    { id: 'VAC-004', title: 'Master Teacher I', category: 'Teaching Related', slots: 2, status: 'Archived', date: '2026-02-15' },
    { id: 'VAC-005', title: 'Registrar I', category: 'Non-Teaching', slots: 1, status: 'Published', date: '2026-03-05' },
]);

const searchQuery = ref('');
const selectedCategory = ref('All');
const categories = ['All', 'Teaching', 'Teaching Related', 'Non-Teaching'];

// Filter Logic
const filteredVacancies = computed(() => {
    return vacancies.value.filter(vac => {
        const matchesSearch = vac.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                              vac.id.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesCat = selectedCategory.value === 'All' || vac.category === selectedCategory.value;
        return matchesSearch && matchesCat;
    });
});

// Vibrant Status Styling
const getStatusBadge = (status) => {
    const base = 'px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ';
    if (status === 'Published') return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Draft') return base + 'bg-slate-50 text-slate-500 border-slate-200';
    if (status === 'Archived') return base + 'bg-rose-50 text-rose-700 border-rose-100';
    return base;
};
</script>

<template>
    <div class="space-y-8 animate-fade-in font-avenir">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Job Vacancies</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Manage and publish career opportunities for the Division.</p>
            </div>
            <button class="px-5 py-2.5 bg-[#020617] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2">
                <i class="pi pi-plus text-[#EAB308]"></i> Create Vacancy
            </button>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div class="relative flex-1">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by position title or ID..." 
                    class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#EAB308]/20 transition-all outline-none" />
            </div>
            <div class="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
                    :class="selectedCategory === cat ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'"
                    class="px-4 py-2 rounded-xl border text-[11px] font-bold transition-all whitespace-nowrap outline-none uppercase tracking-wide">
                    {{ cat }}
                </button>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/30">
                            <th class="px-6 py-5 font-bold">Vacancy ID</th>
                            <th class="px-6 py-5 font-bold">Position Title</th>
                            <th class="px-6 py-5 font-bold">Category</th>
                            <th class="px-6 py-5 font-bold text-center">Slots</th>
                            <th class="px-6 py-5 font-bold">Status</th>
                            <th class="px-6 py-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium text-slate-600">
                        <tr v-for="job in filteredVacancies" :key="job.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <td class="px-6 py-4 text-[11px] font-bold text-slate-400 tracking-tighter">{{ job.id }}</td>
                            <td class="px-6 py-4 text-slate-900 font-bold">{{ job.title }}</td>
                            <td class="px-6 py-4 text-xs">{{ job.category }}</td>
                            <td class="px-6 py-4 text-center font-bold text-slate-900">{{ job.slots }}</td>
                            <td class="px-6 py-4">
                                <span :class="getStatusBadge(job.status)">{{ job.status }}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all">
                                        <i class="pi pi-pencil text-xs"></i>
                                    </button>
                                    <button class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-100 transition-all">
                                        <i class="pi pi-trash text-xs"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr v-if="filteredVacancies.length === 0">
                            <td colspan="6" class="px-6 py-12 text-center text-slate-400 text-sm">
                                <i class="pi pi-search text-2xl mb-2 opacity-20 block"></i>
                                No vacancies found matching your criteria.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

.font-avenir {
    font-family: 'Avenir', sans-serif; /* */
}
</style>