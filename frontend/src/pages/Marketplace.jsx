import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  MicVocal,
  Music,
  Search,
  ShoppingCart,
  Users,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { getAlbums } from '../api/albums.js'
import { getArtists } from '../api/artists.js'
import { getLibrary } from '../api/library.js'
import { purchaseAlbum } from '../api/purchases.js'
import { useToast } from '../app/ToastContext.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import { RatingDisplay } from '../components/StarRating.jsx'
import { PageSpinner } from '../components/Spinner.jsx'
import { useAuth } from '../hooks/useAuth.js'

const PAGE_SIZE = 12

const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'rating_desc', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'name_asc', label: 'Name: A to Z' },
]

const ratingFilterOptions = [
  { value: 'all', label: 'All ratings' },
  { value: '4', label: '4+ stars' },
  { value: '3', label: '3+ stars' },
]

const cardGradients = [
  'from-violet-500 to-fuchsia-700',
  'from-blue-500 to-indigo-700',
  'from-rose-500 to-pink-700',
  'from-emerald-500 to-teal-700',
  'from-amber-500 to-orange-700',
  'from-cyan-500 to-sky-700',
]

export default function Marketplace() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const isAdmin = !!user?.is_admin

  const [activeTab, setActiveTab] = useState('albums')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState('newest')
  const [minRating, setMinRating] = useState('all')
  const [confirmTarget, setConfirmTarget] = useState(null)

  const handleSearch = (value) => {
    setSearch(value)
    setPage(0)
    clearTimeout(window._marketplaceSearchTimer)
    window._marketplaceSearchTimer = setTimeout(() => setDebouncedSearch(value), 350)
  }

  const skip = page * PAGE_SIZE

  const {
    data: albumData,
    isLoading: albumsLoading,
    isError: albumsError,
    error: albumsErrorValue,
  } = useQuery({
    queryKey: ['albums', debouncedSearch, skip, sortBy, minRating],
    queryFn: () =>
      getAlbums({
        search: debouncedSearch || undefined,
        skip,
        limit: PAGE_SIZE,
        sortBy,
        minRating: minRating === 'all' ? undefined : Number(minRating),
      }),
    enabled: activeTab === 'albums',
  })

  const {
    data: artists,
    isLoading: artistsLoading,
    isError: artistsError,
    error: artistsErrorValue,
  } = useQuery({
    queryKey: ['artists', debouncedSearch],
    queryFn: () => getArtists(debouncedSearch || undefined),
    enabled: activeTab === 'artists',
  })

  const { data: library } = useQuery({
    queryKey: ['library'],
    queryFn: getLibrary,
    enabled: !!user && !isAdmin,
  })

  const ownedIds = useMemo(
    () => new Set((library || []).map((item) => item.album_id)),
    [library],
  )

  const purchase = useMutation({
    mutationFn: purchaseAlbum,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      setConfirmTarget(null)
      toast('Album added to your library!')
    },
    onError: (err) => {
      setConfirmTarget(null)
      toast(err?.response?.data?.detail || 'Purchase failed. Please try again.', 'error')
    },
  })

  const totalPages = albumData ? Math.ceil(albumData.total / PAGE_SIZE) : 0

  return (
    <div>
      <section className="relative overflow-hidden rounded-[2rem] bg-zinc-950 px-6 py-8 text-white shadow-xl sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.35),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.25),_transparent_30%)]" />
        <div className="relative">
          <p className="text-xs uppercase tracking-[0.35em] text-white/55">Music Marketplace</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Browse artists, discover albums, purchase once, and rate what you own.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-white/70 sm:text-base">
            Explore a curated catalog of artists and albums, build your library, and rate the music
            you own.
          </p>
        </div>
      </section>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <TabButton
          active={activeTab === 'albums'}
          icon={Music}
          label="Albums"
          onClick={() => {
            setActiveTab('albums')
            setPage(0)
          }}
        />
        <TabButton
          active={activeTab === 'artists'}
          icon={Users}
          label="Artists"
          onClick={() => {
            setActiveTab('artists')
            setPage(0)
          }}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={
                activeTab === 'albums'
                  ? 'Search albums or artists...'
                  : 'Search artists by performing or real name...'
              }
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>

          {activeTab === 'albums' && (
            <>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value)
                  setPage(0)
                }}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <select
                value={minRating}
                onChange={(e) => {
                  setMinRating(e.target.value)
                  setPage(0)
                }}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                {ratingFilterOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {activeTab === 'albums' ? (
        <AlbumResults
          data={albumData}
          isLoading={albumsLoading}
          isError={albumsError}
          error={albumsErrorValue}
          isAdmin={isAdmin}
          isLoggedIn={!!user}
          ownedIds={ownedIds}
          page={page}
          totalPages={totalPages}
          skip={skip}
          onPageChange={setPage}
          onRequestPurchase={setConfirmTarget}
        />
      ) : (
        <ArtistResults
          artists={artists}
          isLoading={artistsLoading}
          isError={artistsError}
          error={artistsErrorValue}
          search={debouncedSearch}
        />
      )}

      {confirmTarget && (
        <PurchaseConfirmModal
          album={confirmTarget}
          isPurchasing={purchase.isPending}
          onConfirm={() => purchase.mutate(confirmTarget.id)}
          onClose={() => setConfirmTarget(null)}
        />
      )}
    </div>
  )
}

