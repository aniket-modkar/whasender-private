import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { waConnect, waGetStatus, waClearSession, onWaQr, onWaStatus, onWaError } from '../lib/ipc';

function WhatsAppAuth() {
  const [qr, setQr] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [phoneNumber, setPhoneNumber] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubscribeQr, unsubscribeStatus, unsubscribeError;

    // Check initial status
    const checkStatus = async () => {
      try {
        const result = await waGetStatus();
        if (result.success) {
          setStatus(result.status);
          setPhoneNumber(result.phoneNumber);

          // Only auto-redirect if fully connected and stable
          // Don't redirect if connecting/reconnecting to avoid loops
          if (result.isConnected && result.status === 'connected') {
            // Wait a bit to ensure connection is stable
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else if (result.status === 'disconnected' || result.status === 'error') {
            // Only initiate connection if truly disconnected
            await waConnect();
          }
          // If connecting/reconnecting, just wait - don't call connect again
        }
      } catch (err) {
        console.error('Error checking WhatsApp status:', err);
        setError('Failed to check WhatsApp status');
      } finally {
        setLoading(false);
      }
    };

    // Setup event listeners
    unsubscribeQr = onWaQr((qrCode) => {
      console.log('QR code received');
      setQr(qrCode);
      setError(null);
    });

    unsubscribeStatus = onWaStatus((statusData) => {
      console.log('WhatsApp status:', statusData);
      setStatus(statusData.status);

      if (statusData.phoneNumber) {
        setPhoneNumber(statusData.phoneNumber);
      }

      // Clear QR when connected
      if (statusData.status === 'connected') {
        setQr(null);
      }
    });

    unsubscribeError = onWaError((errorMsg) => {
      console.error('WhatsApp error:', errorMsg);
      setError(errorMsg);
    });

    checkStatus();

    // Cleanup
    return () => {
      if (unsubscribeQr) unsubscribeQr();
      if (unsubscribeStatus) unsubscribeStatus();
      if (unsubscribeError) unsubscribeError();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to disconnect WhatsApp? You will need to scan the QR code again.')) {
      setLoading(true);
      try {
        await waClearSession();
        setQr(null);
        setPhoneNumber(null);
        setStatus('disconnected');
        setError(null);

        // Reconnect to get new QR
        await waConnect();
      } catch (err) {
        console.error('Error logging out:', err);
        setError('Failed to logout');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleContinue = () => {
    navigate('/dashboard');
  };

  const handleRetry = async () => {
    setLoading(true);
    setError(null);
    try {
      await waConnect();
    } catch (err) {
      console.error('Error retrying connection:', err);
      setError('Failed to retry connection');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading WhatsApp connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-500 mb-2">WhatsApp Connection</h1>
          <p className="text-gray-400 text-sm">Connect your WhatsApp account</p>
        </div>

        {/* Status Display */}
        <div className="mb-6">
          {status === 'qr_pending' && qr && (
            <div className="text-center">
              <div className="bg-white p-4 rounded-lg inline-block mb-4">
                <QRCodeSVG value={qr} size={256} />
              </div>
              <p className="text-gray-300 text-sm mb-2">Scan this QR code with WhatsApp</p>
              <ol className="text-gray-400 text-xs text-left max-w-sm mx-auto space-y-1">
                <li>1. Open WhatsApp on your phone</li>
                <li>2. Tap Menu or Settings and select Linked Devices</li>
                <li>3. Tap on Link a Device</li>
                <li>4. Point your phone at this screen to scan the code</li>
              </ol>
            </div>
          )}

          {status === 'connecting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Connecting to WhatsApp...</p>
            </div>
          )}

          {status === 'reconnecting' && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <p className="text-gray-300">Reconnecting...</p>
            </div>
          )}

          {status === 'connected' && phoneNumber && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-green-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-green-400 font-semibold text-lg mb-2">Connected Successfully!</p>
              <p className="text-gray-300 text-sm">
                Connected as: <span className="text-white font-mono">+{phoneNumber}</span>
              </p>
            </div>
          )}

          {status === 'disconnected' && !qr && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-red-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <p className="text-red-400 font-semibold mb-2">Disconnected</p>
              <p className="text-gray-400 text-sm mb-4">WhatsApp is not connected</p>
              <button
                onClick={handleRetry}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Connect WhatsApp
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-8">
              <div className="mb-4">
                <svg
                  className="w-16 h-16 text-red-500 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-red-400 font-semibold mb-2">Connection Failed</p>
              <p className="text-gray-400 text-sm mb-4">An error occurred</p>
              <button
                onClick={handleRetry}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {status === 'connected' && (
            <>
              <button
                onClick={handleContinue}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Continue to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
              >
                Disconnect WhatsApp
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default WhatsAppAuth;
