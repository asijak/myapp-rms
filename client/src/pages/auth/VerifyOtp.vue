<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const otp = ref('');
const email = route.query.email || 'your email';
const loading = ref(false);

const verify = async () => {
    if (otp.value.length < 6) return;
    loading.value = true;
    try {
        await authStore.verifyOtp(email, otp.value);
        router.push(authStore.dashboardRoute);
    } catch (err) {
        // Error handled in store
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="min-h-screen grid place-items-center bg-slate-50 px-4">
        <div class="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">

            <div class="mb-8 text-center">
                <div class="mx-auto mb-3 w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600
                    flex items-center justify-center shadow-lg shadow-sky-100">
                    <i class="pi pi-shield text-white text-sm"></i>
                </div>
                <h2 class="text-xl font-extrabold text-slate-900 tracking-tight">Verify Identity</h2>
                <p class="text-sm text-slate-500 mt-1 px-4">
                    Please enter the 6-digit code sent to <br />
                    <span class="font-semibold text-slate-900">{{ email }}</span>
                </p>
            </div>

            <div class="space-y-6">
                <div class="space-y-3 text-center">
                    <label class="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                        Verification Code
                    </label>
                    <div class="flex justify-center">
                        <InputOtp v-model="otp" :length="6" integerOnly :pt="{
                            input: {
                                class: 'w-12 h-14 !rounded-xl text-xl font-bold border-slate-200 bg-slate-50 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 transition-all text-center mx-1'
                            }
                        }" />
                    </div>
                </div>

                <Message v-if="authStore.error" severity="error" class="!text-xs" variant="simple">
                    {{ authStore.error }}
                </Message>

                <Button @click="verify" :loading="loading" label="Verify Account" icon="pi pi-check-circle"
                    class="w-full !rounded-xl !py-3 !bg-slate-900 border-none hover:!bg-slate-800 transition-all shadow-lg shadow-slate-200" />
            </div>

            <div class="mt-8 pt-6 border-t border-slate-100 text-center">
                <p class="text-xs text-slate-500">
                    Didn't receive the code?
                    <button
                        class="font-bold text-sky-600 hover:text-sky-700 bg-transparent border-none p-0 cursor-pointer transition-colors">
                        Resend Code
                    </button>
                </p>
                <div class="mt-4">
                    <router-link to="/auth/login"
                        class="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1">
                        <i class="pi pi-arrow-left text-[10px]"></i>
                        Back to Login
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>