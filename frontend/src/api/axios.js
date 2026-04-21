import axios from 'axios'

const primaryBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').trim()
const fallbackBaseUrl = (import.meta.env.VITE_API_URL_FALLBACK || 'https://it.swiftsignbm.com/api').trim()

const API = axios.create({
  baseURL: primaryBaseUrl,
})

const shouldRetryWithFallback = (error) => {
  const status = error?.response?.status
  const code = error?.code
  return code === 'ERR_NETWORK' || status === 404
}

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requestConfig = error?.config
    if (!requestConfig || requestConfig.__usedFallback) {
      return Promise.reject(error)
    }

    if (!fallbackBaseUrl || fallbackBaseUrl === requestConfig.baseURL) {
      return Promise.reject(error)
    }

    if (!shouldRetryWithFallback(error)) {
      return Promise.reject(error)
    }

    requestConfig.__usedFallback = true
    requestConfig.baseURL = fallbackBaseUrl
    API.defaults.baseURL = fallbackBaseUrl
    return API.request(requestConfig)
  }
)

export default API
