export default function Spinner({ size = 'md' }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-8 w-8', lg: 'h-12 w-12' }
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-zinc-200 border-t-violet-600`} />
  )
}

export function PageSpinner() {
  return (
    <div className="flex justify-center items-center py-20">
      <Spinner size="lg" />
    </div>
  )
}
