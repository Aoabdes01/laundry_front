// Commandes
export const selectCommandes = (state) => state.employe.commandes
export const selectSelectedCommande = (state) => state.employe.selectedCommande

// Loading
export const selectLoading = (state) => state.employe.loading
export const selectIsLoadingCommandes = (state) => state.employe.loading.commandes
export const selectIsLoadingSelectedCommande = (state) => state.employe.loading.selectedCommande
export const selectIsUpdatingStatus = (state) => state.employe.loading.updateStatus
export const selectIsUpdatingTapis = (state) => state.employe.loading.updateTapis

// Notifications
export const selectPendingOrders = (state) => state.employe.pendingOrders
export const selectPendingCount = (state) => state.employe.pendingCount
export const selectSeenNotificationIdsEmploye = (state) => state.employe.seenNotificationIds

// Errors
export const selectErrors = (state) => state.employe.error
export const selectCommandesError = (state) => state.employe.error.commandes
export const selectUpdateStatusError = (state) => state.employe.error.updateStatus

