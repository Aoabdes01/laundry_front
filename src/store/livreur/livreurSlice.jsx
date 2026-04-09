import { createSlice } from '@reduxjs/toolkit'
import {
  fetchPendingClient,
  searchClient,
  registerClient,
  deleteClient,
  createOrder,
  fetchReadyForDelivery,
  submitPayment,
  cancelDelivery,
  fetchCanceledDeliveries,
  returnToWorkplace,
  fetchPreteCount,
  fetchReadyOrders,
  fetchLivreurDashboardStats,
  confirmPayment,
  fetchPaymentTypes,
  fetchCarpetTypes
} from './livreurThunk'

export const COMMANDE_STATUS = {
  EN_ATTENTE: 'en_attente',
  VALIDEE: 'validee',
  EN_TRAITEMENT: 'en_traitement',
  PRETE: 'prete',
  LIVREE: 'livree',
  PAYEE: 'payee',
  ANNULEE: 'annulee',
  RETOURNEE: 'retournee'
}

const initialState = {
  // Client state
  pendingClient: null,
  searchResult: null,

  // Orders state
  readyForDelivery: [],
  readyOrders: [],
  canceledDeliveries: [],
  currentOrder: null,
  preteCount: 0,
  dashboardStats: {
    commandesPretesCount: 0,
    commandesARecupererCount: 0,
    commandesAnnuleesCount: 0,
    missionsCount: 0
  },
  carpetTypes: [],
  paymentTypes: [],
  seenNotificationIds: JSON.parse(localStorage.getItem('seen_notifications') || '[]'), 

  // Loading states
  loading: {
    pendingClient: false,
    search: false,
    createClient: false,
    deleteClient: false,
    createOrder: false,
    readyForDelivery: false,
    canceledDeliveries: false,
    payment: false,
    action: false,
    preteCount: false,
    dashboardStats: false,
    paymentTypes: false
  },

  // Error states
  error: {
    pendingClient: null,
    search: null,
    createClient: null,
    deleteClient: null,
    createOrder: null,
    readyForDelivery: null,
    canceledDeliveries: null,
    payment: null,
    action: null,
    dashboardStats: null,
    paymentTypes: null
  },

  // Success flags
  clientCreated: false,
  orderCreated: false,
  paymentRecorded: false
}

