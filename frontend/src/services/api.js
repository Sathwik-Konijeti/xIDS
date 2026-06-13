import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export const login = (username, password) => {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  return api.post('/auth/token', form)
}

export const getAlerts = (params) => api.get('/alerts', { params })
export const getAlert = (id) => api.get(`/alerts/${id}`)
export const submitFeedback = (id, verdict, comment) =>
  api.post(`/alerts/${id}/feedback`, { verdict, comment })
export const getStats = () => api.get('/stats')

export default api
