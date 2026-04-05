const { getDatabase } = require('../database/db');

class TemplatesManager {
  createTemplate({ name, mediaType = 'text', messageBody = '', mediaPath = null, mediaFilename = null, mediaSize = null, mediaCaption = '' }) {
    try {
      const result = getDatabase().prepare(`
        INSERT INTO templates (name, media_type, message_body, media_path, media_filename, media_size, media_caption)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(name, mediaType, messageBody, mediaPath, mediaFilename, mediaSize, mediaCaption);

      return { success: true, templateId: result.lastInsertRowid };
    } catch (error) {
      if (error.message.includes('UNIQUE'))
        return { success: false, error: 'A template with this name already exists' };
      return { success: false, error: error.message };
    }
  }

  getTemplates() {
    try {
      const templates = getDatabase()
        .prepare('SELECT * FROM templates ORDER BY updated_at DESC')
        .all();
      return { success: true, templates };
    } catch (error) {
      return { success: false, error: error.message, templates: [] };
    }
  }

  getTemplate(id) {
    try {
      const template = getDatabase().prepare('SELECT * FROM templates WHERE id = ?').get(id);
      if (!template) return { success: false, error: 'Template not found' };
      return { success: true, template };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  updateTemplate(id, { name, mediaType, messageBody, mediaPath, mediaFilename, mediaSize, mediaCaption }) {
    try {
      getDatabase().prepare(`
        UPDATE templates SET
          name = ?, media_type = ?, message_body = ?,
          media_path = ?, media_filename = ?, media_size = ?,
          media_caption = ?, updated_at = datetime('now')
        WHERE id = ?
      `).run(name, mediaType, messageBody || '', mediaPath, mediaFilename, mediaSize, mediaCaption || '', id);

      return { success: true };
    } catch (error) {
      if (error.message.includes('UNIQUE'))
        return { success: false, error: 'A template with this name already exists' };
      return { success: false, error: error.message };
    }
  }

  deleteTemplate(id) {
    try {
      getDatabase().prepare('DELETE FROM templates WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TemplatesManager();
