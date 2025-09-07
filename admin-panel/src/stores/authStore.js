// authStore.js - Completely revised version
import { create } from "zustand";
import apiService from "../services/api";

// Helper function to read cookies
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await apiService.login(credentials);

      if (response.data?.user) {
        const user = {
          id: response.data.user._id,
          name: response.data.user.fullname,
          email: response.data.user.email,
          username: response.data.user.username,
          avatar: response.data.user.avatar,
          role: response.data.user.role || "user",
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user };
      }

      throw new Error("Login failed");
    } catch (error) {
      set({ isLoading: false });
      let errorMessage = "Login failed";
      if (error.message.includes("User does not exist")) {
        errorMessage = "User not found. Please check your credentials.";
      } else if (error.message.includes("Invalid user credentials")) {
        errorMessage = "Invalid username or password.";
      } else if (error.message.includes("Account is deactivated")) {
        errorMessage =
          "Your account has been deactivated. Please contact admin.";
      } else if (error.message.includes("Too many requests")) {
        errorMessage = "Too many login attempts. Please try again later.";
      } else {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  },

  signup: async (userData) => {
    set({ isLoading: true });
    try {
      const response = await apiService.register(userData);
      set({ isLoading: false });
      return {
        success: true,
        message: response.message || "Account created successfully!",
      };
    } catch (error) {
      set({ isLoading: false });
      // Handle specific backend error messages
      let errorMessage = "Signup failed";
      if (
        error.message.includes(
          "Username can only contain letters, numbers, and underscores"
        )
      ) {
        errorMessage =
          "Username can only contain letters, numbers, and underscores.";
      } else if (
        error.message.includes(
          "User with this email or username already exists"
        )
      ) {
        errorMessage = "An account with this email or username already exists.";
      } else if (error.message.includes("Password must be at least")) {
        errorMessage = "Password must be at least 6 characters long.";
      } else if (error.message.includes("Invalid email")) {
        errorMessage = "Please enter a valid email address.";
      } else if (error.message.includes("Full name is required")) {
        errorMessage = "Please enter your full name.";
      } else {
        errorMessage = error.message;
      }
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await apiService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiService.getCurrentUser();

      if (response.success && response.data) {
        const userData = response.data;
        const user = {
          id: userData._id,
          name: userData.fullname,
          email: userData.email,
          username: userData.username,
          avatar: userData.avatar,
          role: userData.role || "user",
        };

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
        return { success: true, user };
      }

      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return { success: false };
    } catch (error) {
      console.error("Get current user failed:", error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return { success: false };
    }
  },

  refreshToken: async () => {
    try {
      const response = await apiService.refreshToken();
      if (response.success) {
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      console.error("Token refresh failed:", error);
      return { success: false };
    }
  },

  initializeAuth: async () => {
    console.log("🔄 Initializing auth...");
    set({ isLoading: true });

    try {
      // Try to get current user directly
      console.log("👤 Attempting to get current user...");
      const userResult = await get().getCurrentUser();

      if (userResult.success) {
        console.log("✅ User authenticated successfully");
        return;
      }

      // If getCurrentUser fails, try refreshing the token
      console.log("🔄 Attempting token refresh...");
      const refreshResult = await get().refreshToken();

      if (refreshResult.success) {
        console.log("✅ Token refreshed, getting user again...");
        const retryUserResult = await get().getCurrentUser();

        if (retryUserResult.success) {
          console.log("✅ User authenticated after refresh");
          return;
        }
      }

      // If all fails, clear auth state
      console.log("❌ Authentication failed");
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error("❌ Auth initialization error:", error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
  },
}));

export default useAuthStore;
