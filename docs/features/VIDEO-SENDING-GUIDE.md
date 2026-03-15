# Video Sending Implementation Guide

## Current Library: @whiskeysockets/baileys

**Version:** 7.0.0-rc.9

Baileys is a full-featured WhatsApp Web API that fully supports sending media including videos, images, documents, and audio.

## How Baileys Supports Video Sending

Baileys provides the `sendMessage` function which accepts different message types through the second parameter. For videos, you use the `video` property.

### Basic Video Sending Syntax

```javascript
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },  // or Buffer
  caption: 'Video caption here',
  gifPlayback: false,  // true for GIFs
  ptv: false  // true for PTV (round video messages)
});
```

## Available Video Sending Methods

### Method 1: Send from Local File Path (Recommended for Desktop App)

```javascript
await sock.sendMessage(jid, {
  video: { url: '/path/to/video.mp4' },
  caption: 'Check out this video!',
  mimetype: 'video/mp4'
});
```

**Pros:**
- Simple and straightforward
- Good for desktop applications
- Automatic file reading by Baileys

**Cons:**
- Requires local file storage
- Need to manage file cleanup

### Method 2: Send from Buffer (In-Memory)

```javascript
const fs = require('fs');
const videoBuffer = fs.readFileSync('./video.mp4');

await sock.sendMessage(jid, {
  video: videoBuffer,
  caption: 'Video from buffer',
  mimetype: 'video/mp4'
});
```

**Pros:**
- More control over file handling
- Can modify/process video before sending
- Works with downloaded videos

**Cons:**
- Higher memory usage
- Need to handle large files carefully

### Method 3: Send from URL (Direct Download)

```javascript
await sock.sendMessage(jid, {
  video: { url: 'https://example.com/video.mp4' },
  caption: 'Video from URL',
  mimetype: 'video/mp4'
});
```

**Pros:**
- No local storage needed
- Good for cloud-based videos
- Efficient for one-time sends

**Cons:**
- Requires stable internet
- URL must be publicly accessible
- Slower for multiple sends

### Method 4: Stream Video (For Large Files)

```javascript
const fs = require('fs');
const stream = fs.createReadStream('./large-video.mp4');

await sock.sendMessage(jid, {
  video: stream,
  caption: 'Large video file',
  mimetype: 'video/mp4'
});
```

**Pros:**
- Memory efficient for large files
- No need to load entire file
- Better performance

**Cons:**
- More complex implementation
- Need proper stream handling

## Recommended Implementation for WhaSender

For your bulk messaging use case, I recommend a **hybrid approach**:

### Option A: Single Video for All Contacts (Most Common)

Store one video file locally and send to all contacts.

**Benefits:**
- Upload video once
- Faster sending (no re-uploading)
- Lower bandwidth usage
- Consistent message across all contacts

**Use Case:** Same promotional video to 1000 customers

### Option B: Personalized Videos per Contact

Different video for each contact (advanced).

**Benefits:**
- Personalized content
- Higher engagement
- Better conversion rates

**Use Case:** Personalized video messages with customer names

### Option C: Video Library Selection

Let user choose from a library of videos.

**Benefits:**
- Flexibility
- Multiple campaigns
- Easy management

**Use Case:** Different products need different demo videos

## Video Format Support

Baileys/WhatsApp supports these video formats:

| Format | Extension | Recommended |
|--------|-----------|-------------|
| MP4 | .mp4 | ✅ Yes (Best) |
| AVI | .avi | ⚠️ May need conversion |
| MKV | .mkv | ⚠️ May need conversion |
| MOV | .mov | ✅ Yes |
| WebM | .webm | ✅ Yes |
| 3GP | .3gp | ✅ Yes |

**Recommended:** MP4 (H.264 video codec, AAC audio codec)

## Video Size Limits

- **Maximum size:** 16 MB (WhatsApp limitation)
- **Recommended:** Keep under 10 MB for better delivery
- **Solution for larger videos:**
  - Compress videos
  - Split into multiple parts
  - Use video streaming links

## Implementation Architecture

### 1. Database Schema Changes

Add video support to tasks table:

```sql
ALTER TABLE tasks ADD COLUMN media_type TEXT DEFAULT 'text';
ALTER TABLE tasks ADD COLUMN media_path TEXT;
ALTER TABLE tasks ADD COLUMN media_url TEXT;
ALTER TABLE tasks ADD COLUMN video_caption TEXT;
```

### 2. File Storage Structure

```
app/
├── electron/
│   └── media/
│       ├── videos/           # User uploaded videos
│       ├── temp/             # Temporary downloads
│       └── thumbnails/       # Video thumbnails for UI
```

### 3. WASender Extension

Add video sending method to `wa-sender.js`:

