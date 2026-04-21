import axios from 'axios'

// CHANGE: fallback API base URL
// WHY: if .env is missing, admin should still fetch backend data in local dev
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const appBaseUrl = (() => {
  const configuredBase = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/')
  if (configuredBase !== '/') {
    return configuredBase
  }
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return '/admin/'
  }
  return '/'
})()

const API = axios.create({
  baseURL: apiBaseUrl,
})

// Automatically attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  const authUserRaw = localStorage.getItem('authUser')
  let role = ''

  const method = String(config.method || 'get').toLowerCase()
  const isFormDataPayload =
    typeof FormData !== 'undefined' && config.data instanceof FormData

  // PHP does not reliably parse multipart payloads on PUT/PATCH.
  // Convert these requests to POST while preserving intended method.
  if (isFormDataPayload && (method === 'put' || method === 'patch')) {
    config.method = 'post'
    config.headers = config.headers || {}
    if (!config.headers['X-HTTP-Method-Override']) {
      config.headers['X-HTTP-Method-Override'] = method.toUpperCase()
    }
  }

  if (authUserRaw) {
    try {
      role = JSON.parse(authUserRaw)?.role || ''
    } catch {
      role = ''
    }
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (role) {
    config.headers['x-user-role'] = role
  }
  return config
})

// Handle expired token globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const message = String(error.response?.data?.message || '')
    const requestUrl = String(error.config?.url || '')
    const isAuthRequest =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register')
    const isSuspendedAccount = status === 403 && /^Account is\s+/i.test(message)

    // Do not hard-redirect on invalid login/register credentials.
    if ((status === 401 && !isAuthRequest) || (isSuspendedAccount && !isAuthRequest)) {
      localStorage.removeItem('token')
      localStorage.removeItem('authUser')
      window.location.href = `${appBaseUrl}login`
    }
    return Promise.reject(error)
  }
)

export default API
