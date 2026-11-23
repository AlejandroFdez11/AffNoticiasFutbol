/**
 * Generates the static pages of the AffNoticiasWeb site (Netlify) from the
 * canonical copy in `AFFutbol/src/features/legal/documents.ts`.
 *
 * Run from the repository root:
 *
 *   npx --yes tsx scripts/generate-legal-pages.ts
 *
 * By default it writes to the sibling `../AffNoticiasWeb` repo. Override the
 * destination with LEGAL_WEB_DIR if the web repo lives elsewhere.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_DOCUMENT_IDS,
  LEGAL_LAST_UPDATED,
  LEGAL_SITE_URL,
  LEGAL_SUPPORT_EMAIL,
  getLegalDocument,
  type LegalBlock,
  type LegalDocumentId,
} from '../AFFutbol/src/features/legal/documents';

const ROOT = process.cwd();
const WEB_ROOT = process.env.LEGAL_WEB_DIR
  ? path.resolve(process.env.LEGAL_WEB_DIR)
  : path.resolve(ROOT, '..', 'AffNoticiasWeb');
const NAV: Array<{ id: LegalDocumentId; label: string; path: string }> = [
  { id: 'privacidad', label: 'Privacidad', path: '/legal/privacidad' },
  { id: 'terminos', label: 'Condiciones', path: '/legal/terminos' },
  { id: 'fuentes', label: 'Fuentes', path: '/legal/fuentes' },
];

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderBlock(block: LegalBlock): string {
  switch (block.kind) {
    case 'heading':
      return `<h2>${escapeHtml(block.text)}</h2>`;
    case 'paragraph':
      return `<p>${escapeHtml(block.text)}</p>`;
    case 'bullets':
      return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    case 'link':
      return `<p><a href="${escapeHtml(block.url)}" rel="noopener noreferrer">${escapeHtml(block.label)}</a></p>`;
  }
}

function layout(title: string, body: string): string {
  const nav =
    `<a href="${LEGAL_SITE_URL}/descargar">Descargar</a>` +
    NAV.map((item) => `<a href="${LEGAL_SITE_URL}${item.path}">${item.label}</a>`).join('');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)} · AFFutbol</title>
  <meta name="description" content="Información legal de AFFutbol">
  <meta name="theme-color" content="#0B7A4B">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <style>
    :root { color-scheme: light dark; }
    body { margin: 0; background: #07120d; color: #f2f5f3; font: 16px/1.65 system-ui, -apple-system, "Segoe UI", sans-serif; }
    main { max-width: 760px; margin: 0 auto; padding: 40px 20px 80px; }
    header { border-bottom: 1px solid #0b7a4b; margin-bottom: 28px; padding-bottom: 16px; }
    h1 { color: #fff; font-size: 2rem; margin: 0 0 6px; }
    .eyebrow { color: #d99b32; font-size: .8rem; letter-spacing: .12em; text-transform: uppercase; }
    .summary { color: #c8d2cc; }
    h2 { color: #4fbf87; font-size: 1.2rem; margin-top: 32px; }
    a { color: #6fd3a4; }
    nav { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 12px; }
    ul { padding-left: 22px; }
    li { margin: 6px 0; }
    footer { border-top: 1px solid #0b7a4b; color: #99a69f; font-size: .85rem; margin-top: 48px; padding-top: 16px; }
  </style>
</head>
<body>
  <main>
    <header>
      <div class="eyebrow">AFFutbol</div>
      <h1>${escapeHtml(title)}</h1>
      <nav>${nav}<a href="${LEGAL_SITE_URL}/soporte">Soporte</a></nav>
    </header>
    ${body}
    <footer>Última actualización: ${escapeHtml(LEGAL_LAST_UPDATED)}. Publicada en ${escapeHtml(LEGAL_SITE_URL)}.</footer>
  </main>
</body>
</html>
`;
}

async function writePage(outRoot: string, relativePath: string, html: string): Promise<void> {
  const target = path.join(outRoot, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  console.log(`written ${relativePath}`);
}

async function main(): Promise<void> {
  for (const id of LEGAL_DOCUMENT_IDS) {
    const document = getLegalDocument(id);
    const body = [
      `<p class="summary">${escapeHtml(document.summary)}</p>`,
      ...document.blocks.map(renderBlock),
    ].join('\n    ');
    await writePage(WEB_ROOT, path.join('legal', id, 'index.html'), layout(document.title, body));
  }

  const supportBody = [
    '<p>Si necesitas ayuda con AFFutbol, escribe a soporte y te responderemos en España en un plazo máximo de 5 días laborables.</p>',
    `<p><strong>Correo de soporte:</strong> <a href="mailto:${escapeHtml(LEGAL_SUPPORT_EMAIL)}">${escapeHtml(LEGAL_SUPPORT_EMAIL)}</a></p>`,
    `<p><strong>Privacidad:</strong> <a href="mailto:${escapeHtml(LEGAL_CONTACT_EMAIL)}">${escapeHtml(LEGAL_CONTACT_EMAIL)}</a></p>`,
    '<p>Para borrar tu cuenta, usa la opción <strong>Perfil → Eliminar cuenta</strong> dentro de la app.</p>',
  ].join('\n    ');
  await writePage(WEB_ROOT, path.join('soporte', 'index.html'), layout('Soporte', supportBody));
}

void main();
