import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Music, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAlbums } from '../api/albums.js'
import { getLibrary } from '../api/library.js'
import { purchaseAlbum } from '../api/purchases.js'
import { useAuth } from '../hooks/useAuth.js'
import { PageSpinner } from '../components/Spinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { RatingDisplay } from '../components/StarRating.jsx'

const PAGE_SIZE = 12

export default function Marketplace() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [purchaseError, setPurchaseError] = useState(null)

  const handleSearch = (val) => {
    setSearch(val)
    setPage(0)
    clearTimeout(window._searchTimer)
    window._searchTimer = setTimeout(() => setDebouncedSearch(val), 400)
  }

  const skip = page * PAGE_SIZE

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['albums', debouncedSearch, skip],
    queryFn: () => getAlbums({ search: debouncedSearch || undefined, skip, limit: PAGE_SIZE }),
  })

  const { data: library } = useQuery({
    queryKey: ['library'],
    queryFn: getLibrary,
    enabled: !!user,
  })

  const ownedIds = useMemo(
    () => new Set((library || []).map((item) => item.album_id)),
    [library],
  )

  const purchase = useMutation({
    mutationFn: purchaseAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      setPurchaseError(null)
    },
    onError: (err) => setPurchaseError(err),
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-1">Music Marketplace</h1>
        <p className="text-zinc-500">Discover and purchase albums from your favourite artists.</p>
      </div>

      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          type="text"
          placeholder="Search albums or artists…"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border border-zinc-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent bg-white"
        />
      </div>

      {purchaseError && (
        <ErrorMessage error={purchaseError} className="mb-4 max-w-md" />
      )}

      {isLoading ? (
        <PageSpinner />
      ) : isError ? (
        <ErrorMessage error={error} className="max-w-md" />
      ) : data?.items.length === 0 ? (
        <EmptyState
          icon={Music}
          title="No albums found"
          description={debouncedSearch ? `No results for "${debouncedSearch}"` : 'No albums available yet.'}
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                isOwned={ownedIds.has(album.id)}
                isLoggedIn={!!user}
                isPurchasing={purchase.isPending && purchase.variables === album.id}
                onPurchase={() => purchase.mutate(album.id)}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm text-zinc-600">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="text-center text-xs text-zinc-400 mt-4">
            Showing {skip + 1}–{Math.min(skip + PAGE_SIZE, data.total)} of {data.total} albums
          </p>
        </>
      )}
    </div>
  )
}

function AlbumCard({ album, isOwned, isLoggedIn, isPurchasing, onPurchase }) {
  const colors = [
    'from-violet-500 to-purple-700',
    'from-blue-500 to-indigo-700',
    'from-rose-500 to-pink-700',
    'from-emerald-500 to-teal-700',
    'from-amber-500 to-orange-700',
    'from-cyan-500 to-sky-700',
  ]
  const colorIdx = album.id % colors.length

  return (
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      <div className={`bg-gradient-to-br ${colors[colorIdx]} h-36 flex items-center justify-center flex-shrink-0`}>
        <Music className="h-14 w-14 text-white/50" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-zinc-900 truncate" title={album.name}>
          {album.name}
        </h3>
        <p className="text-sm text-zinc-500 truncate mb-2" title={album.artist_name}>
          {album.artist_name}
        </p>

        <RatingDisplay rating={album.rating} count={album.rating_count} />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-zinc-100">
          <span className="text-base font-bold text-violet-700">${Number(album.price).toFixed(2)}</span>

          {isOwned ? (
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full font-medium">
              ✓ Owned
            </span>
          ) : isLoggedIn ? (
            <button
              onClick={onPurchase}
              disabled={isPurchasing}
              className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors font-medium"
            >
              <ShoppingCart className="h-3.5 w-3.5" />
              {isPurchasing ? 'Buying…' : 'Buy'}
            </button>
          ) : (
            <Link
              to="/login"
              className="text-xs text-violet-600 hover:underline font-medium"
            >
              Sign in to buy
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
