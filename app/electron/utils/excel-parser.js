const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

class ExcelParser {
  constructor(config = {}) {
    this.defaultCountryCode = config.defaultCountryCode || '91'; // India

    this.phoneColumnPatterns = [
      'phone',
      'mobile',
      'number',
      'whatsapp',
      'contact',
      'cell',
      'telephone',
      'tel',
    ];

    this.nameColumnPatterns = [
      'name',
      'first name',
      'given name',
      'contact name',
      'full name',
      'display name',
    ];
  }

  detectPhoneColumn(headers) {
    const lowerHeaders = headers.map(h => (h ? h.toString().toLowerCase().trim() : ''));
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      for (const pattern of this.phoneColumnPatterns) {
        if (header.includes(pattern)) return i;
      }
    }
    return 0;
  }

  detectNameColumn(headers) {
    const lowerHeaders = headers.map(h => (h ? h.toString().toLowerCase().trim() : ''));
    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      for (const pattern of this.nameColumnPatterns) {
        if (header.includes(pattern)) return i;
      }
    }
    return null;
  }

  validatePhone(phoneValue) {
    if (!phoneValue) return { valid: false, reason: 'Empty value' };

    let phone = String(phoneValue).trim();
    let cleaned = phone.replace(/[^\d+]/g, '');

    if (cleaned.startsWith('+')) cleaned = cleaned.substring(1);

    if (!/^\d+$/.test(cleaned)) return { valid: false, reason: 'Contains non-numeric characters' };

    if (cleaned.length < 10 || cleaned.length > 15) {
      return { valid: false, reason: `Invalid length: ${cleaned.length} digits` };
    }

    if (cleaned.length === 10) cleaned = this.defaultCountryCode + cleaned;

    return { valid: true, phone: cleaned };
  }

  // Parse VCF (vCard) file — exported from iPhone, Android, WhatsApp
  parseVcf(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const blocks = content.split(/END:VCARD/i).filter(b => b.trim());

      const numbers = [];
      const errors = [];
      const seen = new Set();

      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];

        // Extract name — prefer FN, fall back to N
        let name = '';
        const fnMatch = block.match(/^FN[;:](.+)$/m);
        if (fnMatch) {
          name = fnMatch[1].trim().replace(/\\,/g, ',');
        } else {
          const nMatch = block.match(/^N[;:](.+)$/m);
          if (nMatch) {
            const parts = nMatch[1].split(';');
            name = [parts[1], parts[0]].filter(Boolean).join(' ').trim();
          }
        }

        // Extract all TEL entries
        const telLines = block.match(/^TEL[^:]*:(.+)$/gm);
        if (!telLines) continue;

        let added = false;
        for (const telLine of telLines) {
          const phoneValue = telLine.replace(/^TEL[^:]*:/i, '').trim();
          const validation = this.validatePhone(phoneValue);

          if (!validation.valid) {
            errors.push({ row: i + 1, value: phoneValue, reason: validation.reason });
            continue;
          }

          const phone = validation.phone;
          if (seen.has(phone)) {
            errors.push({ row: i + 1, value: phoneValue, reason: 'Duplicate number' });
            continue;
          }

          seen.add(phone);
          numbers.push({ phone, name: name || '' });
          added = true;
          break; // one entry per contact
        }

        if (!added && telLines.length > 0) {
          // all phones were invalid/duplicate for this contact — already pushed to errors
        }
      }

      return {
        success: true,
        numbers,
        errors,
        totalRows: blocks.length,
        validRows: numbers.length,
        invalidRows: errors.length,
        sheetName: 'VCF Import',
      };
    } catch (error) {
      console.error('Error parsing VCF:', error);
      return { success: false, error: error.message };
    }
  }

  // Parse Excel / CSV file
  parseSpreadsheet(filePath) {
    try {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length === 0) return { success: false, error: 'File is empty' };

      const headers = data[0];
      const phoneColIndex = this.detectPhoneColumn(headers);
      const nameColIndex = this.detectNameColumn(headers);

      console.log('Phone column index:', phoneColIndex, '| Name column index:', nameColIndex);

      const numbers = [];
      const errors = [];
      const seen = new Set();

      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];
        if (!row || row.length === 0 || row.every(cell => !cell)) continue;

        const phoneValue = row[phoneColIndex];
        const nameValue = nameColIndex !== null ? row[nameColIndex] : '';

        const validation = this.validatePhone(phoneValue);

        if (!validation.valid) {
          errors.push({ row: rowIndex + 1, value: phoneValue, reason: validation.reason });
          continue;
        }

        const phone = validation.phone;

        if (seen.has(phone)) {
          errors.push({ row: rowIndex + 1, value: phoneValue, reason: 'Duplicate number' });
          continue;
        }

        seen.add(phone);
        numbers.push({ phone, name: nameValue ? String(nameValue).trim() : '' });
      }

      return {
        success: true,
        numbers,
        errors,
        totalRows: data.length - 1,
        validRows: numbers.length,
        invalidRows: errors.length,
        sheetName,
      };
    } catch (error) {
      console.error('Error parsing spreadsheet:', error);
      return { success: false, error: error.message };
    }
  }

  parseFile(filePath) {
    try {
      const ext = path.extname(filePath).toLowerCase();

      if (ext === '.vcf') return this.parseVcf(filePath);

      if (['.xlsx', '.xls', '.csv'].includes(ext)) return this.parseSpreadsheet(filePath);

      return {
        success: false,
        error: `Unsupported file type: ${ext}. Please use .xlsx, .xls, .csv, or .vcf`,
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      return { success: false, error: error.message };
    }
  }

  setDefaultCountryCode(code) {
    this.defaultCountryCode = code;
  }
}

module.exports = ExcelParser;
