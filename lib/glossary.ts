/**
 * Glossary of technical terms with plain English explanations.
 * Terms are matched case-insensitively in skill content.
 */

export interface GlossaryTerm {
  /** The canonical display form of the term */
  term: string
  /** Plain English explanation shown in the tooltip */
  definition: string
  /** Additional match patterns (exact strings, case-insensitive) */
  aliases?: string[]
}

export const GLOSSARY: GlossaryTerm[] = [
  // AI / LLM
  {
    term: 'MCP',
    definition: 'Model Context Protocol — a standard way for AI assistants like Claude to connect to external tools, databases, and services.',
    aliases: ['MCP server', 'MCP servers'],
  },
  {
    term: 'LLM',
    definition: 'Large Language Model — the type of AI behind tools like Claude, ChatGPT, and Gemini. It understands and generates human-like text.',
    aliases: ['LLMs', 'large language model', 'large language models'],
  },
  {
    term: 'RAG',
    definition: 'Retrieval-Augmented Generation — a technique where an AI looks up relevant information from a database before answering, making responses more accurate.',
    aliases: [],
  },
  {
    term: 'Vector Database',
    definition: 'A special kind of database that stores information as mathematical patterns, allowing AI to find content by meaning rather than exact keywords.',
    aliases: ['vector store', 'vector databases', 'vector stores', 'vector embeddings', 'embeddings'],
  },
  {
    term: 'API',
    definition: 'Application Programming Interface — a way for two pieces of software to talk to each other. Like a waiter taking your order to the kitchen.',
    aliases: ['APIs', 'API key', 'API keys'],
  },
  {
    term: 'API key',
    definition: 'A secret password that proves you are allowed to use a particular online service or API.',
    aliases: ['API keys'],
  },
  {
    term: 'Webhook',
    definition: 'A way for one service to automatically notify another when something happens — like a text message sent whenever a new order comes in.',
    aliases: ['webhooks'],
  },
  {
    term: 'Prompt',
    definition: 'The instruction or question you give to an AI. Better prompts lead to better answers.',
    aliases: ['prompts', 'system prompt', 'system prompts'],
  },

  // Media servers
  {
    term: 'Jellyfin',
    definition: 'A free, open-source media server you run on your own computer to stream your movies, TV shows, and music — like your own private Netflix.',
    aliases: [],
  },
  {
    term: 'Plex',
    definition: 'A popular media server app that lets you organize and stream your personal movie, TV, and music collection from any device.',
    aliases: [],
  },
  {
    term: 'Emby',
    definition: 'Another personal media server app, similar to Plex and Jellyfin, for streaming your own videos and music.',
    aliases: [],
  },
  {
    term: 'TMDB',
    definition: 'The Movie Database — a community-maintained online catalog of movies and TV shows that apps use to look up posters, descriptions, and ratings.',
    aliases: ['The Movie Database'],
  },

  // Databases
  {
    term: 'SQLite',
    definition: 'A simple, lightweight database that stores all its data in a single file — great for small apps that don\'t need a full database server.',
    aliases: ['sqlite3'],
  },
  {
    term: 'PostgreSQL',
    definition: 'A powerful, open-source database used by many professional web applications to store and query structured data.',
    aliases: ['Postgres', 'postgres'],
  },
  {
    term: 'Redis',
    definition: 'An ultra-fast database that keeps data in memory (RAM). Used for things like caching, session storage, and real-time features.',
    aliases: [],
  },

  // Python / Programming
  {
    term: 'virtual environment',
    definition: 'An isolated Python workspace that keeps a project\'s libraries separate from everything else on your computer — preventing conflicts.',
    aliases: ['venv', 'virtualenv', 'virtual environments'],
  },
  {
    term: 'async/await',
    definition: 'A programming pattern that lets code wait for slow operations (like network requests) without freezing everything else.',
    aliases: ['async', 'await', 'asynchronous'],
  },
  {
    term: 'pytest',
    definition: 'A popular Python tool for automatically testing your code to make sure it behaves correctly.',
    aliases: [],
  },
  {
    term: 'pip',
    definition: 'Python\'s package manager — the tool you use to install Python libraries and tools with a simple command.',
    aliases: [],
  },
  {
    term: 'Docker',
    definition: 'A tool that packages an app and everything it needs into a portable "container" that runs the same way on any computer.',
    aliases: ['containers', 'container', 'Dockerfile', 'docker-compose'],
  },
  {
    term: 'CLI',
    definition: 'Command Line Interface — a text-based way to control your computer by typing commands instead of clicking buttons.',
    aliases: ['command line', 'terminal', 'shell'],
  },
  {
    term: 'SSH',
    definition: 'Secure Shell — a secure way to remotely control another computer over the internet by typing commands.',
    aliases: [],
  },
  {
    term: 'Git',
    definition: 'A version control system that tracks every change to your code, so you can undo mistakes and collaborate with others.',
    aliases: ['GitHub', 'repository', 'repo'],
  },

  // Bluetooth / Hardware
  {
    term: 'Bluetooth LE',
    definition: 'Bluetooth Low Energy — a power-efficient version of Bluetooth used by devices like fitness trackers, AirTags, and smart home sensors.',
    aliases: ['BLE', 'Bluetooth Low Energy', 'Bluetooth'],
  },
  {
    term: 'bleak',
    definition: 'A Python library for scanning and connecting to Bluetooth Low Energy (BLE) devices from your computer.',
    aliases: [],
  },
  {
    term: 'BleakScanner',
    definition: 'The main tool in the "bleak" Python library for discovering nearby Bluetooth devices.',
    aliases: [],
  },

  // Web / Bots
  {
    term: 'Discord bot',
    definition: 'An automated account in Discord that can respond to messages, run commands, and perform tasks automatically.',
    aliases: ['Discord', 'discord.py', 'slash commands', 'slash command'],
  },
  {
    term: 'WebSocket',
    definition: 'A technology that keeps a constant connection open between a browser and a server, enabling real-time updates without refreshing.',
    aliases: ['WebSockets', 'websocket'],
  },
  {
    term: 'RSS',
    definition: 'Really Simple Syndication — a standard format websites use to publish a feed of their latest articles or updates.',
    aliases: ['RSS feed', 'RSS feeds'],
  },
  {
    term: 'cron job',
    definition: 'A scheduled task that runs automatically at set times — like an alarm clock for your server.',
    aliases: ['cron', 'cronjob'],
  },

  // AI agents
  {
    term: 'AI agent',
    definition: 'An AI that can take actions on your behalf — like browsing the web, running code, or calling external services — not just answer questions.',
    aliases: ['AI agents', 'agent', 'agents', 'agentic'],
  },
  {
    term: 'tool use',
    definition: 'A feature that lets an AI call external functions or APIs during a conversation — giving it the ability to search, calculate, or take actions.',
    aliases: ['tool calling', 'function calling'],
  },
  {
    term: 'Anthropic',
    definition: 'The AI safety company that created Claude.',
    aliases: [],
  },
  {
    term: 'OpenAI',
    definition: 'The AI company that created ChatGPT and GPT-4.',
    aliases: [],
  },

  // Misc tech
  {
    term: 'Markdown',
    definition: 'A simple way to format text using symbols like **bold**, *italic*, and # headings — without needing a word processor.',
    aliases: [],
  },
  {
    term: 'JSON',
    definition: 'A common text format for storing and sending structured data between programs — easy for both humans and computers to read.',
    aliases: [],
  },
  {
    term: 'YAML',
    definition: 'A human-friendly text format for configuration files — similar to JSON but easier to read and write.',
    aliases: [],
  },
  {
    term: 'open-source',
    definition: 'Software whose code is publicly available for anyone to read, use, and improve.',
    aliases: ['open source'],
  },
  {
    term: 'self-hosted',
    definition: 'Running software on your own computer or server rather than paying a company to run it for you.',
    aliases: ['self-host', 'self hosting'],
  },
  {
    term: 'Home Assistant',
    definition: 'A free, open-source smart home platform you run yourself to control lights, sensors, and other smart devices — without relying on cloud services.',
    aliases: [],
  },
  {
    term: 'n8n',
    definition: 'A free, open-source tool for visually automating workflows — connecting apps and services together without writing much code.',
    aliases: [],
  },
  {
    term: 'Obsidian',
    definition: 'A popular note-taking app that stores your notes as plain text files and lets you link ideas together like a personal knowledge base.',
    aliases: [],
  },
]

/**
 * Build a flat lookup: lowercased match string → GlossaryTerm
 */
export function buildGlossaryIndex(): Map<string, GlossaryTerm> {
  const index = new Map<string, GlossaryTerm>()
  for (const entry of GLOSSARY) {
    index.set(entry.term.toLowerCase(), entry)
    for (const alias of entry.aliases ?? []) {
      if (!index.has(alias.toLowerCase())) {
        index.set(alias.toLowerCase(), entry)
      }
    }
  }
  return index
}
