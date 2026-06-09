#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const base = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const map = {
  'send-forfait-notification': '.cursor-deploy-send-forfait-notification.json',
  'generate-monthly-polls': '.cursor-deploy-generate-monthly-polls.json',
  'sync-match-costs': '.cursor-deploy-sync-match-costs.json',
  'sync-card-penalties': '.cursor-deploy-sync-card-penalties.json',
  'notify-auto-suspension': '.cursor-deploy-notify-auto-suspension.json',
};

const name = process.argv[2];
if (!name || !map[name]) {
  console.error('Usage: node mcp-deploy-args.mjs <function-name>');
  process.exit(1);
}

const p = JSON.parse(fs.readFileSync(path.join(base, map[name]), 'utf8'));
process.stdout.write(JSON.stringify({
  project_id: p.project_id,
  name: p.name,
  entrypoint_path: p.entrypoint_path,
  verify_jwt: p.verify_jwt,
  files: p.files,
}));
