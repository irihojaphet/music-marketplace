export default function ErrorMessage({ error, className = '' }) {
  const message =
    error?.response?.data?.detail || error?.message || 'Something went wrong.'
  return (
    <div className={`rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 ${className}`}>
      {message}
    </div>
  )
}
