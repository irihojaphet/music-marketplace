import api from './client.js'

export const getLibrary = () => api.get('/me/library').then((r) => r.data)
