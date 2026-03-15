import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentArrowUpIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';
import { parseNumbers, taskCreate } from '../lib/ipc';
import { contactsGetAll, contactsExport, contactsGetCount, contactsImport } from '../lib/contacts-ipc';
import MediaTypeSelector from '../components/MediaTypeSelector';
import MediaUpload from '../components/MediaUpload';
import MessagePreviewModal from '../components/MessagePreviewModal';

function NewTask() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Upload, 2: Compose, 3: Schedule
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: File Upload
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'saved'
  const [filePath, setFilePath] = useState('');
  const [parseResult, setParseResult] = useState(null);
  const [savedContacts, setSavedContacts] = useState([]);
  const [selectedContactIds, setSelectedContactIds] = useState([]);

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

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      // Open file dialog using Electron's dialog API
      const result = await window.electronAPI.invoke('dialog:open-file', {
        filters: [
          { name: 'Spreadsheets', extensions: ['csv', 'xlsx', 'xls'] },
          { name: 'All Files', extensions: ['*'] },
        ],
        properties: ['openFile'],
      });

      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        setFilePath(selectedPath);
        await parseFile(selectedPath);
      }
    } catch (err) {
      setError('Failed to open file dialog: ' + err.message);
    }
  };

  // Parse the uploaded file
  const parseFile = async (path) => {
    setLoading(true);
    setError('');
    setParseResult(null);

    try {
      const result = await parseNumbers(path);

      if (result.success) {
        setParseResult(result);
        if (result.numbers.length === 0) {
          setError('No valid phone numbers found in the file');
        }
      } else {
        setError(result.error || 'Failed to parse file');
      }
    } catch (err) {
      setError('Error parsing file: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load saved contacts
  const loadSavedContacts = async () => {
    try {
      const result = await contactsGetAll({ limit: 10000 });
      if (result.success) {
        setSavedContacts(result.contacts);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  // Load saved contacts on mount if user switches to saved mode
  useEffect(() => {
    if (uploadMode === 'saved') {
      loadSavedContacts();
    }
  }, [uploadMode]);

  // Handle importing file contacts to master database
  const handleImportToContacts = async () => {
    if (!parseResult?.numbers) return;

    setLoading(true);
    try {
      const result = await contactsImport(parseResult.numbers);
      if (result.success) {
        alert(`Successfully imported ${result.imported} new contacts and updated ${result.updated} existing contacts!`);
        loadSavedContacts();
      } else {
        setError(result.error || 'Failed to import contacts');
      }
    } catch (err) {
      setError('Error importing contacts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle loading contacts from saved database
  const handleLoadFromSaved = async () => {
    if (selectedContactIds.length === 0) {
      setError('Please select at least one contact');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await contactsExport(selectedContactIds);
      if (result.success) {
        setParseResult({
          success: true,
          numbers: result.contacts,
          totalRows: result.contacts.length,
          validRows: result.contacts.length,
          invalidRows: 0,
          errors: [],
        });
      } else {
        setError(result.error || 'Failed to load contacts');
      }
    } catch (err) {
      setError('Error loading contacts: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle contact selection
  const toggleContactSelection = (contactId) => {
    setSelectedContactIds(prev =>
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  // Select all contacts
  const handleSelectAll = () => {
    if (selectedContactIds.length === savedContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(savedContacts.map(c => c.id));
    }
  };

  // Go to next step
  const handleNextStep = () => {
    if (step === 1 && parseResult?.numbers?.length > 0) {
      setStep(2);
      setError('');
    } else if (step === 2) {
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
            Upload Contacts
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
          {/* Step 1: Upload Contacts */}
          {step === 1 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Select Contacts</h2>

              {/* Mode Selector */}
              <div className="mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {
                      setUploadMode('file');
                      setParseResult(null);
                      setSelectedContactIds([]);
                    }}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      uploadMode === 'file'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <DocumentArrowUpIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-white font-medium">Upload File</p>
                    <p className="text-xs text-gray-400 mt-1">CSV or Excel</p>
                  </button>
                  <button
                    onClick={() => {
                      setUploadMode('saved');
                      setParseResult(null);
                      setFilePath('');
                    }}
                    className={`p-4 rounded-lg border-2 transition-colors ${
                      uploadMode === 'saved'
                        ? 'border-green-500 bg-green-500/10'
                        : 'border-gray-700 bg-gray-900 hover:border-gray-600'
                    }`}
                  >
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-white font-medium">Saved Contacts</p>
                    <p className="text-xs text-gray-400 mt-1">Use master database</p>
                  </button>
                </div>
              </div>

              {/* File Upload Mode */}
              {uploadMode === 'file' && !parseResult && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                    <DocumentArrowUpIcon className="w-12 h-12 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Upload CSV or Excel File</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Upload a file with phone numbers and names. Columns: Phone, Name
                  </p>
                  <button
                    onClick={handleFileSelect}
                    disabled={loading}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <DocumentArrowUpIcon className="w-5 h-5" />
                        Select File
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-500 mt-4">Supported: CSV, XLSX, XLS</p>
                </div>
              )}

              {/* Saved Contacts Mode */}
              {uploadMode === 'saved' && !parseResult && (
                <div className="space-y-4">
                  {savedContacts.length === 0 ? (
                    <div className="text-center py-12 bg-gray-900 rounded-lg border border-gray-700">
                      <p className="text-gray-400 mb-4">No saved contacts found</p>
                      <button
                        onClick={() => setUploadMode('file')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                      >
                        Upload a file to import contacts
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm text-gray-400">
                          {savedContacts.length} contacts available
                        </p>
                        <button
                          onClick={handleSelectAll}
                          className="text-sm text-blue-400 hover:text-blue-300"
                        >
                          {selectedContactIds.length === savedContacts.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>

                      <div className="bg-gray-900 rounded-lg border border-gray-700 max-h-96 overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-gray-800 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left w-12">
                                <input
                                  type="checkbox"
                                  checked={selectedContactIds.length === savedContacts.length && savedContacts.length > 0}
                                  onChange={handleSelectAll}
                                  className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                />
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Phone</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Name</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700">
                            {savedContacts.map((contact) => (
                              <tr
                                key={contact.id}
                                onClick={() => toggleContactSelection(contact.id)}
                                className="cursor-pointer hover:bg-gray-800 transition-colors"
                              >
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedContactIds.includes(contact.id)}
                                    onChange={() => toggleContactSelection(contact.id)}
                                    className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                                  />
                                </td>
                                <td className="px-4 py-3 text-sm text-white font-mono">+{contact.phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-300">{contact.name || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <button
                        onClick={handleLoadFromSaved}
                        disabled={selectedContactIds.length === 0 || loading}
                        className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            Loading...
                          </>
                        ) : (
                          <>
                            <CheckCircleIcon className="w-5 h-5" />
                            Use Selected Contacts ({selectedContactIds.length})
                          </>
                        )}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* File Upload Result */}
              {parseResult && (
                <div className="space-y-6">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-4 bg-gray-900 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3">
                      <DocumentArrowUpIcon className="w-6 h-6 text-green-500" />
                      <div>
                        <p className="text-white font-medium">{filePath.split('/').pop()}</p>
                        <p className="text-sm text-gray-400">
                          {parseResult.totalRows} rows · {parseResult.validRows} valid ·{' '}
                          {parseResult.invalidRows} invalid
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setFilePath('');
                        setParseResult(null);
                      }}
                      className="text-gray-400 hover:text-white"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Summary Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-green-400">{parseResult.numbers.length}</p>
                      <p className="text-sm text-green-300">Valid Contacts</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-400">{parseResult.validRows}</p>
                      <p className="text-sm text-blue-300">Valid Rows</p>
                    </div>
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-2xl font-bold text-red-400">{parseResult.invalidRows}</p>
                      <p className="text-sm text-red-300">Invalid Rows</p>
                    </div>
                  </div>

                  {/* Import to Contacts Database */}
                  {uploadMode === 'file' && parseResult.numbers.length > 0 && (
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-blue-300 mb-1">
                            💾 Save to Master Contacts
                          </h3>
                          <p className="text-xs text-blue-200/80">
                            Import these contacts to your master database for reuse in future campaigns
                          </p>
                        </div>
                        <button
                          onClick={handleImportToContacts}
                          disabled={loading}
                          className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2"
                        >
                          {loading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Importing...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Import to Database
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contact Preview */}
                  <div>
                    <h3 className="text-sm font-medium text-white mb-3">Contact Preview</h3>
                    <div className="bg-gray-900 rounded-lg border border-gray-700 max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                              Phone
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">
                              Name
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {parseResult.numbers.slice(0, 10).map((contact, idx) => (
                            <tr key={idx}>
                              <td className="px-4 py-3 text-sm text-white font-mono">
                                +{contact.phone}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-300">{contact.name || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {parseResult.numbers.length > 10 && (
                        <div className="p-3 text-center text-sm text-gray-400 border-t border-gray-700">
                          +{parseResult.numbers.length - 10} more contacts
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Errors */}
                  {parseResult.errors.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-white mb-3">Errors</h3>
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 max-h-32 overflow-y-auto">
                        {parseResult.errors.slice(0, 5).map((err, idx) => (
                          <p key={idx} className="text-xs text-red-300 mb-1">
                            Row {err.row}: {err.error}
                          </p>
                        ))}
                        {parseResult.errors.length > 5 && (
                          <p className="text-xs text-red-400 mt-2">
                            +{parseResult.errors.length - 5} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Compose Message */}
          {step === 2 && (
            <div className="p-8">
              <h2 className="text-xl font-semibold text-white mb-6">Compose Your Message</h2>

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

            {step < 3 ? (
              <button
                onClick={handleNextStep}
                disabled={
                  (step === 1 && !parseResult?.numbers?.length) ||
                  (step === 2 &&
                    ((mediaType === 'text' && !messageTemplate.trim()) ||
                      (mediaType !== 'text' && !mediaFile)))
                }
                className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors font-medium"
              >
                Next
              </button>
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
    </div>
  );
}

export default NewTask;
