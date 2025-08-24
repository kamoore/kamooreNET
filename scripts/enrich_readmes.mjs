#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

function run(cmd) { return execSync(cmd, { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); }

function parseOwnerRepo(url) {
  // expects https://github.com/owner/repo
  try {
    const u = new URL(url);
    const [owner, repo] = u.pathname.replace(/^\//, '').split('/');
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch { return null; }
}

function stripMarkdown(md) {
  if (!md) return '';
  // remove code fences
  md = md.replace(/```[\s\S]*?```/g, ' ');
  // remove images and links [text](url)
  md = md.replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ');
  md = md.replace(/\[([^\]]+)\]\([^\)]*\)/g, '$1');
  // remove badges (lines with many images)
  md = md.replace(/^\s*\[!\[[\s\S]*?\)\s*\]\([^\)]*\).*$/gm, ' ');
  // remove HTML tags
  md = md.replace(/<[^>]+>/g, ' ');
  // remove headings and emphasis markers
  md = md.replace(/^#+\s*/gm, '');
  md = md.replace(/[\*_`~>#]/g, '');
  // collapse whitespace
  md = md.replace(/\r?\n/g, ' ');
  md = md.replace(/\s{2,}/g, ' ').trim();
  return md;
}

function summarize(text, maxChars = 320) {
  const t = text.slice(0, 2000); // cap work
  let out = t;
  // Prefer up to first sentence end beyond 120 chars
  const min = 120;
  const periodIdx = t.indexOf('. ', min);
  if (periodIdx !== -1) out = t.slice(0, periodIdx + 1);
  if (out.length < min) out = t.slice(0, Math.min(maxChars, t.length));
  if (out.length > maxChars) {
    out = out.slice(0, maxChars);
    const lastSpace = out.lastIndexOf(' ');
    if (lastSpace > 0) out = out.slice(0, lastSpace) + '…';
  }
  return out.trim();
}

function fetchReadme(owner, repo) {
  // REST v3: GET /repos/{owner}/{repo}/readme returns base64 content
  const cmd = `gh api repos/${owner}/${repo}/readme -H 'Accept: application/vnd.github.v3+json' -q .content`;
  try {
    const base64 = run(cmd).trim();
    if (!base64) return '';
    const buf = Buffer.from(base64, 'base64');
    return buf.toString('utf8');
  } catch (err) { return ''; }
}

function main() {
  const path = resolve('assets/data/projects.json');
  const projects = JSON.parse(readFileSync(path, 'utf8'));
  const enriched = projects.map(p => {
    const parsed = parseOwnerRepo(p.url || '');
    if (!parsed) return p;
    const raw = fetchReadme(parsed.owner, parsed.repo);
    if (!raw) return p;
    const text = stripMarkdown(raw);
    const blurb = summarize(text);
    return { ...p, blurb };
  });
  writeFileSync(path, JSON.stringify(enriched, null, 2) + '\n');
  console.log(`Enriched ${enriched.filter(p => p.blurb).length}/${enriched.length} projects with README blurbs.`);
}

try { main(); } catch (e) { console.error(e?.message || e); process.exit(1); }

