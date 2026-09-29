export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="h-6 w-36 bg-gray-200 rounded-lg animate-pulse" />
      </div>
      <div className="p-4 space-y-3">
        {/* Stats card skeleton */}
        <div className="h-36 bg-gray-200 rounded-2xl animate-pulse" />
        {/* Record list skeletons */}
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="h-20 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}
