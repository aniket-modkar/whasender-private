import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  PaperAirplaneIcon,
  CalendarIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  UsersIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { taskCreate } from '../lib/ipc';
import { contactsGetAll, contactsExport, contactsGetGroups, contactsGetByGroup } from '../lib/contacts-ipc';
import { templatesGetAll } from '../lib/templates-ipc';
import MediaTypeSelector from '../components/MediaTypeSelector';
import MediaUpload from '../components/MediaUpload';
import MessagePreviewModal from '../components/MessagePreviewModal';

function NewTask() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1); // 1: Upload, 2: Compose, 3: Schedule
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Template picker
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateWarning, setShowTemplateWarning] = useState(null); // holds template to apply after confirmation

  // Step 1: Contact Selection
  const [parseResult, setParseResult] = useState(null);
  const [savedContacts, setSavedContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);
  const [contactSearch, setContactSearch] = useState('');
  const [groups, setGroups] = useState([]);
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  // Step 2: Message Composer
  const [messageTemplate, setMessageTemplate] = useState('');
  const [mediaType, setMediaType] = useState('text'); // 'text', 'video', 'image', 'document'
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaCaption, setMediaCaption] = useState('');

  // Step 3: Scheduler
  const [scheduleType, setScheduleType] = useState('now'); // 'now' or 'scheduled'
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Load contacts and groups on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [cRes, gRes] = await Promise.all([
          contactsGetAll({ limit: 10000 }),
          contactsGetGroups(),
        ]);
        if (cRes.success) setSavedContacts(cRes.contacts);
        if (gRes.success) setGroups(gRes.groups);
      } catch (err) {
        console.error('Error loading contacts:', err);
      }
    };
    load();
  }, []);

  // Pre-populate Step 2 from "Use in Task" on Templates page
  useEffect(() => {
    const tpl = location.state?.template;
    if (!tpl) return;
    applyTemplate(tpl);
    // Clear state so back navigation doesn't re-apply
    window.history.replaceState({}, '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply a template to Step 2 state
  const applyTemplate = (tpl) => {
    setMediaType(tpl.media_type || 'text');
    setMessageTemplate(tpl.media_type === 'text' ? (tpl.message_body || '') : '');
    setMediaCaption(tpl.media_type !== 'text' ? (tpl.media_caption || '') : '');
    setMediaFile(
      tpl.media_path
        ? { path: tpl.media_path, fileName: tpl.media_filename, size: tpl.media_size }
        : null
    );
    setShowTemplatePicker(false);
    setShowTemplateWarning(null);
  };

  // Open template picker — load templates list
  const openTemplatePicker = async () => {
    setTemplatesLoading(true);
    setShowTemplatePicker(true);
    try {
      const res = await templatesGetAll();
      if (res.success) setTemplates(res.templates || []);
    } catch (err) {
      console.error('Error loading templates:', err);
    } finally {
      setTemplatesLoading(false);
    }
  };

  // Request to load template — warn if Step 2 has content
  const requestLoadTemplate = (tpl) => {
    const hasContent =
      messageTemplate.trim() || mediaCaption.trim() || mediaFile || mediaType !== 'text';
    if (hasContent) {
      setShowTemplateWarning(tpl);
    } else {
      applyTemplate(tpl);
    }
  };

  // Toggle single contact
  const toggleContactSelection = (contactId) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    );
  };

  // Select all
  const applySelectAll = () => {
    setSelectedContactIds(savedContacts.map(c => c.id));
  };

  // Apply range (1-based serial numbers)
  const applyRange = () => {
    const start = Math.max(1, parseInt(rangeStart) || 1);
    const end = Math.min(savedContacts.length, parseInt(rangeEnd) || savedContacts.length);
    if (start > end) {
      setError(`Invalid range: ${start} to ${end}`);
      return;
    }
    setSelectedContactIds(savedContacts.slice(start - 1, end).map(c => c.id));
    setError('');
  };

  // Apply group selection
  const applyGroup = async (groupId) => {
    if (!groupId) return;
    setLoading(true);
    try {
      const res = await contactsGetByGroup(parseInt(groupId));
      if (res.success) setSelectedContactIds(res.contacts.map(c => c.id));
    } catch (err) {
      setError('Error loading group contacts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Go to next step
  const handleNextStep = async () => {
    if (step === 1) {
      if (selectedContactIds.length === 0) {
        setError('Please select at least one contact');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const result = await contactsExport(selectedContactIds);
        if (result.success && result.contacts.length > 0) {
          setParseResult({
            success: true,
            numbers: result.contacts,
            totalRows: result.contacts.length,
            validRows: result.contacts.length,
            invalidRows: 0,
            errors: [],
          });
          setStep(2);
        } else {
          setError('Failed to load selected contacts');
        }
      } catch (err) {
        setError('Error loading contacts: ' + err.message);
      } finally {
        setLoading(false);
      }
      return;
    }
    if (step === 2) {
      // For text messages, require message template
      if (mediaType === 'text' && messageTemplate.trim()) {
        setStep(3);
        setError('');
      }
      // For media messages, require media file
      else if (mediaType !== 'text' && mediaFile) {
        setStep(3);
        setError('');
      } else {
        if (mediaType === 'text') {
          setError('Please enter a message template');
        } else {
          setError('Please select a media file');
        }
      }
    }
  };

  // Go to previous step
  const handlePrevStep = () => {
    setStep(step - 1);
    setError('');
  };

  // Create the task
  const handleCreateTask = async () => {
    setLoading(true);
    setError('');

    try {
      // Validate
      if (mediaType === 'text' && !messageTemplate.trim()) {
        setError('Please enter a message template');
        setLoading(false);
        return;
      }

      if (mediaType !== 'text' && !mediaFile) {
        setError('Please select a media file');
        setLoading(false);
        return;
      }

      if (!parseResult?.numbers || parseResult.numbers.length === 0) {
        setError('No contacts available');
        setLoading(false);
        return;
      }

      // Build scheduled date if needed
      let scheduledAt = null;
      if (scheduleType === 'scheduled') {
        if (!scheduledDate || !scheduledTime) {
          setError('Please select both date and time for scheduling');
          setLoading(false);
          return;
        }
        scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
      }

      // Create task
      const result = await taskCreate({
        messageTemplate: mediaType === 'text' ? messageTemplate : (mediaCaption || ''),
        numbers: parseResult.numbers,
        scheduledAt,
        mediaType: mediaType,
        mediaPath: mediaFile?.path || null,
        mediaCaption: mediaCaption || '',
        mediaSize: mediaFile?.size || null,
        mediaFilename: mediaFile?.fileName || null,
      });

      if (result.success) {
        // Navigate to monitor page
        navigate('/monitor');
      } else {
        setError(result.error || 'Failed to create task');
      }
    } catch (err) {
      setError('Error creating task: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Media handlers
  const handleMediaTypeChange = (type) => {
    setMediaType(type);
    setMediaFile(null);
    setError('');
  };

  const handleMediaSelect = (fileData) => {
    setMediaFile(fileData);
    setError('');
  };

  const handleMediaRemove = () => {
    setMediaFile(null);
  };

  // Insert variable into message
  const insertVariable = (variable) => {
    if (mediaType === 'text') {
      setMessageTemplate(messageTemplate + `{{${variable}}}`);
    } else {
      setMediaCaption(mediaCaption + `{{${variable}}}`);
    }
  };

  // Insert formatting
  const insertFormatting = (type) => {
    const textarea = document.querySelector('textarea[name="message"]');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentText = mediaType === 'text' ? messageTemplate : mediaCaption;
    const selectedText = currentText.substring(start, end);

    let formattedText = '';
    let cursorOffset = 0;

    switch (type) {
      case 'bold':
        formattedText = selectedText ? `*${selectedText}*` : '*bold text*';
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'italic':
        formattedText = selectedText ? `_${selectedText}_` : '_italic text_';
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'strikethrough':
        formattedText = selectedText ? `~${selectedText}~` : '~strikethrough~';
        cursorOffset = selectedText ? 0 : -1;
        break;
      case 'monospace':
        formattedText = selectedText ? `\`\`\`${selectedText}\`\`\`` : '```monospace```';
        cursorOffset = selectedText ? 0 : -3;
        break;
      case 'newline':
        formattedText = '\n';
        break;
      default:
        return;
    }

    const newMessage =
      currentText.substring(0, start) + formattedText + currentText.substring(end);

    if (mediaType === 'text') {
      setMessageTemplate(newMessage);
    } else {
      setMediaCaption(newMessage);
    }

    // Set cursor position
    setTimeout(() => {
      const newPosition = start + formattedText.length + cursorOffset;
      textarea.focus();
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  // Insert emoji
  const insertEmoji = (emoji) => {
    if (mediaType === 'text') {
      setMessageTemplate(messageTemplate + emoji);
    } else {
      setMediaCaption(mediaCaption + emoji);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Create New Task</h1>
          <p className="text-gray-400 mt-2">Upload contacts and compose your message campaign</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 1 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {step > 1 ? <CheckCircleIcon className="w-6 h-6" /> : '1'}
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-700">
              <div
                className={`h-full transition-all ${step >= 2 ? 'bg-green-500' : 'bg-gray-700'}`}
                style={{ width: step >= 2 ? '100%' : '0%' }}
              ></div>
            </div>
          </div>

          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full ${
                step >= 2 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {step > 2 ? <CheckCircleIcon className="w-6 h-6" /> : '2'}
            </div>
            <div className="flex-1 h-1 mx-2 bg-gray-700">
              <div
                className={`h-full transition-all ${step >= 3 ? 'bg-green-500' : 'bg-gray-700'}`}
                style={{ width: step >= 3 ? '100%' : '0%' }}
              ></div>
            </div>
          </div>

          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full ${
              step >= 3 ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
            }`}
          >
            3
          </div>
        </div>

        {/* Step Labels */}
        <div className="flex justify-between mb-8 text-sm">
          <span className={step === 1 ? 'text-white font-medium' : 'text-gray-400'}>
            Select Contacts
          </span>
          <span className={step === 2 ? 'text-white font-medium' : 'text-gray-400'}>
            Compose Message
          </span>
          <span className={step === 3 ? 'text-white font-medium' : 'text-gray-400'}>
            Schedule & Send
          </span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
            <ExclamationCircleIcon className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-300">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {/* Step 1: Select Contacts */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-white mb-2">Select Contacts</h2>
              <p className="text-sm text-gray-400 mb-6">
                {savedContacts.length} contacts available
              </p>

              {savedContacts.length === 0 ? (
                <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
                  <UsersIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">No contacts yet</p>
                  <p className="text-gray-400 text-sm">
                    Go to the <strong>Contacts</strong> page to upload and manage your contacts first.
                  </p>
                </div>
              ) : (
                <>
                  {/* Quick Select */}
                  <div className="bg-gray-900 rounded-lg border border-gray-700 p-4 mb-4 space-y-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quick Select</p>
                    <div className="flex flex-wrap gap-3 items-end">
                      {/* Select All */}
                      <button
                        onClick={applySelectAll}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                      >
                        Select All ({savedContacts.length})
                      </button>

                      {/* Deselect */}
                      {selectedContactIds.length > 0 && (
                        <button
                          onClick={() => setSelectedContactIds([])}
                          className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm transition-colors"
                        >
                          Clear Selection
                        </button>
                      )}

                      {/* Range */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">Range:</span>
                        <input
                          type="number"
                          min="1"
                          max={savedContacts.length}
                          value={rangeStart}
                          onChange={e => setRangeStart(e.target.value)}
                          placeholder="From"
                          className="w-20 px-2 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                        />
                        <span className="text-gray-500 text-sm">–</span>
                        <input
                          type="number"
                          min="1"
                          max={savedContacts.length}
                          value={rangeEnd}
                          onChange={e => setRangeEnd(e.target.value)}
                          placeholder="To"
                          className="w-20 px-2 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                        />
                        <button
                          onClick={applyRange}
                          disabled={!rangeStart && !rangeEnd}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                        >
                          Apply
                        </button>
                      </div>

                      {/* Group */}
                      {groups.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-400">Group:</span>
                          <select
                            onChange={e => { if (e.target.value) applyGroup(e.target.value); }}
                            defaultValue=""
                            className="px-2 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:border-green-500"
                          >
                            <option value="" disabled>Select group...</option>
                            {groups.map(g => (
                              <option key={g.id} value={g.id}>
                                {g.name} ({g.member_count})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative mb-3">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search contacts by name or phone..."
                      value={contactSearch}
                      onChange={e => setContactSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                    />
                  </div>

                  {/* Contact List */}
                  <div className="bg-gray-900 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-800 sticky top-0">
                        <tr>
                          <th className="px-3 py-2.5 text-left w-10">
                            <input
                              type="checkbox"
                              checked={
                                savedContacts.length > 0 &&
                                savedContacts.every(c => selectedContactIds.includes(c.id))
                              }
                              onChange={() =>
                                selectedContactIds.length === savedContacts.length
                                  ? setSelectedContactIds([])
                                  : applySelectAll()
                              }
                              className="w-4 h-4 text-green-600 rounded"
                            />
                          </th>
                          <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-400 w-12">#</th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-400">Name</th>
                          <th className="px-3 py-2.5 text-left text-xs font-medium text-gray-400">Phone</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {savedContacts
                          .filter(c =>
                            !contactSearch ||
                            c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
                            c.phone.includes(contactSearch)
                          )
                          .map((contact, idx) => (
                            <tr
                              key={contact.id}
                              onClick={() => toggleContactSelection(contact.id)}
                              className={`cursor-pointer transition-colors ${
                                selectedContactIds.includes(contact.id)
                                  ? 'bg-green-500/5'
                                  : 'hover:bg-gray-800'
                              }`}
                            >
                              <td className="px-3 py-2.5">
                                <input
                                  type="checkbox"
                                  checked={selectedContactIds.includes(contact.id)}
                                  onChange={() => toggleContactSelection(contact.id)}
                                  onClick={e => e.stopPropagation()}
                                  className="w-4 h-4 text-green-600 rounded"
                                />
                              </td>
                              <td className="px-2 py-2.5 text-xs text-gray-500 font-mono">{idx + 1}</td>
                              <td className="px-3 py-2.5 text-sm text-white">
                                {contact.name || <span className="text-gray-500 italic">–</span>}
                              </td>
                              <td className="px-3 py-2.5 text-sm text-gray-300 font-mono">+{contact.phone}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer / Next */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400">
                      {selectedContactIds.length > 0 ? (
                        <span className="text-green-400 font-medium">{selectedContactIds.length} contacts selected</span>
                      ) : (
                        'No contacts selected'
                      )}
                    </p>
                    <button
                      onClick={handleNextStep}
                      disabled={selectedContactIds.length === 0 || loading}
                      className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium text-sm"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      ) : (
                        <>
                          Next
                          <PaperAirplaneIcon className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 2: Compose Message */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Compose Your Message</h2>
                <button
                  type="button"
                  onClick={openTemplatePicker}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm transition-colors font-medium"
                >
                  <DocumentDuplicateIcon className="w-4 h-4" />
                  Load Template
                </button>
              </div>

              <div className="space-y-6">
                {/* Media Type Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Message Type *
                  </label>
                  <MediaTypeSelector selected={mediaType} onChange={handleMediaTypeChange} />
                </div>

                {/* Media Upload (for video/image/document) */}
                {mediaType !== 'text' && (
                  <MediaUpload
                    mediaType={mediaType}
                    onMediaSelect={handleMediaSelect}
                    onMediaRemove={handleMediaRemove}
                  />
                )}

                {/* WhatsApp Formatting Toolbar */}
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-white mb-3">📝 WhatsApp Formatting</h3>

                  {/* Formatting Buttons */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Text Formatting (select text first)</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => insertFormatting('bold')}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors border border-gray-600"
                          title="Bold - *text*"
                        >
                          <strong>B</strong> Bold
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('italic')}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors border border-gray-600"
                          title="Italic - _text_"
                        >
                          <em>I</em> Italic
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('strikethrough')}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors border border-gray-600"
                          title="Strikethrough - ~text~"
                        >
                          <s>S</s> Strike
                        </button>
                        <button
                          type="button"
                          onClick={() => insertFormatting('monospace')}
                          className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded text-sm transition-colors border border-gray-600 font-mono"
                          title="Monospace - ```text```"
                        >
                          {'</>'}Code
                        </button>
                      </div>
                    </div>

                    {/* Emojis */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Quick Emojis</p>
                      <div className="flex flex-wrap gap-2">
                        {['👋', '😊', '🎉', '✅', '❤️', '🔥', '⭐', '💡', '📱', '📧', '🎁', '💰'].map(
                          (emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => insertEmoji(emoji)}
                              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xl rounded transition-colors border border-gray-600"
                              title={`Insert ${emoji}`}
                            >
                              {emoji}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Variables */}
                    <div>
                      <p className="text-xs text-gray-400 mb-2">Insert Variables</p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => insertVariable('name')}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          {'{{name}}'}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable('phone')}
                          className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                        >
                          {'{{phone}}'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Formatting Guide */}
                  <details className="mt-3">
                    <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-300">
                      Formatting Guide (click to expand)
                    </summary>
                    <div className="mt-2 p-3 bg-gray-950 rounded text-xs space-y-1">
                      <p className="text-gray-300">
                        <strong className="text-white">*Bold*</strong> - Use *asterisks*
                      </p>
                      <p className="text-gray-300">
                        <em className="text-white">_Italic_</em> - Use _underscores_
                      </p>
                      <p className="text-gray-300">
                        <s className="text-white">~Strikethrough~</s> - Use ~tildes~
                      </p>
                      <p className="text-gray-300 font-mono">
                        <code className="text-white">```Monospace```</code> - Use ```backticks```
                      </p>
                      <p className="text-gray-300 mt-2">
                        💡 <strong className="text-white">Tip:</strong> Select text and click
                        formatting buttons
                      </p>
                    </div>
                  </details>
                </div>

                {/* Caption/Message Template */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {mediaType === 'text' ? 'Message Template *' : 'Caption (Optional)'}
                  </label>
                  <textarea
                    name="message"
                    value={mediaType === 'text' ? messageTemplate : mediaCaption}
                    onChange={(e) =>
                      mediaType === 'text'
                        ? setMessageTemplate(e.target.value)
                        : setMediaCaption(e.target.value)
                    }
                    placeholder={
                      mediaType === 'text'
                        ? "Hello {{name}}! 👋\n\n*Welcome* to our service!\n\nWe're excited to have you. Here's what you can expect:\n✅ Quick responses\n✅ 24/7 support\n✅ Special offers\n\nVisit: https://example.com\n\n_Questions? Just reply!_"
                        : 'Enter caption (optional). Use {{name}} and {{phone}} for personalization.'
                    }
                    rows={mediaType === 'text' ? 10 : 4}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent font-sans"
                  />
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Use {'{{name}}'} and {'{{phone}}'} for personalization
                    </p>
                    <p
                      className={`text-xs ${
                        (mediaType === 'text' ? messageTemplate.length : mediaCaption.length) > 4096
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {mediaType === 'text' ? messageTemplate.length : mediaCaption.length} / 4096
                      characters
                    </p>
                  </div>

                  {/* Test Message Button */}
                  {((mediaType === 'text' && messageTemplate.trim()) ||
                    (mediaType !== 'text' && (mediaCaption.trim() || mediaFile))) && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setShowPreviewModal(true)}
                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        🧪 Test Message (Dry Run)
                      </button>
                      <p className="text-xs text-gray-500 text-center mt-2">
                        Preview how your message will look with custom test data
                      </p>
                    </div>
                  )}
                </div>

                {/* Preview */}
                {((mediaType === 'text' && messageTemplate) ||
                  (mediaType !== 'text' && mediaCaption)) &&
                  parseResult?.numbers[0] && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        📱 WhatsApp Preview
                      </label>
                      <div className="bg-gradient-to-b from-teal-700 to-teal-800 p-4 rounded-lg">
                        {/* WhatsApp-style message bubble */}
                        <div className="bg-white rounded-lg rounded-tl-none p-4 shadow-lg max-w-md">
                          {/* Media preview indicator */}
                          {mediaType !== 'text' && (
                            <div className="mb-3 p-3 bg-gray-100 rounded text-center text-sm text-gray-600">
                              {mediaType === 'video' && '🎥 Video attachment'}
                              {mediaType === 'image' && '🖼️ Image attachment'}
                              {mediaType === 'document' && '📄 Document attachment'}
                            </div>
                          )}
                          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {(mediaType === 'text' ? messageTemplate : mediaCaption)
                              .replace(/\{\{name\}\}/g, parseResult.numbers[0].name || 'Customer')
                              .replace(/\{\{phone\}\}/g, parseResult.numbers[0].phone)
                              .split('\n')
                              .map((line, i) => {
                                // Process WhatsApp formatting
                                let processed = line;

                                // Bold: *text*
                                processed = processed.replace(
                                  /\*(.*?)\*/g,
                                  '<strong class="font-bold">$1</strong>'
                                );

                                // Italic: _text_
                                processed = processed.replace(
                                  /_(.*?)_/g,
                                  '<em class="italic">$1</em>'
                                );

                                // Strikethrough: ~text~
                                processed = processed.replace(
                                  /~(.*?)~/g,
                                  '<s class="line-through">$1</s>'
                                );

                                // Monospace: ```text```
                                processed = processed.replace(
                                  /```(.*?)```/g,
                                  '<code class="font-mono bg-gray-100 px-1 rounded">$1</code>'
                                );

                                return (
                                  <span
                                    key={i}
                                    dangerouslySetInnerHTML={{ __html: processed }}
                                    className="block"
                                  />
                                );
                              })}
                          </div>
                          <div className="flex justify-end mt-2">
                            <span className="text-xs text-gray-500">
                              {new Date().toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Preview for: {parseResult.numbers[0].name || parseResult.numbers[0].phone}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Step 3: Schedule */}
          {step === 3 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Schedule Your Campaign</h2>

              <div className="space-y-6">
                {/* Schedule Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    When to send?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="now"
                        checked={scheduleType === 'now'}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">Send Now</p>
                        <p className="text-sm text-gray-400">Start sending immediately</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-green-500 transition-colors">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="scheduled"
                        checked={scheduleType === 'scheduled'}
                        onChange={(e) => setScheduleType(e.target.value)}
                        className="w-4 h-4 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <p className="text-white font-medium">Schedule for Later</p>
                        <p className="text-sm text-gray-400">Choose specific date and time</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Date/Time Picker */}
                {scheduleType === 'scheduled' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Date</label>
                      <input
                        type="date"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Time</label>
                      <input
                        type="time"
                        value={scheduledTime}
                        onChange={(e) => setScheduledTime(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg">
                  <h3 className="text-sm font-medium text-white mb-3">Campaign Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Recipients:</span>
                      <span className="text-white font-medium">{parseResult?.numbers.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Message Length:</span>
                      <span className="text-white font-medium">{messageTemplate.length} chars</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Scheduled:</span>
                      <span className="text-white font-medium">
                        {scheduleType === 'now'
                          ? 'Send immediately'
                          : scheduledDate && scheduledTime
                          ? `${scheduledDate} at ${scheduledTime}`
                          : 'Not set'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="border-t border-gray-700 p-6 flex justify-between">
            <button
              onClick={handlePrevStep}
              disabled={step === 1}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg transition-colors font-medium"
            >
              Previous
            </button>

            {step === 2 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (mediaType === 'text' && !messageTemplate.trim()) ||
                  (mediaType !== 'text' && !mediaFile)
                }
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Next
              </button>
            ) : step === 1 ? (
              <div /> /* Step 1 uses its own embedded Next button */
            ) : (
              <button
                onClick={handleCreateTask}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="w-5 h-5" />
                    Create Task
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Message Preview Modal */}
      <MessagePreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        messageTemplate={messageTemplate}
        mediaType={mediaType}
        mediaCaption={mediaCaption}
        mediaFileName={mediaFile?.fileName || null}
        mediaFilePath={mediaFile?.path || null}
      />

      {/* Template Picker Modal */}
      {showTemplatePicker && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Choose a Template</h3>
              <button
                onClick={() => setShowTemplatePicker(false)}
                className="text-gray-400 hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-4">
              {templatesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <DocumentDuplicateIcon className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-white font-medium mb-1">No templates yet</p>
                  <p className="text-gray-400 text-sm">Create templates from the Templates page first.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      onClick={() => requestLoadTemplate(tpl)}
                      className="text-left p-4 bg-gray-900 border border-gray-700 rounded-lg hover:border-purple-500 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium truncate">{tpl.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              tpl.media_type === 'text'
                                ? 'bg-blue-500/20 text-blue-400'
                                : tpl.media_type === 'image'
                                ? 'bg-green-500/20 text-green-400'
                                : tpl.media_type === 'video'
                                ? 'bg-orange-500/20 text-orange-400'
                                : 'bg-purple-500/20 text-purple-400'
                            }`}>
                              {tpl.media_type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 truncate">
                            {tpl.media_type === 'text'
                              ? (tpl.message_body || <em className="italic">No message body</em>)
                              : (tpl.media_caption || tpl.media_filename || `${tpl.media_type} attachment`)}
                          </p>
                        </div>
                        <span className="text-purple-400 text-sm font-medium group-hover:text-purple-300 whitespace-nowrap">
                          Use this
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Template Overwrite Warning Modal */}
      {showTemplateWarning && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Replace existing content?</h3>
                <p className="text-gray-400 text-sm">Your current message will be overwritten.</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-6">
              Loading <strong className="text-white">"{showTemplateWarning.name}"</strong> will
              replace the message type, content, and media you've already entered.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowTemplateWarning(null)}
                className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => applyTemplate(showTemplateWarning)}
                className="flex-1 px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors text-sm font-medium"
              >
                Yes, Load Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NewTask;
