const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { QUERIES } = require('./queries');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
const SPARQL_ENDPOINT = process.env.SPARQL_ENDPOINT || 'https://ag15qxyn3tqql6pu.allegrograph.cloud/repositories/breastcancer/sparql';
const SPARQL_USER = process.env.SPARQL_USER || 'admin';
const SPARQL_PASS = process.env.SPARQL_PASS || 'karim';
const KEEP_ALIVE_INTERVAL_MS = 7 * 60 * 60 * 1000;

function authHeader(user, pass) {
  const token = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

async function runSparql(query) {
  const params = new URLSearchParams({ query });
  const url = `${SPARQL_ENDPOINT}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/sparql-results+json',
      Authorization: authHeader(SPARQL_USER, SPARQL_PASS)
    }
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`SPARQL HTTP ${response.status}: ${text.slice(0, 300)}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from endpoint: ${text.slice(0, 300)}`);
  }

  return data;
}

function normalizeBindings(bindings) {
  return bindings.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = value.value;
    }
    return normalized;
  });
}

async function runKeepAlive() {
  try {
    await runSparql('SELECT (1 AS ?ok) WHERE {} LIMIT 1');
    console.log(`[keep-alive] SPARQL ping succeeded at ${new Date().toISOString()}`);
  } catch (error) {
    console.error(`[keep-alive] SPARQL ping failed: ${error.message}`);
  }
}

app.get('/api/health', async (_req, res) => {
  try {
    const data = await runSparql('SELECT (COUNT(*) AS ?n) WHERE { ?s ?p ?o } LIMIT 1');
    const count = Number(data?.results?.bindings?.[0]?.n?.value || 0);
    res.json({ ok: true, endpoint: SPARQL_ENDPOINT, hasData: count > 0, tripleCount: count });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.get('/api/analytics', (_req, res) => {
  const items = Object.entries(QUERIES).map(([id, q]) => ({
    id,
    title: q.title,
    category: q.category,
    sparql: q.sparql
  }));
  res.json({ items });
});

app.get('/api/analytics/:id', async (req, res) => {
  const id = req.params.id;
  const queryConfig = QUERIES[id];
  if (!queryConfig) {
    return res.status(404).json({ error: `Unknown query id: ${id}` });
  }

  try {
    const startedAt = Date.now();
    const data = await runSparql(queryConfig.sparql);
    const durationMs = Date.now() - startedAt;

    if (!data?.results?.bindings || !Array.isArray(data.results.bindings)) {
      throw new Error('Unexpected SPARQL JSON shape from endpoint');
    }

    return res.json({
      id,
      title: queryConfig.title,
      category: queryConfig.category,
      sparql: queryConfig.sparql,
      durationMs,
      columns: data.head.vars,
      rowCount: data.results.bindings.length,
      rows: normalizeBindings(data.results.bindings)
    });
  } catch (error) {
    return res.status(500).json({
      id,
      title: queryConfig.title,
      error: error.message
    });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Medical dashboard running on http://localhost:${PORT}`);
  console.log(`SPARQL endpoint: ${SPARQL_ENDPOINT}`);

  // Keep AllegroGraph Cloud repository active to avoid inactivity shutdowns.
  runKeepAlive();
  setInterval(runKeepAlive, KEEP_ALIVE_INTERVAL_MS);
});
