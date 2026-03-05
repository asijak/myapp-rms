<script setup>
import { ref, computed, watch } from 'vue'; // ADDED: watch
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import InputText from 'primevue/inputtext';
import SelectButton from 'primevue/selectbutton';
import Button from 'primevue/button';
import Chip from 'primevue/chip';
import Dialog from 'primevue/dialog';
import Toast from 'primevue/toast';

// FIXED: We import the UserLayout here, not Jobs!
import UserLayout from '@/layouts/UserLayout.vue'; 

const toast = useToast();

// --- STATE ---
const searchQuery = ref('');
const selectedCategory = ref('All');
const categories = ref(['All', 'Teaching', 'Teaching Related', 'Non-Teaching']);

const selectedJob = ref(null);
const isModalOpen = ref(false);
const isApplying = ref(false);

// ADDED: Watcher to reset to 'All' if the user deselects a category
watch(selectedCategory, (newValue) => {
    if (!newValue) {
        selectedCategory.value = 'All';
    }
});

// --- MOCK DATA ---
const jobList = ref([
    {
        id: 1,
        title: 'Teacher I (Elementary)',
        type: 'Full-Time',
        division: 'DIVISION OFFICE',
        category: 'Teaching',
        salary: '₱27,000.00 / month',
        description: 'Provide basic education instruction for elementary students following the K-12 curriculum. Responsible for lesson planning, student assessment, and classroom management.',
        requirements: ['LET Passer', 'B.E.Ed Graduate', 'No experience required', 'Good moral character']
    },
    {
        id: 2,
        title: 'Teacher I (Senior High - TVL)',
        type: 'Full-Time',
        division: 'DIVISION OFFICE',
        category: 'Teaching Related',
        salary: '₱31,705.00 / month',
        description: 'Provide high-quality instruction and hands-on training for the TVL track in Senior High School. Focus on practical skills and competency assessments.',
        requirements: ['LET Passer', 'NC II Certified', 'Relevant Bachelor’s Degree', 'At least 1 year industry experience']
    },
    {
        id: 3,
        title: 'Administrative Support',
        type: 'Contract',
        division: 'DIVISION OFFICE',
        category: 'Non-Teaching',
        salary: '₱18,500.00 / month',
        description: 'Provide general administrative support, record-keeping, and office coordination. Handle incoming communications and manage department files.',
        requirements: ['College Graduate', 'Proficient in MS Office', '1 Year Experience', 'Excellent communication skills']
    },
    {
        id: 4,
        title: 'Guidance Counselor I',
        type: 'Full-Time',
        division: 'DIVISION OFFICE',
        category: 'Teaching Related',
        salary: '₱31,705.00 / month',
        description: 'Implement guidance programs, provide counseling services to students, and assist in career coaching and psychological assessments.',
        requirements: ['Registered Guidance Counselor (RGC)', 'Master’s Degree in Guidance and Counseling']
    }
]);

// --- COMPUTED / FILTER LOGIC ---
const filteredJobs = computed(() => {
    return jobList.value.filter(job => {
        const matchesSearch = !searchQuery.value || 
            job.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
            job.description.toLowerCase().includes(searchQuery.value.toLowerCase());
        const matchesCategory = selectedCategory.value === 'All' || job.category === selectedCategory.value;
        
        return matchesSearch && matchesCategory;
    });
});

// --- ACTIONS ---
const openJobDetails = (job) => {
    selectedJob.value = job;
    isModalOpen.value = true;
};

const handleApply = async () => {
    isApplying.value = true;
    
    // Simulate an API call delay for the application process
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    isApplying.value = false;
    isModalOpen.value = false;
    
    // Show success message
    toast.add({ 
        severity: 'success', 
        summary: 'Application Submitted!', 
        detail: `You have successfully applied for ${selectedJob.value.title}. You can track this in your Applications tab.`, 
        life: 5000 
    });
};
</script>

