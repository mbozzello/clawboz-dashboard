# ClawBoz HQ Dashboard

A Next.js dashboard for monitoring ClawBoz agent activity and projects in real-time.

## Features

- 📊 **Project Cards**: Grouped by project with latest agent status
- 📈 **Activity Feed**: Real-time stream of recent events
- 🔍 **Filters**: Project dropdown, status chips, and search
- ⏱️ **Relative Timestamps**: "5m ago", "2h ago", etc.
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Setup

### 1. Configure GitHub Username

**⚠️ IMPORTANT: You must configure your GitHub username before running the dashboard.**

Edit `src/lib/config.ts` and replace `<MY_GITHUB_USERNAME>` with your actual GitHub username:

```typescript
// TODO: Replace <MY_GITHUB_USERNAME> with your actual GitHub username
export const config = {
  githubUsername: '<MY_GITHUB_USERNAME>', // TODO: Set your GitHub username here
  repoName: 'clawboz-hq-data',
  branch: 'main',
}
```

For example, if your GitHub username is `johndoe`, change it to:

```typescript
export const config = {
  githubUsername: 'johndoe',
  repoName: 'clawboz-hq-data',
  branch: 'main',
}
```

### 2. Install Dependencies

```bash
cd ~/ClawBoz/clawboz-dashboard
npm install
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Data Sources

The dashboard fetches data from your GitHub repository:

- **Events**: `https://raw.githubusercontent.com/<YOUR_USERNAME>/clawboz-hq-data/main/events.jsonl`
- **Projects**: `https://raw.githubusercontent.com/<YOUR_USERNAME>/clawboz-hq-data/main/projects.json`

Make sure your `clawboz-hq-data` repository is:
1. Created on GitHub
2. Contains `events.jsonl` and `projects.json`
3. Set to public (or the raw URLs won't be accessible)

## Deploy to Vercel

### Option 1: Deploy from GitHub

1. **Push your code to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<YOUR_USERNAME>/clawboz-dashboard.git
   git push -u origin main
   ```

2. **Deploy on Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your `clawboz-dashboard` repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"

### Option 2: Deploy with Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd ~/ClawBoz/clawboz-dashboard
vercel

# For production deployment
vercel --prod
```

## Connect a Custom Domain

1. **Go to your project on Vercel**:
   - Navigate to Settings → Domains

2. **Add your domain**:
   - Enter your domain (e.g., `dashboard.yourdomain.com`)
   - Click "Add"

3. **Configure DNS**:
   - Vercel will show you DNS records to add
   - Go to your domain registrar
   - Add the A or CNAME record as instructed

4. **Wait for DNS propagation** (can take up to 48 hours, usually faster)

### Example DNS Configuration

For a subdomain (e.g., `dashboard.yourdomain.com`):
```
Type: CNAME
Name: dashboard
Value: cname.vercel-dns.com
```

For root domain (e.g., `yourdomain.com`):
```
Type: A
Name: @
Value: 76.76.21.21
```

## Project Structure

```
clawboz-dashboard/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main dashboard page
│   └── globals.css       # Global styles
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx      # Main dashboard component
│   │   ├── ProjectCard.tsx    # Project card display
│   │   ├── ActivityFeed.tsx   # Activity feed
│   │   └── Filters.tsx        # Filter controls
│   └── lib/
│       ├── config.ts          # GitHub configuration (SET YOUR USERNAME HERE!)
│       ├── types.ts           # TypeScript types
│       ├── api.ts             # Data fetching functions
│       └── utils.ts           # Utility functions
└── README.md
```

## Environment Variables (Optional)

If you want to use environment variables instead of hardcoding in `config.ts`, create a `.env.local` file:

```env
NEXT_PUBLIC_GITHUB_USERNAME=your-username
NEXT_PUBLIC_REPO_NAME=clawboz-hq-data
NEXT_PUBLIC_BRANCH=main
```

Then update `src/lib/config.ts`:

```typescript
export const config = {
  githubUsername: process.env.NEXT_PUBLIC_GITHUB_USERNAME || '<MY_GITHUB_USERNAME>',
  repoName: process.env.NEXT_PUBLIC_REPO_NAME || 'clawboz-hq-data',
  branch: process.env.NEXT_PUBLIC_BRANCH || 'main',
}
```

## Available Scripts

```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Dashboard shows "No events"

1. Check that your GitHub username is correctly set in `src/lib/config.ts`
2. Verify your `clawboz-hq-data` repository is public
3. Check that `events.jsonl` exists and contains valid JSONL
4. Open browser DevTools and check Console for errors

### CORS errors

- Raw GitHub URLs don't require CORS
- If you see CORS errors, check that you're using the raw URL format
- Make sure your repository is public

### Data not updating

- The dashboard fetches fresh data on each page load
- If using ISR, check the `revalidate` setting in `app/page.tsx`
- Clear your browser cache or use hard refresh (Cmd+Shift+R)

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
