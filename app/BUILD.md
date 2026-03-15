# Building and Distribution Guide

This guide explains how to build and distribute WhaSender for different platforms.

## Prerequisites

1. **Icons**: Add icon files to the `build/` directory (see `build/README.md`)
2. **Code Signing Certificates** (for production):
   - macOS: Apple Developer Certificate
   - Windows: Code signing certificate from a trusted CA

## Building the Application

### Build for Current Platform

```bash
# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win

# Build for Linux
npm run build:linux
```

### Build for All Platforms

```bash
npm run build:all
```

**Note**: Cross-platform building has limitations:
- macOS can build for all platforms
- Windows can build for Windows and Linux
- Linux can build for Linux and Windows

### Build Outputs

Builds are created in the `release/` directory:

**macOS**:
- `WhaSender-{version}.dmg` - Installer
- `WhaSender-{version}-mac.zip` - Portable version

**Windows**:
- `WhaSender Setup {version}.exe` - Installer
- `WhaSender {version}.exe` - Portable version

**Linux**:
- `WhaSender-{version}.AppImage` - Universal Linux package
- `whasender_{version}_amd64.deb` - Debian/Ubuntu package

## Auto-Update System

### How It Works

1. App checks for updates on startup (after 5 seconds)
2. Periodic checks every 6 hours
3. When update found:
   - User is notified
   - Can download update manually
   - Update installed on next app restart

### Setting Up GitHub Releases

The auto-updater uses GitHub Releases to distribute updates.

#### 1. Update `package.json`

Update the `publish` section with your GitHub details:

```json
"build": {
  "publish": {
    "provider": "github",
    "owner": "your-github-username",
    "repo": "whasender"
  }
}
```

#### 2. Create GitHub Token

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens
2. Generate new token with `repo` scope
3. Set environment variable:

```bash
export GH_TOKEN="your_github_token_here"
```

#### 3. Build and Publish

```bash
# Build and publish release
npm run build:mac -- --publish always
npm run build:win -- --publish always
npm run build:linux -- --publish always
```

#### 4. Create GitHub Release

1. Tag the version: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. electron-builder will create a draft release
4. Edit the release notes and publish

### Version Numbering

Follow semantic versioning (semver):
- **Major** (1.0.0): Breaking changes
- **Minor** (1.1.0): New features, backwards compatible
- **Patch** (1.0.1): Bug fixes

Update version in `package.json`:

```bash
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.0 → 1.1.0
npm version major  # 1.0.0 → 2.0.0
```

## Code Signing

### macOS

1. Get Apple Developer Certificate
2. Set environment variables:

```bash
export APPLE_ID="your@email.com"
export APPLE_ID_PASSWORD="app-specific-password"
export CSC_LINK="/path/to/certificate.p12"
export CSC_KEY_PASSWORD="certificate-password"
```

3. Build with signing:

```bash
npm run build:mac
```

### Windows

1. Get code signing certificate (.pfx or .p12)
2. Set environment variables:

```bash
export CSC_LINK="/path/to/certificate.pfx"
export CSC_KEY_PASSWORD="certificate-password"
```

3. Build with signing:

```bash
npm run build:win
```

## Testing Builds Locally

Before publishing, test the built application:

### macOS
```bash
open release/mac/WhaSender.app
```

### Windows
```bash
start release/WhaSender.exe
```

### Linux
```bash
./release/WhaSender-{version}.AppImage
```

## Distribution Channels

### Direct Download
- Upload builds to your website
- Users download and install manually

### GitHub Releases (Recommended)
- Free hosting
- Automatic update delivery
- Version management

### App Stores
- **Mac App Store**: Requires additional configuration
- **Microsoft Store**: Requires APPX/MSIX format
- **Snap Store** (Linux): Additional packaging needed

## Build Configuration

Key settings in `package.json` → `build`:

- `appId`: Unique application identifier
- `productName`: Display name
- `files`: Which files to include in build
- `extraResources`: Additional resources (migrations, etc.)
- `mac/win/linux`: Platform-specific settings

## Troubleshooting

### "Build failed" errors
- Ensure all dependencies are installed: `npm install`
- Rebuild native modules: `npm run postinstall`

### Missing icons
- Add required icons to `build/` directory
- See `build/README.md` for details

### Auto-update not working
- Check GitHub token is valid
- Ensure `publish` config is correct
- Verify GitHub Release is published (not draft)

### Code signing issues
- Verify certificate is valid
- Check environment variables are set
- macOS: Run `security find-identity -v -p codesigning`

## Production Checklist

Before releasing v1.0.0:

- [ ] Add proper application icons
- [ ] Update `package.json` author and description
- [ ] Set up GitHub repository
- [ ] Create GitHub token for releases
- [ ] Test build on all target platforms
- [ ] Set up code signing (optional but recommended)
- [ ] Create initial GitHub release
- [ ] Test auto-update functionality
- [ ] Update README with download links

## Support

For electron-builder documentation:
https://www.electron.build/

For electron-updater documentation:
https://www.electron.build/auto-update
