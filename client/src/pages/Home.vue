<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();
const loggedOutMessage = ref(false);

const currentSlide = ref(0);
const slides = [
    {
        title: "RSP Management Portal",
        subtitle: "Division of Guihulngan City",
        description: "Access the Online Recruitment and Selection system for modern human resource management.",
        image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
    },
    {
        title: "PRIME-HRM Excellence",
        subtitle: "Merit-Based Selection",
        description: "A transparent and standardized process for the recruitment of educators and staff.",
        image: "https://images.unsplash.com/photo-1523050335392-9bef867a0578?auto=format&fit=crop&q=80&w=1200"
    }
];

const nextSlide = () => {
    currentSlide.value = (currentSlide.value + 1) % slides.length;
};

const handleLogout = async () => {
    await authStore.logout();
    loggedOutMessage.value = true;
    setTimeout(() => loggedOutMessage.value = false, 3000);
};

onMounted(() => {
    setInterval(nextSlide, 8000);
});
</script>

<template>
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans">
        <nav class="h-16 border-b border-slate-200 bg-white sticky top-0 z-50 px-6 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <Avatar label="R" class="bg-blue-600 text-white font-bold rounded-lg" size="normal" />
                <div class="flex flex-col leading-tight">
                    <span class="text-sm font-bold text-slate-900">RSP Portal</span>
                    <span class="text-[10px] text-slate-500 uppercase font-bold tracking-wider">DepEd GNC</span>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <template v-if="authStore.isAuthenticated">
                    <Chip :label="authStore.user.username"
                        :image="authStore.user.avatar || 'https://ui-avatars.com/api/?name=' + authStore.user.username"
                        class="bg-slate-100 font-medium text-sm" />
                    <Button icon="pi pi-sign-out" severity="secondary" variant="text" rounded @click="handleLogout" />
                </template>
                <Button v-else label="Sign In" variant="text" class="text-blue-600 font-bold"
                    @click="router.push('/auth/login')" />
            </div>
        </nav>

        <main
            class="flex-1 grid grid-cols-1 lg:grid-cols-2 max-w-7xl mx-auto w-full items-center px-6 lg:px-12 py-12 gap-12">

            <div class="space-y-6">
                <transition name="p-message" mode="out-in">
                    <div :key="currentSlide">
                        <span class="text-blue-600 text-xs font-black uppercase tracking-[0.2em]">
                            {{ slides[currentSlide].subtitle }}
                        </span>
                        <h1 class="text-4xl md:text-6xl font-black text-slate-900 leading-[1.1] mt-4 mb-6">
                            {{ slides[currentSlide].title }}
                        </h1>
                        <p class="text-slate-600 text-lg max-w-md leading-relaxed">
                            {{ slides[currentSlide].description }}
                        </p>
                    </div>
                </transition>

                <div class="flex flex-wrap gap-4 pt-4">
                    <Button v-if="!authStore.isAuthenticated" label="Get Started" icon="pi pi-arrow-right"
                        iconPos="right" class="p-button-rounded bg-blue-600 border-none px-8"
                        @click="router.push('/auth/login')" />

                    <Button v-else label="Open Dashboard" icon="pi pi-th-large"
                        class="p-button-rounded bg-blue-600 border-none px-8"
                        @click="router.push(authStore.dashboardRoute)" />

                    <Button label="View Vacancies" severity="secondary" outlined
                        class="p-button-rounded border-slate-300 text-slate-700 px-8" />
                </div>
            </div>

            <div class="hidden lg:block h-[500px] relative group">
                <div
                    class="absolute inset-0 bg-blue-600/5 rounded-[40px] -rotate-3 transition-transform group-hover:rotate-0">
                </div>
                <div class="relative h-full w-full rounded-[40px] overflow-hidden shadow-2xl shadow-blue-900/10">
                    <img :src="slides[currentSlide].image"
                        class="w-full h-full object-cover transition-opacity duration-1000"
                        :class="{ 'opacity-100': true }" />

                    <div class="absolute bottom-8 left-8 flex gap-2">
                        <div v-for="(_, i) in slides" :key="i" @click="currentSlide = i"
                            class="h-1.5 rounded-full transition-all duration-300 cursor-pointer"
                            :class="i === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/40'">
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <transition name="p-message">
            <div v-if="loggedOutMessage" class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]">
                <Message severity="success" icon="pi pi-check-circle">Logged out successfully</Message>
            </div>
        </transition>
    </div>
</template>

<style scoped>
/* Refined M3 Transitions */
.p-message-enter-active,
.p-message-leave-active {
    transition: all 0.3s ease;
}

.p-message-enter-from {
    opacity: 0;
    transform: translate(-50%, 20px);
}

.p-message-leave-to {
    opacity: 0;
    transform: translate(-50%, 20px);
}
</style>