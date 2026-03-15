# Build Resources

This directory contains resources needed for building the application.

## Icons Required

You need to provide the following icon files before building:

### macOS
- **icon.icns** - macOS icon file (512x512 minimum)
  - Create using: `iconutil` or online tools like https://cloudconvert.com/png-to-icns
  - Place at: `build/icon.icns`

### Windows
- **icon.ico** - Windows icon file (256x256 recommended)
  - Create using: ImageMagick, GIMP, or online tools like https://convertio.co/png-ico/
  - Place at: `build/icon.ico`

### Linux
- **icons/** - PNG icons in various sizes
  - Required sizes: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512
  - Name format: `16x16.png`, `32x32.png`, etc.
  - Place in: `build/icons/`

## Creating Icons

1. Start with a high-resolution logo (at least 1024x1024 PNG)
2. Use an online tool or design software to create icon files
3. Place the generated files in this directory

## Temporary Solution

For testing builds without custom icons, electron-builder will use default Electron icons.
However, for production releases, you should create proper branded icons.

## Build Commands

After adding icons:
- macOS: `npm run build:mac`
- Windows: `npm run build:win`
- Linux: `npm run build:linux`
- All platforms: `npm run build:all`