const livreurSlice = createSlice({
  name: 'livreur',
  initialState,
  reducers: {
    clearErrors: (state) => {
      state.error = {
        pendingClient: null,
        search: null,
        createClient: null,
        deleteClient: null,
        createOrder: null,
        readyForDelivery: null,
        payment: null
      }
    },
    clearSearchResult: (state) => {
      state.searchResult = null
    },
    resetClientCreated: (state) => {
      state.clientCreated = false
    },
    resetSuccess: (state) => {
      state.clientCreated = false
      state.orderCreated = false
      state.paymentRecorded = false
    },
    markNotificationsAsSeen: (state) => {
      // Add all current readyOrders IDs to the seen set
      const currentIds = state.readyOrders.map(o => o.id);
      const newSeenIds = Array.from(new Set([...state.seenNotificationIds, ...currentIds]));
      state.seenNotificationIds = newSeenIds;
      localStorage.setItem('seen_notifications', JSON.stringify(newSeenIds));
    },
    resetOrderCreated: (state) => {
      state.orderCreated = false
    },
    resetPaymentRecorded: (state) => {
      state.paymentRecorded = false
    },
    setPendingClient: (state, action) => {
      state.pendingClient = action.payload
    },
    removeOrderFromReady: (state, action) => {
      const id = action.payload;
      state.readyForDelivery = state.readyForDelivery.filter(o => o.id !== id);
    }
  },
  extraReducers: (builder) => {
    // ========== FETCH PENDING CLIENT ==========
    builder
      .addCase(fetchPendingClient.pending, (state) => {
        state.loading.pendingClient = true
        state.error.pendingClient = null
      })
      .addCase(fetchPendingClient.fulfilled, (state, action) => {
        state.loading.pendingClient = false
        state.pendingClient = action.payload
      })
      .addCase(fetchPendingClient.rejected, (state, action) => {
        state.loading.pendingClient = false
        state.error.pendingClient = action.payload
        state.pendingClient = null
      })

    // ========== SEARCH CLIENT ==========
    builder
      .addCase(searchClient.pending, (state) => {
        state.loading.search = true
        state.error.search = null
      })
      .addCase(searchClient.fulfilled, (state, action) => {
        state.loading.search = false
        // Backend returns: { found: true, client: { ... } } or { found: false }
        if (action.payload?.found && action.payload?.client) {
          state.searchResult = action.payload.client
        } else {
          state.searchResult = null
        }
      })
      .addCase(searchClient.rejected, (state, action) => {
        state.loading.search = false
        state.error.search = action.payload
      })

    // ========== REGISTER CLIENT ==========
    builder
      .addCase(registerClient.pending, (state) => {
        state.loading.createClient = true
        state.error.createClient = null
        state.clientCreated = false
      })
      .addCase(registerClient.fulfilled, (state, action) => {
        state.loading.createClient = false
        state.pendingClient = action.payload
        state.clientCreated = true
      })
      .addCase(registerClient.rejected, (state, action) => {
        state.loading.createClient = false
        state.error.createClient = action.payload
        state.clientCreated = false
      })

    // ========== DELETE CLIENT ==========
    builder
      .addCase(deleteClient.pending, (state) => {
        state.loading.deleteClient = true
        state.error.deleteClient = null
      })
      .addCase(deleteClient.fulfilled, (state) => {
        state.loading.deleteClient = false
        state.pendingClient = null
      })
      .addCase(deleteClient.rejected, (state, action) => {
        state.loading.deleteClient = false
        state.error.deleteClient = action.payload
      })

    // ========== CREATE ORDER ==========
    builder
      .addCase(createOrder.pending, (state) => {
        state.loading.createOrder = true
        state.error.createOrder = null
        state.orderCreated = false
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.loading.createOrder = false
        state.currentOrder = action.payload
        state.pendingClient = null // Client no longer pending
        state.orderCreated = true
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading.createOrder = false
        state.error.createOrder = action.payload
        state.orderCreated = false
      })

    // ========== FETCH READY FOR DELIVERY ==========
    builder
      .addCase(fetchReadyForDelivery.pending, (state) => {
        state.loading.readyForDelivery = true
        state.error.readyForDelivery = null
      })
      .addCase(fetchReadyForDelivery.fulfilled, (state, action) => {
        state.loading.readyForDelivery = false
        state.readyForDelivery = action.payload
      })
      .addCase(fetchReadyForDelivery.rejected, (state, action) => {
        state.loading.readyForDelivery = false
        state.error.readyForDelivery = action.payload
      })

    // ========== SUBMIT PAYMENT ==========
    builder
      .addCase(submitPayment.pending, (state) => {
        state.loading.payment = true
        state.error.payment = null
        state.paymentRecorded = false
      })
      .addCase(submitPayment.fulfilled, (state, action) => {
        state.loading.payment = false
        state.currentOrder = action.payload
        state.paymentRecorded = true
        // Remove from readyForDelivery list (livree / Sorti orders)
        state.readyForDelivery = state.readyForDelivery.filter(
          order => order.id !== action.payload.id
        )
      })
      .addCase(submitPayment.rejected, (state, action) => {
        state.loading.payment = false
        state.error.payment = action.payload
        state.paymentRecorded = false
      })

    // ========== CANCEL DELIVERY ==========
    builder
      .addCase(cancelDelivery.pending, (state) => {
        state.loading.action = true
        state.error.action = null
      })
      .addCase(cancelDelivery.fulfilled, (state, action) => {
        state.loading.action = false
        // Remove from readyForDelivery list (livree / Sorti orders)
        state.readyForDelivery = state.readyForDelivery.filter(
          order => order.id !== action.payload.id
        )
        // Add to canceled deliveries if it's already fetched
        state.canceledDeliveries.unshift(action.payload)
      })
      .addCase(cancelDelivery.rejected, (state, action) => {
        state.loading.action = false
        state.error.action = action.payload
      })

    // ========== FETCH CANCELED DELIVERIES ==========
    builder
      .addCase(fetchCanceledDeliveries.pending, (state) => {
        state.loading.canceledDeliveries = true
        state.error.canceledDeliveries = null
      })
      .addCase(fetchCanceledDeliveries.fulfilled, (state, action) => {
        state.loading.canceledDeliveries = false
        state.canceledDeliveries = action.payload
      })
      .addCase(fetchCanceledDeliveries.rejected, (state, action) => {
        state.loading.canceledDeliveries = false
        state.error.canceledDeliveries = action.payload
      })

    // ========== RETURN TO WORKPLACE ==========
    builder
      .addCase(returnToWorkplace.pending, (state) => {
        state.loading.action = true
        state.error.action = null
      })
      .addCase(returnToWorkplace.fulfilled, (state, action) => {
        state.loading.action = false
        // Remove from canceled deliveries
        state.canceledDeliveries = state.canceledDeliveries.filter(
          order => order.id !== action.payload.id
        )
      })
      .addCase(returnToWorkplace.rejected, (state, action) => {
        state.loading.action = false
        state.error.action = action.payload
      })

    // ========== FETCH PRETE COUNT ==========
    builder
      .addCase(fetchPreteCount.fulfilled, (state, action) => {
        state.preteCount = action.payload
      })

    // ========== FETCH READY ORDERS (prete) ==========
    builder
      .addCase(fetchReadyOrders.pending, (state) => {
        state.loading.readyForDelivery = true
      })
      .addCase(fetchReadyOrders.fulfilled, (state, action) => {
        state.loading.readyForDelivery = false
        state.readyOrders = action.payload
      })
      .addCase(fetchReadyOrders.rejected, (state, action) => {
        state.loading.readyForDelivery = false
        state.error.readyForDelivery = action.payload
      })

    // ========== FETCH DASHBOARD STATS ==========
    builder
      .addCase(fetchLivreurDashboardStats.pending, (state) => {
        state.loading.dashboardStats = true;
        state.error.dashboardStats = null;
      })
      .addCase(fetchLivreurDashboardStats.fulfilled, (state, action) => {
        state.loading.dashboardStats = false;
        state.dashboardStats = action.payload;
      })
      .addCase(fetchLivreurDashboardStats.rejected, (state, action) => {
        state.loading.dashboardStats = false;
        state.error.dashboardStats = action.payload;
      });

    // ========== CONFIRM PAYMENT (Alias) ==========
    builder
      .addCase(confirmPayment.pending, (state) => {
        state.loading.payment = true;
        state.error.payment = null;
        state.paymentRecorded = false;
      })
      .addCase(confirmPayment.fulfilled, (state, action) => {
        state.loading.payment = false;
        state.currentOrder = action.payload;
        state.paymentRecorded = true;
        state.readyForDelivery = state.readyForDelivery.filter(
          order => order.id !== action.payload.id
        );
      })
      .addCase(confirmPayment.rejected, (state, action) => {
        state.loading.payment = false;
        state.error.payment = action.payload;
        state.paymentRecorded = false;
      });

    // ========== FETCH PAYMENT TYPES ==========
    builder
      .addCase(fetchPaymentTypes.pending, (state) => {
        state.loading.paymentTypes = true;
        state.error.paymentTypes = null;
      })
      .addCase(fetchPaymentTypes.fulfilled, (state, action) => {
        state.loading.paymentTypes = false;
        state.paymentTypes = action.payload;
      })
      .addCase(fetchPaymentTypes.rejected, (state, action) => {
        state.loading.paymentTypes = false;
        state.error.paymentTypes = action.payload;
      });

    // ========== FETCH CARPET TYPES ==========
    builder
      .addCase(fetchCarpetTypes.pending, (state) => {
        state.loading.carpetTypes = true;
      })
      .addCase(fetchCarpetTypes.fulfilled, (state, action) => {
        state.loading.carpetTypes = false;
        state.carpetTypes = action.payload;
      })
      .addCase(fetchCarpetTypes.rejected, (state, action) => {
        state.loading.carpetTypes = false;
      });
  }
})

export const {
  clearErrors,
  clearSearchResult,
  resetClientCreated,
  resetOrderCreated,
  resetPaymentRecorded,
  setPendingClient,
  markNotificationsAsSeen,
  removeOrderFromReady
} = livreurSlice.actions

export default livreurSlice.reducer
