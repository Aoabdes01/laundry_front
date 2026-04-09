export const selectAdminState = (state) => state.admin;

export const selectActiveUsers = (state) => state.admin.activeUsers;
export const selectInactiveUsers = (state) => state.admin.inactiveUsers;
export const selectAdminLoading = (state) => state.admin.loading;
export const selectAdminError = (state) => state.admin.error;
export const selectAdminSuccess = (state) => state.admin.success;
export const selectAdminMessage = (state) => state.admin.message;

export const selectAllCommandes = (state) => state.admin.commandes;
export const selectSelectedCommande = (state) => state.admin.selectedCommande;

export const selectAllClients = (state) => state.admin.clients;
export const selectClientCommandes = (state) => state.admin.clientCommandes;
export const selectSelectedClient = (state) => state.admin.selectedClient;
export const selectClientStatistics = (state) => state.admin.clientStatistics;

