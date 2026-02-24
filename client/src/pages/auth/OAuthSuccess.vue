<!-- src/pages/auth/OAuthSuccess.vue -->
<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

const route = useRoute();
const router = useRouter();

onMounted(() => {
    const token = route.query.token;

    if (token) {
        localStorage.setItem("token", token);
        router.replace("/dashboard"); // ✅ go to dashboard
    } else {
        router.replace("/auth/login");
    }
});
</script>

<template>
    <p>Logging you in...</p>
</template>