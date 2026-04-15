import { createSlice } from "@reduxjs/toolkit";
import { fetchNotifications, fetchUnreadCount, markAsReadThunk, markAllAsReadThunk } from "./notificationThunks";

const notificationSlice = createSlice({
    name: "notifications",
    initialState: {
        list: [],
        unreadCount: 0,
        loading: false,
        error: null
    },
    reducers: {
        clearNotifications: (state) => {
            state.list = [];
            state.unreadCount = 0;
        }
    },
    extraReducers: (builder) => {
        builder
            // Fetch All
            .addCase(fetchNotifications.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchNotifications.fulfilled, (state, action) => {
                state.loading = false;
                state.list = Array.isArray(action.payload) ? action.payload : [];
                state.unreadCount = state.list.filter(n => !n.read).length;
            })
            .addCase(fetchNotifications.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            // Unread Count
            .addCase(fetchUnreadCount.fulfilled, (state, action) => {
                state.unreadCount = action.payload;
            })
            // Mark Single
            .addCase(markAsReadThunk.fulfilled, (state, action) => {
                const notif = state.list.find(n => n.id === action.payload);
                if (notif && !notif.read) {
                    notif.read = true;
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
            })
            // Mark All
            .addCase(markAllAsReadThunk.fulfilled, (state) => {
                state.list.forEach(n => n.read = true);
                state.unreadCount = 0;
            });
    }
});

export const { clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
