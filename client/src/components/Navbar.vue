<template>
    <nav class="nav">
        <h2>MyApp</h2>

        <div>
            <router-link v-if="!isLoggedIn" to="/auth/login">Login</router-link>
            <router-link v-if="!isLoggedIn" to="/auth/register">Sign up</router-link>

            <router-link v-if="isLoggedIn" to="/dashboard">Dashboard</router-link>
            <button v-if="isLoggedIn" @click="logout">Logout</button>
        </div>
    </nav>
</template>

<script setup>
import { computed } from "vue";

const isLoggedIn = computed(() => !!localStorage.getItem("token"));

const logout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
};
</script>

<style scoped>
.nav {
    display: flex;
    justify-content: space-between;
    padding: 16px 24px;
}

a {
    margin-left: 12px;
}
</style>