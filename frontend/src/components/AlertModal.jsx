/**
 * AlertModal Component
 * Replaces the native browser alert() with a custom UI
 * Supports: Success (Green), Error (Red), Warning (Yellow + Cancel Option)
 */
export default function AlertModal({ isOpen, onClose, onCancel, message, type = 'success', showCancel = false }) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isWarning = type === 'warning';
  const isError = type === 'error';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl transform transition-all scale-100">
        
        {/* Icon Logic */}
        <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
            isSuccess ? 'bg-green-100' : isWarning ? 'bg-yellow-100' : 'bg-red-100'
        }`}>
          {isSuccess && (
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          )}
          {isWarning && (
            <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          {isError && (
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>

        {/* Text */}
        <div className="text-center">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            {isSuccess ? 'Success' : isWarning ? 'Confirmation' : 'Error'}
          </h3>
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-5 sm:mt-6 flex gap-3">
          {showCancel && (
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none sm:text-sm"
              onClick={onCancel}
            >
              Cancel
            </button>
          )}
          
          <button
            type="button"
            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:text-sm ${
                isSuccess 
                ? 'bg-indigo-600 hover:bg-indigo-700' 
                : isWarning 
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-red-600 hover:bg-red-700'
            }`}
            onClick={onClose}
          >
            {isWarning ? 'Confirm' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  )
}