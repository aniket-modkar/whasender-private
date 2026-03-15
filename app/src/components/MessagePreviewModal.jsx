import { useState } from 'react';
import {
  XMarkIcon,
  PaperAirplaneIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function MessagePreviewModal({
  isOpen,
  onClose,
  messageTemplate,
  mediaType = 'text',
  mediaCaption = '',
  mediaFileName = null,
  mediaFilePath = null
}) {
  const [testName, setTestName] = useState('John Doe');
  const [testPhone, setTestPhone] = useState('9876543210');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      setSendError('Please enter a test phone number');
      return;
    }

    setSending(true);
    setSendSuccess(false);
    setSendError('');

    try {
      const currentMessage = mediaType === 'text' ? messageTemplate : mediaCaption;
      const finalMessage = currentMessage
        .replace(/\{\{name\}\}/g, testName || 'Test User')
        .replace(/\{\{phone\}\}/g, testPhone);

      const result = await window.electronAPI.invoke('test:send-message', {
        phone: testPhone,
        message: finalMessage,
        mediaType,
        mediaPath: mediaFilePath,
      });

      if (result.success) {
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 5000);
      } else {
        setSendError(result.error || 'Failed to send test message');
      }
    } catch (err) {
      setSendError('Error sending test message: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  const currentMessage = mediaType === 'text' ? messageTemplate : mediaCaption;
  const previewMessage = currentMessage
    .replace(/\{\{name\}\}/g, testName || 'John Doe')
    .replace(/\{\{phone\}\}/g, testPhone || '9876543210');

  const formatWhatsAppText = (text) => {
    return text.split('\n').map((line, i) => {
      let processed = line;

      // Bold: *text*
      processed = processed.replace(
        /\*(.*?)\*/g,
        '<strong class="font-bold">$1</strong>'
      );

      // Italic: _text_
      processed = processed.replace(
        /_(.*?)_/g,
        '<em class="italic">$1</em>'
      );

      // Strikethrough: ~text~
      processed = processed.replace(
        /~(.*?)~/g,
        '<s class="line-through">$1</s>'
      );

      // Monospace: ```text```
      processed = processed.replace(
        /```(.*?)```/g,
        '<code class="font-mono bg-gray-100 px-1 rounded">$1</code>'
      );

      return (
        <span
          key={i}
          dangerouslySetInnerHTML={{ __html: processed }}
          className="block"
        />
      );
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">
            🧪 Dry Run - Test Your Message
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Test Data Inputs */}
          <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <h3 className="text-sm font-medium text-white mb-4">
              Enter Test Data
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <UserIcon className="w-4 h-4 inline mr-1" />
                  Test Name
                </label>
                <input
                  type="text"
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="Enter test name"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-2">
                  <PhoneIcon className="w-4 h-4 inline mr-1" />
                  Test Phone
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="Enter test phone number"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>

          {/* Message Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Message Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-blue-200/70">Type:</span>
                <span className="text-blue-100 ml-2 font-medium uppercase">{mediaType}</span>
              </div>
              {mediaType !== 'text' && mediaFileName && (
                <div>
                  <span className="text-blue-200/70">File:</span>
                  <span className="text-blue-100 ml-2 font-medium truncate">{mediaFileName}</span>
                </div>
              )}
              <div>
                <span className="text-blue-200/70">Length:</span>
                <span className="text-blue-100 ml-2 font-medium">{currentMessage.length} chars</span>
              </div>
              <div>
                <span className="text-blue-200/70">Variables:</span>
                <span className="text-blue-100 ml-2 font-medium">
                  {currentMessage.match(/\{\{(name|phone)\}\}/g)?.length || 0} found
                </span>
              </div>
            </div>
          </div>

          {/* WhatsApp Preview */}
          <div>
            <h3 className="text-sm font-medium text-white mb-3">
              📱 WhatsApp Preview
            </h3>
            <div className="bg-gradient-to-b from-teal-700 to-teal-800 p-6 rounded-lg">
              {/* WhatsApp header */}
              <div className="mb-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm">{testName || 'Test User'}</p>
                  <p className="text-teal-200 text-xs">+{testPhone || '9876543210'}</p>
                </div>
              </div>

              {/* Message bubble */}
              <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-lg max-w-md">
                {/* Media preview indicator */}
                {mediaType !== 'text' && (
                  <div className="mb-3 p-4 bg-gray-100 rounded-lg text-center">
                    {mediaType === 'video' && (
                      <div>
                        <div className="text-4xl mb-2">🎥</div>
                        <p className="text-sm text-gray-600 font-medium">Video Attachment</p>
                        {mediaFileName && (
                          <p className="text-xs text-gray-500 mt-1">{mediaFileName}</p>
                        )}
                      </div>
                    )}
                    {mediaType === 'image' && (
                      <div>
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-sm text-gray-600 font-medium">Image Attachment</p>
                        {mediaFileName && (
                          <p className="text-xs text-gray-500 mt-1">{mediaFileName}</p>
                        )}
                      </div>
                    )}
                    {mediaType === 'document' && (
                      <div>
                        <div className="text-4xl mb-2">📄</div>
                        <p className="text-sm text-gray-600 font-medium">Document Attachment</p>
                        {mediaFileName && (
                          <p className="text-xs text-gray-500 mt-1">{mediaFileName}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Message text */}
                {previewMessage ? (
                  <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                    {formatWhatsAppText(previewMessage)}
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 italic">
                    {mediaType === 'text' ? 'No message entered' : 'No caption'}
                  </div>
                )}

                {/* Timestamp */}
                <div className="flex justify-end mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date().toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Variables Guide */}
          {currentMessage.includes('{{') && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-300 mb-2">
                ✅ Variables Detected
              </h3>
              <div className="text-xs text-green-200/80 space-y-1">
                {currentMessage.includes('{{name}}') && (
                  <p>• <code className="bg-green-900/30 px-1 py-0.5 rounded">{'{{name}}'}</code> will be replaced with: <strong>{testName}</strong></p>
                )}
                {currentMessage.includes('{{phone}}') && (
                  <p>• <code className="bg-green-900/30 px-1 py-0.5 rounded">{'{{phone}}'}</code> will be replaced with: <strong>{testPhone}</strong></p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 bg-gray-900 space-y-3">
          {/* Send Success Message */}
          {sendSuccess && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
              <p className="text-sm text-green-400">
                ✅ Test message sent successfully to +{testPhone}!
              </p>
            </div>
          )}

          {/* Send Error Message */}
          {sendError && (
            <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-400">{sendError}</p>
              </div>
              <button
                onClick={() => setSendError('')}
                className="text-red-400 hover:text-red-300"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Close
            </button>
            <button
              onClick={handleSendTest}
              disabled={sending || !testPhone.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending Test...
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-4 h-4" />
                  Send Test Message
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center">
            📱 Test message will be sent to the phone number above via WhatsApp
          </p>
        </div>
      </div>
    </div>
  );
}
