<script setup>
import { useRouter } from "vue-router"
import { computed } from "vue"
import { useAuthStore } from "@/stores/auth"

const router = useRouter()
const auth = useAuthStore()

const userName = computed(() => auth.user?.name || "User")
const userAvatar = computed(() =>
    auth.user?.avatar ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(userName.value)}&background=4f46e5&color=fff`
)

const logout = () => {
    localStorage.removeItem("token")
    auth.user = null
    router.replace("/auth/login")
}
</script>

<template>
    <div class="layout">
        <!-- Sidebar -->
        <aside class="sidebar">
            <h2 class="logo">MyApp</h2>

            <nav>
                <a class="active">Dashboard</a>
                <a>Profile</a>
                <a>Settings</a>
            </nav>
        </aside>

        <!-- Main -->
        <main class="main">
            <!-- Topbar -->
            <header class="topbar">
                <div></div>

                <div class="user-box">
                    <img :src="userAvatar" class="avatar" />
                    <span class="name">{{ userName }}</span>
                    <button class="logout" @click="logout">Logout</button>
                </div>
            </header>

            <!-- Page content -->
            <section class="content">
                <h1>Dashboard</h1>
                <p>Welcome back, {{ userName }} 🎉</p>

                <div class="card">
                    <h3>You're logged in</h3>
                    <p>This is your client dashboard.</p>
                </div>
            </section>
        </main>
    </div>
</template>

<style scoped>
.layout {
    display: flex;
    height: 100vh;
    background: #f4f6f8;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

/* Sidebar */
.sidebar {
    width: 220px;
    background: #0f172a;
    color: #fff;
    padding: 20px;
    display: flex;
    flex-direction: column;
}

.logo {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 24px;
}

.sidebar nav a {
    display: block;
    padding: 10px 12px;
    border-radius: 6px;
    color: #cbd5f5;
    cursor: pointer;
    margin-bottom: 6px;
    text-decoration: none;
}

.sidebar nav a:hover,
.sidebar nav a.active {
    background: #1e293b;
    color: #fff;
}

/* Main */
.main {
    flex: 1;
    display: flex;
    flex-direction: column;
}

/* Topbar */
.topbar {
    height: 60px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
    padding: 0 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.user-box {
    display: flex;
    align-items: center;
    gap: 10px;
}

.avatar {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 2px solid #e5e7eb;
}

.name {
    font-weight: 600;
}

.logout {
    background: #ef4444;
    color: white;
    border: none;
    padding: 6px 10px;
    border-radius: 6px;
    cursor: pointer;
}

.logout:hover {
    opacity: 0.9;
}

/* Content */
.content {
    padding: 24px;
}

.card {
    margin-top: 16px;
    background: white;
    padding: 16px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
</style>