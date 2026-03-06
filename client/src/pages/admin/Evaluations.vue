<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA FOR EVALUATIONS ---
const evaluations = ref([
    { 
        id: 'EVAL-001', 
        name: 'Maria Lourdes Santos', 
        position: 'Teacher I (Elementary)', 
        category: 'Teaching',
        status: 'In Progress', 
        scores: { education: 18, experience: 12, training: 8, rating: 12 },
        total: 50,
        lastUpdated: '1 hour ago'
    },
    { 
        id: 'EVAL-002', 
        name: 'Juanito Dela Cruz', 
        position: 'Admin Assistant II', 
        category: 'Non-Teaching',
        status: 'Completed', 
        scores: { education: 20, experience: 15, training: 10, rating: 15 },
        total: 60,
        lastUpdated: '3 hours ago'
    },
    { 
        id: 'EVAL-003', 
        name: 'Elena G. Reyes', 
        position: 'Teacher I (Secondary)', 
        category: 'Teaching',
        status: 'Pending', 
        scores: { education: 0, experience: 0, training: 0, rating: 0 },
        total: 0,
        lastUpdated: 'Not Started'
    },
    { 
        id: 'EVAL-004', 
        name: 'Mark Anthony Villa', 
        position: 'IT Staff', 
        category: 'Non-Teaching',
        status: 'In Progress', 
        scores: { education: 15, experience: 10, training: 5, rating: 10 },
        total: 40,
        lastUpdated: 'Yesterday'
    }
]);

const searchQuery = ref('');
const filterCategory = ref('All');

// --- FILTER LOGIC ---
const filteredEvaluations = computed(() => {
    return evaluations.value.filter(ev => {
        const matchesSearch = ev.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                              ev.id.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesCat = filterCategory.value === 'All' || ev.category === filterCategory.value;
        return matchesSearch && matchesCat;
    });
});

// --- VIBRANT STATUS STYLING ---
const getStatusClass = (status) => {
    const base = 'px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ';
    if (status === 'Completed') return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'In Progress') return base + 'bg-blue-50 text-blue-700 border-blue-100';
    return base + 'bg-amber-50 text-amber-700 border-amber-100';
};
</script>

<template>
    <div class="space-y-8 animate-fade-in font-avenir">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Applicant Evaluations</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Review and score candidates based on DepEd ranking criteria.</p>
            </div>
            <button class="px-5 py-2.5 bg-[#EAB308] text-[#020617] rounded-lg text-xs font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-500/10 flex items-center gap-2">
                <i class="pi pi-file-pdf"></i> Summary Report
            </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="md:col-span-3 relative">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="searchQuery" type="text" placeholder="Search applicant name or ID..." 
                    class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#EAB308]/20 transition-all outline-none" />
            </div>
            <select v-model="filterCategory" class="px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-[#EAB308]/20 transition-all">
                <option value="All">All Categories</option>
                <option value="Teaching">Teaching</option>
                <option value="Non-Teaching">Non-Teaching</option>
            </select>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/30">
                            <th class="px-6 py-5 font-bold">Applicant</th>
                            <th class="px-6 py-5 font-bold text-center">Education (20)</th>
                            <th class="px-6 py-5 font-bold text-center">Exp. (15)</th>
                            <th class="px-6 py-5 font-bold text-center">Total Score</th>
                            <th class="px-6 py-5 font-bold">Status</th>
                            <th class="px-6 py-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">
                        <tr v-for="evalItem in filteredEvaluations" :key="evalItem.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td class="px-6 py-4">
                                <div>
                                    <p class="font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-none mb-1">{{ evalItem.name }}</p>
                                    <p class="text-[10px] text-slate-400 font-medium tracking-tight">{{ evalItem.position }}</p>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-center font-bold text-slate-600">{{ evalItem.scores.education }}</td>
                            <td class="px-6 py-4 text-center font-bold text-slate-600">{{ evalItem.scores.experience }}</td>
                            <td class="px-6 py-4 text-center">
                                <div class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-900 text-white font-black text-xs shadow-inner">
                                    {{ evalItem.total }}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span :class="getStatusClass(evalItem.status)">{{ evalItem.status }}</span>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button class="px-4 py-2 rounded-lg bg-slate-50 text-[10px] font-bold text-slate-600 hover:bg-[#020617] hover:text-white transition-all uppercase tracking-widest border border-slate-200">
                                    <i class="pi pi-pencil mr-1 text-[8px]"></i> Edit Score
                                </button>
                            </td>
                        </tr>
                        
                        <tr v-if="filteredEvaluations.length === 0">
                            <td colspan="6" class="px-6 py-12 text-center text-slate-400 font-medium">
                                No records found matching your search.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<style scoped>
.font-avenir {
    font-family: 'Avenir', sans-serif; /* */
}

.animate-fade-in {
    animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>