function AlbumResults({
  data,
  isLoading,
  isError,
  error,
  isAdmin,
  isLoggedIn,
  ownedIds,
  page,
  totalPages,
  skip,
  onPageChange,
  onRequestPurchase,
}) {
  if (isLoading) return <PageSpinner />
  if (isError) return <ErrorMessage error={error} className="mt-6 max-w-md" />

  if (data?.items.length === 0) {
    return (
      <EmptyState
        icon={Music}
        title="No albums found"
        description="Try another search term or relax the rating filter."
      />
    )
  }

  return (
    <section className="mt-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.items.map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            isOwned={ownedIds.has(album.id)}
            isLoggedIn={isLoggedIn}
            isAdmin={isAdmin}
            onRequestPurchase={() => onRequestPurchase(album)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => onPageChange((current) => Math.max(0, current - 1))}
            disabled={page === 0}
            className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm text-zinc-600">
            Page {page + 1} of {totalPages}
          </span>
          <button
            onClick={() => onPageChange((current) => Math.min(totalPages - 1, current + 1))}
            disabled={page >= totalPages - 1}
            className="rounded-lg border border-zinc-200 p-2 transition-colors hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <p className="mt-4 text-center text-xs text-zinc-400">
        Showing {skip + 1}-{Math.min(skip + PAGE_SIZE, data.total)} of {data.total} albums
      </p>
    </section>
  )
}

function ArtistResults({ artists, isLoading, isError, error, search }) {
  if (isLoading) return <PageSpinner />
  if (isError) return <ErrorMessage error={error} className="mt-6 max-w-md" />

  if (!artists?.length) {
    return (
      <EmptyState
        icon={Users}
        title="No artists found"
        description={search ? `No artist matched "${search}".` : 'No artists are available yet.'}
      />
    )
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {artists.map((artist) => (
        <article
          key={artist.id}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        >
          <div
            className={`flex h-28 items-center justify-between bg-gradient-to-br px-5 text-white ${
              cardGradients[artist.id % cardGradients.length]
            }`}
          >
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-white/70">Artist</p>
              <h3 className="mt-2 text-xl font-semibold">{artist.performing_name}</h3>
            </div>
            <MicVocal className="h-9 w-9 text-white/60" />
          </div>

          <div className="space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-400">
                Real Name
              </p>
              <p className="mt-1 text-sm text-zinc-700">{artist.real_name}</p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <InfoTile label="Born" value={artist.date_of_birth} />
              <InfoTile label="Albums" value={String(artist.album_count)} />
            </div>

            <p className="text-sm leading-6 text-zinc-600">
              {artist.bio || 'No biography provided for this artist yet.'}
            </p>
          </div>
        </article>
      ))}
    </section>
  )
}

function AlbumCard({ album, isOwned, isLoggedIn, isAdmin, onRequestPurchase }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div
        className={`flex h-36 items-center justify-center bg-gradient-to-br ${
          cardGradients[album.id % cardGradients.length]
        }`}
      >
        <Music className="h-14 w-14 text-white/50" />
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="truncate font-semibold text-zinc-900" title={album.name}>
          {album.name}
        </h3>
        <p className="mb-2 truncate text-sm text-zinc-500" title={album.artist_name}>
          {album.artist_name}
        </p>

        <RatingDisplay rating={album.rating} count={album.rating_count} />

        <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
          <span className="text-base font-bold text-violet-700">
            ${Number(album.price).toFixed(2)}
          </span>

          {!isAdmin &&
            (isOwned ? (
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                Owned
              </span>
            ) : isLoggedIn ? (
              <button
                onClick={onRequestPurchase}
                className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Buy
              </button>
            ) : (
              <Link to="/login" className="text-xs font-medium text-violet-600 hover:underline">
                Sign in to buy
              </Link>
            ))}
        </div>
      </div>
    </article>
  )
}

function PurchaseConfirmModal({ album, isPurchasing, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-xl">
        <div
          className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${
            cardGradients[album.id % cardGradients.length]
          }`}
        >
          <Music className="h-12 w-12 text-white/50" />
          <button
            onClick={onClose}
            disabled={isPurchasing}
            className="absolute right-3 top-3 text-white/70 transition-colors hover:text-white disabled:opacity-40"
            aria-label="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <h2 className="mb-0.5 text-lg font-semibold text-zinc-900">{album.name}</h2>
          <p className="mb-4 text-sm text-zinc-500">{album.artist_name}</p>

          <div className="mb-6 flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3">
            <span className="text-sm text-zinc-500">Total</span>
            <span className="text-xl font-bold text-violet-700">
              ${Number(album.price).toFixed(2)}
            </span>
          </div>

          <p className="mb-4 text-center text-xs text-zinc-400">
            Complete the purchase to add this album to your library instantly.
          </p>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isPurchasing}
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isPurchasing}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-60"
            >
              <ShoppingCart className="h-4 w-4" />
              {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TabButton({ active, icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-zinc-900 text-white'
          : 'border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-zinc-700">{value}</p>
    </div>
  )
}
