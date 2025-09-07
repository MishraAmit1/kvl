import apiService from './api';
import { getApiBaseUrl } from '../config/api';

class LoadChalanApiService {
  // Create new load chalan
  async createLoadChalan(data) {
    return await apiService.request('/load-chalans', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Get all load chalans with filters
  async getAllLoadChalans(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status) queryParams.append('status', params.status);
    if (params.date) queryParams.append('date', params.date);
    if (params.vehicleNumber) queryParams.append('vehicleNumber', params.vehicleNumber);
    if (params.driverName) queryParams.append('driverName', params.driverName);

    const queryString = queryParams.toString();
    const url = queryString ? `/load-chalans?${queryString}` : '/load-chalans';
    
    return await apiService.request(url);
  }

  // Get single load chalan by ID
  async getLoadChalanById(id) {
    return await apiService.request(`/load-chalans/${id}`);
  }

  // Update load chalan status
  async updateLoadChalanStatus(id, status, remarks = '') {
    return await apiService.request(`/load-chalans/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks })
    });
  }

  // Update load chalan details
  async updateLoadChalan(id, data) {
    return await apiService.request(`/load-chalans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Delete load chalan
  async deleteLoadChalan(id) {
    return await apiService.request(`/load-chalans/${id}`, {
      method: 'DELETE'
    });
  }

  // Download PDF
  async downloadPDF(id) {
    const response = await fetch(`${getApiBaseUrl()}/load-chalans/${id}/pdf`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `load-chalan-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }

  // Get load chalan statistics
  async getLoadChalanStats(startDate = null, endDate = null) {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const queryString = queryParams.toString();
    const url = queryString ? `/load-chalans/stats?${queryString}` : '/load-chalans/stats';
    
    return await apiService.request(url);
  }

  // Get available consignments for chalan
  async getAvailableConsignments() {
    return await apiService.request('/consignments?status=BOOKED&limit=100');
  }

  // Get available vehicles
  async getAvailableVehicles() {
    return await apiService.request('/vehicles?status=ACTIVE&limit=100');
  }

  // Get available drivers
  async getAvailableDrivers() {
    return await apiService.request('/drivers?status=ACTIVE&limit=100');
  }
}

export default new LoadChalanApiService();
