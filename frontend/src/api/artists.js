import api from './client.js'

export const getArtists = (search) =>
  api.get('/artists', { params: search ? { search } : {} }).then((r) => r.data)

export const getArtist = (id) => api.get(`/artists/${id}`).then((r) => r.data)

export const createArtist = (data) => api.post('/artists', data).then((r) => r.data)

export const updateArtist = (id, data) => api.patch(`/artists/${id}`, data).then((r) => r.data)

export const deleteArtist = (id) => api.delete(`/artists/${id}`)
