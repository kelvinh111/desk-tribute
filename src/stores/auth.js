import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
    // State
    const isAuthenticated = ref(false);
    const loginAttempts = ref(0);
    const lastAttemptTime = ref(0);

    // Session storage key
    const SESSION_KEY = 'desk_admin_session';
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

    // Computed
    const isLocked = computed(() => {
        if (loginAttempts.value >= MAX_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - lastAttemptTime.value;
            return timeSinceLastAttempt < LOCKOUT_TIME;
        }
        return false;
    });

    const lockoutTimeRemaining = computed(() => {
        if (!isLocked.value) return 0;
        const elapsed = Date.now() - lastAttemptTime.value;
        return Math.max(0, LOCKOUT_TIME - elapsed);
    });

    // Actions
    function initializeAuth() {
        // Check if there's a valid session
        const session = localStorage.getItem(SESSION_KEY);
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = Date.now();

                // Check if session is still valid (24 hours)
                if (sessionData.expires > now) {
                    isAuthenticated.value = true;
                    return true;
                } else {
                    // Session expired, clear it
                    logout();
                }
            } catch (error) {
                // Invalid session data, clear it
                logout();
            }
        }
        return false;
    }

    async function login(password) {
        // Check if locked out
        if (isLocked.value) {
            throw new Error(`Too many failed attempts. Please wait ${Math.ceil(lockoutTimeRemaining.value / 60000)} minutes.`);
        }

        try {
            // Verify password with backend
            const response = await fetch('https://uedlyafexdgfdqkjkygr.supabase.co/functions/v1/admin-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVlZGx5YWZleGRnZmRxa2preWdyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzYzNTcsImV4cCI6MjA3MDA1MjM1N30.7d0_E1JmTKt1CLKIhoPR92rP8ncx7xTsluVSljMGD5E`
                },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Authentication failed');
            }

            // Success - create session
            const sessionData = {
                authenticated: true,
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };

            localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            isAuthenticated.value = true;

            // Reset failed attempts on successful login
            loginAttempts.value = 0;
            lastAttemptTime.value = 0;

            return true;

        } catch (error) {
            // Record failed attempt
            loginAttempts.value++;
            lastAttemptTime.value = Date.now();

            // Store failed attempts in localStorage to persist across page reloads
            localStorage.setItem('desk_admin_attempts', JSON.stringify({
                count: loginAttempts.value,
                lastAttempt: lastAttemptTime.value
            }));

            throw error;
        }
    }

    function logout() {
        isAuthenticated.value = false;
        localStorage.removeItem(SESSION_KEY);
    }

    function loadFailedAttempts() {
        try {
            const attempts = localStorage.getItem('desk_admin_attempts');
            if (attempts) {
                const data = JSON.parse(attempts);
                loginAttempts.value = data.count || 0;
                lastAttemptTime.value = data.lastAttempt || 0;

                // Clear old attempts if lockout period has passed
                if (!isLocked.value && loginAttempts.value >= MAX_ATTEMPTS) {
                    loginAttempts.value = 0;
                    lastAttemptTime.value = 0;
                    localStorage.removeItem('desk_admin_attempts');
                }
            }
        } catch (error) {
            // Invalid data, reset
            loginAttempts.value = 0;
            lastAttemptTime.value = 0;
        }
    }

    // Initialize on store creation
    loadFailedAttempts();

    return {
        // State
        isAuthenticated,
        isLocked,
        lockoutTimeRemaining,
        loginAttempts,

        // Actions
        initializeAuth,
        login,
        logout
    };
});
