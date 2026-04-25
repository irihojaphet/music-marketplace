import api from './client.js'

export const createRating = (albumId, score) =>
  api.post(`/albums/${albumId}/rating`, { score }).then((r) => r.data)

export const updateRating = (albumId, score) =>
  api.patch(`/albums/${albumId}/rating`, { score }).then((r) => r.data)