<template>
    <UserLayout>
        <div class="space-y-8 font-inter">
            
            <div class="bg-white p-6 md:p-8 rounded-[24px] border border-slate-200 shadow-sm space-y-6">
                <div>
                    <h1 class="text-2xl font-black text-slate-800 tracking-tight">Available Opportunities</h1>
                    <p class="text-slate-500 text-sm mt-1">Browse and apply for the latest job vacancies in the division.</p>
                </div>

                <div class="flex flex-col lg:flex-row items-center gap-4">
                    <div class="relative w-full lg:w-1/2 group">
                        <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-sky-600 transition-colors"></i>
                        <InputText 
                            v-model="searchQuery" 
                            placeholder="Search by job title or keyword..." 
                            class="w-full pl-11 pr-4 py-3 rounded-xl border-slate-200 bg-slate-50 focus:bg-white transition-colors" 
                        />
                    </div>
                    
                    <div class="w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
                        <SelectButton 
                            v-model="selectedCategory" 
                            :options="categories" 
                            class="custom-filter whitespace-nowrap" 
                        />
                    </div>
                </div>
            </div>

            <div v-if="filteredJobs.length > 0" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div v-for="job in filteredJobs" :key="job.id" 
                    @click="openJobDetails(job)"
                    class="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-300 flex flex-col group relative overflow-hidden cursor-pointer">
                    
                    <div class="absolute top-0 left-0 right-0 h-1.5" 
                         :class="job.category === 'Non-Teaching' ? 'bg-amber-400' : 'bg-sky-500'">
                    </div>

                    <div class="flex justify-between items-start mb-4 pt-2">
                        <div class="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-sky-50 group-hover:text-sky-600 transition-colors">
                            <i class="pi pi-briefcase text-xl"></i>
                        </div>
                        <Chip :label="job.type" class="text-[10px] font-bold uppercase bg-slate-100 text-slate-600" />
                    </div>

                    <p class="text-[10px] font-black text-sky-600 uppercase tracking-widest mb-1">{{ job.category }}</p>
                    <h3 class="text-lg font-bold text-slate-800 leading-tight mb-2 group-hover:text-sky-700 transition-colors">{{ job.title }}</h3>
                    <p class="text-sm font-semibold text-slate-500 mb-4">{{ job.salary }}</p>
                    
                    <p class="text-sm text-slate-500 line-clamp-2 mb-6 leading-relaxed flex-1">
                        {{ job.description }}
                    </p>

                    <div class="mt-auto border-t border-slate-100 pt-5 flex items-center justify-between">
                        <span class="text-xs text-slate-400 font-medium"><i class="pi pi-map-marker mr-1"></i> Guihulngan City</span>
                        <Button label="View Details" variant="text" size="small" class="!font-bold !text-sky-600 !p-0 hover:underline" @click.stop="openJobDetails(job)" />
                    </div>
                </div>
            </div>

            <div v-else class="bg-white rounded-[24px] border border-slate-200 border-dashed p-12 text-center flex flex-col items-center justify-center">
                <div class="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <i class="pi pi-search text-3xl text-slate-300"></i>
                </div>
                <h3 class="text-lg font-bold text-slate-700 mb-2">No jobs found</h3>
                <p class="text-slate-500 text-sm max-w-md">We couldn't find any positions matching your current search or filter criteria. Try adjusting your filters.</p>
                <Button label="Clear Filters" variant="text" class="mt-4 !text-sky-600" @click="searchQuery = ''; selectedCategory = 'All'" />
            </div>

            <Dialog v-model:visible="isModalOpen" modal dismissableMask :showHeader="false" contentClass="p-0 rounded-[32px] overflow-hidden border-none shadow-2xl font-inter" class="max-w-2xl w-full mx-4">
                <div class="bg-white text-left flex flex-col max-h-[85vh]">
                    
                    <div class="p-8 md:p-10 overflow-y-auto">
                        <div class="flex justify-between items-start mb-4">
                            <Chip :label="selectedJob?.category" class="bg-sky-50 text-sky-700 font-bold text-[10px] uppercase tracking-wider" />
                            <Button icon="pi pi-times" severity="secondary" rounded text class="-mt-2 -mr-2 hover:bg-slate-100 hover:text-slate-700" @click="isModalOpen = false" />
                        </div>
                        
                        <h2 class="text-3xl font-black text-slate-800 mb-4 leading-tight">{{ selectedJob?.title }}</h2>
                        
                        <div class="flex flex-wrap gap-3 mb-8">
                            <div class="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <i class="pi pi-money-bill text-emerald-500"></i> {{ selectedJob?.salary }}
                            </div>
                            <div class="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <i class="pi pi-clock text-amber-500"></i> {{ selectedJob?.type }}
                            </div>
                            <div class="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <i class="pi pi-map-marker text-sky-500"></i> {{ selectedJob?.division }}
                            </div>
                        </div>

                        <div class="space-y-8">
                            <div>
                                <h4 class="font-bold text-slate-800 mb-3 flex items-center gap-2">
                                    <i class="pi pi-align-left text-sky-600"></i> Job Description
                                </h4>
                                <p class="text-slate-600 text-sm leading-relaxed">{{ selectedJob?.description }}</p>
                            </div>
                            
                            <div v-if="selectedJob?.requirements">
                                <h4 class="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <i class="pi pi-check-square text-sky-600"></i> Minimum Requirements
                                </h4>
                                <ul class="space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <li v-for="(req, index) in selectedJob.requirements" :key="index" class="flex items-start gap-3 text-sm text-slate-700 font-medium">
                                        <i class="pi pi-check-circle text-emerald-500 mt-0.5"></i> 
                                        <span>{{ req }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="w-full mt-auto p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                        <Button label="Cancel" severity="secondary" text @click="isModalOpen = false" class="!font-bold px-6" />
                        <Button 
                            :label="isApplying ? 'Submitting...' : 'Apply for this Position'" 
                            :icon="isApplying ? 'pi pi-spin pi-spinner' : 'pi pi-send'" 
                            :loading="isApplying"
                            class="!bg-sky-600 !border-none !font-bold px-8 shadow-md hover:shadow-lg transition-all" 
                            @click="handleApply" 
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    </UserLayout>
</template>

<style scoped>
@reference "@/assets/main.css";

/* Hide scrollbar for category filters on mobile */
.hide-scrollbar::-webkit-scrollbar {
    display: none;
}
.hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
}

/* Clean up PrimeVue SelectButton styles to match modern look */
:deep(.custom-filter .p-button) { 
    @apply bg-white border border-slate-200 text-slate-500 font-semibold text-xs px-5 py-2.5 shadow-sm transition-all; 
}
:deep(.custom-filter .p-button:first-child) {
    @apply rounded-l-lg;
}
:deep(.custom-filter .p-button:last-child) {
    @apply rounded-r-lg;
}
:deep(.custom-filter .p-button.p-highlight) { 
    @apply bg-slate-800 border-slate-800 text-white shadow-md; 
}
:deep(.custom-filter .p-button:hover:not(.p-highlight)) {
    @apply bg-slate-50 text-slate-800;
}
</style>