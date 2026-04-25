import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'
import { getArtists, createArtist, updateArtist, deleteArtist } from '../../api/artists.js'
import { useToast } from '../../app/ToastContext.jsx'
import { PageSpinner } from '../../components/Spinner.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import ErrorMessage from '../../components/ErrorMessage.jsx'

export default function AdminArtists() {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // null | { mode: 'create' | 'edit', artist?: {} }
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formError, setFormError] = useState(null)

  const { data: artists, isLoading, isError, error } = useQuery({
    queryKey: ['artists', search],
    queryFn: () => getArtists(search || undefined),
  })

  const createMut = useMutation({
    mutationFn: createArtist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] })
      setModal(null)
      setFormError(null)
      toast('Artist created successfully')
    },
    onError: (e) => setFormError(e),
  })

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => updateArtist(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] })
      setModal(null)
      setFormError(null)
      toast('Artist updated successfully')
    },
    onError: (e) => setFormError(e),
  })

  const deleteMut = useMutation({
    mutationFn: deleteArtist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artists'] })
      setDeleteTarget(null)
      toast('Artist deleted', 'info')
    },
  })

  const handleSave = (data) => {
    setFormError(null)
    if (modal.mode === 'create') {
      createMut.mutate(data)
    } else {
      updateMut.mutate({ id: modal.artist.id, data })
    }
  }

  const openCreate = () => { setModal({ mode: 'create' }); setFormError(null) }
  const openEdit = (artist) => { setModal({ mode: 'edit', artist }); setFormError(null) }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Artists</h1>
          <p className="text-sm text-zinc-500 mt-0.5">Manage your artist roster</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Artist
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search artists…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white"
        />
      </div>

      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <ErrorMessage error={error} />
      ) : artists?.length === 0 ? (
        <EmptyState title="No artists found" description="Add your first artist to get started." />
      ) : (
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50">
                <th className="text-left px-4 py-3 font-medium text-zinc-600">Performing Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden sm:table-cell">Real Name</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden md:table-cell">Born</th>
                <th className="text-left px-4 py-3 font-medium text-zinc-600 hidden lg:table-cell">Albums</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {artists.map((artist) => (
                <tr key={artist.id} className="border-b border-zinc-50 last:border-0 hover:bg-zinc-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-zinc-900">{artist.performing_name}</td>
                  <td className="px-4 py-3 text-zinc-600 hidden sm:table-cell">{artist.real_name}</td>
                  <td className="px-4 py-3 text-zinc-500 hidden md:table-cell">{artist.date_of_birth}</td>
                  <td className="px-4 py-3 text-zinc-500 hidden lg:table-cell">{artist.album_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(artist)}
                        className="p-1.5 text-zinc-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(artist)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
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
      )}

      {modal && (
        <ArtistModal
          mode={modal.mode}
          artist={modal.artist}
          error={formError}
          saving={createMut.isPending || updateMut.isPending}
          onSave={handleSave}
          onClose={() => { setModal(null); setFormError(null) }}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete artist"
          message={`Delete "${deleteTarget.performing_name}"? This will also delete all their albums.`}
          loading={deleteMut.isPending}
          onConfirm={() => deleteMut.mutate(deleteTarget.id)}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}

function ArtistModal({ mode, artist, error, saving, onSave, onClose }) {
  const [form, setForm] = useState({
    real_name: artist?.real_name || '',
    performing_name: artist?.performing_name || '',
    date_of_birth: artist?.date_of_birth || '',
    bio: artist?.bio || '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const data = { ...form }
    if (!data.bio) delete data.bio
    onSave(data)
  }

  const inputClass = 'w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500'

  return (
    <Modal title={mode === 'create' ? 'Add Artist' : 'Edit Artist'} onClose={onClose}>
      {error && <ErrorMessage error={error} className="mb-4" />}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Performing Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.performing_name}
            onChange={(e) => setForm({ ...form, performing_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Real Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            value={form.real_name}
            onChange={(e) => setForm({ ...form, real_name: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">
            Date of Birth <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            required
            value={form.date_of_birth}
            onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-700 mb-1">Bio (optional)</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full border border-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
          />
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
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

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
