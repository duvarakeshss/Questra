import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export function extractError(error) {
  const detail = error?.response?.data?.error?.message
  return detail || error?.message || 'Something went wrong.'
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
