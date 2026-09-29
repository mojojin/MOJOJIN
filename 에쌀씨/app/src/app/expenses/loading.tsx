export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="h-6 w-32 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {/* Summary card skeleton */}
        <div className="h-28 bg-gray-200 rounded-2xl animate-pulse" />
        {/* Table/list skeleton */}
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-16 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
