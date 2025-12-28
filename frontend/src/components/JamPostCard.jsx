/**
 * JamPostCard Component
 * Displays a single "Looking For" post on the Jam Board
 */

export default function JamPostCard({ post, onMessage }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
      {/* Author Info */}
      <div className="flex items-center mb-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mr-3">
          <span className="text-indigo-600 font-semibold text-lg">
            {post.author.name.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
          <p className="text-sm text-gray-500">{post.author.instrument}</p>
        </div>
      </div>

      {/* Post Content */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-medium text-gray-700">Looking for:</span>
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
            {post.looking_for_instrument}
          </span>
          {post.genre && (
            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
              {post.genre}
            </span>
          )}
        </div>
        <p className="text-gray-600 mb-2">{post.description}</p>
        <p className="text-sm text-gray-500">📍 {post.location}</p>
      </div>

      {/* Action Button */}
      <button
        onClick={() => onMessage(post.author.id)}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition font-medium"
      >
        Send Message / Raise Hand
      </button>
    </div>
  )
}
