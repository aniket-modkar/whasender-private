import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DocumentDuplicateIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  EyeIcon,
  PaperAirplaneIcon,
  VideoCameraIcon,
  PhotoIcon,
  DocumentIcon,
  ChatBubbleLeftEllipsisIcon,
} from '@heroicons/react/24/outline';
import { templatesCreate, templatesGetAll, templatesUpdate, templatesDelete } from '../lib/templates-ipc';
import MediaTypeSelector from '../components/MediaTypeSelector';
import MediaUpload from '../components/MediaUpload';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MEDIA_TYPE_META = {
  text: { label: 'Text', icon: ChatBubbleLeftEllipsisIcon, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  image: { label: 'Image', icon: PhotoIcon, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  video: { label: 'Video', icon: VideoCameraIcon, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  document: { label: 'Document', icon: DocumentIcon, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
};

const SAMPLE = { name: 'John Doe', phone: '919876543210' };

function renderPreview(text) {
  return (text || '')
    .replace(/\{\{name\}\}/g, SAMPLE.name)
    .replace(/\{\{phone\}\}/g, SAMPLE.phone);
}

function renderFormattedLine(line, i) {
  let html = line
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/~(.*?)~/g, '<s>$1</s>')
    .replace(/```(.*?)```/g, '<code class="font-mono bg-gray-100 px-0.5 rounded text-xs">$1</code>');
  return <span key={i} dangerouslySetInnerHTML={{ __html: html }} className="block" />;
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Templates() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formMediaType, setFormMediaType] = useState('text');
  const [formMessage, setFormMessage] = useState('');
  const [formCaption, setFormCaption] = useState('');
  const [formMediaFile, setFormMediaFile] = useState(null); // { path, type, size, fileName, extension }
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const textareaRef = useRef(null);

  // ── Data ────────────────────────────────────────────────────────────────────

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await templatesGetAll();
      if (res.success) setTemplates(res.templates);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTemplates(); }, [loadTemplates]);

  // ── Modal helpers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormMediaType('text');
    setFormMessage('');
    setFormCaption('');
    setFormMediaFile(null);
    setFormError('');
    setShowModal(true);
  };

  const openEdit = (tmpl) => {
    setEditingTemplate(tmpl);
    setFormName(tmpl.name);
    setFormMediaType(tmpl.media_type || 'text');
    setFormMessage(tmpl.media_type === 'text' ? (tmpl.message_body || '') : '');
    setFormCaption(tmpl.media_type !== 'text' ? (tmpl.message_body || tmpl.media_caption || '') : '');
    setFormMediaFile(
      tmpl.media_path
        ? { path: tmpl.media_path, type: tmpl.media_type, size: tmpl.media_size, fileName: tmpl.media_filename }
        : null
    );
    setFormError('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setShowPreview(false);
  };

  // ── Form actions ─────────────────────────────────────────────────────────────

  const handleMediaTypeChange = (type) => {
    setFormMediaType(type);
    setFormMediaFile(null);
    setFormError('');
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Template name is required');
      return;
    }
    const body = formMediaType === 'text' ? formMessage : formCaption;
    if (formMediaType === 'text' && !body.trim()) {
      setFormError('Message body is required');
      return;
    }
    if (formMediaType !== 'text' && !formMediaFile) {
      setFormError('Please select a media file');
      return;
    }

    setFormLoading(true);
    setFormError('');
    try {
      const payload = {
        name: formName.trim(),
        mediaType: formMediaType,
        messageBody: body,
        mediaPath: formMediaFile?.path || null,
        mediaFilename: formMediaFile?.fileName || null,
        mediaSize: formMediaFile?.size || null,
        mediaCaption: formMediaType !== 'text' ? formCaption : '',
      };

      const res = editingTemplate
        ? await templatesUpdate(editingTemplate.id, payload)
        : await templatesCreate(payload);

      if (res.success) {
        closeModal();
        loadTemplates();
      } else {
        setFormError(res.error || 'Failed to save template');
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (tmpl) => {
    if (!window.confirm(`Delete template "${tmpl.name}"?`)) return;
    const res = await templatesDelete(tmpl.id);
    if (res.success) loadTemplates();
  };

  const handleUseInTask = (tmpl) => {
    navigate('/new-task', {
      state: {
        template: {
          mediaType: tmpl.media_type,
          messageBody: tmpl.message_body,
          mediaPath: tmpl.media_path,
          mediaFilename: tmpl.media_filename,
          mediaSize: tmpl.media_size,
          mediaCaption: tmpl.media_caption,
        },
      },
    });
  };

  // ── Formatting helpers (for compose modal) ────────────────────────────────────

  const insertFormatting = (type) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const current = formMediaType === 'text' ? formMessage : formCaption;
    const selected = current.substring(start, end);
    const map = {
      bold: selected ? `*${selected}*` : '*bold text*',
      italic: selected ? `_${selected}_` : '_italic text_',
      strike: selected ? `~${selected}~` : '~strikethrough~',
      mono: selected ? `\`\`\`${selected}\`\`\`` : '```monospace```',
    };
    const insert = map[type] || '';
    const next = current.substring(0, start) + insert + current.substring(end);
    formMediaType === 'text' ? setFormMessage(next) : setFormCaption(next);
    setTimeout(() => {
      el.focus();
      const pos = start + insert.length;
      el.setSelectionRange(pos, pos);
    }, 0);
  };

  const insertEmoji = (e) => {
    formMediaType === 'text'
      ? setFormMessage(prev => prev + e)
      : setFormCaption(prev => prev + e);
  };

  const insertVariable = (v) => {
    formMediaType === 'text'
      ? setFormMessage(prev => prev + `{{${v}}}`)
      : setFormCaption(prev => prev + `{{${v}}}`);
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const currentBody = formMediaType === 'text' ? formMessage : formCaption;

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Templates</h1>
            <p className="text-gray-400 mt-1">Reusable message templates for your campaigns</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
          >
            <PlusIcon className="w-4 h-4" />
            Create Template
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mr-3" />
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-16 text-center">
            <DocumentDuplicateIcon className="w-14 h-14 text-gray-600 mx-auto mb-4" />
            <p className="text-white font-semibold text-lg mb-1">No templates yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Create reusable message templates to speed up your campaigns
            </p>
            <button
              onClick={openCreate}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
            >
              Create First Template
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {templates.map(tmpl => {
              const meta = MEDIA_TYPE_META[tmpl.media_type] || MEDIA_TYPE_META.text;
              const Icon = meta.icon;
              const preview = renderPreview(tmpl.message_body).substring(0, 120);
              return (
                <div key={tmpl.id} className="bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col hover:border-gray-600 transition-colors">
                  {/* Card header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${meta.bg}`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <h3 className="text-white font-semibold text-sm truncate">{tmpl.name}</h3>
                    </div>
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${meta.bg} ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Message preview */}
                  {tmpl.media_type !== 'text' && tmpl.media_filename && (
                    <div className="flex items-center gap-1.5 mb-2 text-xs text-gray-400">
                      <Icon className="w-3.5 h-3.5" />
                      <span className="truncate">{tmpl.media_filename}</span>
                    </div>
                  )}
                  <p className="text-sm text-gray-400 flex-1 leading-relaxed line-clamp-3 mb-4 whitespace-pre-wrap">
                    {preview || <span className="italic text-gray-500">No message body</span>}
                    {tmpl.message_body?.length > 120 && '...'}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-auto">
                    <button
                      onClick={() => handleUseInTask(tmpl)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors font-medium"
                    >
                      <PaperAirplaneIcon className="w-4 h-4" />
                      Use in Task
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { openEdit(tmpl); setShowPreview(false); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={() => { openEdit(tmpl); setShowPreview(true); }}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-blue-300 rounded-lg text-xs transition-colors"
                      >
                        <EyeIcon className="w-3.5 h-3.5" />
                        Preview
                      </button>
                      <button
                        onClick={() => handleDelete(tmpl)}
                        className="flex items-center justify-center px-3 py-1.5 bg-gray-700 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg text-xs transition-colors"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Create / Edit Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-gray-800 border border-gray-700 rounded-xl w-full max-w-2xl my-8">

            {/* Modal header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">
                {editingTemplate ? 'Edit Template' : 'Create Template'}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(p => !p)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    showPreview ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
                  }`}
                >
                  <EyeIcon className="w-4 h-4" />
                  Preview
                </button>
                <button onClick={closeModal} className="text-gray-400 hover:text-white">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Template name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Template Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="e.g. Welcome Message, Promo Offer..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 text-sm"
                />
              </div>

              {/* Media type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message Type *</label>
                <MediaTypeSelector selected={formMediaType} onChange={handleMediaTypeChange} />
              </div>

              {/* Media upload */}
              {formMediaType !== 'text' && (
                <MediaUpload
                  mediaType={formMediaType}
                  onMediaSelect={f => setFormMediaFile(f)}
                  onMediaRemove={() => setFormMediaFile(null)}
                />
              )}

              {/* Preview mode */}
              {showPreview ? (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Preview — sample data: <span className="text-gray-300 normal-case">{SAMPLE.name} / +{SAMPLE.phone}</span>
                  </p>
                  <div className="bg-gradient-to-b from-teal-700 to-teal-800 p-4 rounded-lg">
                    <div className="bg-white rounded-lg rounded-tl-none p-4 shadow max-w-sm">
                      {formMediaType !== 'text' && (
                        <div className="mb-3 p-3 bg-gray-100 rounded text-center text-sm text-gray-600">
                          {formMediaType === 'video' && '🎥 Video attachment'}
                          {formMediaType === 'image' && '🖼️ Image attachment'}
                          {formMediaType === 'document' && '📄 Document attachment'}
                          {formMediaFile && (
                            <p className="text-xs text-gray-400 mt-1 truncate">{formMediaFile.fileName}</p>
                          )}
                        </div>
                      )}
                      <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                        {renderPreview(currentBody)
                          .split('\n')
                          .map((line, i) => renderFormattedLine(line, i))}
                      </div>
                      <div className="flex justify-end mt-2">
                        <span className="text-xs text-gray-400">
                          {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Formatting toolbar */}
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
                    <p className="text-xs font-medium text-gray-400">WhatsApp Formatting</p>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'B', title: 'Bold', action: 'bold', className: 'font-bold' },
                        { label: 'I', title: 'Italic', action: 'italic', className: 'italic' },
                        { label: 'S', title: 'Strike', action: 'strike', className: 'line-through' },
                        { label: '</>', title: 'Mono', action: 'mono', className: 'font-mono' },
                      ].map(btn => (
                        <button
                          key={btn.action}
                          type="button"
                          onClick={() => insertFormatting(btn.action)}
                          title={btn.title}
                          className={`px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded border border-gray-600 text-sm transition-colors ${btn.className}`}
                        >
                          {btn.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {['👋', '😊', '🎉', '✅', '❤️', '🔥', '⭐', '💡', '📱', '🎁', '💰', '📢'].map(e => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => insertEmoji(e)}
                          className="w-8 h-8 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded border border-gray-600 text-base transition-colors"
                        >
                          {e}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => insertVariable('name')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                      >
                        {'{{'} name {'}}'}
                      </button>
                      <button
                        type="button"
                        onClick={() => insertVariable('phone')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                      >
                        {'{{'} phone {'}}'}
                      </button>
                    </div>
                  </div>

                  {/* Textarea */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5">
                      {formMediaType === 'text' ? 'Message Body *' : 'Caption (Optional)'}
                    </label>
                    <textarea
                      ref={textareaRef}
                      value={currentBody}
                      onChange={e =>
                        formMediaType === 'text'
                          ? setFormMessage(e.target.value)
                          : setFormCaption(e.target.value)
                      }
                      placeholder={
                        formMediaType === 'text'
                          ? 'Hello {{name}}! 👋\n\nWrite your message here...'
                          : 'Enter caption (optional). Use {{name}} for personalization.'
                      }
                      rows={formMediaType === 'text' ? 8 : 4}
                      className="w-full px-3 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-500 font-sans text-sm resize-none"
                    />
                    <p className="text-xs text-gray-500 text-right mt-1">{currentBody.length} / 4096</p>
                  </div>
                </>
              )}

              {formError && <p className="text-sm text-red-400">{formError}</p>}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={formLoading}
                  className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg text-sm transition-colors font-medium"
                >
                  {formLoading ? 'Saving...' : editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