```javascript
async sendVideoMessage(phone, videoPath, caption = '') {
  try {
    const sock = this.waConnection.getSocket();
    const jid = this.formatPhoneNumber(phone);

    // Check if number exists
    const checkResult = await this.checkNumberExists(phone);
    if (!checkResult.exists) {
      return { sent: false, error: 'not_on_whatsapp' };
    }

    // Send recording indicator
    await sock.sendPresenceUpdate('recording', jid);

    // Send video
    const sentMessage = await sock.sendMessage(jid, {
      video: { url: videoPath },
      caption: caption,
      mimetype: 'video/mp4',
      gifPlayback: false
    });

    // Stop recording
    await sock.sendPresenceUpdate('paused', jid);

    return {
      sent: true,
      messageId: sentMessage.key.id,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      sent: false,
      error: error.message,
      retryable: true
    };
  }
}
```

### 4. UI Changes Needed

**New Task Page:**
- Add "Message Type" selector (Text / Image / Video / Document)
- Add video upload component
- Show video preview
- Display video size and duration
- Add caption input field

**Task Execution:**
- Show "Sending video..." status
- Display upload progress
- Handle video-specific errors

## Advanced Features

### 1. Video Thumbnails

Generate and send custom thumbnails:

```javascript
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },
  caption: 'Video with custom thumbnail',
  jpegThumbnail: thumbnailBuffer  // Custom thumbnail
});
```

### 2. GIF Playback Mode

Send videos as auto-playing GIFs:

```javascript
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },
  gifPlayback: true  // Plays as GIF
});
```

### 3. PTV (Round Video Messages)

Send round video messages like Instagram Stories:

```javascript
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },
  ptv: true  // Round video message
});
```

### 4. Video with Quoted Message

Reply to a message with video:

```javascript
await sock.sendMessage(jid, {
  video: { url: './video.mp4' },
  caption: 'Reply video',
  quoted: previousMessage  // Reply context
});
```

## Video Compression

For videos larger than 16MB, you'll need compression:

### Option 1: FFmpeg (Recommended)

```javascript
const ffmpeg = require('fluent-ffmpeg');

function compressVideo(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vcodec libx264',
        '-crf 28',
        '-preset fast',
        '-vf scale=640:-2'
      ])
      .on('end', () => resolve(outputPath))
      .on('error', reject)
      .save(outputPath);
  });
}
```

### Option 2: Cloud Compression Services

- Cloudinary
- AWS MediaConvert
- Azure Media Services

## Error Handling

Common video sending errors:

```javascript
try {
  await sock.sendMessage(jid, { video: { url: videoPath } });
} catch (error) {
  if (error.message.includes('file too large')) {
    // Video exceeds WhatsApp limit
  } else if (error.message.includes('invalid media')) {
    // Unsupported video format
  } else if (error.message.includes('timeout')) {
    // Upload timeout (retry)
  }
}
```

## Performance Considerations

### 1. Upload Once, Send to Many

For bulk sending:
- Upload video to WhatsApp servers once
- Get media key
- Reuse for subsequent sends (faster)

### 2. Concurrent Upload Limits

- WhatsApp may rate-limit media uploads
- Implement queue system
- Add delays between video sends

### 3. Bandwidth Management

- Monitor upload bandwidth
- Show progress indicators
- Allow pause/resume for large uploads

## Security & Privacy

1. **Local Storage:** Store videos securely
2. **Encryption:** Encrypt stored video files
3. **Cleanup:** Delete videos after campaign completion
4. **Access Control:** Restrict video access per user

## Recommended Implementation Steps

### Phase 1: Basic Video Support (MVP)
1. ✅ Add `sendVideoMessage()` to WASender
2. ✅ Update database schema
3. ✅ Add video upload UI component
4. ✅ Implement file validation (size, format)
5. ✅ Test with small videos (<5MB)

### Phase 2: Enhanced Features
1. Video compression integration
2. Thumbnail generation
3. Video preview in UI
4. Progress indicators
5. Multiple video library

### Phase 3: Advanced Features
1. GIF mode support
2. PTV (round videos)
3. Video editing (trim, crop)
4. Cloud storage integration
5. Video analytics

## Testing Checklist

- [ ] Send MP4 video (under 16MB)
- [ ] Send video with caption
- [ ] Send video with variables ({{name}})
- [ ] Send same video to 10+ contacts
- [ ] Test video format conversion
- [ ] Test large video (15MB+)
- [ ] Test video compression
- [ ] Test upload failure recovery
- [ ] Test slow internet scenario
- [ ] Verify anti-ban delays still work

## Cost Considerations

### Storage Costs
- Local storage: Free (uses user's disk)
- Cloud storage: $0.02-$0.05 per GB/month

### Bandwidth Costs
- Video upload bandwidth
- Consider user's internet plan
- Offer WiFi-only option

### Processing Costs
- Video compression: CPU intensive
- Consider cloud processing for large batches

## Conclusion

**Best Approach for WhaSender:**

1. **Start Simple:** Single video upload per task
2. **Store Locally:** Save uploaded videos in `electron/media/videos/`
3. **Reuse Upload:** Upload once to WhatsApp, send to all
4. **Add Compression:** Integrate FFmpeg for videos >10MB
5. **Enhance Gradually:** Add thumbnails, GIF mode later

The Baileys library fully supports all video sending features. Implementation is straightforward - it's just an extension of your existing text message sending with media upload capabilities.
