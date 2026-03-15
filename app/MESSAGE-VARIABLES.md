# Message Variables

WhaSender now supports dynamic variables in your message templates that get replaced with actual contact information when sending messages.

## Supported Variables

### Name Variables
- `{{name}}` - Contact's name (double curly braces)
- `{name}` - Contact's name (single curly braces)

### Phone Variables
- `{{phone}}` - Contact's phone number (double curly braces)
- `{phone}` - Contact's phone number (single curly braces)

## Usage Examples

### Example 1: Using Name
```
Hi {{name}}, hope you're doing well! We have a special offer for you.
```

**Result:**
```
Hi John Doe, hope you're doing well! We have a special offer for you.
```

### Example 2: Using Phone
```
Dear customer, your registered number is {{phone}}. Please confirm if this is correct.
```

**Result:**
```
Dear customer, your registered number is +1234567890. Please confirm if this is correct.
```

### Example 3: Combining Variables
```
Hello {{name}}, we're reaching out to you at {{phone}} regarding your recent inquiry.
```

**Result:**
```
Hello Jane Smith, we're reaching out to you at +9876543210 regarding your recent inquiry.
```

### Example 4: Using Single Curly Braces
```
Hi {name}, thanks for contacting us from {phone}!
```

**Result:**
```
Hi Mike Johnson, thanks for contacting us from +1112223333!
```

## Important Notes

1. **Both Formats Work**: You can use either `{{variable}}` (double curly braces) or `{variable}` (single curly braces). They both work the same way.

2. **Case Insensitive**: Variable names are case-insensitive, so `{{Name}}`, `{{NAME}}`, and `{{name}}` all work the same.

3. **Missing Data**: If a contact doesn't have a name or phone number in the CSV file, the variable will be replaced with an empty string (removed from the message).

4. **Whitespace Cleanup**: Extra spaces left behind after variable replacement are automatically cleaned up.

## CSV Format

Your CSV file should have columns matching the variables:

```csv
phone,name
+1234567890,John Doe
+9876543210,Jane Smith
+1112223333,Mike Johnson
```

## Before the Fix

Previously, only `{name}` (single curly braces) was supported. If you used `{{name}}` (double curly braces), it would not be replaced and might show as `{User name}` or remain as `{{name}}` in the message.

## After the Fix

Now both formats are supported:
- `{{name}}` → Replaced with contact name
- `{name}` → Replaced with contact name
- `{{phone}}` → Replaced with phone number
- `{phone}` → Replaced with phone number

## Additional Features

WhaSender also adds:
1. **Random Greetings**: Optionally prepends greetings like "Hi", "Hello", "Hey" to make messages more natural
2. **Invisible Variation**: Adds zero-width characters to make each message unique (anti-ban feature)

These features work together with variable replacement to create personalized, unique messages for each contact.
