
import { api } from "../../api/axios"

// Get my pending client
export const getMyPendingClient = async () => {
  return await api.get('/livreur/my-client/pending')
}

// Search client by phone
export const searchClientByPhone = async (phone) => {
  return await api.get(`/livreur/clients/search?phone=${phone}`)
}

// Create new client
export const addClient = async (data) => {
  return await api.post('/livreur/clients', data)
}

// Delete pending client
export const deletePendingClient = async (clientId) => {
  return await api.delete(`/livreur/clients/${clientId}`)
}

// ========== COMMANDE ENDPOINTS ==========

// Create commande
export const createCommande = async (data) => {
  return await api.post('/livreur/commandes', data)
}

// Get ready for delivery
export const getReadyForDelivery = async () => {
  return await api.get('/livreur/commandes/ready-for-delivery')
}

// Record payment
export const recordPayment = async (commandeId, data) => {
  return await api.post(`/livreur/commandes/${commandeId}/payment`, data)
}

// Cancel delivery
export const cancelDeliveryApi = async (commandeId) => {
  return await api.put(`/api/livreur/commandes/${commandeId}/annuler`)
}

// Get canceled deliveries
export const getCanceledDeliveries = async () => {
  return await api.get('/livreur/commandes/canceled-deliveries')
}

// Return order to workplace
export const returnToWorkplaceApi = async (commandeId) => {
  return await api.patch(`/livreur/commandes/${commandeId}/return`)
}

// Get count of prete orders (for notification badge)
export const getPreteCount = async () => {
  return await api.get('/livreur/commandes/prete-count')
}

// Get list of prete orders (for notification dropdown)
export const getReadyOrders = async () => {
  return await api.get('/api/livreur/commandes/prete')
}

// ========== NEW REDESIGN ENDPOINTS ==========

// Get dashboard stats
export const getDashboardStats = async () => {
  return await api.get('/api/livreur/dashboard/stats')
}

// Get ready for delivery (alias for consistency with request)
export const getReadyDeliveries = async () => {
  return await api.get('/api/livreur/commandes/ready-for-delivery')
}

// Get canceled deliveries (canonical)
export const getAnnulees = async () => {
  return await api.get('/livreur/commandes/canceled-deliveries')
}

// Return to workshop (canonical)
export const returnToWorkshopRequest = async (orderId) => {
  return await api.patch(`/livreur/commandes/${orderId}/return`)
}

// Confirm payment (canonical)
export const confirmPaymentRequest = async (orderId, paymentData) => {
  return await api.post(`/livreur/commandes/${orderId}/payment`, paymentData)
}

// Get payment types
export const getPaymentTypes = async () => {
  return await api.get('/api/livreur/payment-types')
}

// Upload tapis image
export const uploadTapisImage = async (tapisId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return await api.post(`/tapis/${tapisId}/images`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}

// Get active carpet types (for livreur dropdown)
export const getCarpetTypes = async () => {
  return await api.get('/livreur/carpet-types/active')
}

// Upload tapis images (plural)
export const uploadFiles = async (files) => {
  const formData = new FormData();
  // Ensure we are dealing with an array of files
  const fileArray = Array.isArray(files) ? files : [files];
  
  fileArray.forEach(file => {
    formData.append('files', file);
  });
  
  return await api.post('/livreur/tapis/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
}
