import { createAsyncThunk } from '@reduxjs/toolkit'
import { loginRequest, Logout } from './authService'
import { jwtDecode } from 'jwt-decode'
import { logOut, setCredentials } from './authSlice'

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      const res = await loginRequest(credentials)

      const accessToken = res.data.token;

      const decoded = jwtDecode(accessToken)

      dispatch(setCredentials({
        user: {
          id:decoded.sub,
          name:decoded.name,
          email:decoded.email,
          role:decoded.role
        },
        token: accessToken
      }))
    } catch (error) {
      if (error.response?.data?.error === "ACCOUNT_DISABLED") {
        window.location.href = '/compte-suspendu'
        return rejectWithValue("Compte désactivé") // will not display because of redirect but good practice
      }
      return rejectWithValue(error.response?.data || "Erreur de connexion")
    }
  }
)

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch }) => {
    await Logout()
    dispatch(logOut())
  }
)

