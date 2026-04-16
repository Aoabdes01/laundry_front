import { createAsyncThunk } from "@reduxjs/toolkit";
import {
    createUser,
    updateUser,
    getUser,
    getActiveUsers,
    getInactiveUsers,
    inactivateUser,
    activateUser,
    deleteUser,
    getAllCommandes,
    getCommandeById,
    getAllClients,
    getClientCommandes,
    exportCommandesCsv,
    getClientStatistics,
    adminGetCarpetTypes,
    adminCreateCarpetType,
    adminUpdateCarpetType,
    adminDeleteCarpetType,
    adminChangePassword,
} from "./adminService";


export const createNewUser = createAsyncThunk(
    'admin/createUser',
    async (userData, { rejectWithValue }) => {
        try {
            const res = await createUser(userData);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateExistingUser = createAsyncThunk(
    'admin/updateUser',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await updateUser(id, data);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);




export const fetchActiveUsers = createAsyncThunk(
    'admin/fetchActiveUsers',
    async (_, { rejectWithValue }) => {
        try {
            const res = await getActiveUsers();
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchInactiveUsers = createAsyncThunk(
    'admin/fetchInactiveUsers',
    async (_, { rejectWithValue }) => {
        try {
            const res = await getInactiveUsers();
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deactivateUser = createAsyncThunk(
    'admin/deactivateUser',
    async (id, { rejectWithValue }) => {
        try {
            const res = await inactivateUser(id);
            return { id, data: res.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const reactivateUser = createAsyncThunk(
    'admin/reactivateUser',
    async (id, { rejectWithValue }) => {
        try {
            const res = await activateUser(id);
            return { id, data: res.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const removeUser = createAsyncThunk(
    'admin/removeUser',
    async (id, { rejectWithValue }) => {
        try {
            const res = await deleteUser(id);
            return { id, data: res.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ===== COMMANDES =====

export const fetchAllCommandes = createAsyncThunk(
    'admin/fetchAllCommandes',
    async (params, { rejectWithValue }) => {
        try {
            const res = await getAllCommandes(params);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const downloadCommandesCsv = createAsyncThunk(
    'admin/downloadCommandesCsv',
    async (_, { rejectWithValue }) => {
        try {
            const res = await exportCommandesCsv();
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'commandes.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            return true;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchCommandeById = createAsyncThunk(
    'admin/fetchCommandeById',
    async (id, { rejectWithValue }) => {
        try {
            const res = await getCommandeById(id);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ===== CLIENTS =====

export const fetchAllClients = createAsyncThunk(
    'admin/fetchAllClients',
    async (params, { rejectWithValue }) => {
        try {
            const res = await getAllClients(params);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchClientStatistics = createAsyncThunk(
    'admin/fetchClientStatistics',
    async (_, { rejectWithValue }) => {
        try {
            const res = await getClientStatistics();
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const fetchClientCommandes = createAsyncThunk(
    'admin/fetchClientCommandes',
    async (clientId, { rejectWithValue }) => {
        try {
            const res = await getClientCommandes(clientId);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

// ===== CARPET TYPES =====

export const fetchAdminCarpetTypes = createAsyncThunk(
    'admin/fetchCarpetTypes',
    async (_, { rejectWithValue }) => {
        try {
            const res = await adminGetCarpetTypes();
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const createAdminCarpetType = createAsyncThunk(
    'admin/createCarpetType',
    async (data, { rejectWithValue }) => {
        try {
            const res = await adminCreateCarpetType(data);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const updateAdminCarpetType = createAsyncThunk(
    'admin/updateCarpetType',
    async ({ id, data }, { rejectWithValue }) => {
        try {
            const res = await adminUpdateCarpetType(id, data);
            return res.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const deleteAdminCarpetType = createAsyncThunk(
    'admin/deleteCarpetType',
    async (id, { rejectWithValue }) => {
        try {
            await adminDeleteCarpetType(id);
            return id;
        } catch (error) {
            return rejectWithValue(error.response?.data || error.message);
        }
    }
);

export const changeUserpassword = createAsyncThunk(
    'admin/changeUserpassword',
    async ({ id, password }, { rejectWithValue }) => {
        try {
            const res = await adminChangePassword(id, password)
            return res.data
        } catch (err) {
            return rejectWithValue(err.response?.data?.message)
        }
    }
)
