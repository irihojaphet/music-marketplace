export default function EmptyState({ title, description, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      {Icon && <Icon className="h-12 w-12 text-zinc-300 mb-4" />}
      <h3 className="text-lg font-semibold text-zinc-700">{title}</h3>
      {description && <p className="text-sm text-zinc-500 mt-1 max-w-sm">{description}</p>}
    </div>
  )
}
