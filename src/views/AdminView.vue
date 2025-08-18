<template>
    <div class="admin-view">
        <!-- Show login if not authenticated -->
        <AdminLogin v-if="!authStore.isAuthenticated" />

        <!-- Show dashboard if authenticated -->
        <div
            v-else
            class="authenticated-admin"
        >
            <!-- Logout Header -->
            <div class="admin-header">
                <div class="header-content">
                    <h1>Admin Dashboard</h1>
                    <button
                        @click="handleLogout"
                        class="logout-btn"
                    >
                        🚪 Logout
                    </button>
                </div>
            </div>

            <!-- Dashboard Content -->
            <AdminDashboard />
        </div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import AdminLogin from '../components/AdminLogin.vue';
import AdminDashboard from '../components/AdminDashboard.vue';

// ==========================================
// SETUP
// ==========================================

const authStore = useAuthStore();

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
    // Initialize authentication state
    authStore.initializeAuth();
});

// ==========================================
// METHODS
// ==========================================

function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        authStore.logout();
    }
}
</script>

<style scoped lang="scss">
.admin-view {
    min-height: 100dvh;
    background: #f5f5f5;
}

.authenticated-admin {
    min-height: 100dvh;
}

.admin-header {
    background: white;
    border-bottom: 1px solid #e1e5e9;
    padding: 0;
    position: sticky;
    top: 0;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

    .header-content {
        max-width: 1200px;
        margin: 0 auto;
        padding: 1rem 2rem;
        display: flex;
        justify-content: space-between;
        align-items: center;

        h1 {
            margin: 0;
            color: #1a1a1a;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .logout-btn {
            padding: 0.5rem 1rem;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            font-weight: 500;
            transition: all 0.2s;

            &:hover {
                background: #c82333;
                transform: translateY(-1px);
            }
        }
    }
}
</style>
