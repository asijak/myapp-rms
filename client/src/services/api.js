import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
  withCredentials: true,
})

// Attach token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle expired session / unauthorized
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')

      // Optional UX (you can replace alert with toast later)
      alert('Session expired. Please login again.')

      window.location.href = '/auth/login?expired=1'
    }
    return Promise.reject(err)
  },
)

export default api
