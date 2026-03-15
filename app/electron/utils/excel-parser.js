const XLSX = require('xlsx');
const path = require('path');

class ExcelParser {
  constructor(config = {}) {
    // Default country code for 10-digit numbers
    this.defaultCountryCode = config.defaultCountryCode || '91'; // India

    // Column name patterns for detection
    this.phoneColumnPatterns = [
      'phone',
      'mobile',
      'number',
      'whatsapp',
      'contact',
      'cell',
      'telephone',
    ];

    this.nameColumnPatterns = ['name', 'first name', 'contact name', 'full name'];
  }

  // Detect phone column
  detectPhoneColumn(headers) {
    const lowerHeaders = headers.map((h) =>
      h ? h.toString().toLowerCase().trim() : ''
    );

    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      for (const pattern of this.phoneColumnPatterns) {
        if (header.includes(pattern)) {
          return i;
        }
      }
    }

    // Default to first column if no match
    return 0;
  }

  // Detect name column
  detectNameColumn(headers) {
    const lowerHeaders = headers.map((h) =>
      h ? h.toString().toLowerCase().trim() : ''
    );

    for (let i = 0; i < lowerHeaders.length; i++) {
      const header = lowerHeaders[i];
      for (const pattern of this.nameColumnPatterns) {
        if (header.includes(pattern)) {
          return i;
        }
      }
    }

    // No name column found
    return null;
  }

  // Validate and clean phone number
  validatePhone(phoneValue) {
    if (!phoneValue) {
      return { valid: false, reason: 'Empty value' };
    }

    // Convert to string and trim
    let phone = String(phoneValue).trim();

    // Strip all non-numeric characters except leading +
    let cleaned = phone.replace(/[^\d+]/g, '');

    // Remove leading + if present
    if (cleaned.startsWith('+')) {
      cleaned = cleaned.substring(1);
    }

    // Check if it's all digits now
    if (!/^\d+$/.test(cleaned)) {
      return { valid: false, reason: 'Contains non-numeric characters' };
    }

    // Check length (10-15 digits is typical for phone numbers)
    if (cleaned.length < 10 || cleaned.length > 15) {
      return {
        valid: false,
        reason: `Invalid length: ${cleaned.length} digits`,
      };
    }

    // If 10 digits, assume default country code
    if (cleaned.length === 10) {
      cleaned = this.defaultCountryCode + cleaned;
    }

    return {
      valid: true,
      phone: cleaned,
    };
  }

  // Parse file
  parseFile(filePath) {
    try {
      // Get file extension
      const ext = path.extname(filePath).toLowerCase();

      if (!['.xlsx', '.xls', '.csv'].includes(ext)) {
        return {
          success: false,
          error: `Unsupported file type: ${ext}. Please use .xlsx, .xls, or .csv`,
        };
      }

      // Read file
      const workbook = XLSX.readFile(filePath);

      // Get first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (data.length === 0) {
        return {
          success: false,
          error: 'File is empty',
        };
      }

      // Extract headers (first row)
      const headers = data[0];

      // Detect columns
      const phoneColIndex = this.detectPhoneColumn(headers);
      const nameColIndex = this.detectNameColumn(headers);

      console.log('Phone column index:', phoneColIndex);
      console.log('Name column index:', nameColIndex);

      // Parse rows
      const numbers = [];
      const errors = [];
      const seen = new Set(); // For deduplication

      // Start from row 1 (skip header)
      for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
        const row = data[rowIndex];

        // Skip empty rows
        if (!row || row.length === 0 || row.every((cell) => !cell)) {
          continue;
        }

        const phoneValue = row[phoneColIndex];
        const nameValue = nameColIndex !== null ? row[nameColIndex] : '';

        // Validate phone
        const validation = this.validatePhone(phoneValue);

        if (!validation.valid) {
          errors.push({
            row: rowIndex + 1, // Excel row number (1-indexed)
            value: phoneValue,
            reason: validation.reason,
          });
          continue;
        }

        const phone = validation.phone;

        // Check for duplicates
        if (seen.has(phone)) {
          errors.push({
            row: rowIndex + 1,
            value: phoneValue,
            reason: 'Duplicate number',
          });
          continue;
        }

        seen.add(phone);

        // Add to numbers array
        numbers.push({
          phone,
          name: nameValue ? String(nameValue).trim() : '',
        });
      }

      return {
        success: true,
        numbers,
        errors,
        totalRows: data.length - 1, // Exclude header
        validRows: numbers.length,
        invalidRows: errors.length,
        sheetName,
      };
    } catch (error) {
      console.error('Error parsing file:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Update default country code
  setDefaultCountryCode(code) {
    this.defaultCountryCode = code;
  }
}

module.exports = ExcelParser;
