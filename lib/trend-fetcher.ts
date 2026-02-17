/**
 * Fetches trending content from across the web.
 * Runs server-side (Node.js) — works on both local and Vercel.
 */

export interface TrendSource {
  name: string
  url: string
  content: string
  fetchedAt: string
}

const SOURCES = [
  { name: 'Product Hunt', url: 'https://www.producthunt.com/' },
  { name: 'HackerNews', url: 'https://news.ycombinator.com/' },
  { name: 'GitHub Trending', url: 'https://github.com/trending?since=daily' },
  { name: 'Cursor Changelog', url: 'https://cursor.com/changelog' },
]

// HackerNews API — much better than scraping HTML
const HN_TOP_URL = 'https://hacker-news.firebaseio.com/v0/topstories.json'
const HN_ITEM_URL = 'https://hacker-news.firebaseio.com/v0/item'

// Product Hunt — use their website content
const PH_URL = 'https://www.producthunt.com/'

export async function fetchAllTrends(): Promise<TrendSource[]> {
  const results: TrendSource[] = []

  const fetches = [
    fetchHackerNews(),
    fetchGitHubTrending(),
    fetchProductHunt(),
    fetchCursorChangelog(),
  ]

  const settled = await Promise.allSettled(fetches)

  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value)
    }
  }

  return results
}

async function fetchHackerNews(): Promise<TrendSource> {
  // Use HN API for structured data
  const topRes = await fetch(HN_TOP_URL, { next: { revalidate: 0 } })
  const topIds: number[] = await topRes.json()

  // Get top 20 stories
  const storyPromises = topIds.slice(0, 20).map(async (id) => {
    const res = await fetch(`${HN_ITEM_URL}/${id}.json`)
    return res.json()
  })

  const stories = await Promise.all(storyPromises)

  const content = stories
    .filter((s: any) => s && s.title)
    .map((s: any) => {
      const url = s.url || `https://news.ycombinator.com/item?id=${s.id}`
      return `- ${s.title} (${s.score} points) ${url}`
    })
    .join('\n')

  return {
    name: 'HackerNews Top 20',
    url: 'https://news.ycombinator.com/',
    content,
    fetchedAt: new Date().toISOString(),
  }
}

async function fetchGitHubTrending(): Promise<TrendSource> {
  const res = await fetch('https://github.com/trending?since=daily', {
    headers: { 'User-Agent': 'ClawBoz-TrendCoach/1.0' },
    next: { revalidate: 0 },
  })
  const html = await res.text()

  // Extract repo info from HTML
  const repos: string[] = []
  const repoRegex = /href="\/([^"]+\/[^"]+)"[^>]*class="[^"]*?Link[^"]*?"[^>]*?>\s*<span[^>]*>([^<]*)<\/span>\s*\/\s*<span[^>]*>([^<]*)<\/span>/g
  // Simpler: look for h2 article titles
  const articleRegex = /href="\/([\w-]+\/[\w.-]+)"[^>]*>\s*([\w-]+)\s*\/\s*([\w.-]+)/g

  let match
  const seen = new Set<string>()
  // Extract repo names from trending page
  const repoPattern = /<h2[^>]*class="[^"]*lh-condensed[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/([\w-]+\/[\w.-]+)"/g
  while ((match = repoPattern.exec(html)) !== null && repos.length < 25) {
    const repo = match[1]
    if (!seen.has(repo)) {
      seen.add(repo)
      repos.push(repo)
    }
  }

  // Also try simpler pattern
  if (repos.length < 5) {
    const simplePattern = /\/([a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+)"\s+class/g
    while ((match = simplePattern.exec(html)) !== null && repos.length < 25) {
      const repo = match[1]
      if (!seen.has(repo) && !repo.includes('trending') && !repo.includes('explore')) {
        seen.add(repo)
        repos.push(repo)
      }
    }
  }

  // Get descriptions from GitHub API for top repos
  const repoDetails = await Promise.allSettled(
    repos.slice(0, 15).map(async (repo) => {
      try {
        const res = await fetch(`https://api.github.com/repos/${repo}`, {
          headers: { 'User-Agent': 'ClawBoz-TrendCoach/1.0' },
        })
        if (!res.ok) return `- ${repo}`
        const data = await res.json()
        return `- ${repo}: ${data.description || 'No description'} (${data.stargazers_count} stars, ${data.language || 'unknown'})`
      } catch {
        return `- ${repo}`
      }
    })
  )

  const content = repoDetails
    .map(r => r.status === 'fulfilled' ? r.value : '')
    .filter(Boolean)
    .join('\n')

  return {
    name: 'GitHub Trending',
    url: 'https://github.com/trending',
    content: content || 'Could not parse GitHub trending page',
    fetchedAt: new Date().toISOString(),
  }
}

async function fetchProductHunt(): Promise<TrendSource> {
  // Fetch PH homepage and extract product names
  const res = await fetch('https://www.producthunt.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      'Accept': 'text/html',
    },
    next: { revalidate: 0 },
  })
  const html = await res.text()

  // Extract product info from HTML — look for data in script tags or structured data
  const products: string[] = []

  // Try JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)
  if (jsonLdMatch) {
    for (const block of jsonLdMatch) {
      try {
        const jsonStr = block.replace(/<\/?script[^>]*>/g, '')
        const data = JSON.parse(jsonStr)
        if (data.name) {
          products.push(`- ${data.name}: ${data.description || ''}`)
        }
      } catch {}
    }
  }

  // Also extract from meta/title patterns
  const titlePattern = /data-test="post-name"[^>]*>([^<]+)<|"name":"([^"]+)","tagline":"([^"]+)"/g
  let match
  while ((match = titlePattern.exec(html)) !== null && products.length < 15) {
    const name = match[1] || match[2]
    const tagline = match[3] || ''
    if (name && !products.some(p => p.includes(name))) {
      products.push(`- ${name}${tagline ? ': ' + tagline : ''}`)
    }
  }

  // Fallback: extract any meaningful text
  if (products.length === 0) {
    // Strip HTML tags and get text chunks
    const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
    const chunks = text.match(/[A-Z][^.!?]*(?:AI|tool|app|platform|build|automate|workflow)[^.!?]*/gi) || []
    for (const chunk of chunks.slice(0, 10)) {
      products.push(`- ${chunk.trim().slice(0, 120)}`)
    }
  }

  return {
    name: 'Product Hunt',
    url: 'https://www.producthunt.com/',
    content: products.length > 0 ? products.join('\n') : 'Product Hunt trending: various AI and developer tools',
    fetchedAt: new Date().toISOString(),
  }
}

async function fetchCursorChangelog(): Promise<TrendSource> {
  const res = await fetch('https://cursor.com/changelog', {
    headers: { 'User-Agent': 'ClawBoz-TrendCoach/1.0' },
    next: { revalidate: 0 },
  })
  const html = await res.text()

  // Extract text content, strip tags
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Take first 1500 chars of meaningful content
  const lines = text.split('\n').filter(l => l.trim().length > 10).slice(0, 30)

  return {
    name: 'Cursor Changelog',
    url: 'https://cursor.com/changelog',
    content: lines.join('\n').slice(0, 1500),
    fetchedAt: new Date().toISOString(),
  }
}
