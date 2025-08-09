<template>
    <div class="login-container">
        <div class="login-card">
            <div class="login-header">
                <h1>🖥️ Desk Admin</h1>
                <p>Enter password to access admin dashboard</p>
            </div>

            <form
                @submit.prevent="handleLogin"
                class="login-form"
            >
                <div class="form-group">
                    <label for="password">Admin Password</label>
                    <input
                        id="password"
                        v-model="password"
                        type="password"
                        class="form-input"
                        :class="{ error: hasError }"
                        placeholder="Enter admin password"
                        :disabled="isLoading || authStore.isLocked"
                        required
                    />
                </div>

                <!-- Error Message -->
                <div
                    v-if="errorMessage"
                    class="error-message"
                >
                    {{ errorMessage }}
                </div>

                <!-- Lockout Warning -->
                <div
                    v-if="authStore.isLocked"
                    class="lockout-message"
                >
                    <h3>🔒 Account Temporarily Locked</h3>
                    <p>Too many failed login attempts.</p>
                    <p>Please wait <strong>{{ formatLockoutTime }}</strong> before trying again.</p>
                </div>

                <!-- Attempt Warning -->
                <div
                    v-else-if="authStore.loginAttempts > 0"
                    class="warning-message"
                >
                    ⚠️ {{ authStore.loginAttempts }}/5 failed attempts.
                    {{ 5 - authStore.loginAttempts }} attempts remaining.
                </div>

                <button
                    type="submit"
                    class="login-button"
                    :disabled="isLoading || authStore.isLocked || !password.trim()"
                >
                    <span v-if="isLoading">🔄 Authenticating...</span>
                    <span v-else-if="authStore.isLocked">🔒 Locked</span>
                    <span v-else>🔓 Login</span>
                </button>
            </form>

            <div class="login-footer">
                <p><small>Secure admin access for desk submission management</small></p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAuthStore } from '../stores/auth.js';
import { useRouter } from 'vue-router';

// ==========================================
// SETUP
// ==========================================

const authStore = useAuthStore();
const router = useRouter();

// ==========================================
// REACTIVE STATE
// ==========================================

const password = ref('');
const isLoading = ref(false);
const errorMessage = ref('');
const hasError = ref(false);
const lockoutTimer = ref(null);

// ==========================================
// COMPUTED PROPERTIES
// ==========================================

const formatLockoutTime = computed(() => {
    const minutes = Math.ceil(authStore.lockoutTimeRemaining / 60000);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
});

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
    // Check if already authenticated
    if (authStore.initializeAuth()) {
        router.push('/admin');
    }

    // Start lockout timer if locked
    if (authStore.isLocked) {
        startLockoutTimer();
    }
});

onUnmounted(() => {
    if (lockoutTimer.value) {
        clearInterval(lockoutTimer.value);
    }
});

// ==========================================
// METHODS
// ==========================================

async function handleLogin() {
    if (authStore.isLocked) return;

    isLoading.value = true;
    errorMessage.value = '';
    hasError.value = false;

    try {
        await authStore.login(password.value);

        // Success - redirect to admin
        router.push('/admin');

    } catch (error) {
        errorMessage.value = error.message;
        hasError.value = true;
        password.value = ''; // Clear password on error

        // Start lockout timer if now locked
        if (authStore.isLocked) {
            startLockoutTimer();
        }

    } finally {
        isLoading.value = false;
    }
}

function startLockoutTimer() {
    if (lockoutTimer.value) return; // Already running

    lockoutTimer.value = setInterval(() => {
        if (!authStore.isLocked) {
            clearInterval(lockoutTimer.value);
            lockoutTimer.value = null;
            errorMessage.value = '';
        }
    }, 1000); // Update every second
}
</script>

<style scoped lang="scss">
.login-container {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.login-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    padding: 3rem;
    width: 100%;
    max-width: 400px;
    text-align: center;
}

.login-header {
    margin-bottom: 2rem;

    h1 {
        margin: 0 0 0.5rem 0;
        color: #333;
        font-size: 2rem;
        font-weight: 600;
    }

    p {
        margin: 0;
        color: #666;
        font-size: 0.95rem;
    }
}

.login-form {
    text-align: left;
}

.form-group {
    margin-bottom: 1.5rem;

    label {
        display: block;
        margin-bottom: 0.5rem;
        color: #333;
        font-weight: 500;
        font-size: 0.9rem;
    }

    .form-input {
        width: 100%;
        padding: 1rem;
        border: 2px solid #e1e5e9;
        border-radius: 8px;
        font-size: 1rem;
        transition: all 0.2s;
        box-sizing: border-box;

        &:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        &.error {
            border-color: #dc3545;
            background-color: #fff5f5;
        }

        &:disabled {
            background-color: #f8f9fa;
            color: #666;
            cursor: not-allowed;
        }
    }
}

.error-message {
    background: #fff5f5;
    border: 1px solid #f5c6cb;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.lockout-message {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 1rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    text-align: center;

    h3 {
        margin: 0 0 0.5rem 0;
        font-size: 1rem;
    }

    p {
        margin: 0.25rem 0;
        font-size: 0.9rem;
    }
}

.warning-message {
    background: #fff3cd;
    border: 1px solid #ffeaa7;
    color: #856404;
    padding: 0.75rem;
    border-radius: 6px;
    margin-bottom: 1rem;
    font-size: 0.85rem;
    text-align: center;
}

.login-button {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 1rem;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }

    &:disabled {
        background: #ccc;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
    }
}

.login-footer {
    border-top: 1px solid #e1e5e9;
    padding-top: 1rem;
    margin-top: 1rem;

    p {
        margin: 0;
        color: #666;
        font-size: 0.8rem;
    }
}
</style>
