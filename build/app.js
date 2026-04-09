const { useEffect, useMemo, useState } = React;

const QUERY_DETAILS = {
  Q1: {
    objectif: 'Vue globale de la cohorte: taille, age moyen et survie moyenne.',
    interpretation: 'Permet de verifier rapidement la qualite du chargement et le profil global des patients.',
    utilite: 'Controle de coherence avant analyses detaillees.'
  },
  Q2: {
    objectif: 'Comparer la survie selon les sous-types PAM50.',
    interpretation: 'Aide a identifier les sous-types avec le pronostic le plus favorable ou defavorable.',
    utilite: 'Support a la stratification pronostique.'
  },
  Q3: {
    objectif: 'Analyser la survie selon les statuts ER/PR/HER2.',
    interpretation: 'Utile pour relier les profils biologiques aux resultats cliniques.',
    utilite: 'Aide au positionnement therapeutique selon biomarqueurs.'
  },
  Q4: {
    objectif: 'Mesurer les outcomes par stade tumoral.',
    interpretation: 'Montre l impact du stade et de la taille tumorale sur la survie.',
    utilite: 'Evaluation du diagnostic precoce et du risque clinique.'
  },
  Q5: {
    objectif: 'Comparer les traitements selon le sous-type.',
    interpretation: 'Aide a evaluer quelles strategies semblent associees a une meilleure survie.',
    utilite: 'Support a l optimisation des parcours therapeutiques.'
  },
  Q6: {
    objectif: 'Isoler la cohorte triple negative.',
    interpretation: 'Permet de suivre ce sous-groupe a risque et sa survie moyenne.',
    utilite: 'Alerte sur une population souvent de mauvais pronostic.'
  },
  Q7: {
    objectif: 'Lister les genes les plus mutés.',
    interpretation: 'Priorise les biomarqueurs potentiels pour les analyses avancees.',
    utilite: 'Priorisation des cibles biologiques et panneaux genes.'
  },
  Q8: {
    objectif: 'Associer les mutations aux sous-types.',
    interpretation: 'Montre les signatures mutationnelles dominantes par sous-type.',
    utilite: 'Support a la medecine de precision par sous-population.'
  },
  Q9: {
    objectif: 'Detecter les paires de co-mutations frequentes.',
    interpretation: 'Supporte l exploration de mecanismes biologiques combines.',
    utilite: 'Aide a construire des hypotheses biologiques multi-genes.'
  },
  Q10: {
    objectif: 'Etablir une baseline d expression genetique.',
    interpretation: 'Donne une vue d ensemble des genes les plus representes et de leurs z-scores moyens.',
    utilite: 'Repere des marqueurs expressionnels atypiques.'
  },
  Q11: {
    objectif: 'Comparer expression et statut mutationnel.',
    interpretation: 'Aide a verifier si une mutation est associee a un changement d expression.',
    utilite: 'Validation de la pertinence fonctionnelle des mutations.'
  },
  Q12: {
    objectif: 'Identifier des phenotypes haut risque.',
    interpretation: 'Repere les patients potentiellement prioritaires pour revue clinique.',
    utilite: 'Aide au tri clinique et au suivi renforce.'
  }
};

const QUERY_OVERVIEW = {
  Q1: { nom: 'Snapshot de Cohorte', explication: 'Mesure la taille de la cohorte, l age moyen et la survie moyenne.' },
  Q2: { nom: 'Survie par PAM50', explication: 'Compare les outcomes selon les sous-types moleculaires PAM50.' },
  Q3: { nom: 'Survie par Recepteur', explication: 'Analyse la survie selon les profils ER/PR/HER2.' },
  Q4: { nom: 'Impact du Stade Tumoral', explication: 'Lie stade et taille tumorale aux resultats de survie.' },
  Q5: { nom: 'Traitements vs Survie', explication: 'Compare les performances des strategies therapeutiques par sous-type.' },
  Q6: { nom: 'Focus Triple Negative', explication: 'Isole la cohorte triple negative et estime sa survie moyenne.' },
  Q7: { nom: 'Top Genes Mutes', explication: 'Classe les genes les plus frequemment observes en mutation.' },
  Q8: { nom: 'Mutations par Sous-type', explication: 'Identifie les signatures mutationnelles dominantes selon PAM50.' },
  Q9: { nom: 'Reseau de Co-mutations', explication: 'Repere les paires de mutations qui co-occurent frequemment.' },
  Q10: { nom: 'Baseline Expression', explication: 'Construit un profil de reference des niveaux d expression genique.' },
  Q11: { nom: 'Expression vs Mutation', explication: 'Teste le lien entre statut mutationnel et variation d expression.' },
  Q12: { nom: 'Detection Haut Risque', explication: 'Detecte des profils cliniques et moleculaires a risque eleve.' }
};

