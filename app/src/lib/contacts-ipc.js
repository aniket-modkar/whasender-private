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

// ─── Groups ────────────────────────────────────────────────────────────────

export async function contactsCreateGroup(data) {
  return await window.electronAPI.invoke('contacts:create-group', data);
}

export async function contactsGetGroups() {
  return await window.electronAPI.invoke('contacts:get-groups');
}

export async function contactsUpdateGroup(id, data) {
  return await window.electronAPI.invoke('contacts:update-group', { id, ...data });
}

export async function contactsDeleteGroup(id) {
  return await window.electronAPI.invoke('contacts:delete-group', id);
}

export async function contactsAddToGroup(groupId, contactIds) {
  return await window.electronAPI.invoke('contacts:add-to-group', { groupId, contactIds });
}

export async function contactsRemoveFromGroup(groupId, contactIds) {
  return await window.electronAPI.invoke('contacts:remove-from-group', { groupId, contactIds });
}

export async function contactsGetByGroup(groupId) {
  return await window.electronAPI.invoke('contacts:get-by-group', groupId);
}
