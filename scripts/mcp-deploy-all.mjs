#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const base = path.resolve(__dirname, '..');

const functions = [
  'send-forfait-notification',
  'generate-monthly-polls',
  'sync-match-costs',
  'sync-card-penalties',
  'notify-auto-suspension',
];

const map = {
  'send-forfait-notification': '.cursor-deploy-send-forfait-notification.json',
  'generate-monthly-polls': '.cursor-deploy-generate-monthly-polls.json',
  'sync-match-costs': '.cursor-deploy-sync-match-costs.json',
  'sync-card-penalties': '.cursor-deploy-sync-card-penalties.json',
  'notify-auto-suspension': '.cursor-deploy-notify-auto-suspension.json',
};

const outDir = '/tmp/mcp-deploy-batch';
fs.mkdirSync(outDir, { recursive: true });

for (const name of functions) {
  const p = JSON.parse(fs.readFileSync(path.join(base, map[name]), 'utf8'));
  const args = {
    project_id: p.project_id,
    name: p.name,
    entrypoint_path: p.entrypoint_path,
    verify_jwt: p.verify_jwt,
    files: p.files,
  };
  fs.writeFileSync(path.join(outDir, `${name}.json`), JSON.stringify(args));
  console.log(`prepared ${name} (${JSON.stringify(args).length} bytes)`);
}
