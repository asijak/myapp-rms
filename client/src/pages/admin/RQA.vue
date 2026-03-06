<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA FOR REGISTRY OF QUALIFIED APPLICANTS (RQA) ---
const rqaList = ref([
    { rank: 1, id: 'APP-2026-002', name: 'Juanito Dela Cruz', specialization: 'Elementary', score: 88.45, status: 'Certified' },
    { rank: 2, id: 'APP-2026-088', name: 'Liza Jane T. Mahilum', specialization: 'Elementary', score: 85.20, status: 'Certified' },
    { rank: 1, id: 'APP-2026-015', name: 'Roberto S. Gamoso', specialization: 'Secondary - Math', score: 82.15, status: 'Certified' },
    { rank: 3, id: 'APP-2026-044', name: 'Maria Lourdes Santos', specialization: 'Elementary', score: 79.80, status: 'Certified' },
    { rank: 2, id: 'APP-2026-102', name: 'Carlos D. Mondragon', specialization: 'Secondary - Math', score: 76.50, status: 'Certified' },
    { rank: 4, id: 'APP-2026-091', name: 'Ana Maria B. Calbog', specialization: 'Elementary', score: 74.25, status: 'Certified' },
]);

const searchQuery = ref('');
const selectedSpecialization = ref('All');
const specializations = ['All', 'Elementary', 'Secondary - Math', 'Secondary - English', 'Senior High'];

// --- RANKING & FILTER LOGIC ---
const filteredRQA = computed(() => {
    return rqaList.value
        .filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchQuery.value.toLowerCase());
            const matchesSpec = selectedSpecialization.value === 'All' || item.specialization === selectedSpecialization.value;
            return matchesSearch && matchesSpec;
        })
        .sort((a, b) => b.score - a.score); // 🪄 Ensure highest score is always on top
});
</script>

<template>
    <div class="space-y-8 animate-fade-in font-avenir">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Registry of Qualified Applicants (RQA)</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Final ranked list of candidates for the 2026-2027 school year.</p>
            </div>
            <div class="flex gap-2">
                <button class="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                    <i class="pi pi-print"></i> Print List
                </button>
                <button class="px-5 py-2.5 bg-[#020617] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2">
                    <i class="pi pi-file-excel text-[#EAB308]"></i> Export RQA
                </button>
            </div>
        </div>

        <div class="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
            <div class="relative flex-1 w-full">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="searchQuery" type="text" placeholder="Find applicant in registry..." 
                    class="w-full pl-10 pr-4 py-3 bg-transparent border-none text-sm focus:ring-0 outline-none" />
            </div>
            <div class="h-8 w-[1px] bg-slate-200 hidden md:block"></div>
            <select v-model="selectedSpecialization" class="w-full md:w-64 px-4 py-3 bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer">
                <option v-for="spec in specializations" :key="spec" :value="spec">{{ spec }}</option>
            </select>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/30">
                            <th class="px-8 py-5 font-bold">Rank</th>
                            <th class="px-6 py-5 font-bold">Applicant Name</th>
                            <th class="px-6 py-5 font-bold">Specialization</th>
                            <th class="px-6 py-5 font-bold text-center">Final Score</th>
                            <th class="px-6 py-5 font-bold">Status</th>
                            <th class="px-8 py-5 font-bold text-right">Profile</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium">
                        <tr v-for="item in filteredRQA" :key="item.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td class="px-8 py-4">
                                <div :class="item.rank === 1 ? 'bg-[#EAB308] text-[#020617]' : 'bg-slate-100 text-slate-500'" 
                                    class="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs shadow-sm">
                                    {{ item.rank }}
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <p class="text-slate-900 font-bold tracking-tight">{{ item.name }}</p>
                                <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{{ item.id }}</p>
                            </td>
                            <td class="px-6 py-4 text-xs text-slate-500">{{ item.specialization }}</td>
                            <td class="px-6 py-4 text-center">
                                <span class="text-lg font-black text-slate-900">{{ item.score.toFixed(2) }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold uppercase tracking-wider">
                                    <i class="pi pi-verified text-[8px]"></i> {{ item.status }}
                                </span>
                            </td>
                            <td class="px-8 py-4 text-right">
                                <button class="w-9 h-9 rounded-xl border border-slate-200 text-slate-400 hover:text-[#020617] hover:border-slate-400 hover:bg-white transition-all shadow-sm">
                                    <i class="pi pi-external-link text-xs"></i>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="px-8 py-4 bg-slate-50/50 border-t border-slate-100">
                <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    * Minimum qualifying score for RQA inclusion: 70.00 points.
                </p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.font-avenir {
    font-family: 'Avenir', sans-serif; /* */
}

.animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>