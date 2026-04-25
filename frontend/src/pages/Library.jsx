import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Library as LibraryIcon, Music } from 'lucide-react'
import { getLibrary } from '../api/library.js'
import { createRating, updateRating } from '../api/ratings.js'
import { useToast } from '../app/ToastContext.jsx'
import { PageSpinner } from '../components/Spinner.jsx'
import EmptyState from '../components/EmptyState.jsx'
import ErrorMessage from '../components/ErrorMessage.jsx'
import StarRating, { RatingDisplay } from '../components/StarRating.jsx'

export default function Library() {
  const queryClient = useQueryClient()
  const toast = useToast()

  const { data: library, isLoading, isError, error } = useQuery({
    queryKey: ['library'],
    queryFn: getLibrary,
  })

  const rateMutation = useMutation({
    mutationFn: ({ albumId, score, isUpdate }) =>
      isUpdate ? updateRating(albumId, score) : createRating(albumId, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library'] })
      queryClient.invalidateQueries({ queryKey: ['albums'] })
      toast('Rating saved!')
    },
    onError: () => toast('Failed to save rating', 'error'),
  })

  const handleRate = (albumId, score, hasExisting) => {
    rateMutation.mutate({ albumId, score, isUpdate: hasExisting })
  }

  if (isLoading) return <PageSpinner />
  if (isError) return <ErrorMessage error={error} className="max-w-md" />

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-900 mb-1 flex items-center gap-2">
          <LibraryIcon className="h-7 w-7 text-violet-600" />
          My Library
        </h1>
        <p className="text-zinc-500">
          {library?.length > 0
            ? `${library.length} album${library.length !== 1 ? 's' : ''} in your collection`
            : 'Your purchased albums will appear here.'}
        </p>
      </div>

      {library?.length === 0 ? (
        <EmptyState
          icon={Music}
          title="Your library is empty"
          description="Head to the marketplace to discover and purchase albums."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {library?.map((item) => (
            <LibraryCard
              key={item.id}
              item={item}
              onRate={(score) => handleRate(item.album_id, score, item.album.user_rating !== null)}
              isRating={rateMutation.isPending && rateMutation.variables?.albumId === item.album_id}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function LibraryCard({ item, onRate, isRating }) {
  const { album } = item
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
    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden flex flex-col">
      <div className={`bg-gradient-to-br ${colors[colorIdx]} h-32 flex items-center justify-center flex-shrink-0`}>
        <Music className="h-12 w-12 text-white/50" />
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-zinc-900 truncate flex-1" title={album.name}>
            {album.name}
          </h3>
          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium flex-shrink-0">
            Owned
          </span>
        </div>

        <p className="text-sm text-zinc-500 truncate mb-2">{album.artist_name}</p>

        <div className="mb-3">
          <p className="text-xs text-zinc-400 mb-1">Community rating</p>
          <RatingDisplay rating={album.rating} count={album.rating_count} />
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 mb-1.5 font-medium">
            {album.user_rating ? 'Your rating' : 'Rate this album'}
          </p>
          <div className="flex items-center gap-2">
            <StarRating
              value={album.user_rating || 0}
              onChange={onRate}
              readonly={isRating}
            />
            {isRating && <span className="text-xs text-zinc-400">Saving…</span>}
            {!isRating && album.user_rating && (
              <span className="text-xs text-zinc-400">{album.user_rating}/5</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
