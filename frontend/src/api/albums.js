import api from './client.js'

export const getAlbums = ({ search, skip = 0, limit = 20 } = {}) =>
  api.get('/albums', { params: { search, skip, limit } }).then((r) => r.data)

export const getAlbum = (id) => api.get(`/albums/${id}`).then((r) => r.data)

export const createAlbum = (data) => api.post('/albums', data).then((r) => r.data)

export const updateAlbum = (id, data) => api.patch(`/albums/${id}`, data).then((r) => r.data)

export const deleteAlbum = (id) => api.delete(`/albums/${id}`)
