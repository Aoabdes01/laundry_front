import { createSlice } from "@reduxjs/toolkit";
import {
    createNewUser,
    updateExistingUser,
    fetchActiveUsers,
    fetchInactiveUsers,
    deactivateUser,
    reactivateUser,
    removeUser,
    fetchAllCommandes,
    fetchCommandeById,
    fetchAllClients,
    fetchClientCommandes,
    fetchClientStatistics,
    fetchAdminCarpetTypes,
    createAdminCarpetType,
    updateAdminCarpetType,
    deleteAdminCarpetType,
} from "./adminThunk";

const initialState = {
    activeUsers: [],
    inactiveUsers: [],
    currentUser: null,
    commandes: [],
    selectedCommande: null,
    clients: [],
    clientCommandes: [],
    selectedClient: null,
    clientStatistics: null,
    carpetTypes: [],
    carpetTypesLoading: false,
    carpetTypesError: null,
    loading: false,
    error: null,
    success: false,
    message: null
};

const adminSlice = createSlice({
    name: 'admin',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        clearSuccess: (state) => {
            state.success = false;
            state.message = null;
        },
        clearCurrentUser: (state) => {
            state.currentUser = null;
        },
        clearSelectedCommande: (state) => {
            state.selectedCommande = null;
        },
        clearClientCommandes: (state) => {
            state.clientCommandes = [];
            state.selectedClient = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // --- CREATE USER ---
            .addCase(createNewUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(createNewUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Utilisateur créé avec succès";
                // Add to the correct list immediately
                if (action.payload.isActive) {
                    state.activeUsers.push(action.payload);
                } else {
                    state.inactiveUsers.push(action.payload);
                }
            })
            .addCase(createNewUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur lors de la création";
            })

            // --- UPDATE USER ---
            .addCase(updateExistingUser.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.success = false;
            })
            .addCase(updateExistingUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Utilisateur mis à jour avec succès";

                const updatedUser = action.payload;

                // Remove from both lists first to avoid duplicates/confusion
                state.activeUsers = state.activeUsers.filter(u => u.id !== updatedUser.id);
                state.inactiveUsers = state.inactiveUsers.filter(u => u.id !== updatedUser.id);

                // Add back to the correct list based on new status
                if (updatedUser.isActive) {
                    state.activeUsers.push(updatedUser);
                } else {
                    state.inactiveUsers.push(updatedUser);
                }
            })
            .addCase(updateExistingUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur lors de la mise à jour";
            })

            // --- FETCH ACTIVE USERS ---
            .addCase(fetchActiveUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchActiveUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.activeUsers = action.payload;
            })
            .addCase(fetchActiveUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement actifs";
            })

            // --- FETCH INACTIVE USERS ---
            .addCase(fetchInactiveUsers.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchInactiveUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.inactiveUsers = action.payload;
            })
            .addCase(fetchInactiveUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement inactifs";
            })

            // --- DEACTIVATE USER ---
            .addCase(deactivateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deactivateUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Utilisateur désactivé";

                const userId = action.payload.id;

                // Find the user in active list
                const userIndex = state.activeUsers.findIndex(u => u.id === userId);

                if (userIndex !== -1) {
                    // Remove from active
                    const user = state.activeUsers[userIndex];
                    state.activeUsers.splice(userIndex, 1);

                    // Update status and add to inactive (Normalize both fields)
                    const updatedUser = { ...user, isActive: false, active: false };
                    state.inactiveUsers.push(updatedUser);
                }
            })
            .addCase(deactivateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur désactivation";
            })

            // --- REACTIVATE USER ---
            .addCase(reactivateUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(reactivateUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Utilisateur activé";

                const userId = action.payload.id;

                // Find in inactive list
                const userIndex = state.inactiveUsers.findIndex(u => u.id === userId);

                if (userIndex !== -1) {
                    // Remove from inactive
                    const user = state.inactiveUsers[userIndex];
                    state.inactiveUsers.splice(userIndex, 1);

                    // Update status and add to active (Normalize both fields)
                    const updatedUser = { ...user, isActive: true, active: true };
                    state.activeUsers.push(updatedUser);
                }
            })
            .addCase(reactivateUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur activation";
            })

            // --- DELETE USER ---
            .addCase(removeUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeUser.fulfilled, (state, action) => {
                state.loading = false;
                state.success = true;
                state.message = "Utilisateur supprimé";

                const userId = action.payload.id;
                // REMOVED: state.users filter (this caused the crash)
                // We only need to remove from inactive list because we can only delete inactive users
                state.inactiveUsers = state.inactiveUsers.filter(u => u.id !== userId);
            })
            .addCase(removeUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur suppression";
            })

            // --- FETCH ALL COMMANDES ---
            .addCase(fetchAllCommandes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllCommandes.fulfilled, (state, action) => {
                state.loading = false;
                state.commandes = action.payload;
            })
            .addCase(fetchAllCommandes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement commandes";
            })

            // --- FETCH COMMANDE BY ID ---
            .addCase(fetchCommandeById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchCommandeById.fulfilled, (state, action) => {
                state.loading = false;
                state.selectedCommande = action.payload;
            })
            .addCase(fetchCommandeById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement commande";
            })

            // --- FETCH ALL CLIENTS ---
            .addCase(fetchAllClients.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllClients.fulfilled, (state, action) => {
                state.loading = false;
                state.clients = action.payload;
            })
            .addCase(fetchAllClients.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement clients";
            })

            // --- FETCH CLIENT COMMANDES ---
            .addCase(fetchClientCommandes.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClientCommandes.fulfilled, (state, action) => {
                state.loading = false;
                state.clientCommandes = action.payload;
            })
            .addCase(fetchClientCommandes.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement commandes client";
            })
            
            // --- FETCH CLIENT STATISTICS ---
            .addCase(fetchClientStatistics.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchClientStatistics.fulfilled, (state, action) => {
                state.loading = false;
                state.clientStatistics = action.payload;
            })
            .addCase(fetchClientStatistics.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload?.message || "Erreur chargement statistiques clients";
            })

            // --- FETCH ADMIN CARPET TYPES ---
            .addCase(fetchAdminCarpetTypes.pending, (state) => {
                state.carpetTypesLoading = true;
                state.carpetTypesError = null;
            })
            .addCase(fetchAdminCarpetTypes.fulfilled, (state, action) => {
                state.carpetTypesLoading = false;
                state.carpetTypes = action.payload;
            })
            .addCase(fetchAdminCarpetTypes.rejected, (state, action) => {
                state.carpetTypesLoading = false;
                state.carpetTypesError = action.payload?.message || "Erreur chargement types";
            })

            // --- CREATE CARPET TYPE ---
            .addCase(createAdminCarpetType.fulfilled, (state, action) => {
                state.carpetTypes.push(action.payload);
            })

            // --- UPDATE CARPET TYPE ---
            .addCase(updateAdminCarpetType.fulfilled, (state, action) => {
                const idx = state.carpetTypes.findIndex(t => t.id === action.payload.id);
                if (idx !== -1) state.carpetTypes[idx] = action.payload;
            })

            // --- DELETE CARPET TYPE ---
            .addCase(deleteAdminCarpetType.fulfilled, (state, action) => {
                state.carpetTypes = state.carpetTypes.filter(t => t.id !== action.payload);
            });
    }
});

export const { clearError, clearSuccess, clearCurrentUser, clearSelectedCommande, clearClientCommandes } = adminSlice.actions;
export default adminSlice.reducer;
