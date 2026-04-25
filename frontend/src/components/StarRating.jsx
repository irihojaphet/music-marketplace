export default function StarRating({ value, onChange, readonly = false, size = 'md' }) {
  const sizes = { sm: 'text-base', md: 'text-xl', lg: 'text-2xl' }

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          className={`${sizes[size]} leading-none transition-colors ${
            readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
          } ${star <= Math.round(value || 0) ? 'text-yellow-400' : 'text-zinc-300'}`}
          aria-label={readonly ? `${value} stars` : `Rate ${star} stars`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

export function RatingDisplay({ rating, count }) {
  if (!rating && count === 0) {
    return <span className="text-xs text-zinc-400">No ratings yet</span>
  }
  return (
    <div className="flex items-center gap-1">
      <StarRating value={rating || 0} readonly size="sm" />
      <span className="text-xs text-zinc-500">
        {rating ? rating.toFixed(1) : '—'} ({count})
      </span>
    </div>
  )
}