const MEDICAL_GLOSSARY = [
  { terme: 'Mutation genique', definition: 'Modification de la sequence ADN d un gene. Certaines mutations peuvent influencer le comportement tumoral.' },
  { terme: 'Expression genique', definition: 'Niveau d activite d un gene, mesure ici via des z-scores d expression.' },
  { terme: 'Z-score', definition: 'Mesure standardisee indiquant si l expression d un gene est au-dessus ou au-dessous de la moyenne.' },
  { terme: 'ER / PR / HER2', definition: 'Biomarqueurs du cancer du sein utilises pour le pronostic et l orientation therapeutique.' },
  { terme: 'Sous-type PAM50', definition: 'Classification moleculaire (ex: Luminal A, Basal-like) liee au pronostic et a la reponse aux traitements.' },
  { terme: 'Triple negative', definition: 'Profil tumoral ER negatif, PR negatif et HER2 negatif, souvent associe a un risque plus eleve.' },
  { terme: 'Stade tumoral', definition: 'Niveau d avancement clinique de la tumeur (taille, extension locale, etc.).' },
  { terme: 'Survie globale', definition: 'Duree de vie observee apres diagnostic, exprimee en mois dans ce tableau de bord.' },
  { terme: 'Chimiotherapie', definition: 'Traitement systemique anti-cancer utilisant des agents cytotoxiques.' },
  { terme: 'Hormonotherapie', definition: 'Traitement ciblant la signalisation hormonale, souvent utilise pour les tumeurs hormone-sensibles.' },
  { terme: 'Radiotherapie', definition: 'Traitement local par rayonnements pour controler ou detruire des cellules tumorales.' },
  { terme: 'Co-mutation', definition: 'Presence simultanee de mutations sur deux genes chez un meme patient.' },
  { terme: 'Phenotype haut risque', definition: 'Profil combinant marqueurs cliniques et genomiques associe a un pronostic defavorable.' }
];

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

const API_BASE = String(window.API_BASE_URL || '').replace(/\/+$/, '');

function apiUrl(path) {
  const normalizedPath = String(path || '').startsWith('/') ? String(path || '') : `/${String(path || '')}`;
  return API_BASE ? `${API_BASE}${normalizedPath}` : normalizedPath;
}

