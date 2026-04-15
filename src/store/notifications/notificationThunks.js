import { createAsyncThunk } from "@reduxjs/toolkit";
import * as notificationService from "./notificationService";

export const fetchNotifications = createAsyncThunk(
    "notifications/fetchAll",
    async (_, { rejectWithValue }) => {
        try {
            const res = await notificationService.getMyNotifications();
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message || "Erreur de chargement");
        }
    }
);

export const fetchUnreadCount = createAsyncThunk(
    "notifications/fetchUnreadCount",
    async (_, { rejectWithValue }) => {
        try {
            const res = await notificationService.getUnreadCount();
            return res.data;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const markAsReadThunk = createAsyncThunk(
    "notifications/markAsRead",
    async (id, { rejectWithValue }) => {
        try {
            await notificationService.markNotificationAsRead(id);
            return id;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);

export const markAllAsReadThunk = createAsyncThunk(
    "notifications/markAllAsRead",
    async (_, { rejectWithValue }) => {
        try {
            await notificationService.markAllNotificationsAsRead();
            return true;
        } catch (err) {
            return rejectWithValue(err.response?.data?.message);
        }
    }
);
