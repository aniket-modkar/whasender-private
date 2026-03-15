import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { authCheckStatus, authLogout } from '../lib/ipc';
import useAuthStore from '../stores/authStore';

function AccountInactive() {
  const { updateUser, setActive } = useAuthStore();
  const [checking, setChecking] = useState(false);

  const handleRecheck = async () => {
    setChecking(true);
    try {
      const result = await authCheckStatus();
      if (result.success && result.isActive) {
        // Account is now active
        if (result.user) {
          updateUser(result.user);
        }
        setActive(true);
      }
    } catch (error) {
      console.error('Error checking status:', error);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authLogout();
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-yellow-500/10 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="w-12 h-12 text-yellow-500" />
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
          {/* Title */}
          <h1 className="text-2xl font-bold text-white mb-3">Account Inactive</h1>

          {/* Message */}
          <p className="text-gray-400 mb-6">
            Your account has been deactivated by the administrator. Please contact your
            administrator to reactivate your account.
          </p>

          {/* Info Box */}
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6 text-left">
            <h3 className="text-sm font-semibold text-yellow-400 mb-2">What happens now?</h3>
            <ul className="text-sm text-yellow-300/80 space-y-1">
              <li>• All active tasks have been paused</li>
              <li>• WhatsApp connection is maintained</li>
              <li>• Your data is safe and secure</li>
              <li>• Contact administrator to restore access</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleRecheck}
              disabled={checking}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
            >
              {checking ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Checking...
                </>
              ) : (
                <>
                  <ArrowPathIcon className="w-5 h-5" />
                  Check Status Again
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-gray-500 mt-6">
          Your WhatsApp session will remain active. You can resume work immediately once your
          account is reactivated.
        </p>
      </div>
    </div>
  );
}

export default AccountInactive;
