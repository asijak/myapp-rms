<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA FOR APPLICANTS ---
const applicants = ref([
    { id: 'APP-2026-001', name: 'Maria Lourdes Santos', position: 'Teacher I (Elementary)', status: 'Qualified', email: 'm.santos@email.com', date: '2026-03-05' },
    { id: 'APP-2026-002', name: 'Juanito Dela Cruz', position: 'Admin Assistant II', status: 'Evaluated', email: 'j.delacruz@email.com', date: '2026-03-04' },
    { id: 'APP-2026-003', name: 'Elena G. Reyes', position: 'Teacher I (Senior High)', status: 'Initial Screening', email: 'e.reyes@email.com', date: '2026-03-06' },
    { id: 'APP-2026-004', name: 'Mark Anthony Villa', position: 'IT Staff', status: 'In Review', email: 'm.villa@email.com', date: '2026-03-03' },
    { id: 'APP-2026-005', name: 'Sophia Ramirez', position: 'Teacher I (Elementary)', status: 'Rejected', email: 's.ramirez@email.com', date: '2026-03-02' },
    { id: 'APP-2026-006', name: 'Ricardo Gomez', position: 'Administrative Officer II', status: 'Initial Screening', email: 'r.gomez@email.com', date: '2026-03-06' }
]);

const searchQuery = ref('');
const selectedStatus = ref('All');
const statuses = ['All', 'Initial Screening', 'In Review', 'Evaluated', 'Qualified', 'Rejected'];

// --- FILTER LOGIC ---
const filteredApplicants = computed(() => {
    return applicants.value.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                              app.id.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesStatus = selectedStatus.value === 'All' || app.status === selectedStatus.value;
        return matchesSearch && matchesStatus;
    });
});

// --- VIBRANT STATUS STYLING ---
const getStatusBadge = (status) => {
    const base = 'px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ';
    if (status === 'Qualified') return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Initial Screening') return base + 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'In Review') return base + 'bg-purple-50 text-purple-700 border-purple-100';
    if (status === 'Evaluated') return base + 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'Rejected') return base + 'bg-rose-50 text-rose-700 border-rose-100';
    return base + 'bg-slate-50 text-slate-500 border-slate-200';
};
</script>

<template>
    <div class="space-y-8 animate-fade-in font-avenir">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Applicants List</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Manage and track candidate progress through the recruitment flow.</p>
            </div>
            <div class="flex items-center gap-2">
                <button class="px-4 py-2.5 border border-slate-200 bg-white text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                    <i class="pi pi-download text-slate-400"></i> Export List
                </button>
            </div>
        </div>

        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div class="relative w-full">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by name, email, or application ID..." 
                    class="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#EAB308]/20 transition-all outline-none" />
            </div>
            
            <div class="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
                <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2 whitespace-nowrap">Filter Status:</span>
                <button v-for="status in statuses" :key="status" @click="selectedStatus = status"
                    :class="selectedStatus === status ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'"
                    class="px-4 py-1.5 rounded-lg border text-[10px] font-bold transition-all whitespace-nowrap outline-none uppercase tracking-wide">
                    {{ status }}
                </button>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/30">
                            <th class="px-6 py-5 font-bold">Applicant Details</th>
                            <th class="px-6 py-5 font-bold">Target Position</th>
                            <th class="px-6 py-5 font-bold">Current Status</th>
                            <th class="px-6 py-5 font-bold">Applied Date</th>
                            <th class="px-6 py-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium text-slate-600">
                        <tr v-for="app in filteredApplicants" :key="app.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 group-hover:bg-[#EAB308]/10 group-hover:text-[#EAB308] group-hover:border-[#EAB308]/20 transition-all">
                                        {{ app.name.charAt(0) }}
                                    </div>
                                    <div>
                                        <p class="font-bold text-slate-900 group-hover:text-[#020617] transition-colors leading-none mb-1">{{ app.name }}</p>
                                        <p class="text-[10px] text-slate-400 tracking-tighter">{{ app.email }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-xs font-semibold text-slate-600">{{ app.position }}</td>
                            <td class="px-6 py-4">
                                <span :class="getStatusBadge(app.status)">{{ app.status }}</span>
                            </td>
                            <td class="px-6 py-4 text-xs font-medium text-slate-400">{{ app.date }}</td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all" title="View Profile">
                                        <i class="pi pi-eye text-xs"></i>
                                    </button>
                                    <button class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all" title="Edit Assessment">
                                        <i class="pi pi-user-edit text-xs"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        
                        <tr v-if="filteredApplicants.length === 0">
                            <td colspan="5" class="px-6 py-16 text-center">
                                <div class="flex flex-col items-center">
                                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                        <i class="pi pi-users text-2xl text-slate-200"></i>
                                    </div>
                                    <h3 class="text-slate-900 font-bold">No applicants found</h3>
                                    <p class="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Showing {{ filteredApplicants.length }} candidates</p>
                <div class="flex gap-1">
                    <button class="px-3 py-1 text-[10px] font-bold border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 transition-all">Prev</button>
                    <button class="px-3 py-1 text-[10px] font-bold border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-30 transition-all">Next</button>
                </div>
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

.custom-scrollbar::-webkit-scrollbar {
    height: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
</style>