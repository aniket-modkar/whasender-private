import {
  ChatBubbleLeftIcon,
  VideoCameraIcon,
  PhotoIcon,
  DocumentIcon,
} from '@heroicons/react/24/outline';

export default function MediaTypeSelector({ selected, onChange }) {
  const mediaTypes = [
    {
      type: 'text',
      icon: ChatBubbleLeftIcon,
      label: 'Text',
      description: 'Send text messages',
      color: 'blue',
    },
    {
      type: 'video',
      icon: VideoCameraIcon,
      label: 'Video',
      description: 'Send video files (Max 16MB)',
      color: 'purple',
    },
    {
      type: 'image',
      icon: PhotoIcon,
      label: 'Image',
      description: 'Send images (Max 5MB)',
      color: 'green',
    },
    {
      type: 'document',
      icon: DocumentIcon,
      label: 'Document',
      description: 'Send documents (Max 100MB)',
      color: 'orange',
    },
  ];

  const colorClasses = {
    blue: {
      border: 'border-blue-500',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      ring: 'ring-blue-500',
    },
    purple: {
      border: 'border-purple-500',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      ring: 'ring-purple-500',
    },
    green: {
      border: 'border-green-500',
      bg: 'bg-green-50',
      text: 'text-green-600',
      ring: 'ring-green-500',
    },
    orange: {
      border: 'border-orange-500',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      ring: 'ring-orange-500',
    },
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Message Type
      </label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mediaTypes.map((mediaType) => {
          const Icon = mediaType.icon;
          const colors = colorClasses[mediaType.color];
          const isSelected = selected === mediaType.type;

          return (
            <button
              key={mediaType.type}
              type="button"
              onClick={() => onChange(mediaType.type)}
              className={`
                relative flex flex-col items-center p-4 border-2 rounded-lg transition-all
                ${
                  isSelected
                    ? `${colors.border} ${colors.bg} ring-2 ${colors.ring}`
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <Icon
                className={`w-8 h-8 mb-2 ${
                  isSelected ? colors.text : 'text-gray-400'
                }`}
              />
              <span
                className={`text-sm font-medium ${
                  isSelected ? colors.text : 'text-gray-700'
                }`}
              >
                {mediaType.label}
              </span>
              <span className="text-xs text-gray-500 mt-1 text-center">
                {mediaType.description}
              </span>
              {isSelected && (
                <div
                  className={`absolute top-2 right-2 w-3 h-3 rounded-full ${colors.bg} ${colors.border} border-2`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
