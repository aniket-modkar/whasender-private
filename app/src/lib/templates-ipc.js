export async function templatesCreate(data) {
  return await window.electronAPI.invoke('templates:create', data);
}

export async function templatesGetAll() {
  return await window.electronAPI.invoke('templates:get-all');
}

export async function templatesGet(id) {
  return await window.electronAPI.invoke('templates:get', id);
}

export async function templatesUpdate(id, data) {
  return await window.electronAPI.invoke('templates:update', { id, ...data });
}

export async function templatesDelete(id) {
  return await window.electronAPI.invoke('templates:delete', id);
}
