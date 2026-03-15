# UI Integration Guide for Media Sending

## Overview

The backend for video/image/document sending is complete. To enable it in the UI, you need to update the NewTask page to use the new components.

---

## Step 1: Update NewTask.jsx

Add the following changes to `src/pages/NewTask.jsx`:

### 1.1: Import New Components

```javascript
// Add these imports at the top
import MediaTypeSelector from '../components/MediaTypeSelector';
import MediaUpload from '../components/MediaUpload';
```

### 1.2: Add State Variables

```javascript
// Add these state variables
const [mediaType, setMediaType] = useState('text'); // text, video, image, document
const [mediaFile, setMediaFile] = useState(null);
const [mediaCaption, setMediaCaption] = useState('');
```

### 1.3: Add Media Handlers

```javascript
// Handle media type change
const handleMediaTypeChange = (type) => {
  setMediaType(type);
  setMediaFile(null);
  setError('');
};

// Handle media file selection
const handleMediaSelect = (fileData) => {
  setMediaFile(fileData);
  setError('');
};

// Handle media file removal
const handleMediaRemove = () => {
  setMediaFile(null);
};
```

### 1.4: Update Task Creation

```javascript
// In handleCreateTask(), update the data object:
const data = {
  messageTemplate: mediaType === 'text' ? messageTemplate : (mediaCaption || ''),
  totalNumbers: parseResult.numbers.length,
  numbers: parseResult.numbers,
  scheduledAt: scheduleType === 'scheduled' ? scheduledDateTime : null,
  // New media fields
  mediaType: mediaType,
  mediaPath: mediaFile?.path || null,
  mediaCaption: mediaCaption || '',
  mediaSize: mediaFile?.size || null,
  mediaFilename: mediaFile?.fileName || null,
};
```

### 1.5: Update Step 2 (Compose Message)

Replace the message template section with:

```jsx
{/* Step 2: Message Compose */}
{step === 2 && (
  <div className="space-y-6">
    {/* Media Type Selector */}
    <MediaTypeSelector
      selected={mediaType}
      onChange={handleMediaTypeChange}
    />

    {/* Media Upload (for video/image/document) */}
    {mediaType !== 'text' && (
      <MediaUpload
        mediaType={mediaType}
        onMediaSelect={handleMediaSelect}
        onMediaRemove={handleMediaRemove}
      />
    )}

    {/* Caption/Message Template */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {mediaType === 'text' ? 'Message Template' : 'Caption (Optional)'}
      </label>
      <textarea
        value={mediaType === 'text' ? messageTemplate : mediaCaption}
        onChange={(e) =>
          mediaType === 'text'
            ? setMessageTemplate(e.target.value)
            : setMediaCaption(e.target.value)
        }
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        rows={6}
        placeholder={
          mediaType === 'text'
            ? 'Enter your message here. Use {{name}} for contact name and {{phone}} for phone number.'
            : 'Enter caption (optional). Use {{name}} and {{phone}} for personalization.'
        }
      />
      <p className="mt-2 text-sm text-gray-500">
        Use <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{name}}'}</code> and{' '}
        <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{phone}}'}</code> for
        personalization
      </p>
    </div>

    {/* Buttons */}
    <div className="flex justify-between">
      <button
        onClick={handlePrevStep}
        className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Back
      </button>
      <button
        onClick={handleNextStep}
        disabled={
          (mediaType === 'text' && !messageTemplate.trim()) ||
          (mediaType !== 'text' && !mediaFile)
        }
        className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
      >
        Next: Schedule
      </button>
    </div>
  </div>
)}
```

---

## Step 2: Test the Implementation

### 2.1: Test Text Messages (Existing)
1. Create new task
2. Select "Text" message type
3. Enter message template
4. Upload CSV
5. Send

### 2.2: Test Video Messages (New)
1. Create new task
2. Select "Video" message type
3. Upload video file (<16MB)
4. Enter caption (optional, use {{name}})
5. Upload CSV
6. Send

### 2.3: Test Image Messages (New)
1. Create new task
2. Select "Image" message type
3. Upload image file (<5MB)
4. Enter caption
5. Upload CSV
6. Send

### 2.4: Test Document Messages (New)
1. Create new task
2. Select "Document" message type
3. Upload document file (<100MB)
4. Enter caption
5. Upload CSV
6. Send

---

## Step 3: Validation Messages

The components handle validation automatically:

- **File too large:** Shows error message
- **Invalid format:** Shows error message
- **No file selected:** Disables "Next" button
- **File validated:** Shows green checkmark

---

## Step 4: Complete Code Example

Here's a simplified example of the updated NewTask.jsx structure:

