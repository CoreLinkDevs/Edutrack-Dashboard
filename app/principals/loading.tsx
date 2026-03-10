export default function Loading() {
  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Principal Management</h1>
              <p className="text-sm text-gray-600">Manage school principals and their profiles</p>
            </div>
          </div>
        </div>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          <div className="space-y-6">
            {/* Filters skeleton */}
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-4 flex-1">
                <div className="relative">
                  <div className="h-10 bg-gray-200 rounded-md w-full sm:w-64 animate-pulse"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-md w-full sm:w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded-md w-full sm:w-32 animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded-md w-32 animate-pulse"></div>
            </div>

            {/* Cards skeleton */}
            <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border-0 shadow-sm overflow-hidden animate-pulse"
                >
                  <div className="p-6 pb-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                        <div className="flex gap-2">
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                          <div className="h-5 bg-gray-200 rounded w-20"></div>
                          <div className="h-5 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6 space-y-4">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                    <div className="h-16 bg-gray-100 rounded-lg"></div>
                    <div className="flex justify-between pt-4 border-t border-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}