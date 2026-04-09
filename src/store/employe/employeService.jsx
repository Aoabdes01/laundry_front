import { api } from '../../api/axios'

// ========== COMMANDE ENDPOINTS ==========

// Get all commandes
export const getAllCommandes = async () => {
    return await api.get('/employe/commandes')
}

// Get commande by id (with tapis details)
export const getCommandeById = async (id) => {
    return await api.get(`/employe/commandes/${id}`)
}

// Update commande status
export const patchCommandeStatus = async (id, data) => {
    return await api.patch(`/employe/commandes/${id}/status`, data)
}

// Update tapis état
export const patchTapisEtat = async (tapisId, data) => {
    return await api.patch(`/employe/commandes/tapis/${tapisId}/etat`, data)
}

// Add tapis images
export const postTapisImages = async (tapisId, data) => {
    return await api.post(`/employe/commandes/tapis/${tapisId}/images`, data)
}

// Upload tapis files
export const uploadFiles = async (files) => {
    const formData = new FormData();
    files.forEach(file => {
        formData.append('files', file);
    });
    return await api.post('/employe/tapis/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    });
}

// Get orders en attente
export const getPendingOrders = async () => {
    return await api.get('/employe/commandes/attente')
}

// Get count of orders en attente
export const getPendingCount = async () => {
    return await api.get('/employe/commandes/count/attente')
}

// Get orders retournées
export const getReturnedOrders = async () => {
    return await api.get('/employe/commandes/retournee')
}

// Get count of orders retournées
export const getReturnedCount = async () => {
    return await api.get('/employe/commandes/count/retournee')
}

