import { useState, useEffect, useCallback } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import {
  contactsGetAll,
  contactsImport,
  contactsDelete,
  contactsDeleteMultiple,
  contactsGetCount,
  contactsCreateGroup,
  contactsGetGroups,
  contactsUpdateGroup,
  contactsDeleteGroup,
  contactsAddToGroup,
  contactsRemoveFromGroup,
  contactsGetByGroup,
} from '../lib/contacts-ipc';

const PAGE_SIZE = 50;

export default function Contacts() {
  const [tab, setTab] = useState('contacts'); // 'contacts' | 'groups'

  // ── All Contacts state ───────────────────────────────────────────────────
  const [contacts, setContacts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // ── Upload state ─────────────────────────────────────────────────────────
  const [uploadResult, setUploadResult] = useState(null); // { newContacts, duplicates, errors, total }
  const [uploading, setUploading] = useState(false);

  // ── Groups state ─────────────────────────────────────────────────────────
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(false);

  // ── Group detail state ───────────────────────────────────────────────────
  const [activeGroup, setActiveGroup] = useState(null); // selected group object
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupMembersLoading, setGroupMembersLoading] = useState(false);
  const [groupMemberSearch, setGroupMemberSearch] = useState('');
  const [addMembersSearch, setAddMembersSearch] = useState('');
  const [addMembersContacts, setAddMembersContacts] = useState([]);
  const [addMembersSelected, setAddMembersSelected] = useState([]);
  const [showAddMembers, setShowAddMembers] = useState(false);

  // ── Modal state ──────────────────────────────────────────────────────────
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDesc, setGroupFormDesc] = useState('');
  const [groupFormError, setGroupFormError] = useState('');
  const [groupFormLoading, setGroupFormLoading] = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Data loading
  // ─────────────────────────────────────────────────────────────────────────

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await contactsGetAll({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search,
      });
      if (res.success) {
        setContacts(res.contacts);
        setTotal(res.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    try {
      const res = await contactsGetGroups();
      if (res.success) setGroups(res.groups);
    } finally {
      setGroupsLoading(false);
    }
  }, []);

  const loadGroupMembers = useCallback(async (group) => {
    setGroupMembersLoading(true);
    try {
      const res = await contactsGetByGroup(group.id);
      if (res.success) setGroupMembers(res.contacts);
    } finally {
      setGroupMembersLoading(false);
    }
  }, []);

  useEffect(() => { loadContacts(); }, [loadContacts]);
  useEffect(() => { loadGroups(); }, [loadGroups]);

  useEffect(() => {
    if (activeGroup) loadGroupMembers(activeGroup);
  }, [activeGroup, loadGroupMembers]);

  // Reset page on search change
  useEffect(() => { setPage(1); }, [search]);

  // ─────────────────────────────────────────────────────────────────────────
  // Upload
  // ─────────────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    try {
      const result = await window.electronAPI.invoke('dialog:open-file', {
        filters: [
          { name: 'Contacts Files', extensions: ['csv', 'xlsx', 'xls', 'vcf'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (result.canceled || !result.filePaths?.length) return;

      setUploading(true);
      const filePath = result.filePaths[0];

      // Parse the file
      const parsed = await window.electronAPI.invoke('file:parse-numbers', filePath);
      if (!parsed.success) {
        setUploadResult({ error: parsed.error });
        setUploading(false);
        return;
      }

      if (!parsed.numbers?.length) {
        setUploadResult({ error: 'No valid contacts found in file', total: parsed.totalRows });
        setUploading(false);
        return;
      }

      // Import into master DB
      const imported = await contactsImport(parsed.numbers);
      setUploadResult({
        newContacts: imported.newContacts ?? 0,
        duplicates: imported.duplicates ?? 0,
        invalidRows: parsed.invalidRows ?? 0,
        total: parsed.totalRows ?? parsed.numbers.length,
        error: imported.success ? null : imported.error,
      });

      if (imported.success) {
        loadContacts();
        loadGroups();
      }
    } catch (err) {
      setUploadResult({ error: err.message });
    } finally {
      setUploading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Contact selection
  // ─────────────────────────────────────────────────────────────────────────

  const toggleSelect = (id) =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleSelectAll = () => {
    const pageIds = contacts.map(c => c.id);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...pageIds])]);
    }
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.length) return;
    if (!window.confirm(`Delete ${selectedIds.length} contact(s)? This cannot be undone.`)) return;

    const res = await contactsDeleteMultiple(selectedIds);
    if (res.success) {
      setSelectedIds([]);
      loadContacts();
      loadGroups();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Groups CRUD
  // ─────────────────────────────────────────────────────────────────────────

  const openCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormName('');
    setGroupFormDesc('');
    setGroupFormError('');
    setShowCreateGroup(true);
  };

  const openEditGroup = (group) => {
    setEditingGroup(group);
    setGroupFormName(group.name);
    setGroupFormDesc(group.description || '');
    setGroupFormError('');
    setShowCreateGroup(true);
  };

  const handleSaveGroup = async () => {
    if (!groupFormName.trim()) {
      setGroupFormError('Group name is required');
      return;
    }
    setGroupFormLoading(true);
    setGroupFormError('');
    try {
      const res = editingGroup
        ? await contactsUpdateGroup(editingGroup.id, { name: groupFormName.trim(), description: groupFormDesc })
        : await contactsCreateGroup({ name: groupFormName.trim(), description: groupFormDesc });

      if (res.success) {
        setShowCreateGroup(false);
        setEditingGroup(null);
        loadGroups();
        if (activeGroup && editingGroup?.id === activeGroup.id) {
          setActiveGroup(prev => ({ ...prev, name: groupFormName.trim(), description: groupFormDesc }));
        }
      } else {
        setGroupFormError(res.error || 'Failed to save group');
      }
    } finally {
      setGroupFormLoading(false);
    }
  };

  const handleDeleteGroup = async (group) => {
    if (!window.confirm(`Delete group "${group.name}"? Contacts will not be deleted.`)) return;
    const res = await contactsDeleteGroup(group.id);
    if (res.success) {
      loadGroups();
      if (activeGroup?.id === group.id) setActiveGroup(null);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Group members management
  // ─────────────────────────────────────────────────────────────────────────

  const handleRemoveFromGroup = async (contactId) => {
    if (!activeGroup) return;
    const res = await contactsRemoveFromGroup(activeGroup.id, [contactId]);
    if (res.success) {
      loadGroupMembers(activeGroup);
      loadGroups();
    }
  };

  const openAddMembers = async () => {
    const res = await contactsGetAll({ limit: 10000 });
    if (res.success) {
      const memberIds = new Set(groupMembers.map(m => m.id));
      setAddMembersContacts(res.contacts.filter(c => !memberIds.has(c.id)));
    }
    setAddMembersSelected([]);
    setAddMembersSearch('');
    setShowAddMembers(true);
  };

  const handleAddMembers = async () => {
    if (!addMembersSelected.length || !activeGroup) return;
    const res = await contactsAddToGroup(activeGroup.id, addMembersSelected);
    if (res.success) {
      setShowAddMembers(false);
      loadGroupMembers(activeGroup);
      loadGroups();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived
  // ─────────────────────────────────────────────────────────────────────────

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const pageIds = contacts.map(c => c.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id));

  const filteredGroupMembers = groupMembers.filter(
    c =>
      !groupMemberSearch ||
      c.name.toLowerCase().includes(groupMemberSearch.toLowerCase()) ||
      c.phone.includes(groupMemberSearch)
  );

  const filteredAddContacts = addMembersContacts.filter(
    c =>
      !addMembersSearch ||
      c.name.toLowerCase().includes(addMembersSearch.toLowerCase()) ||
      c.phone.includes(addMembersSearch)
  );

  const serialOffset = (page - 1) * PAGE_SIZE;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Contacts</h1>
            <p className="text-gray-400 mt-1">{total.toLocaleString()} total contacts</p>
          </div>
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <ArrowUpTrayIcon className="w-4 h-4" />
            )}
            {uploading ? 'Uploading...' : 'Upload Contacts'}
          </button>
        </div>

        {/* Upload Result Banner */}
        {uploadResult && (
          <div
            className={`mb-6 p-4 rounded-lg border flex items-start gap-4 ${
              uploadResult.error
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-gray-800 border-gray-700'
            }`}
          >
            {uploadResult.error ? (
              <>
                <ExclamationTriangleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-300">Upload failed</p>
                  <p className="text-xs text-red-400 mt-0.5">{uploadResult.error}</p>
                </div>
              </>
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-2">Upload Complete</p>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-2">
                      <p className="text-lg font-bold text-green-400">{uploadResult.newContacts}</p>
                      <p className="text-xs text-green-300">New contacts added</p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                      <p className="text-lg font-bold text-yellow-400">{uploadResult.duplicates}</p>
                      <p className="text-xs text-yellow-300">Duplicates found</p>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                      <p className="text-lg font-bold text-red-400">{uploadResult.invalidRows ?? 0}</p>
                      <p className="text-xs text-red-300">Invalid entries</p>
                    </div>
                  </div>
                </div>
              </>
            )}
            <button onClick={() => setUploadResult(null)} className="text-gray-400 hover:text-white">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-800 rounded-lg p-1 w-fit">
          <button
            onClick={() => setTab('contacts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'contacts'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Contacts
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === 'groups'
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Groups {groups.length > 0 && <span className="ml-1 text-xs text-gray-400">({groups.length})</span>}
          </button>
        </div>

        {/* ── ALL CONTACTS TAB ────────────────────────────────────────────── */}
        {tab === 'contacts' && (
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            {/* Toolbar */}
            <div className="p-4 border-b border-gray-700 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-48">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>

              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                >
                  <TrashIcon className="w-4 h-4" />
                  Delete {selectedIds.length} selected
                </button>
              )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={allPageSelected}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 text-green-600 rounded"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-16">#</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Phone</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2" />
                        Loading...
                      </td>
                    </tr>
                  ) : contacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                        {search ? 'No contacts match your search' : 'No contacts yet. Upload a file to get started.'}
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact, idx) => (
                      <tr
                        key={contact.id}
                        onClick={() => toggleSelect(contact.id)}
                        className="cursor-pointer hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(contact.id)}
                            onChange={() => toggleSelect(contact.id)}
                            onClick={e => e.stopPropagation()}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 font-mono">
                          {serialOffset + idx + 1}
                        </td>
                        <td className="px-4 py-3 text-sm text-white">
                          {contact.name || <span className="text-gray-500 italic">No name</span>}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-300 font-mono">+{contact.phone}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!window.confirm('Delete this contact?')) return;
                              await contactsDelete(contact.id);
                              loadContacts();
                              loadGroups();
                            }}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-700 flex items-center justify-between text-sm">
                <span className="text-gray-400">
                  Showing {serialOffset + 1}–{Math.min(serialOffset + PAGE_SIZE, total)} of {total.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <span className="text-gray-300">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── GROUPS TAB ──────────────────────────────────────────────────── */}
        {tab === 'groups' && (
          <div>
            {activeGroup ? (
              /* ── Group Detail View ─────────────────────────────────────── */
              <div className="bg-gray-800 rounded-lg border border-gray-700">
                {/* Group header */}
                <div className="p-4 border-b border-gray-700 flex items-center gap-3">
                  <button
                    onClick={() => { setActiveGroup(null); setGroupMemberSearch(''); }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <h2 className="text-white font-semibold">{activeGroup.name}</h2>
                    {activeGroup.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{activeGroup.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded-md">
                    {groupMembers.length} members
                  </span>
                  <button
                    onClick={openAddMembers}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add Contacts
                  </button>
                </div>

                {/* Member search */}
                <div className="p-3 border-b border-gray-700">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search members..."
                      value={groupMemberSearch}
                      onChange={e => setGroupMemberSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>
                </div>

                {/* Members list */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 w-16">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Phone</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Remove</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {groupMembersLoading ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto" />
                          </td>
                        </tr>
                      ) : filteredGroupMembers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-gray-400">
                            {groupMemberSearch ? 'No members match your search' : 'No members in this group yet'}
                          </td>
                        </tr>
                      ) : (
                        filteredGroupMembers.map((contact, idx) => (
                          <tr key={contact.id} className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-4 py-3 text-xs text-gray-500 font-mono">{idx + 1}</td>
                            <td className="px-4 py-3 text-sm text-white">
                              {contact.name || <span className="text-gray-500 italic">No name</span>}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-300 font-mono">+{contact.phone}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => handleRemoveFromGroup(contact.id)}
                                className="text-gray-500 hover:text-red-400 transition-colors text-xs"
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* ── Groups List ────────────────────────────────────────────── */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-400">{groups.length} group{groups.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={openCreateGroup}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Create Group
                  </button>
                </div>

                {groupsLoading ? (
                  <div className="text-center py-12 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2" />
                    Loading groups...
                  </div>
                ) : groups.length === 0 ? (
                  <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
                    <UserGroupIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No groups yet</p>
                    <p className="text-gray-400 text-sm mb-4">Create groups to organize your contacts</p>
                    <button
                      onClick={openCreateGroup}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                    >
                      Create First Group
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groups.map(group => (
                      <div
                        key={group.id}
                        onClick={() => setActiveGroup(group)}
                        className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-green-500/50 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-center">
                            <UsersIcon className="w-5 h-5 text-green-400" />
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); openEditGroup(group); }}
                              className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                            >
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); handleDeleteGroup(group); }}
                              className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                        <h3 className="text-white font-medium text-sm mb-1 truncate">{group.name}</h3>
                        {group.description && (
                          <p className="text-xs text-gray-400 mb-2 line-clamp-2">{group.description}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {group.member_count} contact{group.member_count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Create / Edit Group Modal ─────────────────────────────────────── */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                {editingGroup ? 'Edit Group' : 'Create Group'}
              </h2>
              <button
                onClick={() => { setShowCreateGroup(false); setEditingGroup(null); }}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={groupFormName}
                  onChange={e => setGroupFormName(e.target.value)}
                  placeholder="e.g. Customers, Leads, VIPs..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description <span className="text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={groupFormDesc}
                  onChange={e => setGroupFormDesc(e.target.value)}
                  placeholder="Brief description..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>

              {groupFormError && (
                <p className="text-sm text-red-400">{groupFormError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowCreateGroup(false); setEditingGroup(null); }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGroup}
                  disabled={groupFormLoading}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors font-medium"
                >
                  {groupFormLoading ? 'Saving...' : editingGroup ? 'Save Changes' : 'Create Group'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Members Modal ────────────────────────────────────────────── */}
      {showAddMembers && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-lg flex flex-col" style={{ maxHeight: '80vh' }}>
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add Contacts to "{activeGroup?.name}"</h2>
              <button onClick={() => setShowAddMembers(false)} className="text-gray-400 hover:text-white">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={addMembersSearch}
                  onChange={e => setAddMembersSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>
            </div>

            <div className="overflow-y-auto flex-1">
              {filteredAddContacts.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm">
                  {addMembersSearch ? 'No contacts match' : 'All contacts are already in this group'}
                </p>
              ) : (
                <table className="w-full">
                  <tbody className="divide-y divide-gray-700">
                    {filteredAddContacts.map(contact => (
                      <tr
                        key={contact.id}
                        onClick={() =>
                          setAddMembersSelected(prev =>
                            prev.includes(contact.id) ? prev.filter(x => x !== contact.id) : [...prev, contact.id]
                          )
                        }
                        className="cursor-pointer hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-4 py-2.5 w-10">
                          <input
                            type="checkbox"
                            checked={addMembersSelected.includes(contact.id)}
                            onChange={() => {}}
                            className="w-4 h-4 text-green-600 rounded"
                          />
                        </td>
                        <td className="px-2 py-2.5 text-sm text-white">
                          {contact.name || <span className="text-gray-500 italic">No name</span>}
                        </td>
                        <td className="px-4 py-2.5 text-sm text-gray-400 font-mono">+{contact.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-700 flex items-center justify-between gap-3">
              <span className="text-sm text-gray-400">
                {addMembersSelected.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddMembers(false)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMembers}
                  disabled={addMembersSelected.length === 0}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors font-medium"
                >
                  Add {addMembersSelected.length > 0 ? `(${addMembersSelected.length})` : ''}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
