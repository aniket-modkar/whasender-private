const { getDatabase } = require('../database/db');

class ContactsManager {
  // Add a single contact
  addContact({ phone, name = '', tags = [] }) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO contacts (phone, name, tags, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(phone) DO UPDATE SET
          name = COALESCE(excluded.name, name),
          tags = excluded.tags,
          updated_at = datetime('now')
      `);

      const result = stmt.run(phone, name || '', JSON.stringify(tags));

      return {
        success: true,
        contactId: result.lastInsertRowid,
      };
    } catch (error) {
      console.error('Error adding contact:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Import multiple contacts (bulk insert)
  importContacts(contacts) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        INSERT INTO contacts (phone, name, tags, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(phone) DO UPDATE SET
          name = COALESCE(excluded.name, name),
          tags = excluded.tags,
          updated_at = datetime('now')
      `);

      let imported = 0;
      let updated = 0;
      let errors = [];

      const transaction = db.transaction(() => {
        for (const contact of contacts) {
          try {
            const result = stmt.run(
              contact.phone,
              contact.name || '',
              JSON.stringify(contact.tags || [])
            );

            if (result.changes > 0) {
              if (result.lastInsertRowid) {
                imported++;
              } else {
                updated++;
              }
            }
          } catch (err) {
            errors.push({ phone: contact.phone, error: err.message });
          }
        }
      });

      transaction();

      console.log(`Imported ${imported} new contacts, updated ${updated} existing contacts`);

      return {
        success: true,
        imported,
        updated,
        errors,
        total: contacts.length,
      };
    } catch (error) {
      console.error('Error importing contacts:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get all contacts with pagination and search
  getContacts({ limit = 100, offset = 0, search = '', tags = [] }) {
    try {
      const db = getDatabase();

      let query = 'SELECT * FROM contacts WHERE 1=1';
      const params = [];

      // Add search filter
      if (search) {
        query += ' AND (phone LIKE ? OR name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      // Add tags filter
      if (tags.length > 0) {
        const tagConditions = tags.map(() => 'tags LIKE ?').join(' OR ');
        query += ` AND (${tagConditions})`;
        tags.forEach(tag => params.push(`%"${tag}"%`));
      }

      // Get total count
      const countStmt = db.prepare(query.replace('SELECT *', 'SELECT COUNT(*) as count'));
      const countResult = countStmt.get(...params);
      const total = countResult.count;

      // Get paginated results
      query += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const stmt = db.prepare(query);
      const contacts = stmt.all(...params);

      // Parse tags JSON
      const parsedContacts = contacts.map(contact => ({
        ...contact,
        tags: contact.tags ? JSON.parse(contact.tags) : [],
      }));

      return {
        success: true,
        contacts: parsedContacts,
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting contacts:', error);
      return {
        success: false,
        error: error.message,
        contacts: [],
        total: 0,
      };
    }
  }

  // Get contact by ID
  getContact(id) {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT * FROM contacts WHERE id = ?');
      const contact = stmt.get(id);

      if (!contact) {
        return { success: false, error: 'Contact not found' };
      }

      return {
        success: true,
        contact: {
          ...contact,
          tags: contact.tags ? JSON.parse(contact.tags) : [],
        },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update contact
  updateContact(id, { name, tags }) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(`
        UPDATE contacts
        SET name = ?, tags = ?, updated_at = datetime('now')
        WHERE id = ?
      `);

      stmt.run(name || '', JSON.stringify(tags || []), id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete contact
  deleteContact(id) {
    try {
      const db = getDatabase();
      const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
      stmt.run(id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete multiple contacts
  deleteContacts(ids) {
    try {
      const db = getDatabase();
      const placeholders = ids.map(() => '?').join(',');
      const stmt = db.prepare(`DELETE FROM contacts WHERE id IN (${placeholders})`);
      stmt.run(...ids);

      return { success: true, deleted: ids.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get contact count
  getContactCount() {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT COUNT(*) as count FROM contacts');
      const result = stmt.get();

      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error.message, count: 0 };
    }
  }

  // Get all unique tags
  getAllTags() {
    try {
      const db = getDatabase();
      const stmt = db.prepare('SELECT DISTINCT tags FROM contacts WHERE tags IS NOT NULL AND tags != "[]"');
      const results = stmt.all();

      const tagsSet = new Set();
      results.forEach(row => {
        const tags = JSON.parse(row.tags);
        tags.forEach(tag => tagsSet.add(tag));
      });

      return {
        success: true,
        tags: Array.from(tagsSet).sort(),
      };
    } catch (error) {
      return { success: false, error: error.message, tags: [] };
    }
  }

  // Export contacts to array format (for task creation)
  exportContacts(ids = []) {
    try {
      const db = getDatabase();

      let query = 'SELECT phone, name FROM contacts';
      const params = [];

      if (ids.length > 0) {
        const placeholders = ids.map(() => '?').join(',');
        query += ` WHERE id IN (${placeholders})`;
        params.push(...ids);
      }

      const stmt = db.prepare(query);
      const contacts = stmt.all(...params);

      return {
        success: true,
        contacts,
      };
    } catch (error) {
      return { success: false, error: error.message, contacts: [] };
    }
  }
}

module.exports = new ContactsManager();
