import axios from 'axios'

import { supabase } from './supabase'

const ANON_ID_KEY = 'questra.anonId'

function getAnonId() {
  try {
    let id = localStorage.getItem(ANON_ID_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`
      localStorage.setItem(ANON_ID_KEY, id)
    }
    return id
  } catch {
    return 'anonymous'
  }
}

const backendUrl = import.meta.env.VITE_BACKEND_URL?.replace(/\/+$/, '')
const api = axios.create({ baseURL: backendUrl ? `${backendUrl}/api` : '/api' })

api.interceptors.request.use(async (config) => {
  config.headers['X-Anon-Id'] = getAnonId()
  if (supabase) {
    const { data } = await supabase.auth.getSession()
    const token = data?.session?.access_token
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export function extractError(error) {
  return error?.response?.data?.error?.message || error?.message || 'Something went wrong.'
}

export function errorCode(error) {
  return error?.response?.data?.error?.code || null
}

export function isQuotaError(error) {
  return error?.response?.status === 429 || errorCode(error) === 'QUOTA_EXCEEDED'
}

export function isUnauthorized(error) {
  return error?.response?.status === 401
}

export async function getMe() {
  const { data } = await api.get('/me')
  return data
}

export async function generateSuggestions({ image, audio, text }) {
  const formData = new FormData()
  if (image) formData.append('image', image)
  if (audio) formData.append('audio', audio)
  if (text && text.trim()) formData.append('text', text)

  const { data } = await api.post('/query/suggestions', formData)
  return data
}

export async function search(query) {
  const { data } = await api.post('/search', { query })
  return data
}
