import { configureStore } from "@reduxjs/toolkit"
import authReducer from './auth/authSlice'
import adminReducer from './admin/adminSlice'
import livreurReducer from './livreur/livreurSlice'
import employeReducer from './employe/employeSlice'
import statisticsReducer from './statistics/statisticsSlice'
import notificationReducer from './notifications/notificationSlice'

export const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        livreur: livreurReducer,
        employe: employeReducer,
        statistics: statisticsReducer,
        notifications: notificationReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }),
})

