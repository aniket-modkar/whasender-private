/**
 * Media IPC Wrapper Functions
 * Frontend interface for media file operations
 */

// Save uploaded file to media directory
export async function mediaSaveFile(sourcePath, mediaType, taskId) {
  return await window.electronAPI.invoke('media:save-file', { sourcePath, mediaType, taskId });
}

// Delete media file
export async function mediaDeleteFile(filePath) {
  return await window.electronAPI.invoke('media:delete-file', filePath);
}

// Get file information
export async function mediaGetFileInfo(filePath) {
  return await window.electronAPI.invoke('media:get-file-info', filePath);
}

// Validate file size and type
export async function mediaValidateFile(filePath, mediaType) {
  return await window.electronAPI.invoke('media:validate-file', { filePath, mediaType });
}

// Cleanup old temporary files
export async function mediaCleanupTemp(hours = 24) {
  return await window.electronAPI.invoke('media:cleanup-temp', hours);
}

// Delete all media files for a task
export async function mediaDeleteTaskMedia(taskId) {
  return await window.electronAPI.invoke('media:delete-task-media', taskId);
}

// Get disk usage statistics
export async function mediaGetDiskUsage() {
  return await window.electronAPI.invoke('media:get-disk-usage');
}
