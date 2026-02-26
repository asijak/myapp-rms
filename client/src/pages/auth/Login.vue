<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const form = ref({ email: '', password: '' });
const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
    loading.value = true;
    error.value = '';
    try {
        await authStore.login(form.value);

        // ✅ Use the smart getter we just created
        const defaultDash = authStore.dashboardRoute;

        const redirectPath = route.query.redirect || defaultDash;
        router.push(redirectPath);
    } catch (err) {
        error.value = typeof err === 'string' ? err : (err.response?.data?.message || 'Login failed');
    } finally {
        loading.value = false;
    }
};

const handleGoogleLogin = () => {
    // 1. Get base URL from env with a hardcoded fallback to port 4000
    const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api').replace(/\/$/, "");

    // 2. The path to the backend passport route
    const finalUrl = `${baseUrl}/auth/google`;

    console.log("🚀 Redirecting to Google Auth:", finalUrl);

    // 3. Full page redirect (Required for Passport.js)
    window.location.href = finalUrl;
};
</script>

<template>
    <div class="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
            <div class="mb-6 text-center">
                <div class="mx-auto mb-3 w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-500
                 flex items-center justify-center shadow">
                    <i class="pi pi-send text-white text-sm"></i>
                </div>
                <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">
                    Sign in
                </h2>
                <p class="text-sm text-slate-500 mt-1">
                    Access the DepEd GNC Recruitment Portal
                </p>
            </div>

            <form @submit.prevent="handleLogin" class="space-y-4">
                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Email address
                    </label>
                    <InputText v-model="form.email" type="email" placeholder="name@example.com"
                        class="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <div class="space-y-1">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Password
                    </label>
                    <Password v-model="form.password" :feedback="false" toggleMask placeholder="••••••••" class="w-full"
                        inputClass="w-full !rounded-xl !py-2.5 !px-3" required />
                </div>

                <Message v-if="error" severity="error" class="!text-xs">
                    {{ error }}
                </Message>

                <Button type="submit" :loading="loading" label="Sign in" icon="pi pi-sign-in"
                    class="w-full !rounded-xl !py-2.5" />
            </form>

            <div class="flex items-center gap-3 my-5">
                <div class="h-px bg-slate-200 flex-1"></div>
                <span class="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    OR
                </span>
                <div class="h-px bg-slate-200 flex-1"></div>
            </div>

            <Button @click="handleGoogleLogin" outlined
                class="w-full !rounded-xl !py-2.5 flex items-center justify-center gap-2">
                <i class="pi pi-google w-4 h-4"></i>
                Continue with Gmail
            </Button>

            <div class="mt-6 text-center text-xs text-slate-500">
                New to ORAS?
                <router-link to="/auth/register" class="font-bold text-sky-600 hover:underline">
                    Create an account
                </router-link>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* PrimeVue overrides usually go here if needed */
:deep(.p-password-input) {
    width: 100%;
}
</style>