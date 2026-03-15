import { useState } from 'react';
import {
  VideoCameraIcon,
  PhotoIcon,
  DocumentIcon,
  ChatBubbleLeftIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { mediaSaveFile, mediaValidateFile, mediaGetFileInfo } from '../lib/media-ipc';

export default function MediaUpload({ mediaType, onMediaSelect, onMediaRemove }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileInfo, setFileInfo] = useState(null);

  const mediaConfig = {
    text: {
      icon: ChatBubbleLeftIcon,
      label: 'Text Message',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    video: {
      icon: VideoCameraIcon,
      label: 'Video Message',
      accept: 'video/*',
      maxSize: 16,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      extensions: '.mp4,.avi,.mov,.mkv,.webm,.3gp',
    },
    image: {
      icon: PhotoIcon,
      label: 'Image Message',
      accept: 'image/*',
      maxSize: 5,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      extensions: '.jpg,.jpeg,.png,.gif,.webp,.bmp',
    },
    document: {
      icon: DocumentIcon,
      label: 'Document Message',
      accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx',
      maxSize: 100,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      extensions: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.ppt,.pptx',
    },
  };

  const config = mediaConfig[mediaType] || mediaConfig.text;
  const Icon = config.icon;

  const handleFileSelect = async () => {
    try {
      const result = await window.electronAPI.invoke('dialog:open-file', {
        filters: [
          { name: config.label, extensions: config.extensions?.split(',').map(e => e.replace('.', '')) || ['*'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        await processFile(filePath);
      }
    } catch (err) {
      setError('Failed to open file dialog: ' + err.message);
    }
  };

  const processFile = async (filePath) => {
    setUploading(true);
    setError('');

    try {
      // Validate file
      const validation = await mediaValidateFile(filePath, mediaType);

      if (!validation.valid) {
        setError(validation.error);
        setUploading(false);
        return;
      }

      // Get file info
      const info = await mediaGetFileInfo(filePath);

      if (!info.exists) {
        setError('File not found');
        setUploading(false);
        return;
      }

      // Check file size
      const sizeInMB = parseFloat(info.sizeInMB);
      if (sizeInMB > config.maxSize) {
        setError(`File too large. Maximum ${config.maxSize}MB allowed.`);
        setUploading(false);
        return;
      }

      setSelectedFile(filePath);
      setFileInfo(info);

      // Notify parent component
      if (onMediaSelect) {
        onMediaSelect({
          path: filePath,
          type: mediaType,
          size: info.size,
          sizeInMB: info.sizeInMB,
          fileName: info.fileName,
          extension: info.extension,
        });
      }
    } catch (err) {
      setError('Error processing file: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileInfo(null);
    setError('');

    if (onMediaRemove) {
      onMediaRemove();
    }
  };

  if (mediaType === 'text') {
    return null; // No file upload for text messages
  }

  return (
    <div className="space-y-4">
      {!selectedFile ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Icon className="w-5 h-5 inline mr-2" />
            Select {config.label}
          </label>
          <div
            onClick={handleFileSelect}
            className={`border-2 border-dashed ${config.borderColor} rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
          >
            <Icon className={`w-12 h-12 mx-auto mb-3 ${config.color}`} />
            <p className="text-sm text-gray-600 mb-2">
              Click to upload {mediaType}
            </p>
            <p className="text-xs text-gray-500">
              Maximum file size: {config.maxSize}MB
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: {config.extensions}
            </p>
          </div>
        </div>
      ) : (
        <div className={`border-2 ${config.borderColor} rounded-lg p-4 ${config.bgColor}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <Icon className={`w-10 h-10 ${config.color}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {fileInfo?.fileName}
                </p>
                <div className="flex items-center space-x-3 mt-1">
                  <p className="text-xs text-gray-500">
                    Size: {fileInfo?.sizeInMB} MB
                  </p>
                  <p className="text-xs text-gray-500">
                    Type: {fileInfo?.extension}
                  </p>
                </div>
                <div className="flex items-center mt-2">
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">File ready to send</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveFile}
              className="ml-4 text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {uploading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 mt-2">Processing file...</p>
        </div>
      )}
    </div>
  );
}