async function fetchJson(path) {
  const response = await fetch(apiUrl(path));
  const contentType = String(response.headers.get('content-type') || '').toLowerCase();
  const bodyText = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} on ${apiUrl(path)}: ${bodyText.slice(0, 120)}`);
  }

  if (!contentType.includes('application/json')) {
    throw new Error(`Expected JSON from ${apiUrl(path)} but got ${contentType || 'unknown content-type'}`);
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    throw new Error(`Invalid JSON from ${apiUrl(path)}: ${bodyText.slice(0, 120)}`);
  }
}

function niceLabel(label) {
  return String(label || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatMetric(value) {
  const n = toNumber(value);
  if (n === null) return String(value ?? '-');
  if (Math.abs(n) >= 100) return n.toFixed(1);
  return n.toFixed(2);
}

function KPIView({ result }) {
  if (!result || !result.rows || result.rows.length !== 1) return null;
  const row = result.rows[0];
  const numericEntries = Object.entries(row).filter(([, v]) => toNumber(v) !== null);
  if (numericEntries.length === 0) return null;

  return (
    <div className="kpi-grid">
      {numericEntries.slice(0, 4).map(([key, value]) => (
        <div key={key} className="kpi-card">
          <div className="kpi-label">{niceLabel(key)}</div>
          <div className="kpi-value">{formatMetric(value)}</div>
        </div>
      ))}
    </div>
  );
}

function buildChartData(result) {
  if (!result || !result.rows || result.rows.length === 0) {
    return null;
  }

  const columns = result.columns;
  const numericCol = columns.find((col) => result.rows.some((r) => toNumber(r[col]) !== null));
  if (!numericCol) return null;

  const labelCol = columns.find((col) => col !== numericCol) || columns[0];

  const rows = result.rows
    .map((r) => ({ label: String(r[labelCol] ?? '(vide)'), value: toNumber(r[numericCol]) }))
    .filter((r) => r.value !== null)
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  if (rows.length === 0) return null;

  const maxValue = Math.max(...rows.map((r) => r.value), 1);
  return { rows, maxValue, numericCol, labelCol };
}

function ChartView({ result }) {
  const chart = useMemo(() => buildChartData(result), [result]);
  if (!chart) {
    return <p className="muted">Visualisation indisponible pour ce resultat.</p>;
  }

  return (
    <div className="chart-wrap">
      <div className="chart-head">
        <strong>Visualisation</strong>
        <span>{chart.labelCol} vs {chart.numericCol}</span>
      </div>
      {chart.rows.map((row, idx) => {
        const width = `${(row.value / chart.maxValue) * 100}%`;
        return (
          <div key={`${row.label}-${idx}`} className="bar-row">
            <div className="bar-label" title={row.label}>{row.label}</div>
            <div className="bar-track">
              <div className="bar-fill" style={{ width }} />
            </div>
            <div className="bar-value">{row.value.toFixed(2)}</div>
          </div>
        );
      })}
    </div>
  );
}

function buildTreatmentHeatmap(result) {
  if (!result || result.id !== 'Q5' || !Array.isArray(result.rows)) return null;
  if (!result.columns.includes('subtype') || !result.columns.includes('treatmentType') || !result.columns.includes('avgSurvivalMonths')) {
    return null;
  }

  const subtypeSet = new Set();
  const treatmentSet = new Set();
  const matrix = new Map();
  let maxValue = 0;

  result.rows.forEach((row) => {
    const subtype = String(row.subtype || '').trim();
    const treatmentRaw = String(row.treatmentType || '').trim();
    const treatment = treatmentRaw.includes('#') ? treatmentRaw.split('#').pop() : treatmentRaw;
    const value = toNumber(row.avgSurvivalMonths);
    if (!subtype || !treatment || value === null) return;

    subtypeSet.add(subtype);
    treatmentSet.add(treatment);
    matrix.set(`${subtype}||${treatment}`, value);
    maxValue = Math.max(maxValue, value);
  });

  if (subtypeSet.size === 0 || treatmentSet.size === 0) return null;
  return {
    subtypes: Array.from(subtypeSet),
    treatments: Array.from(treatmentSet),
    matrix,
    maxValue: Math.max(1, maxValue)
  };
}

function TreatmentHeatmapView({ result }) {
  const data = useMemo(() => buildTreatmentHeatmap(result), [result]);
  if (!data) return null;
  const rowStyle = { gridTemplateColumns: `160px repeat(${data.treatments.length}, minmax(92px, 1fr))` };

  return (
    <div className="heatmap-wrap">
      <div className="chart-head">
        <strong>Heatmap Survie Moyenne</strong>
        <span>Sous-type PAM50 x Type de traitement</span>
      </div>
      <div className="heatmap-grid">
        <div className="heatmap-row header" style={rowStyle}>
          <div className="heatmap-cell label">Sous-type</div>
          {data.treatments.map((t) => (
            <div key={t} className="heatmap-cell header-cell">{t}</div>
          ))}
        </div>
        {data.subtypes.map((subtype) => (
          <div key={subtype} className="heatmap-row" style={rowStyle}>
            <div className="heatmap-cell label">{subtype}</div>
            {data.treatments.map((treatment) => {
              const value = data.matrix.get(`${subtype}||${treatment}`);
              const ratio = value ? value / data.maxValue : 0;
              const bg = value
                ? `rgba(17, 100, 102, ${0.15 + ratio * 0.8})`
                : 'rgba(180, 180, 180, 0.1)';
              return (
                <div key={`${subtype}-${treatment}`} className="heatmap-cell" style={{ background: bg }}>
                  {value ? value.toFixed(1) : '-'}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function buildRiskScatter(result) {
  if (!result || result.id !== 'Q12' || !Array.isArray(result.rows)) return null;
  if (!result.columns.includes('mutationCount') || !result.columns.includes('survivalMonths')) return null;

  const points = result.rows
    .map((r) => ({
      mutationCount: toNumber(r.mutationCount),
      survivalMonths: toNumber(r.survivalMonths),
      patient: String(r.p || '')
    }))
    .filter((p) => p.mutationCount !== null && p.survivalMonths !== null);

  if (points.length === 0) return null;
  const maxMut = Math.max(...points.map((p) => p.mutationCount), 1);
  const maxSurvival = Math.max(...points.map((p) => p.survivalMonths), 1);
  return { points, maxMut, maxSurvival };
}

function RiskScatterView({ result }) {
  const data = useMemo(() => buildRiskScatter(result), [result]);
  if (!data) return null;

  return (
    <div className="scatter-wrap">
      <div className="chart-head">
        <strong>Profil Haut Risque</strong>
        <span>Mutations (x) vs Survie en mois (y)</span>
      </div>
      <svg viewBox="0 0 640 260" className="scatter-svg" role="img" aria-label="Scatter plot high risk patients">
        <line x1="42" y1="220" x2="610" y2="220" stroke="#9fb0ba" strokeWidth="1.5" />
        <line x1="42" y1="28" x2="42" y2="220" stroke="#9fb0ba" strokeWidth="1.5" />
        {data.points.map((p, idx) => {
          const x = 42 + (p.mutationCount / data.maxMut) * 560;
          const y = 220 - (p.survivalMonths / data.maxSurvival) * 192;
          return (
            <circle key={`${p.patient}-${idx}`} cx={x} cy={y} r="5.3" fill="#b6415d">
              <title>{`${p.patient} | mutationCount=${p.mutationCount}, survivalMonths=${p.survivalMonths}`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="graph-help">Chaque point represente un patient candidat au profil haut risque.</div>
    </div>
  );
}

function buildCoMutationGraph(result) {
  if (!result || result.id !== 'Q9' || !Array.isArray(result.rows)) {
    return null;
  }

  const hasCols = result.columns.includes('geneA') && result.columns.includes('geneB') && result.columns.includes('coMutationCount');
  if (!hasCols) return null;

  const nodeMap = new Map();
  const edges = [];

  result.rows.forEach((row) => {
    const geneA = String(row.geneA || '').trim();
    const geneB = String(row.geneB || '').trim();
    const weight = toNumber(row.coMutationCount);
    if (!geneA || !geneB || weight === null || weight <= 0) return;

    if (!nodeMap.has(geneA)) nodeMap.set(geneA, { id: geneA, label: geneA });
    if (!nodeMap.has(geneB)) nodeMap.set(geneB, { id: geneB, label: geneB });

    edges.push({
      from: geneA,
      to: geneB,
      value: weight,
      label: String(weight),
      width: Math.max(1, Math.log2(weight + 1))
    });
  });

  if (edges.length === 0) return null;

  return {
    nodes: Array.from(nodeMap.values()),
    edges
  };
}

function CoMutationGraph({ result }) {
  const graphRef = React.useRef(null);
  const graphData = useMemo(() => buildCoMutationGraph(result), [result]);

  useEffect(() => {
    if (!graphRef.current || !graphData || !window.vis) return undefined;

    const nodes = new window.vis.DataSet(graphData.nodes);
    const edges = new window.vis.DataSet(graphData.edges);

    const options = {
      nodes: {
        shape: 'dot',
        size: 14,
        font: { face: 'Space Grotesk', color: '#0f2330', size: 14 },
        color: {
          background: '#2f9a8d',
          border: '#116466',
          highlight: { background: '#d9b08c', border: '#916e49' }
        }
      },
      edges: {
        color: { color: '#8fa6b1', highlight: '#116466' },
        smooth: { type: 'dynamic' },
        font: { size: 10, color: '#3f5563', strokeWidth: 0 },
        scaling: { min: 1, max: 10 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        navigationButtons: true,
        keyboard: true
      },
      physics: {
        enabled: true,
        stabilization: { iterations: 200 },
        barnesHut: {
          gravitationalConstant: -2500,
          springLength: 120,
          springConstant: 0.03,
          damping: 0.18
        }
      }
    };

    const network = new window.vis.Network(graphRef.current, { nodes, edges }, options);

    return () => network.destroy();
  }, [graphData]);

  if (!graphData) {
    return <p className="muted">Vue graphe disponible pour la requete Q9 (co-mutations).</p>;
  }

  return (
    <div className="graph-wrap">
      <div className="graph-head">
        <strong>Graphe des Co-mutations</strong>
        <span>{graphData.nodes.length} genes | {graphData.edges.length} interactions</span>
      </div>
      <div ref={graphRef} className="graph-canvas" />
      <div className="graph-help">Astuce: utilisez la molette pour zoomer et glisser-deposer pour deplacer le reseau.</div>
    </div>
  );
}

function GlossaryPanel() {
  return (
    <div className="glossary-wrap">
      <h3>Glossaire Medical</h3>
      <p className="muted">Definitions rapides des termes utilises dans les analyses.</p>
      <div className="glossary-list">
        {MEDICAL_GLOSSARY.map((item) => (
          <div key={item.terme} className="glossary-item">
            <div className="glossary-term">{item.terme}</div>
            <div className="glossary-def">{item.definition}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function App() {
  const [health, setHealth] = useState({ loading: true, ok: false });
  const [queries, setQueries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuery, setShowQuery] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [healthRes, listRes] = await Promise.all([
          fetchJson('/api/health'),
          fetchJson('/api/analytics')
        ]);

        setHealth({ loading: false, ...healthRes });
        setQueries(listRes.items || []);
        if ((listRes.items || []).length > 0) {
          setSelectedId(listRes.items[0].id);
        }
      } catch (e) {
        setHealth({ loading: false, ok: false, error: e.message });
      }
    }
    bootstrap();
  }, []);

  const selected = useMemo(
    () => queries.find((q) => q.id === selectedId),
    [queries, selectedId]
  );

  const details = useMemo(() => QUERY_DETAILS[selectedId] || null, [selectedId]);

  async function runQuery() {
    if (!selectedId) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await fetchJson(`/api/analytics/${selectedId}`);
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data);
    } catch (e) {
      setError(e.message || 'Erreur inconnue pendant execution de la requete');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="hero">
        <h1>Tableau de Bord d Analyses Oncologiques</h1>
        <p>Requetes SPARQL pretes a l emploi sur votre endpoint AllegroGraph.</p>
        <p>
          Statut endpoint:{' '}
          {health.loading
            ? 'verification...'
            : health.ok
            ? `en ligne (donnees: ${String(health.hasData)})`
            : `hors ligne (${health.error || 'inaccessible'})`}
        </p>
      </div>

      <div className="grid">
        <section className="panel">
          <h2>Requetes (Q1 a Q12)</h2>
          <div className="query-list">
            {queries.map((q) => {
              const overview = QUERY_OVERVIEW[q.id] || { nom: q.title, explication: q.category };
              return (
              <button
                key={q.id}
                className={`query-item ${q.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(q.id)}
                type="button"
              >
                <div className="query-title">{q.id} - {q.title}</div>
                <div className="query-name">{overview.nom}</div>
                <div className="query-explain">{overview.explication}</div>
                <div className="query-cat">{q.category}</div>
              </button>
              );
            })}
          </div>

          <GlossaryPanel />
        </section>

        <section className="panel">
          <h2>Resultats</h2>
          <div className="controls">
            <button disabled={!selectedId || loading} onClick={runQuery} type="button">
              {loading ? 'Execution...' : selected ? `Executer ${selected.id}` : 'Executer'}
            </button>
            <button type="button" onClick={() => setShowQuery((prev) => !prev)}>
              {showQuery ? 'Masquer SPARQL' : 'Voir SPARQL'}
            </button>
          </div>

          {details && (
            <div className="info-card">
              <h3>Signification Clinique</h3>
              <p><strong>Objectif:</strong> {details.objectif}</p>
              <p><strong>Interpretation:</strong> {details.interpretation}</p>
              <p><strong>Utilite clinique:</strong> {details.utilite}</p>
            </div>
          )}

          {showQuery && selected?.sparql && (
            <div className="query-box">
              <h3>Requete SPARQL</h3>
              <pre>{selected.sparql}</pre>
            </div>
          )}

          {error && <div className="error">Erreur: {error}</div>}

          {result && (
            <>
              <div className="stats">
                <span className="badge">lignes: {result.rowCount}</span>
                <span className="badge">duree: {result.durationMs} ms</span>
                <span className="badge">colonnes: {result.columns.length}</span>
              </div>

              <KPIView result={result} />

              <ChartView result={result} />

              <TreatmentHeatmapView result={result} />

              <RiskScatterView result={result} />

              {result.id === 'Q9' && <CoMutationGraph result={result} />}

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      {result.columns.map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.rows.map((row, idx) => (
                      <tr key={idx}>
                        {result.columns.map((col) => (
                          <td key={col}>{row[col] ?? ''}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
