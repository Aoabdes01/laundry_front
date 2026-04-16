import { createSlice } from "@reduxjs/toolkit";
const initstate = {
    user: null,
    token: null

}

const authSlice = createSlice({
    name: 'auth',
    initialState: initstate,
    reducers: {
        setCredentials: (state, action) => {
            const { user, token } = action.payload;
            if (user !== undefined) {
                state.user = user ? {
                    ...user,
                    isActive: user.isActive ?? true
                } : null;
                if (state.user) {
                    localStorage.setItem('user', JSON.stringify(state.user))
                } else {
                    localStorage.removeItem('user')
                }
            }
            if (token !== undefined) {
                state.token = token
            }
        },

        logOut: () => ({
            user: null,
            token: null
        })
    }
})
export const { setCredentials, logOut } = authSlice.actions
export default authSlice.reducer

