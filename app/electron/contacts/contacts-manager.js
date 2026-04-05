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
          name = CASE WHEN excluded.name != '' THEN excluded.name ELSE name END,
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

  // Import multiple contacts — returns newContacts (truly new) + duplicates (already existed)
  importContacts(contacts) {
    try {
      const db = getDatabase();

      const checkStmt = db.prepare('SELECT id FROM contacts WHERE phone = ?');
      const upsertStmt = db.prepare(`
        INSERT INTO contacts (phone, name, tags, updated_at)
        VALUES (?, ?, ?, datetime('now'))
        ON CONFLICT(phone) DO UPDATE SET
          name = CASE WHEN excluded.name != '' THEN excluded.name ELSE name END,
          updated_at = datetime('now')
      `);

      let newContacts = 0;
      let duplicates = 0;
      let errors = [];

      const transaction = db.transaction(() => {
        for (const contact of contacts) {
          try {
            const existing = checkStmt.get(contact.phone);
            if (existing) {
              duplicates++;
            } else {
              newContacts++;
            }
            upsertStmt.run(
              contact.phone,
              contact.name || '',
              JSON.stringify(contact.tags || [])
            );
          } catch (err) {
            errors.push({ phone: contact.phone, error: err.message });
          }
        }
      });

      transaction();

      console.log(`Imported ${newContacts} new, ${duplicates} duplicates`);

      return {
        success: true,
        newContacts,
        duplicates,
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

  // Get contacts with pagination and search — sorted by id ASC for consistent serial numbers
  getContacts({ limit = 50, offset = 0, search = '', groupId = null } = {}) {
    try {
      const db = getDatabase();

      let query = 'SELECT c.* FROM contacts c';
      const params = [];

      if (groupId) {
        query += ' INNER JOIN contact_group_members m ON c.id = m.contact_id AND m.group_id = ?';
        params.push(groupId);
      }

      query += ' WHERE 1=1';

      if (search) {
        query += ' AND (c.phone LIKE ? OR c.name LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      const countStmt = db.prepare(query.replace('SELECT c.*', 'SELECT COUNT(*) as count'));
      const countResult = countStmt.get(...params);
      const total = countResult.count;

      query += ' ORDER BY c.id ASC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const contacts = db.prepare(query).all(...params);

      return {
        success: true,
        contacts: contacts.map(c => ({
          ...c,
          tags: c.tags ? JSON.parse(c.tags) : [],
        })),
        total,
        limit,
        offset,
      };
    } catch (error) {
      console.error('Error getting contacts:', error);
      return { success: false, error: error.message, contacts: [], total: 0 };
    }
  }

  // Get contact by ID
  getContact(id) {
    try {
      const db = getDatabase();
      const contact = db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);

      if (!contact) return { success: false, error: 'Contact not found' };

      return {
        success: true,
        contact: { ...contact, tags: contact.tags ? JSON.parse(contact.tags) : [] },
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Update contact
  updateContact(id, { name, tags }) {
    try {
      const db = getDatabase();
      db.prepare(`
        UPDATE contacts SET name = ?, tags = ?, updated_at = datetime('now') WHERE id = ?
      `).run(name || '', JSON.stringify(tags || []), id);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete contact
  deleteContact(id) {
    try {
      getDatabase().prepare('DELETE FROM contacts WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Delete multiple contacts
  deleteContacts(ids) {
    try {
      const placeholders = ids.map(() => '?').join(',');
      getDatabase().prepare(`DELETE FROM contacts WHERE id IN (${placeholders})`).run(...ids);
      return { success: true, deleted: ids.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get total contact count
  getContactCount() {
    try {
      const result = getDatabase().prepare('SELECT COUNT(*) as count FROM contacts').get();
      return { success: true, count: result.count };
    } catch (error) {
      return { success: false, error: error.message, count: 0 };
    }
  }

  // Get all unique tags
  getAllTags() {
    try {
      const results = getDatabase()
        .prepare('SELECT DISTINCT tags FROM contacts WHERE tags IS NOT NULL AND tags != "[]"')
        .all();

      const tagsSet = new Set();
      results.forEach(row => {
        JSON.parse(row.tags).forEach(tag => tagsSet.add(tag));
      });

      return { success: true, tags: Array.from(tagsSet).sort() };
    } catch (error) {
      return { success: false, error: error.message, tags: [] };
    }
  }

  // Export contacts as snapshot for task creation (ordered by id ASC)
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

      query += ' ORDER BY id ASC';

      return { success: true, contacts: db.prepare(query).all(...params) };
    } catch (error) {
      return { success: false, error: error.message, contacts: [] };
    }
  }

  // ─── Groups ───────────────────────────────────────────────────────────────

  createGroup({ name, description = '' }) {
    try {
      const result = getDatabase()
        .prepare('INSERT INTO contact_groups (name, description) VALUES (?, ?)')
        .run(name, description);

      return { success: true, groupId: result.lastInsertRowid };
    } catch (error) {
      if (error.message.includes('UNIQUE'))
        return { success: false, error: 'A group with this name already exists' };
      return { success: false, error: error.message };
    }
  }

  getGroups() {
    try {
      const groups = getDatabase().prepare(`
        SELECT g.*, COUNT(m.contact_id) as member_count
        FROM contact_groups g
        LEFT JOIN contact_group_members m ON g.id = m.group_id
        GROUP BY g.id
        ORDER BY g.name ASC
      `).all();

      return { success: true, groups };
    } catch (error) {
      return { success: false, error: error.message, groups: [] };
    }
  }

  updateGroup(id, { name, description }) {
    try {
      getDatabase().prepare(`
        UPDATE contact_groups SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?
      `).run(name, description || '', id);

      return { success: true };
    } catch (error) {
      if (error.message.includes('UNIQUE'))
        return { success: false, error: 'A group with this name already exists' };
      return { success: false, error: error.message };
    }
  }

  deleteGroup(id) {
    try {
      getDatabase().prepare('DELETE FROM contact_groups WHERE id = ?').run(id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  addContactsToGroup(groupId, contactIds) {
    try {
      const db = getDatabase();
      const stmt = db.prepare(
        'INSERT OR IGNORE INTO contact_group_members (group_id, contact_id) VALUES (?, ?)'
      );
      db.transaction(() => {
        for (const id of contactIds) stmt.run(groupId, id);
      })();

      return { success: true, added: contactIds.length };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  removeContactsFromGroup(groupId, contactIds) {
    try {
      const placeholders = contactIds.map(() => '?').join(',');
      getDatabase()
        .prepare(
          `DELETE FROM contact_group_members WHERE group_id = ? AND contact_id IN (${placeholders})`
        )
        .run(groupId, ...contactIds);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getContactsByGroup(groupId) {
    try {
      const db = getDatabase();
      const contacts = db.prepare(`
        SELECT c.* FROM contacts c
        INNER JOIN contact_group_members m ON c.id = m.contact_id
        WHERE m.group_id = ?
        ORDER BY c.id ASC
      `).all(groupId);

      return {
        success: true,
        contacts: contacts.map(c => ({ ...c, tags: c.tags ? JSON.parse(c.tags) : [] })),
      };
    } catch (error) {
      return { success: false, error: error.message, contacts: [] };
    }
  }
}

module.exports = new ContactsManager();
