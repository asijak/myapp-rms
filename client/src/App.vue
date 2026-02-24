<script setup>
import { onMounted, watch } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const checkAuth = () => {
  const token = localStorage.getItem("token");

  // Always allow OAuth callback to run
  if (route.path === "/oauth-success") return;

  // If logged in, don't stay on login/register
  if (token && route.path.startsWith("/auth")) {
    router.replace("/dashboard");
    return;
  }

  // If not logged in, block dashboard
  if (!token && route.path === "/dashboard") {
    router.replace("/auth/login");
  }
};

onMounted(checkAuth);
watch(() => route.path, checkAuth);
</script>

<template>
  <router-view />
</template>