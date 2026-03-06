<script setup>
import { ref, computed } from 'vue';

// --- MOCK DATA FOR USER LIST ---
const users = ref([
    { id: 'USR-001', name: 'King P. Domingo', email: 'king.domingo@deped.gov.ph', role: 'Super Admin', status: 'Active', lastLogin: 'Just now' },
    { id: 'USR-002', name: 'Ana Maria Calbog', email: 'ana.calbog@deped.gov.ph', role: 'HR Manager', status: 'Active', lastLogin: '2 hours ago' },
    { id: 'USR-003', name: 'Roberto S. Gamoso', email: 'roberto.gamoso@deped.gov.ph', role: 'Evaluator', status: 'Active', lastLogin: 'Yesterday' },
    { id: 'USR-004', name: 'Liza Jane Mahilum', email: 'liza.mahilum@deped.gov.ph', role: 'HR Manager', status: 'Inactive', lastLogin: '5 days ago' },
    { id: 'USR-005', name: 'Carlos Mondragon', email: 'carlos.mondragon@deped.gov.ph', role: 'Evaluator', status: 'Active', lastLogin: '3 hours ago' },
]);

const searchQuery = ref('');
const selectedRole = ref('All');
const roles = ['All', 'Super Admin', 'HR Manager', 'Evaluator'];

// --- FILTER LOGIC ---
const filteredUsers = computed(() => {
    return users.value.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                              user.email.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesRole = selectedRole.value === 'All' || user.role === selectedRole.value;
        return matchesSearch && matchesRole;
    });
});

// --- VIBRANT STATUS STYLING ---
const getStatusBadge = (status) => {
    const base = 'px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ';
    if (status === 'Active') return base + 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return base + 'bg-slate-50 text-slate-400 border-slate-200';
};
</script>

<template>
    <div class="space-y-8 animate-fade-in font-avenir">
        
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900 tracking-tight">System Users</h1>
                <p class="text-sm text-slate-500 font-medium mt-1">Manage administrative accounts and access levels for the portal.</p>
            </div>
            <button class="px-5 py-2.5 bg-[#020617] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10 flex items-center gap-2">
                <i class="pi pi-user-plus text-[#EAB308]"></i> Add New User
            </button>
        </div>

        <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
            <div class="relative flex-1">
                <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                <input v-model="searchQuery" type="text" placeholder="Search by name or email..." 
                    class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#EAB308]/20 transition-all outline-none" />
            </div>
            <div class="flex items-center gap-2">
                <button v-for="role in roles" :key="role" @click="selectedRole = role"
                    :class="selectedRole === role ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-200'"
                    class="px-4 py-2 rounded-xl border text-[11px] font-bold transition-all whitespace-nowrap outline-none uppercase tracking-wide">
                    {{ role }}
                </button>
            </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-[10px] uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 bg-slate-50/30">
                            <th class="px-6 py-5 font-bold">User Information</th>
                            <th class="px-6 py-5 font-bold">Role</th>
                            <th class="px-6 py-5 font-bold">Account Status</th>
                            <th class="px-6 py-5 font-bold">Last Active</th>
                            <th class="px-6 py-5 font-bold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm font-medium text-slate-600">
                        <tr v-for="user in filteredUsers" :key="user.id" class="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                            <td class="px-6 py-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 group-hover:bg-[#EAB308]/10 group-hover:text-[#EAB308] transition-all">
                                        {{ user.name.charAt(0) }}
                                    </div>
                                    <div>
                                        <p class="font-bold text-slate-900 group-hover:text-[#020617] transition-colors leading-none mb-1">{{ user.name }}</p>
                                        <p class="text-[10px] text-slate-400 tracking-tighter">{{ user.email }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-6 py-4">
                                <span class="text-xs font-bold text-slate-600 uppercase tracking-tight">{{ user.role }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <span :class="getStatusBadge(user.status)">{{ user.status }}</span>
                            </td>
                            <td class="px-6 py-4 text-xs font-medium text-slate-400">{{ user.lastLogin }}</td>
                            <td class="px-6 py-4 text-right">
                                <div class="flex justify-end gap-2">
                                    <button class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all" title="Edit User">
                                        <i class="pi pi-user-edit text-xs"></i>
                                    </button>
                                    <button class="w-8 h-8 rounded-lg border border-slate-200 text-slate-400 hover:text-amber-600 hover:border-amber-100 transition-all" title="Reset Password">
                                        <i class="pi pi-key text-xs"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                        
                        <tr v-if="filteredUsers.length === 0">
                            <td colspan="5" class="px-6 py-12 text-center text-slate-400 text-sm italic">
                                No users found matching your current search criteria.
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