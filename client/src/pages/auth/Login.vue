<template>
    <div class="auth-container">
        <div class="card">
            <h2>Welcome Back 👋</h2>
            <p class="subtitle">Login to continue</p>

            <p v-if="$route.query.expired" class="expired">
                Session expired. Please login again.
            </p>

            <form @submit.prevent="login">
                <input v-model="email" type="email" placeholder="Email" required />

                <div class="password-wrapper">
                    <input :type="showPassword ? 'text' : 'password'" v-model="password" placeholder="Password"
                        required />
                    <span @click="showPassword = !showPassword">
                        {{ showPassword ? "Hide" : "Show" }}
                    </span>
                </div>

                <button type="submit" class="primary">Login</button>
            </form>

            <div class="divider">OR</div>

            <button class="google" @click="loginWithGoogle">
                Continue with Google
            </button>

            <p class="footer">
                No account?
                <router-link to="/auth/register">Register</router-link>
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const router = useRouter();

const login = async () => {
    const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.value, password: password.value }),
    });

    const data = await res.json();
    localStorage.setItem("token", data.token);
    router.push("/dashboard");
};

const loginWithGoogle = () => {
    window.location.href = "http://localhost:4000/api/auth/google";
};
</script>

<style scoped>
.auth-container {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, #111827, #1f2933);
}

.card {
    width: 100%;
    max-width: 380px;
    background: #0f172a;
    padding: 32px;
    border-radius: 14px;
    color: #e5e7eb;
    box-shadow: 0 20px 40px rgba(0, 0, 0, .4);
}

h2 {
    text-align: center;
}

.subtitle {
    text-align: center;
    opacity: 0.7;
    margin-bottom: 20px;
}

input {
    width: 100%;
    padding: 12px;
    border-radius: 8px;
    border: none;
    margin-bottom: 12px;
    background: #020617;
    color: white;
}

.password-wrapper {
    position: relative;
}

.password-wrapper span {
    position: absolute;
    right: 12px;
    top: 12px;
    font-size: 12px;
    cursor: pointer;
    opacity: 0.7;
}

.primary {
    width: 100%;
    padding: 12px;
    background: #6366f1;
    color: white;
    border-radius: 8px;
    border: none;
    cursor: pointer;
}

.google {
    width: 100%;
    padding: 12px;
    background: white;
    color: black;
    border-radius: 8px;
    border: none;
    margin-top: 10px;
}

.divider {
    text-align: center;
    margin: 14px 0;
    opacity: 0.5;
}

.footer {
    text-align: center;
    margin-top: 12px;
}

.expired {
    background: #7f1d1d;
    padding: 10px;
    border-radius: 8px;
    margin-bottom: 10px;
    font-size: 14px;
}
</style>