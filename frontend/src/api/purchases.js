import api from './client.js'

export const purchaseAlbum = (albumId) =>
  api.post(`/albums/${albumId}/purchase`).then((r) => r.data)
