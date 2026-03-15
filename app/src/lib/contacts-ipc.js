/**
 * Contacts IPC Wrapper Functions
 * Frontend interface for contacts management operations
 */

// Add a single contact
export async function contactsAdd(contact) {
  return await window.electronAPI.invoke('contacts:add', contact);
}

// Import multiple contacts
export async function contactsImport(contacts) {
  return await window.electronAPI.invoke('contacts:import', contacts);
}

// Get all contacts with pagination and filtering
export async function contactsGetAll(options = {}) {
  return await window.electronAPI.invoke('contacts:get-all', options);
}

// Get a single contact by ID
export async function contactsGet(id) {
  return await window.electronAPI.invoke('contacts:get', id);
}

// Update a contact
export async function contactsUpdate(id, data) {
  return await window.electronAPI.invoke('contacts:update', { id, ...data });
}

// Delete a contact
export async function contactsDelete(id) {
  return await window.electronAPI.invoke('contacts:delete', id);
}

// Delete multiple contacts
export async function contactsDeleteMultiple(ids) {
  return await window.electronAPI.invoke('contacts:delete-multiple', ids);
}

// Get total contact count
export async function contactsGetCount() {
  return await window.electronAPI.invoke('contacts:get-count');
}

// Get all unique tags
export async function contactsGetTags() {
  return await window.electronAPI.invoke('contacts:get-tags');
}

// Export contacts (for task creation)
export async function contactsExport(ids = []) {
  return await window.electronAPI.invoke('contacts:export', ids);
}
