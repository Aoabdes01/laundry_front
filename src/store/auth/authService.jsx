import { api } from "../../api/axios"



export const loginRequest = (credentials) => {
  return api.post("/auth/login", credentials)
}

export const Logout = async () => {
  await api.post("/auth/logout")
}

// export const updateUserP = async (data) =>{
//   return await api.post(`/users/change-password`,data)
// }

