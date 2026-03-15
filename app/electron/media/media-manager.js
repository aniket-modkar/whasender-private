const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class MediaManager {
  constructor() {
    // Get user data path
    const userDataPath = app.getPath('userData');

    // Define media directories
    this.mediaDir = path.join(userDataPath, 'media');
    this.videosDir = path.join(this.mediaDir, 'videos');
    this.imagesDir = path.join(this.mediaDir, 'images');
    this.documentsDir = path.join(this.mediaDir, 'documents');
    this.tempDir = path.join(this.mediaDir, 'temp');

    // Initialize directories
    this.initializeDirectories();
  }

  // Initialize all media directories
  initializeDirectories() {
    const dirs = [
      this.mediaDir,
      this.videosDir,
      this.imagesDir,
      this.documentsDir,
      this.tempDir
    ];

    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
      }
    });
  }

  // Get directory for media type
  getMediaDirectory(mediaType) {
    const dirMap = {
      video: this.videosDir,
      image: this.imagesDir,
      document: this.documentsDir,
      temp: this.tempDir
    };

    return dirMap[mediaType] || this.tempDir;
  }

  // Save uploaded file
  async saveUploadedFile(sourcePath, mediaType, taskId) {
    try {
      const ext = path.extname(sourcePath);
      const fileName = `${taskId}_${Date.now()}${ext}`;
      const targetDir = this.getMediaDirectory(mediaType);
      const targetPath = path.join(targetDir, fileName);

      // Copy file to media directory
      fs.copyFileSync(sourcePath, targetPath);

      // Get file stats
      const stats = fs.statSync(targetPath);

      return {
        success: true,
        filePath: targetPath,
        fileName: fileName,
        size: stats.size,
        sizeInMB: (stats.size / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      console.error('Error saving uploaded file:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Delete media file
  deleteFile(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filePath}`);
        return { success: true };
      }
      return { success: false, error: 'File not found' };
    } catch (error) {
      console.error('Error deleting file:', error);
      return { success: false, error: error.message };
    }
  }

  // Get file info
  getFileInfo(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return { exists: false };
      }

      const stats = fs.statSync(filePath);
      const ext = path.extname(filePath).toLowerCase();

      return {
        exists: true,
        path: filePath,
        size: stats.size,
        sizeInMB: (stats.size / (1024 * 1024)).toFixed(2),
        extension: ext,
        fileName: path.basename(filePath),
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime
      };
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  // Validate file size
  validateFileSize(filePath, mediaType) {
    const maxSizes = {
      video: 16 * 1024 * 1024,    // 16MB
      image: 5 * 1024 * 1024,      // 5MB
      document: 100 * 1024 * 1024   // 100MB
    };

    const maxSize = maxSizes[mediaType] || 16 * 1024 * 1024;

    try {
      const stats = fs.statSync(filePath);

      if (stats.size > maxSize) {
        return {
          valid: false,
          error: `File too large. Maximum ${(maxSize / (1024 * 1024))}MB for ${mediaType}`,
          actualSize: (stats.size / (1024 * 1024)).toFixed(2) + 'MB'
        };
      }

      return { valid: true, size: stats.size };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Clean up old temporary files
  cleanupTempFiles(olderThanHours = 24) {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = olderThanHours * 60 * 60 * 1000;
      let deletedCount = 0;

      files.forEach(file => {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        const age = now - stats.mtimeMs;

        if (age > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      });

      console.log(`Cleaned up ${deletedCount} temporary files`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error cleaning up temp files:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete task media files
  deleteTaskMedia(taskId) {
    try {
      let deletedCount = 0;
      const dirs = [this.videosDir, this.imagesDir, this.documentsDir];

      dirs.forEach(dir => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          if (file.startsWith(`${taskId}_`)) {
            const filePath = path.join(dir, file);
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        });
      });

      console.log(`Deleted ${deletedCount} media files for task ${taskId}`);
      return { success: true, deletedCount };
    } catch (error) {
      console.error('Error deleting task media:', error);
      return { success: false, error: error.message };
    }
  }

  // Get disk usage statistics
  getDiskUsage() {
    try {
      const getDirSize = (dir) => {
        let totalSize = 0;
        const files = fs.readdirSync(dir);

        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        });

        return totalSize;
      };

      const videoSize = getDirSize(this.videosDir);
      const imageSize = getDirSize(this.imagesDir);
      const documentSize = getDirSize(this.documentsDir);
      const tempSize = getDirSize(this.tempDir);
      const totalSize = videoSize + imageSize + documentSize + tempSize;

      return {
        success: true,
        total: totalSize,
        totalMB: (totalSize / (1024 * 1024)).toFixed(2),
        videos: {
          size: videoSize,
          sizeMB: (videoSize / (1024 * 1024)).toFixed(2)
        },
        images: {
          size: imageSize,
          sizeMB: (imageSize / (1024 * 1024)).toFixed(2)
        },
        documents: {
          size: documentSize,
          sizeMB: (documentSize / (1024 * 1024)).toFixed(2)
        },
        temp: {
          size: tempSize,
          sizeMB: (tempSize / (1024 * 1024)).toFixed(2)
        }
      };
    } catch (error) {
      console.error('Error getting disk usage:', error);
      return { success: false, error: error.message };
    }
  }
}

// Singleton instance
let mediaManager = null;

function getMediaManager() {
  if (!mediaManager) {
    mediaManager = new MediaManager();
  }
  return mediaManager;
}

module.exports = {
  getMediaManager,
  MediaManager
};
