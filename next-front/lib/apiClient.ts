import axios from 'axios'
import Router from 'next/router'
import { toast } from 'sonner'
import { CONFIG } from '@/constants/config'
import { getToken, clearAuth } from '@/lib/auth'

const apiClient = axios.create({
  baseURL: CONFIG.SERVER_URL,
  timeout: CONFIG.API_TIMEOUT || 10000,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!getToken()
      clearAuth()
      if (hadToken) {
        toast.error('인증이 만료되었습니다', { description: '로그인 페이지로 이동합니다' })
        void Router.replace('/')
      }
    }
    return Promise.reject(error)
  },
)

export default apiClient
