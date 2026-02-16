export const GITHUB_USERNAME = "mbozzello";
export const DATA_REPO = "clawboz-hq-data";
export const DATA_BRANCH = "main";

export const DATA_BASE = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${DATA_REPO}/${DATA_BRANCH}`;

// GitHub API base for listing files in a directory
export const GITHUB_API_BASE = `https://api.github.com/repos/${GITHUB_USERNAME}/${DATA_REPO}/contents`;

export function getEventsUrl() {
  return `${DATA_BASE}/events.jsonl`;
}

export function getProjectsUrl() {
  return `${DATA_BASE}/projects.json`;
}

export function getMissionsGitHubDir() {
  return `${GITHUB_API_BASE}/missions`;
}

export function getMissionRawUrl(filename: string) {
  return `${DATA_BASE}/missions/${filename}`;
}

// Are we running locally? (has access to filesystem)
export function isLocal() {
  return process.env.NODE_ENV === 'development' || !!process.env.LOCAL_MODE;
}
