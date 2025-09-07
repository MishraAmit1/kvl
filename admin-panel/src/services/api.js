class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  processQueue(error, token = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this.failedQueue = [];
  }
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      credentials: "include", // This is crucial for cookies!
      ...options,
    };

    try {
      console.log(`🌐 Making request to: ${endpoint}`);
      const response = await fetch(url, config);

      // Handle different response statuses
      if (
        response.status === 401 &&
        !endpoint.includes("/refresh-token") &&
        !endpoint.includes("/login")
      ) {
        console.log("🔒 401 Unauthorized - attempting token refresh");

        // Try to refresh token
        if (!this.isRefreshing) {
          this.isRefreshing = true;

          try {
            const refreshResponse = await this.refreshToken();
            console.log("🔄 Refresh response:", refreshResponse);

            if (refreshResponse.success) {
              this.processQueue(null, "refreshed");

              // Retry the original request
              console.log("🔄 Retrying original request");
              const retryResponse = await fetch(url, config);

              if (!retryResponse.ok) {
                const retryErrorData = await retryResponse
                  .json()
                  .catch(() => ({}));
                throw new Error(
                  retryErrorData.message ||
                    `HTTP error! status: ${retryResponse.status}`
                );
              }

              return await retryResponse.json();
            } else {
              throw new Error("Token refresh failed");
            }
          } catch (refreshError) {
            console.error("❌ Token refresh failed:", refreshError);
            this.processQueue(refreshError, null);
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        } else {
          // Queue the request if already refreshing
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then(() => {
            return fetch(url, config).then((response) => {
              if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
              }
              return response.json();
            });
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Request failed:`, errorData);
        throw new Error(
          errorData.message || `HTTP error! status: ${response.status}`
        );
      }

      const data = await response.json();
      console.log(`✅ Request successful:`, endpoint);
      return data;
    } catch (error) {
      console.error(`❌ API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    console.log("🔐 Attempting login...");
    return this.request("/users/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request("/users/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    console.log("🚪 Logging out...");
    return this.request("/users/logout", {
      method: "POST",
    });
  }
  async refreshToken() {
    console.log("🔄 Refreshing token...");
    try {
      const response = await this.request("/users/refresh-token", {
        method: "POST",
      });
      return response;
    } catch (error) {
      console.error("❌ Refresh token request failed:", error);
      throw error;
    }
  }

  async getCurrentUser() {
    try {
      const response = await this.request("/users/me", {
        method: "GET",
      });
      return {
        success: true,
        data: response.data, // Ensure the backend returns { data: user }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Users endpoints
  async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users?${queryString}`);
  }

  async getUser(id) {
    return this.request(`/users/${id}`);
  }

  async createUser(userData) {
    return this.request("/users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async updateUser(id, userData) {
    return this.request(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id) {
    return this.request(`/users/${id}`, {
      method: "DELETE",
    });
  }
  // Add these methods to the ApiService class
  // Add these methods in your ApiService class (api.js)

  // Consignments endpoints
  async getConsignments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/consignments?${queryString}`);
  }

  async getConsignmentById(id) {
    return this.request(`/consignments/${id}`);
  }

  async createConsignment(data) {
    return this.request("/consignments", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateConsignment(id, data) {
    return this.request(`/consignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteConsignment(id) {
    return this.request(`/consignments/${id}`, {
      method: "DELETE",
    });
  }

  async getConsignmentStatistics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/consignments/statistics?${queryString}`);
  }
  // Add these methods in your ApiService class (api.js):

  // Consignment status and actions
  async updateConsignmentStatus(id, statusData) {
    return this.request(`/consignments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  }

  async assignVehicleToConsignment(id, data) {
    return this.request(`/consignments/${id}/assign-vehicle`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async schedulePickup(id, data) {
    return this.request(`/consignments/${id}/schedule-pickup`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async confirmDelivery(id, data) {
    return this.request(`/consignments/${id}/confirm-delivery`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Get unbilled consignments (fix the method name)
  async getUnbilledConsignments(customerId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/freight-bills/customers/${customerId}/unbilled-consignments?${queryString}`
    );
  }

  // Freight bill methods (if missing)
  async updateFreightBillStatus(id, statusData) {
    return this.request(`/freight-bills/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify(statusData),
    });
  }
  // Customers endpoint (if not already there)
  async getCustomers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/customers?${queryString}`);
  }

  // Vehicles endpoint (if not already there)
  async getVehicles(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/vehicles?${queryString}`);
  }

  // Drivers endpoint (if not already there)
  async getDrivers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/drivers?${queryString}`);
  }
  // Freight Bills endpoints
  async getFreightBills(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/freight-bills?${queryString}`);
  }

  async getFreightBillById(id) {
    return this.request(`/freight-bills/${id}`);
  }

  async createFreightBill(billData) {
    return this.request("/freight-bills", {
      method: "POST",
      body: JSON.stringify(billData),
    });
  }

  async updateFreightBill(id, billData) {
    return this.request(`/freight-bills/${id}`, {
      method: "PUT",
      body: JSON.stringify(billData),
    });
  }

  async deleteFreightBill(id) {
    return this.request(`/freight-bills/${id}`, {
      method: "DELETE",
    });
  }

  async getUnbilledConsignments(customerId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(
      `/freight-bills/customers/${customerId}/unbilled-consignments?${queryString}`
    );
  }

  async downloadFreightBillPDF(id) {
    return this.request(`/freight-bills/${id}/pdf`, {
      method: "GET",
      headers: {
        "Content-Type": "application/pdf",
      },
    });
  }

  async sendFreightBillEmail(id, email = null) {
    return this.request(`/freight-bills/${id}/send-email`, {
      method: "POST",
      body: JSON.stringify(email ? { email } : {}),
    });
  }

  async markFreightBillAsPaid(id) {
    return this.request(`/freight-bills/${id}/mark-paid`, {
      method: "POST",
    });
  }

  async getFreightBillStatistics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/freight-bills/statistics?${queryString}`);
  }

  async getPendingPayments(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/freight-bills/pending-payments?${queryString}`);
  }

  async searchFreightBills(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/freight-bills/search?${queryString}`);
  }
}

export default new ApiService();
