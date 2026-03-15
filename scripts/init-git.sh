#!/bin/bash

# WhaSender - Git Repository Initialization Script
# This script helps you set up your Git repository for the first time

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║         WhaSender - Git Repository Initialization              ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "app" ] || [ ! -d "auth-server" ]; then
    echo -e "${RED}❌ Error: This script must be run from the whasender root directory${NC}"
    exit 1
fi

echo -e "${CYAN}📁 Current directory: $(pwd)${NC}"
echo ""

# Check if git is already initialized
if [ -d ".git" ]; then
    echo -e "${YELLOW}⚠️  Git is already initialized in this directory${NC}"
    echo ""
    read -p "Do you want to continue and update the configuration? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 1: Create .gitignore${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json

# Build outputs
app/dist/
app/release/
app/out/
admin-portal/client/dist/
admin-portal/client/.next/
admin-portal/client/out/

# Environment files
.env
.env.local
.env.production
.env.development
*.env
!.env.example

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.project
.settings/

# Database files
*.sqlite
*.sqlite-shm
*.sqlite-wal
*.db
*.db-journal

# WhatsApp session files
auth-session/
WhatsApp/
.wwebjs_auth/
.wwebjs_cache/
baileys_store/
baileys_auth_info/

# Electron
app/electron-builder.yml

# Testing
coverage/
.nyc_output/

# Temporary
tmp/
temp/
*.tmp
*.bak
*.backup

# Mac
.AppleDouble
.LSOverride

# Windows
desktop.ini
$RECYCLE.BIN/

# Linux
.directory
.Trash-*
EOF

echo -e "${GREEN}✅ Created .gitignore${NC}"
echo ""

# Initialize git if not already done
if [ ! -d ".git" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}Step 2: Initialize Git Repository${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    git init
    echo -e "${GREEN}✅ Initialized Git repository${NC}"
    echo ""
else
    echo -e "${GREEN}✅ Git already initialized${NC}"
    echo ""
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 3: Configure Git${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Get user name
GIT_NAME=$(git config user.name 2>/dev/null || echo "")
if [ -z "$GIT_NAME" ]; then
    read -p "Enter your name: " GIT_NAME
    git config user.name "$GIT_NAME"
    echo -e "${GREEN}✅ Set git user name: $GIT_NAME${NC}"
else
    echo -e "${GREEN}✅ Git user name already set: $GIT_NAME${NC}"
fi

# Get user email
GIT_EMAIL=$(git config user.email 2>/dev/null || echo "")
if [ -z "$GIT_EMAIL" ]; then
    read -p "Enter your email: " GIT_EMAIL
    git config user.email "$GIT_EMAIL"
    echo -e "${GREEN}✅ Set git user email: $GIT_EMAIL${NC}"
else
    echo -e "${GREEN}✅ Git user email already set: $GIT_EMAIL${NC}"
fi

echo ""

# Set default branch to main
git branch -M main 2>/dev/null || true
echo -e "${GREEN}✅ Set default branch to 'main'${NC}"
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 4: Initial Commit${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if there are uncommitted changes
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
else
    echo -e "${YELLOW}📝 Adding all files to git...${NC}"
    git add .
    echo -e "${GREEN}✅ Files staged${NC}"
    echo ""

    echo -e "${YELLOW}📝 Creating initial commit...${NC}"
    git commit -m "Initial commit: WhaSender project setup

- Electron desktop app (WhaSender)
- Authentication server (Express + MongoDB)
- Admin portal (React dashboard)
- Complete documentation
- Deployment configurations
- Auto-update system configured" || echo -e "${GREEN}✅ Already committed${NC}"
fi

echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 5: GitHub Repository Setup${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check if remote exists
REMOTE_URL=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$REMOTE_URL" ]; then
    echo -e "${YELLOW}📝 No GitHub remote configured${NC}"
    echo ""
    echo "Please create a GitHub repository first:"
    echo "  1. Go to: https://github.com/new"
    echo "  2. Repository name: whasender-private"
    echo "  3. Visibility: 🔒 PRIVATE (recommended)"
    echo "  4. Don't initialize with README"
    echo "  5. Click 'Create repository'"
    echo ""

    read -p "Enter your GitHub username: " GITHUB_USER
    read -p "Enter repository name [whasender-private]: " REPO_NAME
    REPO_NAME=${REPO_NAME:-whasender-private}

    GITHUB_URL="https://github.com/$GITHUB_USER/$REPO_NAME.git"

    echo ""
    echo -e "${YELLOW}📝 Adding GitHub remote...${NC}"
    git remote add origin "$GITHUB_URL"
    echo -e "${GREEN}✅ Remote added: $GITHUB_URL${NC}"
else
    echo -e "${GREEN}✅ GitHub remote already configured: $REMOTE_URL${NC}"
fi

echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 6: Update Package Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "You need to update app/package.json with your GitHub repository details:"
echo ""
echo "Edit: app/package.json"
echo "Update the 'build.publish' section:"
echo ""
echo -e "${YELLOW}  \"build\": {${NC}"
echo -e "${YELLOW}    \"publish\": {${NC}"
echo -e "${YELLOW}      \"provider\": \"github\",${NC}"
echo -e "${YELLOW}      \"owner\": \"YOUR-GITHUB-USERNAME\",  ${RED}<-- Change this${NC}"
echo -e "${YELLOW}      \"repo\": \"whasender-private\"       ${RED}<-- Change if different${NC}"
echo -e "${YELLOW}    }${NC}"
echo -e "${YELLOW}  }${NC}"
echo ""

read -p "Press Enter when you've updated package.json... "
echo ""

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}Step 7: Push to GitHub${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "Do you want to push to GitHub now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}📝 Pushing to GitHub...${NC}"
    git push -u origin main || echo -e "${RED}❌ Push failed. Make sure you've created the repository on GitHub.${NC}"
    echo ""
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                   ✅ Git Setup Complete!                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

echo -e "${GREEN}✅ Repository initialized successfully!${NC}"
echo ""

echo -e "${CYAN}📋 Next Steps:${NC}"
echo ""
echo "1. Verify on GitHub:"
echo "   → Go to your repository and confirm files are there"
echo ""
echo "2. Deploy auth server:"
echo "   → Read DEPLOY-NOW.md for step-by-step guide"
echo "   → open DEPLOY-NOW.md"
echo ""
echo "3. Set up GitHub token for releases:"
echo "   → Go to: https://github.com/settings/tokens"
echo "   → Generate new token (classic)"
echo "   → Scopes: repo (full access)"
echo "   → Set in terminal: export GH_TOKEN=\"your_token\""
echo ""
echo "4. Build and publish first release:"
echo "   → cd app"
echo "   → node scripts/release.js release patch mac"
echo "   → node scripts/release.js publish mac"
echo ""

echo -e "${CYAN}📚 Documentation:${NC}"
echo "   → GIT-REPOSITORY-SETUP.md    - Complete Git guide"
echo "   → DEPLOY-NOW.md               - Deploy auth server"
echo "   → PRIVATE-REPO-SETUP.md       - Private repo auto-updates"
echo "   → QUICK-START-RELEASE.md      - Building and releasing"
echo ""

echo "🎉 You're ready to develop and deploy!"
echo ""
