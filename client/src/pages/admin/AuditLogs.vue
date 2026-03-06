<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA FOR AUDIT LOGS ---
const logs = ref([
    { id: 'LOG-882', user: 'King P. Domingo', role: 'Super Admin', action: 'Update', module: 'Roles & Permissions', details: 'Updated "HR Manager" delete permissions', ip: '192.168.1.42', timestamp: '2026-03-06 10:15 AM' },
    { id: 'LOG-881', user: 'Ana Maria Calbog', role: 'HR Manager', action: 'Create', module: 'Vacancies', details: 'Published Teacher I (Elementary) vacancy', ip: '192.168.1.15', timestamp: '2026-03-06 09:30 AM' },
    { id: 'LOG-880', user: 'Roberto Gamoso', role: 'Evaluator', action: 'Update', module: 'Evaluations', details: 'Submitted scores for APP-2026-001', ip: '10.0.0.8', timestamp: '2026-03-05 04:45 PM' },
    { id: 'LOG-879', user: 'System', role: 'Automated', action: 'Security', module: 'Auth', details: 'Successful login from new device (Admin PC-04)', ip: '192.168.1.102', timestamp: '2026-03-05 08:00 AM' },
    { id: 'LOG-878', user: 'King P. Domingo', role: 'Super Admin', action: 'Delete', module: 'Applicants', details: 'Permanently removed duplicate record APP-2026-X99', ip: '192.168.1.42', timestamp: '2026-03-04 11:20 AM' },
]);

const searchQuery = ref('');

// --- FILTER LOGIC ---
const filteredLogs = computed(() => {
    return logs.value.filter(log => {
        return log.user.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
               log.details.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
               log.module.toLowerCase().includes(searchQuery.value.toLowerCase());
    });
});

// --- VIBRANT ACTION STYLING ---
const getActionBadge = (action) => {
    const base = 'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ';
    if (action === 'Create') return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (action === 'Update') return base + 'bg-blue-50 text-blue-700 border-blue-100';
    if (action === 'Delete') return base + 'bg-rose-50 text-rose-700 border-rose-100';
    if (action === 'Security') return base + 'bg-purple-50 text-purple-700 border-purple-100';
    return base + 'bg-slate-50 text-slate-500 border-slate-200';
};
</script>

<template>
    <div class="space-y-8 animate-fade-in font-avenir">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">System Audit Logs</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Security trail for the DepEd Guihulngan Recruitment Portal.</p>
            </div>
            <button class="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm">
                <i class="pi pi-filter"></i> Advanced Filters
            </button>
        </div>

        <div class="relative w-full">
            <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
            <input v-model="searchQuery" type="text" placeholder="Search logs by user, action, or module..." 
                class="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-[#EAB308]/20 transition-all outline-none shadow-sm" />
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/30">
                            <th class="px-6 py-5 font-bold">User / Role</th>
                            <th class="px-6 py-5 font-bold">Action</th>
                            <th class="px-6 py-5 font-bold">Module</th>
                            <th class="px-6 py-5 font-bold">Change Details</th>
                            <th class="px-6 py-5 font-bold text-right">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium">
                        <tr v-for="log in filteredLogs" :key="log.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-full bg-slate-900 text-[#EAB308] flex items-center justify-center font-black text-[10px] shadow-sm">
                                        {{ log.user.charAt(0) }}
                                    </div>
                                    <div>
                                        <p class="text-slate-900 font-bold tracking-tight">{{ log.user }}</p>
                                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{{ log.role }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span :class="getActionBadge(log.action)">{{ log.action }}</span>
                            </td>
                            <td class="px-6 py-4 text-xs font-bold text-slate-600">{{ log.module }}</td>
                            <td class="px-6 py-4">
                                <p class="text-slate-500 font-medium max-w-xs truncate" :title="log.details">{{ log.details }}</p>
                                <p class="text-[9px] text-slate-300 font-mono mt-0.5">IP: {{ log.ip }}</p>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <p class="text-xs font-bold text-slate-400">{{ log.timestamp }}</p>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div v-if="filteredLogs.length === 0" class="py-12 text-center text-slate-400">
                <i class="pi pi-history text-2xl mb-2 opacity-20"></i>
                <p class="text-xs font-bold uppercase tracking-widest">No matching logs found</p>
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