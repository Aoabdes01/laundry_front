import { createAsyncThunk } from '@reduxjs/toolkit'
import {
    getAllCommandes,
    getCommandeById,
    patchCommandeStatus,
    patchTapisEtat,
    postTapisImages,
    uploadFiles as uploadFilesService,
    getPendingOrders,
    getPendingCount,
    getReturnedOrders,
    getReturnedCount
} from './employeService'

// ========== COMMANDE THUNKS ==========

export const fetchAllCommandes = createAsyncThunk(
    'employe/fetchAllCommandes',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getAllCommandes()
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des commandes')
        }
    }
)

export const fetchCommandeById = createAsyncThunk(
    'employe/fetchCommandeById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await getCommandeById(id)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement de la commande')
        }
    }
)

export const updateCommandeStatus = createAsyncThunk(
    'employe/updateCommandeStatus',
    async ({ id, newStatus, commentaire }, { rejectWithValue }) => {
        try {
            const response = await patchCommandeStatus(id, { newStatus, commentaire })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors de la mise à jour du statut')
        }
    }
)

export const updateTapisEtat = createAsyncThunk(
    'employe/updateTapisEtat',
    async ({ tapisId, newEtat }, { rejectWithValue }) => {
        try {
            const response = await patchTapisEtat(tapisId, { newEtat })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Erreur lors de la mise à jour de l'état")
        }
    }
)

export const addTapisImages = createAsyncThunk(
    'employe/addTapisImages',
    async ({ tapisId, imageUrls, type }, { rejectWithValue }) => {
        try {
            const response = await postTapisImages(tapisId, { imageUrls, type })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Erreur lors de l'ajout des images")
        }
    }
)

export const uploadEmployeImages = createAsyncThunk(
    'employe/uploadImages',
    async (files, { rejectWithValue }) => {
        try {
            const response = await uploadFilesService(files)
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Erreur lors de l'upload des images")
        }
    }
)

export const fetchPendingOrders = createAsyncThunk(
    'employe/fetchPendingOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getPendingOrders()
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des commandes en attente')
        }
    }
)

export const fetchPendingCount = createAsyncThunk(
    'employe/fetchPendingCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getPendingCount()
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement du compteur')
        }
    }
)


export const fetchReturnedOrders = createAsyncThunk(
    'employe/fetchReturnedOrders',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getReturnedOrders()
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement des commandes retournées')
        }
    }
)

export const fetchReturnedCount = createAsyncThunk(
    'employe/fetchReturnedCount',
    async (_, { rejectWithValue }) => {
        try {
            const response = await getReturnedCount()
            return response.data
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || 'Erreur lors du chargement du compteur des retours')
        }
    }
)

