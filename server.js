/**
 * Wedding invitation server — single Node + Express process that
 *   1. Serves the static site (index.html, admin.html, assets/…)
 *   2. Exposes /api/rsvp for create / list / update / delete
 *
 * Storage: Postgres (Neon free tier works great).
 * Auth: admin endpoints (list / update / delete) require a bearer
 *       token equal to ADMIN_TOKEN. The submission endpoint is open.
 *
 * Required env vars:
 *   DATABASE_URL  — postgres://user:pass@host/db?sslmode=require
 *   ADMIN_TOKEN   — secret string admin pages send in Authorization
 *   PORT          — provided by Render automatically (defaults to 3000)
 */

'use strict';

const path    = require('path');
const express = require('express');
const { Pool } = require('pg');

const PORT         = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_TOKEN  = process.env.ADMIN_TOKEN || 'danson2026';

if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL env var — set it in Render (or .env locally)');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false }   // Neon requires SSL
});

const app = express();
app.use(express.json({ limit: '64kb' }));
app.use(express.urlencoded({ extended: true, limit: '64kb' }));

// CORS — keep open since this whole project is one origin on Render,
// but allow the local dev server to call it too while developing.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin',  '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ─── Schema bootstrap ───────────────────────────────────────────────
async function ensureSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS rsvp (
      id              SERIAL PRIMARY KEY,
      submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name            TEXT NOT NULL,
      attending       TEXT,
      guest_of        TEXT,
      main_course     TEXT,
      dietary         TEXT,
      dietary_details TEXT
    );
  `);
}

// ─── Helpers ────────────────────────────────────────────────────────
function requireAdmin(req, res, next) {
  const hdr = req.headers.authorization || '';
  const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : '';
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

function rowToJson(r) {
  return {
    id:                r.id,
    Timestamp:         r.submitted_at,
    Name:              r.name,
    Attending:         r.attending,
    'Guest Of':         r.guest_of,
    'Main Course':      r.main_course,
    Dietary:            r.dietary,
    'Dietary Details': r.dietary_details
  };
}

// ─── Routes ─────────────────────────────────────────────────────────

// Health check — Render pings this; also a quick way to verify the
// server is up.
app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Submit RSVP (public — guests use this)
app.post('/api/rsvp', async (req, res) => {
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim().slice(0, 120);
    if (!name) return res.status(400).json({ error: 'name required' });

    const { rows } = await pool.query(
      `INSERT INTO rsvp (name, attending, guest_of, main_course, dietary, dietary_details)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        name,
        String(b.attend          || '').slice(0, 16),
        String(b.side            || '').slice(0, 16),
        String(b.main            || '').slice(0, 16),
        String(b.dietary         || '').slice(0, 16),
        String(b.dietary_details || '').slice(0, 500)
      ]
    );
    res.status(201).json({ ok: true, row: rowToJson(rows[0]) });
  } catch (err) {
    console.error('POST /api/rsvp', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// List all RSVPs (admin)
app.get('/api/rsvp', requireAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM rsvp ORDER BY submitted_at DESC`
    );
    res.json({ rows: rows.map(rowToJson) });
  } catch (err) {
    console.error('GET /api/rsvp', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Update one row (admin)
app.put('/api/rsvp/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad id' });

    const b = req.body || {};
    const { rowCount, rows } = await pool.query(
      `UPDATE rsvp
         SET name = COALESCE($1, name),
             attending = COALESCE($2, attending),
             guest_of = COALESCE($3, guest_of),
             main_course = COALESCE($4, main_course),
             dietary = COALESCE($5, dietary),
             dietary_details = COALESCE($6, dietary_details)
       WHERE id = $7
       RETURNING *`,
      [
        b.name        != null ? String(b.name).slice(0, 120)         : null,
        b.attend      != null ? String(b.attend).slice(0, 16)        : null,
        b.side        != null ? String(b.side).slice(0, 16)          : null,
        b.main        != null ? String(b.main).slice(0, 16)          : null,
        b.dietary     != null ? String(b.dietary).slice(0, 16)       : null,
        b.dietary_details != null ? String(b.dietary_details).slice(0, 500) : null,
        id
      ]
    );
    if (rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true, row: rowToJson(rows[0]) });
  } catch (err) {
    console.error('PUT /api/rsvp/:id', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// Delete one row (admin)
app.delete('/api/rsvp/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'bad id' });
    const { rowCount } = await pool.query(`DELETE FROM rsvp WHERE id = $1`, [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/rsvp/:id', err);
    res.status(500).json({ error: 'internal error' });
  }
});

// ─── Static files (the actual invitation pages) ─────────────────────
// Serve everything from the project root: index.html, admin.html, style.css, script.js, assets/
app.use(express.static(path.join(__dirname), {
  extensions: ['html'],
  fallthrough: true
}));

// ─── Start ──────────────────────────────────────────────────────────
ensureSchema()
  .then(() => app.listen(PORT, () => {
    console.log(`✨ Wedding server listening on http://localhost:${PORT}`);
  }))
  .catch((err) => {
    console.error('Failed to start (schema/db error):', err);
    process.exit(1);
  });
