<script setup>
<<<<<<< Updated upstream
import AdminLayout from '@/layouts/AdminLayout.vue';
import { ref } from 'vue';

const stats = ref([
    { label: 'Total Applicants', value: '1,248', icon: 'pi-users', color: 'text-sky-600', bg: 'bg-sky-50' },
    { label: 'Pending Reviews', value: '42', icon: 'pi-clock', color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Active Job Posts', value: '15', icon: 'pi-briefcase', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reports Sync', value: 'Online', icon: 'pi-sync', color: 'text-slate-500', bg: 'bg-slate-50' }
]);

const applications = ref([
    { id: 1, name: 'Juan Dela Cruz', position: 'Teacher I (Elementary)', date: '2026-02-24', status: 'Pending' },
    { id: 2, name: 'Maria Clara', position: 'Master Teacher II', date: '2026-02-23', status: 'Shortlisted' },
    { id: 3, name: 'Crisostomo Ibarra', position: 'Principal I', date: '2026-02-22', status: 'Pending' },
]);

const getStatusSeverity = (status) => {
    switch (status) {
        case 'Shortlisted': return 'success';
        case 'Pending': return 'warn';
        default: return 'info';
    }
};
</script>

<template>
    <AdminLayout>
        <div class="mb-6">
            <h1 class="text-xl font-medium text-slate-800 tracking-tight">Administrative Overview</h1>
            <p class="text-xs text-slate-500 mt-1 font-normal font-inter">PRIME-HRM Compliance Monitoring & Recruitment
                Statistics</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div v-for="stat in stats" :key="stat.label"
                class="bg-white p-5 rounded-sm border border-corp-border flex items-center justify-between shadow-sm/5">
                <div>
                    <span class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest font-inter">{{
                        stat.label }}</span>
                    <h2 class="text-2xl font-light text-slate-800 mt-1 font-roboto">{{ stat.value }}</h2>
                </div>
                <div :class="[stat.bg, stat.color]"
                    class="w-10 h-10 rounded flex items-center justify-center border border-current/10">
                    <i :class="['pi', stat.icon]" class="text-base"></i>
                </div>
            </div>
        </div>

        <div class="bg-white rounded-sm border border-corp-border shadow-sm overflow-hidden">
            <div class="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                <h3 class="text-sm font-medium text-slate-700 font-inter">Recent Applications</h3>
                <Button label="Export CSV" icon="pi pi-download" size="small" variant="text"
                    class="!text-[11px] font-medium uppercase tracking-wider" />
            </div>

            <DataTable :value="applications" responsiveLayout="scroll" class="p-datatable-compact font-roboto">
                <Column field="name" header="Applicant Name" class="text-[13px] text-slate-700 font-inter font-medium">
                </Column>

                <Column field="position" header="Position Applied" class="text-[13px] text-slate-500"></Column>

                <Column field="date" header="Date Submitted">
                    <template #body="slotProps">
                        <span class="text-xs text-slate-400">{{ slotProps.data.date }}</span>
                    </template>
                </Column>

                <Column field="status" header="Status">
                    <template #body="slotProps">
                        <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)"
                            class="!text-[10px] !px-2 !py-0.5 !font-medium !rounded-full !uppercase !tracking-tighter" />
                    </template>
                </Column>

                <Column header="Action" headerStyle="width: 4rem; text-align: center" bodyStyle="text-align: center">
                    <template #body>
                        <Button icon="pi pi-ellipsis-h" variant="text" severity="secondary" size="small" class="!p-1" />
                    </template>
                </Column>
            </DataTable>
        </div>
    </AdminLayout>
</template>

<style scoped>
@reference "@/assets/main.css";

/* Instead of applying to classes, use standard CSS for fonts to avoid ! important issues */
.font-inter {
    font-family: 'Inter', sans-serif !important;
}

.font-roboto {
    font-family: 'Roboto', sans-serif !important;
}

/* PrimeVue Overrides */
:deep(.p-datatable-compact .p-datatable-thead > tr > th) {
    /* Use ! prefix only on standard Tailwind utilities */
    @apply !bg-slate-50/50 !text-slate-400 !text-[10px] !uppercase !tracking-widest !py-3 !px-4 !border-b !border-corp-border !font-semibold;
    font-family: 'Inter', sans-serif !important;
}

:deep(.p-datatable-compact .p-datatable-tbody > tr > td) {
    @apply !py-2.5 !px-4 !border-b !border-slate-50;
    /* Use standard CSS for force-overriding PrimeVue padding/borders if @apply fails */
    border-bottom-width: 1px !important;
}

:deep(.p-datatable-compact .p-datatable-tbody > tr:hover) {
    background-color: rgba(248, 250, 252, 0.5) !important;
}
</style>
=======
</script>

<template>
    <div>
        this is the admin dashboard
    </div>
</template>

<style scoped></style>
>>>>>>> Stashed changes