```jsx
import { useState } from 'react';
import MediaTypeSelector from '../components/MediaTypeSelector';
import MediaUpload from '../components/MediaUpload';

function NewTask() {
  // State
  const [step, setStep] = useState(1);
  const [mediaType, setMediaType] = useState('text');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaCaption, setMediaCaption] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');

  // Handlers
  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setMediaFile(null);
  };

  const handleMediaSelect = (fileData) => {
    setMediaFile(fileData);
  };

  const handleMediaRemove = () => {
    setMediaFile(null);
  };

  const handleCreateTask = async () => {
    const data = {
      messageTemplate: mediaType === 'text' ? messageTemplate : (mediaCaption || ''),
      totalNumbers: parseResult.numbers.length,
      numbers: parseResult.numbers,
      mediaType: mediaType,
      mediaPath: mediaFile?.path || null,
      mediaCaption: mediaCaption || '',
      mediaSize: mediaFile?.size || null,
      mediaFilename: mediaFile?.fileName || null,
    };

    const result = await taskCreate(data);
    // Handle result...
  };

  return (
    <div>
      {step === 2 && (
        <div className="space-y-6">
          {/* Media Type Selection */}
          <MediaTypeSelector
            selected={mediaType}
            onChange={handleMediaTypeChange}
          />

          {/* Media Upload (if not text) */}
          {mediaType !== 'text' && (
            <MediaUpload
              mediaType={mediaType}
              onMediaSelect={handleMediaSelect}
              onMediaRemove={handleMediaRemove}
            />
          )}

          {/* Message/Caption Input */}
          <textarea
            value={mediaType === 'text' ? messageTemplate : mediaCaption}
            onChange={(e) =>
              mediaType === 'text'
                ? setMessageTemplate(e.target.value)
                : setMediaCaption(e.target.value)
            }
            placeholder={
              mediaType === 'text'
                ? 'Enter your message...'
                : 'Enter caption (optional)...'
            }
          />
        </div>
      )}
    </div>
  );
}
```

---

## Step 5: CSS/Styling Notes

The components use Tailwind CSS classes. Make sure your tailwind.config.js includes:

```javascript
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
    },
  },
};
```

---

## Step 6: Error Handling

The components handle these errors automatically:

1. **File too large**
   - Shows: "File too large. Maximum Xmb for [type]"

2. **Invalid format**
   - Shows: "Invalid file type. Supported: [formats]"

3. **File not found**
   - Shows: "File not found"

4. **Upload failed**
   - Shows: "Error processing file: [error message]"

You can add additional error handling in the parent component:

```jsx
const handleMediaSelect = (fileData) => {
  // Validate file
  if (fileData.sizeInMB > maxSizeForType) {
    setError('File too large!');
    return;
  }

  setMediaFile(fileData);
  setError('');
};
```

---

## Step 7: Preview Before Sending

You can add a preview step (optional):

```jsx
{step === 4 && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold">Review Your Campaign</h3>

    {/* Message Type */}
    <div>
      <p className="text-sm text-gray-600">Type:</p>
      <p className="font-medium">{mediaType.toUpperCase()}</p>
    </div>

    {/* Media File */}
    {mediaFile && (
      <div>
        <p className="text-sm text-gray-600">File:</p>
        <p className="font-medium">{mediaFile.fileName}</p>
        <p className="text-xs text-gray-500">{mediaFile.sizeInMB} MB</p>
      </div>
    )}

    {/* Caption/Message */}
    <div>
      <p className="text-sm text-gray-600">
        {mediaType === 'text' ? 'Message:' : 'Caption:'}
      </p>
      <p className="font-medium">
        {mediaType === 'text' ? messageTemplate : mediaCaption}
      </p>
    </div>

    {/* Contacts */}
    <div>
      <p className="text-sm text-gray-600">Recipients:</p>
      <p className="font-medium">{parseResult.numbers.length} contacts</p>
    </div>
  </div>
)}
```

---

## Summary

### Changes Required:
1. ✅ Import new components (MediaTypeSelector, MediaUpload)
2. ✅ Add state variables (mediaType, mediaFile, mediaCaption)
3. ✅ Add handlers (handleMediaTypeChange, handleMediaSelect, handleMediaRemove)
4. ✅ Update task creation data object
5. ✅ Replace Step 2 UI with new components

### Benefits:
- ✅ User-friendly media type selection
- ✅ Drag-and-drop file upload
- ✅ Automatic file validation
- ✅ Visual feedback
- ✅ Error handling
- ✅ File preview

### Total Time to Integrate:
~15-20 minutes of code changes

---

## Need Help?

- Check `VIDEO-SENDING-IMPLEMENTATION-SUMMARY.md` for full implementation details
- See component files for props and usage examples
- Test with small files first before large campaigns

**Ready to start sending videos, images, and documents!**
