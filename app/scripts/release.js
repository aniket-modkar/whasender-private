#!/usr/bin/env node

/**
 * Release Helper Script
 * Helps manage version bumps and releases
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const args = process.argv.slice(2);
const command = args[0];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getCurrentVersion() {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

function setVersion(newVersion) {
  const packagePath = path.join(__dirname, '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  packageJson.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  log(`✓ Updated version to ${newVersion}`, 'green');
}

function bumpVersion(type) {
  const currentVersion = getCurrentVersion();
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      break;
    case 'patch':
      newVersion = `${major}.${minor}.${patch + 1}`;
      break;
    default:
      log(`Invalid version type: ${type}`, 'red');
      log('Use: major, minor, or patch', 'yellow');
      process.exit(1);
  }

  log(`\n${colors.bright}Version Bump${colors.reset}`, 'cyan');
  log(`Current: ${currentVersion}`, 'yellow');
  log(`New:     ${newVersion}`, 'green');

  setVersion(newVersion);
  return newVersion;
}

function buildApp(platform) {
  log(`\n${colors.bright}Building for ${platform}...${colors.reset}`, 'cyan');

  try {
    execSync(`npm run build:${platform}`, { stdio: 'inherit' });
    log(`✓ Build complete for ${platform}`, 'green');
  } catch (error) {
    log(`✗ Build failed for ${platform}`, 'red');
    process.exit(1);
  }
}

function showHelp() {
  log(`
${colors.bright}WhaSender Release Helper${colors.reset}

${colors.cyan}Usage:${colors.reset}
  node scripts/release.js <command> [options]

${colors.cyan}Commands:${colors.reset}

  ${colors.green}version${colors.reset}
    Show current version

  ${colors.green}bump <type>${colors.reset}
    Bump version number
    Types: major | minor | patch
    Example: node scripts/release.js bump patch

  ${colors.green}build <platform>${colors.reset}
    Build for specific platform
    Platforms: mac | win | linux | all
    Example: node scripts/release.js build mac

  ${colors.green}release <type> <platform>${colors.reset}
    Bump version and build
    Example: node scripts/release.js release patch mac

  ${colors.green}publish <platform>${colors.reset}
    Build and publish to GitHub
    Example: node scripts/release.js publish mac

  ${colors.green}help${colors.reset}
    Show this help message

${colors.cyan}Examples:${colors.reset}

  # Bump patch version (1.0.0 → 1.0.1)
  node scripts/release.js bump patch

  # Build for macOS
  node scripts/release.js build mac

  # Bump version and build
  node scripts/release.js release minor mac

  # Build and publish to GitHub
  node scripts/release.js publish mac

${colors.cyan}Prerequisites:${colors.reset}

  ✓ Set GH_TOKEN environment variable for publishing
  ✓ Configure GitHub repo in package.json
  ✓ Commit all changes before releasing

${colors.cyan}Version Types:${colors.reset}

  major: Breaking changes (1.0.0 → 2.0.0)
  minor: New features    (1.0.0 → 1.1.0)
  patch: Bug fixes       (1.0.0 → 1.0.1)
`, 'reset');
}

function checkGitStatus() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' });
    if (status.trim()) {
      log('\n⚠️  Warning: You have uncommitted changes', 'yellow');
      log('Consider committing before releasing\n', 'yellow');
      return false;
    }
    return true;
  } catch (error) {
    log('Git not available or not a git repository', 'yellow');
    return false;
  }
}

function checkGHToken() {
  if (!process.env.GH_TOKEN) {
    log('\n⚠️  Warning: GH_TOKEN not set', 'yellow');
    log('Publishing to GitHub requires GH_TOKEN environment variable', 'yellow');
    log('Set it with: export GH_TOKEN="your_github_token"\n', 'yellow');
    return false;
  }
  return true;
}

function publish(platform) {
  log(`\n${colors.bright}Publishing ${platform} to GitHub...${colors.reset}`, 'cyan');

  if (!checkGHToken()) {
    log('✗ Cannot publish without GH_TOKEN', 'red');
    process.exit(1);
  }

  try {
    const version = getCurrentVersion();
    log(`Publishing version ${version}`, 'cyan');

    // Build and publish
    const publishCmd = platform === 'all'
      ? 'npx electron-builder -mwl --publish always'
      : `npx electron-builder --${platform} --publish always`;

    execSync(publishCmd, { stdio: 'inherit' });

    log(`\n✓ Published ${platform} successfully!`, 'green');
    log(`\nView release at: https://github.com/YOUR-USERNAME/whasender/releases/v${version}`, 'cyan');
  } catch (error) {
    log('✗ Publish failed', 'red');
    process.exit(1);
  }
}

function release(type, platform) {
  log(`\n${colors.bright}Creating Release${colors.reset}`, 'cyan');

  // Check git status
  checkGitStatus();

  // Bump version
  const newVersion = bumpVersion(type);

  // Build
  buildApp(platform);

  log(`\n${colors.green}✓ Release ${newVersion} built successfully!${colors.reset}`);
  log(`\n${colors.cyan}Next steps:${colors.reset}`);
  log('1. Review the build in release/ folder', 'yellow');
  log('2. Test the built application', 'yellow');
  log('3. Commit version change: git add . && git commit -m "Release v' + newVersion + '"', 'yellow');
  log('4. Publish to GitHub: node scripts/release.js publish ' + platform, 'yellow');
}

// Main command handler
switch (command) {
  case 'version':
    log(`Current version: ${getCurrentVersion()}`, 'green');
    break;

  case 'bump':
    if (!args[1]) {
      log('Please specify version type: major, minor, or patch', 'red');
      process.exit(1);
    }
    bumpVersion(args[1]);
    break;

  case 'build':
    if (!args[1]) {
      log('Please specify platform: mac, win, linux, or all', 'red');
      process.exit(1);
    }
    buildApp(args[1]);
    break;

  case 'release':
    if (!args[1] || !args[2]) {
      log('Usage: node scripts/release.js release <type> <platform>', 'red');
      log('Example: node scripts/release.js release patch mac', 'yellow');
      process.exit(1);
    }
    release(args[1], args[2]);
    break;

  case 'publish':
    if (!args[1]) {
      log('Please specify platform: mac, win, linux, or all', 'red');
      process.exit(1);
    }
    publish(args[1]);
    break;

  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;

  default:
    log('Unknown command. Use "help" to see available commands.', 'red');
    log('Example: node scripts/release.js help', 'yellow');
    process.exit(1);
}
