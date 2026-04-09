import { createAsyncThunk } from '@reduxjs/toolkit'
import {
  getMyPendingClient,
  searchClientByPhone,
  deletePendingClient,
  createCommande,
  getReadyForDelivery,
  recordPayment,
  cancelDeliveryApi,
  getCanceledDeliveries,
  returnToWorkplaceApi,
  addClient,
  uploadFiles,
  getPreteCount,
  getReadyOrders,
  getDashboardStats,
  confirmPaymentRequest,
  getPaymentTypes,
  returnToWorkshopRequest,
  getCarpetTypes
} from './livreurService'

// ========== CLIENT THUNKS ==========

export const fetchPendingClient = createAsyncThunk(
  'livreur/fetchPendingClient',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getMyPendingClient()
      return response.data
    } catch (error) {
      if (error.response?.status === 204) {
        return null // No pending client
      }
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement')
    }
  }
)

export const searchClient = createAsyncThunk(
  'livreur/searchClient',
  async (phone, { rejectWithValue }) => {
    try {
      const response = await searchClientByPhone(phone)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de recherche')
    }
  }
)

export const registerClient = createAsyncThunk(
  'livreur/registerClient',
  async (data, { rejectWithValue }) => {
    try {
      const response = await addClient(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création')
    }
  }
)

export const deleteClient = createAsyncThunk(
  'livreur/deleteClient',
  async (clientId, { rejectWithValue }) => {
    try {
      await deletePendingClient(clientId)
      return clientId
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la suppression')
    }
  }
)

// ========== COMMANDE THUNKS ==========

export const createOrder = createAsyncThunk(
  'livreur/createOrder',
  async (data, { rejectWithValue }) => {
    try {
      const response = await createCommande(data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors de la création de la commande')
    }
  }
)

export const fetchReadyForDelivery = createAsyncThunk(
  'livreur/fetchReadyForDelivery',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getReadyForDelivery()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement')
    }
  }
)

export const submitPayment = createAsyncThunk(
  'livreur/submitPayment',
  async ({ orderId, data }, { rejectWithValue }) => {
    try {
      const response = await recordPayment(orderId, data)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Erreur lors de l'enregistrement du paiement")
    }
  }
)

export const cancelDelivery = createAsyncThunk(
  'livreur/cancelDelivery',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await cancelDeliveryApi(orderId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Erreur lors de l'annulation de la commande")
    }
  }
)

export const fetchCanceledDeliveries = createAsyncThunk(
  'livreur/fetchCanceledDeliveries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCanceledDeliveries()
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Erreur lors du chargement des commandes annulées")
    }
  }
)

export const returnToWorkplace = createAsyncThunk(
  'livreur/returnToWorkplace',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await returnToWorkplaceApi(orderId)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Erreur lors du retour de la commande à l'atelier")
    }
  }
)

export const uploadImages = createAsyncThunk(
  'livreur/uploadImages',
  async (files, { rejectWithValue }) => {
    try {
      const response = await uploadFiles(files);
      return response.data; // Array of { imageUrl: "..." }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Erreur lors de l'upload des images");
    }
  }
);

// Fetch count of prete orders (notification badge)
export const fetchPreteCount = createAsyncThunk(
  'livreur/fetchPreteCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPreteCount();
      return response.data.readyOrdersCount;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur');
    }
  }
);

// Fetch list of prete orders (for notification dropdown)
export const fetchReadyOrders = createAsyncThunk(
  'livreur/fetchReadyOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getReadyOrders();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur');
    }
  }
);

// ========== NEW REDESIGN THUNKS ==========

export const fetchLivreurDashboardStats = createAsyncThunk(
  'livreur/fetchDashboardStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getDashboardStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur stats');
    }
  }
);

export const confirmPayment = createAsyncThunk(
  'livreur/confirmPayment',
  async ({ orderId, data }, { rejectWithValue }) => {
    try {
      const response = await confirmPaymentRequest(orderId, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur paiement');
    }
  }
);

export const fetchPaymentTypes = createAsyncThunk(
  'livreur/fetchPaymentTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPaymentTypes();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur types paiement');
    }
  }
);

export const fetchCarpetTypes = createAsyncThunk(
  'livreur/fetchCarpetTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getCarpetTypes();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Erreur types tapis');
    }
  }
);
