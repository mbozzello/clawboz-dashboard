# Setup Instructions for ClawBoz Dashboard

## ⚠️ IMPORTANT: Required Configuration

Before running the dashboard, you **MUST** replace `<MY_GITHUB_USERNAME>` with your actual GitHub username.

### Step 1: Update GitHub Configuration

Edit `lib/config.ts`:

```typescript
// TODO: Replace <MY_GITHUB_USERNAME> with your actual GitHub username
export const config = {
  githubUsername: '<MY_GITHUB_USERNAME>', // ⚠️ CHANGE THIS!
  repoName: 'clawboz-hq-data',
  branch: 'main',
}
```

**Example:** If your GitHub username is `johndoe`, change it to:

```typescript
export const config = {
  githubUsername: 'johndoe',  // ✅ Changed!
  repoName: 'clawboz-hq-data',
  branch: 'main',
}
```

### Step 2: Install Dependencies

```bash
cd ~/ClawBoz/clawboz-dashboard
npm install
```

### Step 3: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Quick Deploy to Vercel

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push
   ```

2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your repository
5. Click "Deploy"

## Add Custom Domain

1. In Vercel project → Settings → Domains
2. Add your domain (e.g., `dashboard.yourdomain.com`)
3. Update DNS with provided records
4. Wait for DNS propagation

Done! 🎉
