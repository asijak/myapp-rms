<script setup>
import { ref } from 'vue';

// --- MOCK DATA FOR THE RECRUITMENT PORTAL ---

// 1. Key Performance Indicators (KPIs)
const stats = ref([
    { label: 'Active Vacancies', value: '14', icon: 'pi pi-briefcase', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Total Applicants', value: '1,284', icon: 'pi pi-users', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Pending Evaluations', value: '86', icon: 'pi pi-file-edit', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Qualified (RQA)', value: '42', icon: 'pi pi-verified', color: 'text-purple-600', bg: 'bg-purple-50' }
]);

// 2. Recent Applicant Activity
const recentApplicants = ref([
    { id: 'APP-2026-001', name: 'Maria Lourdes Santos', position: 'Teacher I (Elementary)', status: 'Initial Screening', date: '10:30 AM' },
    { id: 'APP-2026-002', name: 'Juanito Dela Cruz', position: 'Admin Assistant II', status: 'Evaluated', date: '09:15 AM' },
    { id: 'APP-2026-003', name: 'Elena G. Reyes', position: 'Teacher I (Senior High)', status: 'Qualified', date: 'Yesterday' },
    { id: 'APP-2026-004', name: 'Mark Anthony Villa', position: 'IT Staff', status: 'In Review', date: 'Yesterday' }
]);

// 3. Recruitment Pipeline Progress
const pipeline = ref([
    { stage: 'Initial Screening', count: 450, percentage: 75, color: 'bg-blue-500' },
    { stage: 'Document Evaluation', count: 280, percentage: 55, color: 'bg-amber-500' },
    { stage: 'Interview/Demo', count: 120, percentage: 35, color: 'bg-purple-500' },
    { stage: 'Final Selection', count: 42, percentage: 15, color: 'bg-emerald-500' }
]);

// Helper for status styling
const getStatusBadge = (status) => {
    const base = 'px-2 py-0.5 rounded-full text-[10px] font-bold border ';
    if (status === 'Qualified') return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Initial Screening') return base + 'bg-blue-50 text-blue-700 border-blue-100';
    return base + 'bg-slate-50 text-slate-700 border-slate-100';
};
</script>

<template>
    <div class="space-y-8 animate-in fade-in duration-700">
        
        <div class="flex flex-col gap-1">
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Recruitment Dashboard</h1>
            <p class="text-sm text-slate-500 font-medium">Guihulngan City Division Talent Pool Management</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div v-for="stat in stats" :key="stat.label" 
                class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                <div class="flex justify-between items-start mb-4">
                    <div :class="[stat.bg, stat.color]" class="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
                        <i :class="[stat.icon, 'text-lg']"></i>
                    </div>
                </div>
                <h3 class="text-3xl font-black text-slate-900 leading-none">{{ stat.value }}</h3>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{{ stat.label }}</p>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                    <h2 class="text-xs font-bold text-slate-900 uppercase tracking-[0.2em]">Recent Activity</h2>
                    <button class="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase">View All</button>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-100">
                                <th class="px-6 py-4 font-bold">Applicant</th>
                                <th class="px-6 py-4 font-bold">Position</th>
                                <th class="px-6 py-4 font-bold">Status</th>
                                <th class="px-6 py-4 font-bold text-right">Time</th>
                            </tr>
                        </thead>
                        <tbody class="text-sm">
                            <tr v-for="app in recentApplicants" :key="app.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                <td class="px-6 py-4">
                                    <p class="font-bold text-slate-900">{{ app.name }}</p>
                                    <p class="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{{ app.id }}</p>
                                </td>
                                <td class="px-6 py-4 text-slate-500 font-medium text-xs">{{ app.position }}</td>
                                <td class="px-6 py-4">
                                    <span :class="getStatusBadge(app.status)">{{ app.status }}</span>
                                </td>
                                <td class="px-6 py-4 text-right text-slate-400 font-medium text-xs">{{ app.date }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 class="text-xs font-bold text-slate-900 uppercase tracking-[0.2em] mb-8">Hiring Pipeline</h2>
                <div class="space-y-8">
                    <div v-for="item in pipeline" :key="item.stage">
                        <div class="flex justify-between text-[11px] font-bold mb-2">
                            <span class="text-slate-500 uppercase tracking-wide">{{ item.stage }}</span>
                            <span class="text-slate-900">{{ item.count }}</span>
                        </div>
                        <div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div :class="item.color" class="h-full rounded-full transition-all duration-1000" :style="{ width: item.percentage + '%' }"></div>
                        </div>
                    </div>
                </div>
                <button class="w-full mt-10 py-3 rounded-xl border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hover:bg-white hover:border-[#EAB308] hover:text-[#EAB308] transition-all">
                    Export Full Analytics
                </button>
            </div>

        </div>
    </div>
</template>

<style scoped>
/* Scrollbar for the table if needed */
.overflow-x-auto::-webkit-scrollbar {
    height: 4px;
}
.overflow-x-auto::-webkit-scrollbar-thumb {
    background: #e2e8f0;
    border-radius: 10px;
}
</style>