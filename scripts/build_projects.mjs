#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

function run(cmd) {
  return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString();
}

function safe(v, fallback = '') { return v ?? fallback; }

function main() {
  const outPath = resolve('assets/data/projects.json');
  const outDir = dirname(outPath);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

  // Get current user login to scope repo list
  const login = run('gh api user -q .login').trim();
  if (!login) throw new Error('Failed to detect GitHub user via gh api user');

  // Fetch repositories; include private
  const json = run(`gh repo list ${login} --limit 200 --json name,description,homepageUrl,updatedAt,visibility,stargazerCount,repositoryTopics,isArchived,isPrivate,url`);
  const repos = JSON.parse(json);

  // Map to simplified public-safe schema
  const projects = repos.map(r => ({
    name: safe(r.name),
    description: safe(r.description),
    homepage: safe(r.homepageUrl),
    url: safe(r.url),
    updatedAt: safe(r.updatedAt),
    visibility: safe(r.visibility),
    stars: Number(r.stargazerCount || 0),
    topics: Array.isArray(r?.repositoryTopics?.nodes) ? r.repositoryTopics.nodes.map(n => n?.topic?.name).filter(Boolean) : [],
    archived: Boolean(r.isArchived),
    isPrivate: Boolean(r.isPrivate)
  }))
  // Filter out forks and archived if you prefer; here we keep archived but can sort last
  .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

  writeFileSync(outPath, JSON.stringify(projects, null, 2) + '\n');
  console.log(`Wrote ${projects.length} projects to ${outPath}`);
}

try { main(); } catch (err) { console.error(err?.message || err); process.exit(1); }
