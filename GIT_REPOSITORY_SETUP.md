# Git Repository Setup Guide

## Quick Setup Instructions

### Step 1: Initialize Git Repository (if not already done)

```bash
git init
git add .
git commit -m "Initial commit: Construction AI Platform"
```

### Step 2: Create Remote Repository

#### Option A: GitHub
1. Go to https://github.com/new
2. Create a new repository (name: `construction-ai-platform` or your choice)
3. **DO NOT** initialize with README, .gitignore, or license
4. Copy the repository URL

#### Option B: GitLab
1. Go to https://gitlab.com/projects/new
2. Create a new project
3. Copy the repository URL

#### Option C: Bitbucket
1. Go to https://bitbucket.org/repo/create
2. Create a new repository
3. Copy the repository URL

### Step 3: Connect and Push

```bash
# Add remote origin (replace URL with your repository)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to main branch
git branch -M main
git push -u origin main
```

## Important: Protect Sensitive Data

### Files Already Protected (.gitignore)
- `.env` files
- `node_modules/`
- Build directories
- Supabase local config

### Before Pushing - Security Checklist
✅ No API keys in code (all use environment variables)
✅ No hardcoded credentials
✅ Supabase keys use environment variables
✅ Edge function secrets stored in Supabase (not in code)

## Repository Structure

```
construction-ai-platform/
├── src/                    # React application
├── supabase/              # Supabase functions & migrations
├── public/                # Static assets
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies
└── README.md             # Project documentation
```

## Deployment Integration

### Vercel (Recommended for Frontend)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy
```

### GitHub Actions (CI/CD)
Create `.github/workflows/deploy.yml` for automated deployments

## Collaboration Setup

### Branch Protection
1. Go to repository Settings → Branches
2. Add rule for `main` branch
3. Enable:
   - Require pull request reviews
   - Require status checks to pass
   - Include administrators

### Team Access
1. Settings → Collaborators
2. Add team members with appropriate permissions

## Environment Variables Setup

### For Deployment Platforms
Add these environment variables in your deployment platform:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps After Upload

1. ✅ Update README.md with project-specific information
2. ✅ Add LICENSE file if open source
3. ✅ Create CONTRIBUTING.md for contributors
4. ✅ Set up GitHub Issues for bug tracking
5. ✅ Configure branch protection rules
6. ✅ Set up CI/CD pipeline
7. ✅ Add badges to README (build status, license, etc.)

## Repository URL Format

After setup, your repository will be accessible at:
- GitHub: `https://github.com/YOUR_USERNAME/YOUR_REPO`
- GitLab: `https://gitlab.com/YOUR_USERNAME/YOUR_REPO`
- Bitbucket: `https://bitbucket.org/YOUR_USERNAME/YOUR_REPO`

## Clone Command for Team Members

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
npm install
```

## Troubleshooting

### Issue: "remote origin already exists"
```bash
git remote remove origin
git remote add origin YOUR_NEW_URL
```

### Issue: Authentication failed
```bash
# Use personal access token instead of password
# GitHub: Settings → Developer settings → Personal access tokens
```

### Issue: Large files rejected
```bash
# Use Git LFS for large files
git lfs install
git lfs track "*.pdf"
git lfs track "*.dwg"
```

---

**Ready to push!** Follow the steps above to create your repository.
