/**
 * Admin Authentication Module
 * Handles password storage, verification, and session state.
 */
const Auth = {
    isAuthenticated: false,

    // Initialize auth from localStorage
    init() {
        const password = localStorage.getItem('pos_admin_password');
        // If no password set, we stay in unauthenticated state but maybe trigger 'setup'
        return password !== null;
    },

    // Check if password is set
    hasPassword() {
        return localStorage.getItem('pos_admin_password') !== null;
    },

    // Set or Change password
    setPassword(newPassword) {
        if (!newPassword || newPassword.length < 4) {
            return { success: false, message: "Password must be at least 4 characters long." };
        }
        localStorage.setItem('pos_admin_password', newPassword);
        return { success: true };
    },

    // Login verification
    login(inputPassword) {
        const storedPassword = localStorage.getItem('pos_admin_password');
        if (inputPassword === storedPassword) {
            this.isAuthenticated = true;
            sessionStorage.setItem('pos_is_logged_in', 'true');
            return true;
        }
        return false;
    },

    // Check session
    checkSession() {
        this.isAuthenticated = sessionStorage.getItem('pos_is_logged_in') === 'true';
        return this.isAuthenticated;
    },

    // Logout
    logout() {
        this.isAuthenticated = false;
        sessionStorage.removeItem('pos_is_logged_in');
    }
};
