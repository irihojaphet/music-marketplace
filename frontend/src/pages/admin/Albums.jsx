import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { getAlbums, createAlbum, updateAlbum, deleteAlbum } from '../../api/albums.js'
import { getArtists } from '../../api/artists.js'
import { PageSpinner } from '../../components/Spinner.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorMessage from '../../components/ErrorMessage.jsx'
import { RatingDisplay } from '../../components/StarRating.jsx'

export default function AdminAlbums() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [modal, setModal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formError, setFormError] = useState(null)

  const PAGE_SIZE = 20

  const handleSearch = (val) => {
    setSearch(val)
    setPage(0)
    clearTimeout(window._albumSearchTimer)
    window._albumSearchTimer = setTimeout(() => setDebouncedSearch(val), 400)
  }

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['albums', debouncedSearch, page * PAGE_SIZE],
    queryFn: () => getAlbums({ search: debouncedSearch || undefined, skip: page * PAGE_SIZE, limit: PAGE_SIZE }),
  })

  const { data: artists } = useQuery({
    queryKey: ['artists'],
    queryFn: () => getArtists(),
  })

  const createMut = useMutation({
    mutationFn: createAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      setModal(null)
      setFormError(null)
    },
    onError: (e) => setFormError(e),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateAlbum(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      setModal(null)
      setFormError(null)
    },
    onError: (e) => setFormError(e),
  })

  const deleteMut = useMutation({
    mutationFn: deleteAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      setDeleteTarget(null)
    },
  })

  const handleSave = (data) => {
    setFormError(null)
    if (modal.mode === 'create') {
      createMut.mutate(data)
    } else {
      updateMut.mutate({ id: modal.album.id, data })
    }
  }

  const openCreate = () => { setModal({ mode: 'create' }); setFormError(null) }
  const openEdit = (album) => { setModal({ mode: 'edit', album }); setFormError(null) }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Albums</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your album catalog</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Album
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search albums or artists…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <ErrorMessage error={error} />
      ) : data?.items.length === 0 ? (
        <EmptyState title="No albums found" description="Add your first album to the catalog." />
      ) : (
        <>
          <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50">
                  <th className="text-left px-4 py-3 font-medium text-zinc-600">Album</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden sm:table-cell">Artist</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden md:table-cell">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden lg:table-cell">Rating</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.items.map((album) => (
                  <tr key={album.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-zinc-900">{album.name}</td>
                    <td className="px-4 py-3 text-zinc-600 hidden sm:table-cell">{album.artist_name}</td>
                    <td className="px-4 py-3 text-zinc-600 hidden md:table-cell">${Number(album.price).toFixed(2)}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <RatingDisplay rating={album.rating} count={album.rating_count} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(album)}
                          className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(album)}
                          className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 py-1.5 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {modal && (
        <AlbumModal
          mode={modal.mode}
          album={modal.album}
          artists={artists || []}
          error={formError}
          saving={createMut.isPending || updateMut.isPending}
          onSave={handleSave}
          onClose={() => { setModal(null); setFormError(null) }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete album"
          message={`Delete "${deleteTarget.name}"? This will also remove all purchases and ratings.`}
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

function AlbumModal({ mode, album, artists, error, saving, onSave, onClose }) {
  const [form, setForm] = useState({
    name: album?.name || '',
    price: album?.price ? String(album.price) : '',
    artist_id: album?.artist_id ? String(album.artist_id) : '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({ name: form.name, price: form.price, artist_id: Number(form.artist_id) })
  }

  return (
    <Modal title={mode === 'create' ? 'Add Album' : 'Edit Album'} onClose={onClose}>
      {error && <ErrorMessage error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Album Name</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Album title"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Price ($)</label>
          <input
            required
            type="number"
            step="0.01"
            min="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="9.99"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Artist</label>
          <select
            required
            value={form.artist_id}
            onChange={(e) => setForm({ ...form, artist_id: e.target.value })}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
          >
            <option value="">Select an artist…</option>
            {artists.map((a) => (
              <option key={a.id} value={a.id}>{a.performing_name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function ConfirmModal({ title, message, loading, onConfirm, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <p className="text-sm text-zinc-600 mb-6">{message}</p>
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm border border-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors"
        >
          {loading ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
