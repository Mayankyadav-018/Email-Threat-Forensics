import {
  useEffect,
  useRef,
  useState,
} from "react";

const pageMeta = {
  overview: ['Security Overview', 'Monitor detected email threats and active investigations.'],
  detection: ['Threat Detection', 'Analyze a suspicious email and identify evidence of malicious activity.'],
  forensic: ['Forensic Investigation', 'Trace the infrastructure and relationships behind the detected threat.'],
  cases: ['Cases & Reports', 'Manage investigations and generate forensic reports.'],
}

const threatRows = [
  ['CRITICAL', 'Urgent payment required', 'finance@example-security.com', 'Business Email Compromise', '2 min ago', '91'],
  ['HIGH', 'Microsoft account verification', 'security@example-mail.com', 'Credential Phishing', '8 min ago', '87'],
  ['HIGH', 'Document shared with you', 'notify@example-mail.com', 'Malware', '15 min ago', '82'],
  ['MEDIUM', 'Invoice attached', 'billing@example-mail.com', 'Suspicious', '21 min ago', '64'],
]

const entityData = {
  email: ['Urgent payment required', 'SUSPICIOUS EMAIL', [['Threat', 'Business Email Compromise'], ['Sender', 'finance@example-security.com'], ['Score', '91 / 100'], ['Risk', 'CRITICAL'], ['Received', '10:31 AM']]],
  sender: ['finance@example-security.com', 'SENDER ADDRESS', [['Risk', 'SUSPICIOUS'], ['Reply-To', 'accounts@example-mail.com'], ['Authentication', 'DMARC failed'], ['Related Emails', '12'], ['Confidence', 'High']]],
  domain: ['example-security.com', 'DOMAIN', [['Risk', 'CRITICAL'], ['Type', 'Lookalike domain'], ['Related URLs', '5'], ['Related Cases', '3'], ['Confidence', 'High']]],
  url: ['example-security.com/login', 'URL', [['Risk', 'CRITICAL'], ['Status', 'Suspicious'], ['Domain', 'example-security.com'], ['Related Emails', '12'], ['Confidence', 'High']]],
  ip: ['185.xxx.xxx.xxx', 'IP ADDRESS', [['Risk', 'SUSPICIOUS'], ['Country', 'Germany'], ['City', 'Frankfurt'], ['ASN', 'AS12345'], ['Organization', 'Example Hosting'], ['Reputation', 'Suspicious'], ['Confidence', 'Medium']]],
  asn: ['AS12345', 'AUTONOMOUS SYSTEM', [['Organization', 'Example Hosting'], ['Country', 'Germany'], ['Connected IP', '185.xxx.xxx.xxx'], ['Related Domains', '3'], ['Confidence', 'Medium']]],
  location: ['Germany · Frankfurt', 'APPROXIMATE INFRASTRUCTURE LOCATION', [['Country', 'Germany'], ['City', 'Frankfurt'], ['Source', 'IP geolocation'], ['Connected IP', '185.xxx.xxx.xxx'], ['Confidence', 'Medium']]],
  related: ['Related Cases', 'CASE CORRELATION', [['Case', 'TR-2026-00118'], ['Case', 'TR-2026-00121'], ['Current Case', 'TR-2026-00124'], ['Shared IP', '185.xxx.xxx.xxx'], ['Confidence', 'High']]],
}

function Icon({ children, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

function NavIcon({ type }) {
  const shapes = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    detection: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.5-8 10-4.6-1.5-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    forensic: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="8" r="2.5" />
        <circle cx="12" cy="18" r="2.5" />
        <path d="m8.2 7.1 7.5.9M7.5 8l3.5 7.6m5.4-5.3-3.1 5.3" />
      </>
    ),
    cases: (
      <>
        <path d="M5 3h10l4 4v14H5z" />
        <path d="M15 3v5h5M8 12h8M8 16h8" />
      </>
    ),
    mail: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </>
    ),
    user: (
      <>
        <path d="M4 20v-1a4 4 0 0 1 4-4h3a4 4 0 0 1 4 4v1M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>
    ),
    link: (
      <>
        <path d="M10 14 14 10M8 17l-2 2a4 4 0 0 1-6-6l3-3a4 4 0 0 1 6 0M16 7l2-2a4 4 0 0 1 6 6l-3 3a4 4 0 0 1-6 0" />
      </>
    ),
    box: (
      <>
        <path d="M4 17V7l8-4 8 4v10l-8 4-8-4Z" />
        <path d="M4 7l8 4 8-4M12 11v10" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2" />
      </>
    ),
    doc: (
      <>
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8M8 13h5" />
      </>
    ),
  }

  return <Icon>{shapes[type]}</Icon>
}

const Badge = ({ children, tone = 'warning' }) => (
  <span className={`badge ${tone}`}>{children}</span>
)

const Panel = ({ children, className = '' }) => (
  <section className={`panel ${className}`}>{children}</section>
)

const Heading = ({ title, meta }) => (
  <div className="section-head">
    <h2>{title}</h2>
    {meta && <span className="section-meta">{meta}</span>}
  </div>
)

const Metric = ({ label, value, hint, tone }) => (
  <article className="metric-card">
    <span className="metric-label">{label}</span>
    <b className={`metric-value ${tone || ''}`}>{value}</b>
    <small>{hint}</small>
  </article>
)

const Button = ({ children, primary, className = '', ...rest }) => (
  <button
    {...rest}
    className={`btn ${primary ? 'btn-primary' : ''} ${className}`}
  >
    {children}
  </button>
)

function Sidebar({ active, change }) {
  return (
    <aside className="sidebar">
      <div className="brand">
        <b>TRACE</b>
        <span>EMAIL THREAT INTELLIGENCE</span>
      </div>

      <nav>
        {Object.keys(pageMeta).map((page) => (
          <button
            className={`nav-item ${active === page ? 'active' : ''}`}
            onClick={() => change(page)}
            key={page}
          >
            <NavIcon type={page} />
            <span>
              {page === 'overview'
                ? 'Overview'
                : page === 'detection'
                  ? 'Threat Detection'
                  : page === 'forensic'
                    ? 'Forensic Investigation'
                    : 'Cases & Reports'}
            </span>
          </button>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div>
          <span className="label">System Status</span>
          <p className="operational">
            <i />Operational
          </p>
        </div>

        <div className="analyst">
          <div className="avatar">AV</div>
          <div>
            <b>Arjun Verma</b>
            <small>Security Analyst</small>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Header({ page }) {
  const [title, description] = pageMeta[page]

  return (
    <header className="topbar">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>

      <div className="header-actions">
        <label className="search">
          <Icon>
            <circle cx="11" cy="11" r="6" />
            <path d="m16 16 4 4" />
          </Icon>
          <input
            aria-label="Search investigations"
            placeholder="Search cases or indicators"
          />
        </label>

        <button className="icon-button" aria-label="Notifications">
          <i />
          <Icon>
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
          </Icon>
        </button>

        <div className="header-analyst">
          <div className="avatar">AV</div>
          <span>Arjun Verma</span>
        </div>
      </div>
    </header>
  )
}

function Overview({ analysis, investigations }) {
  const score = analysis?.threatScore?.score ?? 0;
  const risk = analysis?.threatScore?.riskLevel ?? "NO ANALYSIS";

  const iocCount = analysis?.iocs
    ? Object.values(analysis.iocs).reduce(
        (total, items) =>
          total + (Array.isArray(items) ? items.length : 0),
        0
      )
    : 0;

  const correlationCount = analysis?.correlations?.length ?? 0;
  const graphNodes = analysis?.attackGraph?.nodes?.length ?? 0;
  const timelineEvents = analysis?.forensicTimeline?.length ?? 0;

  const riskClass =
    risk === "CRITICAL"
      ? "critical"
      : risk === "HIGH"
      ? "high"
      : risk === "MEDIUM"
      ? "medium"
      : "low";

  // Database-backed statistics
  const totalAnalyses = investigations?.length || 0;

  const criticalAnalyses =
    investigations?.filter(
      (item) =>
        item.threat_level === "critical" ||
        item.risk_level === "CRITICAL"
    ).length || 0;

  const highAnalyses =
    investigations?.filter(
      (item) =>
        item.threat_level === "high" ||
        item.risk_level === "HIGH"
    ).length || 0;

  const latestAnalysis = investigations?.[0] || analysis;

  const latestScore =
    latestAnalysis?.threatScore?.score ??
    analysis?.threatScore?.score ??
    0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <div className="eyebrow">SECURITY OPERATIONS</div>
          <h1>Overview</h1>
          <p>
            Real-time email threat analysis and forensic intelligence.
          </p>
        </div>

        <div className="status-indicator">
          <span className="status-dot"></span>
          ANALYSIS ENGINE ONLINE
        </div>
      </div>

      {!analysis ? (
        <div className="empty-state">
          <div className="empty-icon">+</div>

          <h2>No Analysis Yet</h2>

          <p>
            Upload a suspicious <strong>.eml</strong> file from Threat
            Detection to populate the dashboard.
          </p>

          {/* Still show database statistics if previous investigations exist */}
          {totalAnalyses > 0 && (
            <div className="overview-grid">
              <div className="metric-card">
                <span>TOTAL ANALYSES</span>
                <strong>{totalAnalyses}</strong>
                <small>Emails investigated</small>
              </div>

              <div className="metric-card">
                <span>CRITICAL</span>
                <strong>{criticalAnalyses}</strong>
                <small>Critical investigations</small>
              </div>

              <div className="metric-card">
                <span>HIGH RISK</span>
                <strong>{highAnalyses}</strong>
                <small>High-risk investigations</small>
              </div>

              <div className="metric-card">
                <span>LATEST SCORE</span>
                <strong>
                  {latestScore}
                  <small>/100</small>
                </strong>
                <small>Latest threat assessment</small>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* =========================
              DATABASE OVERVIEW METRICS
             ========================= */}

          <div className="overview-grid">

            <div className="metric-card">
              <span>TOTAL ANALYSES</span>
              <strong>{totalAnalyses}</strong>
              <small>Emails investigated</small>
            </div>

            <div className="metric-card">
              <span>CRITICAL</span>
              <strong>{criticalAnalyses}</strong>
              <small>Critical investigations</small>
            </div>

            <div className="metric-card">
              <span>HIGH RISK</span>
              <strong>{highAnalyses}</strong>
              <small>High-risk investigations</small>
            </div>

            <div className="metric-card">
              <span>LATEST SCORE</span>
              <strong>
                {latestScore}
                <small>/100</small>
              </strong>
              <div className={`risk-label ${riskClass}`}>
                {risk}
              </div>
            </div>

          </div>

          {/* =========================
              LATEST INVESTIGATION
             ========================= */}

          <div className="overview-columns">

            <section className="panel">
              <div className="panel-header">
                <div>
                  <div className="eyebrow">
                    LATEST INVESTIGATION
                  </div>

                  <h2>
                    Analysis #{analysis.analysisId}
                  </h2>
                </div>

                <div className={`risk-badge ${riskClass}`}>
                  {risk}
                </div>
              </div>

              <div className="email-overview">

                <div>
                  <span>FROM</span>
                  <strong>
                    {analysis.email?.from || "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>TO</span>
                  <strong>
                    {analysis.email?.to || "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>SUBJECT</span>
                  <strong>
                    {analysis.email?.subject || "Unknown"}
                  </strong>
                </div>

                <div>
                  <span>MESSAGE ID</span>
                  <strong>
                    {analysis.email?.messageId || "Unknown"}
                  </strong>
                </div>

              </div>
            </section>

            {/* =========================
                FORENSIC PIPELINE
               ========================= */}

            <section className="panel">

              <div className="panel-header">
                <div>
                  <div className="eyebrow">
                    FORENSIC ACTIVITY
                  </div>

                  <h2>Analysis Pipeline</h2>
                </div>
              </div>

              <div className="pipeline">

                <div className="pipeline-item done">
                  <span>01</span>

                  <div>
                    <strong>Email Parsed</strong>
                    <small>
                      Headers and content extracted
                    </small>
                  </div>
                </div>

                <div className="pipeline-item done">
                  <span>02</span>

                  <div>
                    <strong>IOC Extraction</strong>
                    <small>
                      {iocCount} indicators identified
                    </small>
                  </div>
                </div>

                <div className="pipeline-item done">
                  <span>03</span>

                  <div>
                    <strong>Threat Intelligence</strong>
                    <small>
                      Infrastructure analyzed
                    </small>
                  </div>
                </div>

                <div className="pipeline-item done">
                  <span>04</span>

                  <div>
                    <strong>Attack Graph</strong>
                    <small>
                      {graphNodes} entities mapped
                    </small>
                  </div>
                </div>

                <div className="pipeline-item done">
                  <span>05</span>

                  <div>
                    <strong>Forensic Timeline</strong>
                    <small>
                      {timelineEvents} events reconstructed
                    </small>
                  </div>
                </div>

              </div>
            </section>

          </div>

          {/* =========================
              THREAT ASSESSMENT
             ========================= */}

          <section className="panel threat-summary">

            <div className="panel-header">
              <div>
                <div className="eyebrow">
                  THREAT ASSESSMENT
                </div>

                <h2>Detection Factors</h2>
              </div>
            </div>

            <div className="reason-grid">

              {analysis.threatScore?.reasons?.length ? (
                analysis.threatScore.reasons.map(
                  (reason, index) => (
                    <div
                      className="reason-card"
                      key={index}
                    >
                      <strong>
                        {typeof reason === "string"
                          ? reason
                          : reason.reason ||
                            reason.description ||
                            "Threat factor"}
                      </strong>

                      {typeof reason !== "string" &&
                        reason.points != null && (
                          <span>
                            +{reason.points}
                          </span>
                        )}
                    </div>
                  )
                )
              ) : (
                <div className="reason-card">
                  No threat factors recorded.
                </div>
              )}

            </div>

          </section>

          {/* =========================
              RECENT INVESTIGATIONS
             ========================= */}

          <section className="panel recent-panel">

            <div className="panel-header">

              <div>
                <div className="eyebrow">
                  CASE ACTIVITY
                </div>

                <h2>Recent Investigations</h2>
              </div>

              <span className="investigation-count">
                {totalAnalyses} TOTAL
              </span>

            </div>

            <div className="recent-list">

              {investigations?.length === 0 ? (
                <div className="recent-empty">
                  No investigations recorded.
                </div>
              ) : (
                investigations
                  ?.slice(0, 5)
                  .map((item) => (
                    <div
                      className="recent-row"
                      key={item.id}
                    >

                      <div>
                        <strong>
                          Analysis #{item.id}
                        </strong>

                        <small>
                          {item.subject || "No subject"}
                        </small>
                      </div>

                      <div>
                        <small>FROM</small>

                        <span>
                          {item.sender || "Unknown"}
                        </span>
                      </div>

                      <div>
                        <small>STATUS</small>

                        <span className="status-online">
                          ANALYZED
                        </span>
                      </div>

                    </div>
                  ))
              )}

            </div>

          </section>
        </>
      )}
    </div>
  );
}

function ThreatChart() {
  return (
    <div className="chart">
      <svg
        viewBox="0 0 1100 210"
        role="img"
        aria-label="Malicious email activity over the last 30 days"
      >
        <g className="grid">
          <line x1="46" x2="1070" y1="22" y2="22" />
          <line x1="46" x2="1070" y1="70" y2="70" />
          <line x1="46" x2="1070" y1="118" y2="118" />
          <line x1="46" x2="1070" y1="166" y2="166" />
        </g>

        <g className="axis">
          <text x="9" y="25">18</text>
          <text x="9" y="73">12</text>
          <text x="15" y="121">6</text>
          <text x="17" y="169">0</text>
          <text x="46" y="196">Aug 02</text>
          <text x="286" y="196">Aug 09</text>
          <text x="526" y="196">Aug 16</text>
          <text x="766" y="196">Aug 23</text>
          <text x="1017" y="196">Aug 31</text>
        </g>

        <path
          className="area"
          d="M46 150 L81 143 L116 149 L151 132 L186 140 L221 119 L256 128 L291 116 L326 122 L361 106 L396 116 L431 89 L466 101 L501 110 L536 91 L571 103 L606 75 L641 85 L676 95 L711 73 L746 65 L781 78 L816 50 L851 63 L886 42 L921 55 L956 34 L991 40 L1026 24 L1062 33 L1062 166 L46 166 Z"
        />
        <path
          className="line"
          d="M46 150 L81 143 L116 149 L151 132 L186 140 L221 119 L256 128 L291 116 L326 122 L361 106 L396 116 L431 89 L466 101 L501 110 L536 91 L571 103 L606 75 L641 85 L676 95 L711 73 L746 65 L781 78 L816 50 L851 63 L886 42 L921 55 L956 34 L991 40 L1026 24 L1062 33"
        />
        <circle cx="1062" cy="33" r="4" />
      </svg>
    </div>
  )
}

function Detection({
  analysis,
  setAnalysis,
  notify,
}) {
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL ||
    "http://localhost:8787";

  async function analyzeFile(file) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".eml")) {
      notify("Only .eml files are supported.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      notify("Maximum file size is 10 MB.");
      return;
    }

    try {
      setLoading(true);

      notify(`Analyzing ${file.name}...`);

      const formData = new FormData();

      formData.append("file", file);

      const response = await fetch(
        `${API_BASE}/api/v1/analysis/email`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Email analysis failed."
        );
      }

      console.log(
        "REAL BACKEND RESPONSE:",
        data
      );

      setAnalysis(data);

      notify(
        `Email analyzed · Threat Score: ${data.threatScore.score} / 100`
      );
    } catch (error) {
      console.error(
        "Email upload error:",
        error
      );

      notify(
        error instanceof Error
          ? error.message
          : "Failed to analyze email."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(event) {
    const file =
      event.target.files?.[0];

    if (file) {
      analyzeFile(file);
    }

    event.target.value = "";
  }

  function handleDrop(event) {
    event.preventDefault();

    setDragging(false);

    const file =
      event.dataTransfer.files?.[0];

    if (file) {
      analyzeFile(file);
    }
  }

  const score =
    analysis?.threatScore?.score ?? null;

  const risk =
    analysis?.threatScore?.riskLevel ??
    null;

  const reasons =
    analysis?.threatScore?.reasons ?? [];

  const email =
    analysis?.email ?? {};

  const iocs =
    analysis?.iocs ?? {};

  const authentication =
    analysis?.authentication ?? {};

  const hasAnalysis =
    Boolean(analysis);

  return (
    <div
      className="page-content"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => {
        setDragging(false);
      }}
      onDrop={handleDrop}
    >
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            THREAT DETECTION
          </div>

          <h1>
            Analyze suspicious email
          </h1>

          <p>
            Upload a suspicious email and
            identify authentication failures,
            deceptive sending patterns, and
            malicious indicators.
          </p>
        </div>
      </div>

      <Panel>
        <div
          className={`upload-zone ${
            dragging ? "dragging" : ""
          }`}
        >
          <div className="upload-icon">
            ↑
          </div>

          <h2>
            {loading
              ? "Analyzing Email..."
              : "Analyze Email"}
          </h2>

          <p>
            {loading
              ? "The forensic engine is analyzing the uploaded email."
              : "Upload an email file to identify authentication failures, deceptive sending patterns, and malicious indicators."}
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".eml,message/rfc822"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          <div className="upload-actions">
            <Button
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={loading}
            >
              {loading
                ? "ANALYZING..."
                : "UPLOAD .EML"}
            </Button>

            <span>or</span>

            <Button
              variant="secondary"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={loading}
            >
              PASTE EMAIL
            </Button>
          </div>

          <small>
            Supported format: .eml · Maximum
            size: 10 MB
          </small>
        </div>
      </Panel>

      {hasAnalysis && (
        <>
          <div className="metrics-grid">
            <Metric
              label="THREAT SCORE"
              value={`${score} / 100`}
              sub={risk}
            />

            <Metric
              label="IOCs"
              value={
                iocs.ips.length +
                iocs.domains.length +
                iocs.urls.length
              }
              sub="Indicators"
            />

            <Metric
              label="CORRELATIONS"
              value={
                analysis.correlations?.length ??
                0
              }
              sub="Previous matches"
            />

            <Metric
              label="RISK LEVEL"
              value={risk}
              sub="Forensic assessment"
            />
          </div>

          <Panel>
            <Heading>
              Threat Assessment
            </Heading>

            <div className="threat-score-display">
              <div className="big-score">
                {score}
                <span>/100</span>
              </div>

              <Badge>
                {risk}
              </Badge>
            </div>

            <div className="score-reasons">
              {reasons.map(
                (reason, index) => (
                  <div
                    className="score-reason"
                    key={index}
                  >
                    <div>
                      <strong>
                        {reason.signal}
                      </strong>

                      <p>
                        {reason.description}
                      </p>
                    </div>

                    <strong>
                      +{reason.points}
                    </strong>
                  </div>
                )
              )}
            </div>
          </Panel>

          <Panel>
            <Heading>
              Email Details
            </Heading>

            <div className="detail-grid">
              <div>
                <span>FROM</span>
                <strong>
                  {email.sender || "—"}
                </strong>
              </div>

              <div>
                <span>REPLY-TO</span>
                <strong>
                  {email.replyTo || "—"}
                </strong>
              </div>

              <div>
                <span>TO</span>
                <strong>
                  {email.recipient || "—"}
                </strong>
              </div>

              <div>
                <span>SUBJECT</span>
                <strong>
                  {email.subject || "—"}
                </strong>
              </div>

              <div>
                <span>DATE</span>
                <strong>
                  {email.date || "—"}
                </strong>
              </div>

              <div>
                <span>MESSAGE-ID</span>
                <strong>
                  {email.messageId || "—"}
                </strong>
              </div>

              <div>
                <span>RETURN-PATH</span>
                <strong>
                  {email.returnPath || "—"}
                </strong>
              </div>
            </div>
          </Panel>

          <Panel>
            <Heading>
              Authentication
            </Heading>

            <div className="evidence-grid">
              <div>
                <span>SPF</span>
                <strong>
                  {authentication.spf
                    ?.join(" ") || "NOT FOUND"}
                </strong>
              </div>

              <div>
                <span>DKIM</span>
                <strong>
                  {authentication.dkim
                    ?.join(" ") || "NOT FOUND"}
                </strong>
              </div>

              <div>
                <span>DMARC</span>
                <strong>
                  {authentication.dmarc
                    ?.join(" ") || "NOT FOUND"}
                </strong>
              </div>

              <div>
                <span>AUTH RESULTS</span>
                <strong>
                  {authentication
                    .authenticationResults
                    ?.join(" ") ||
                    "NOT FOUND"}
                </strong>
              </div>
            </div>
          </Panel>

          <Panel>
            <Heading>
              Indicators of Compromise
            </Heading>

            <div className="ioc-section">
              <h3>
                IP Addresses
              </h3>

              {iocs.ips?.length ? (
                iocs.ips.map((ip) => (
                  <div
                    className="ioc-item"
                    key={ip}
                  >
                    {ip}
                  </div>
                ))
              ) : (
                <p>No IP addresses detected.</p>
              )}
            </div>

            <div className="ioc-section">
              <h3>
                Domains
              </h3>

              {iocs.domains?.length ? (
                iocs.domains.map(
                  (domain) => (
                    <div
                      className="ioc-item"
                      key={domain}
                    >
                      {domain}
                    </div>
                  )
                )
              ) : (
                <p>No domains detected.</p>
              )}
            </div>

            <div className="ioc-section">
              <h3>
                URLs
              </h3>

              {iocs.urls?.length ? (
                iocs.urls.map((url) => (
                  <div
                    className="ioc-item"
                    key={url}
                  >
                    {url}
                  </div>
                ))
              ) : (
                <p>No URLs detected.</p>
              )}
            </div>
          </Panel>
        </>
      )}

      {!hasAnalysis && !loading && (
        <Panel>
          <div className="empty-state">
            <h2>
              No email analyzed yet
            </h2>

            <p>
              Upload a .eml file above to
              start the forensic analysis.
            </p>
          </div>
        </Panel>
      )}
    </div>
  );
}

function Node({ id, title, sub, type, active, choose }) {
  return (
    <button
      className={`graph-node ${id} ${active === id ? 'active' : ''}`}
      onClick={() => choose(id)}
    >
      <span>
        <NavIcon type={type} />
      </span>
      <b>
        {title}
        <small>{sub}</small>
      </b>
    </button>
  )
}

function Forensic({ analysis }) {
  if (!analysis) {
    return (
      <div className="page-content">
        <div className="page-heading">
          <div>
            <div className="eyebrow">
              FORENSIC INVESTIGATION
            </div>

            <h1>Forensic Investigation</h1>

            <p>
              Analyze relationships between email
              infrastructure, indicators, and previous
              investigations.
            </p>
          </div>
        </div>

        <Panel>
          <div className="empty-state">
            <h2>No investigation available</h2>
            <p>
              Analyze an email from Threat Detection
              first.
            </p>
          </div>
        </Panel>
      </div>
    );
  }

  const {
    email,
    threatScore,
    attackGraph,
    geolocation,
    correlations,
    forensicTimeline,
    iocs,
  } = analysis;

  const nodes = attackGraph?.nodes ?? [];
  const edges = attackGraph?.edges ?? [];

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            FORENSIC INVESTIGATION
          </div>

          <h1>Forensic Investigation</h1>

          <p>
            Trace the infrastructure, indicators,
            relationships, and timeline associated
            with the analyzed email.
          </p>
        </div>
      </div>

      {/* CASE HEADER */}

      <div className="metrics-grid">
        <Metric
          label="ANALYSIS ID"
          value={`#${analysis.analysisId}`}
          sub="Current investigation"
        />

        <Metric
          label="THREAT SCORE"
          value={`${threatScore.score}/100`}
          sub={threatScore.riskLevel}
        />

        <Metric
          label="GRAPH NODES"
          value={nodes.length}
          sub="Infrastructure entities"
        />

        <Metric
          label="RELATIONSHIPS"
          value={edges.length}
          sub="Graph connections"
        />
      </div>

      {/* EMAIL SUMMARY */}

      <Panel>
        <Heading>Investigation Target</Heading>

        <div className="detail-grid">
          <div>
            <span>FROM</span>
            <strong>{email.sender || "—"}</strong>
          </div>

          <div>
            <span>TO</span>
            <strong>{email.recipient || "—"}</strong>
          </div>

          <div>
            <span>SUBJECT</span>
            <strong>{email.subject || "—"}</strong>
          </div>

          <div>
            <span>MESSAGE-ID</span>
            <strong>{email.messageId || "—"}</strong>
          </div>
        </div>
      </Panel>

      {/* ATTACK GRAPH */}

      <Panel>
        <Heading>Attack Graph</Heading>

        <p className="panel-description">
          Relationships extracted from the analyzed
          email and correlated infrastructure.
        </p>

        <div className="forensic-graph">
          {edges.map((edge, index) => {
            const source =
              nodes.find(
                (node) => node.id === edge.source
              );

            const target =
              nodes.find(
                (node) => node.id === edge.target
              );

            if (!source || !target) {
              return null;
            }

            return (
              <div
                className="graph-relationship"
                key={`${edge.source}-${edge.target}-${index}`}
              >
                <span className="graph-node-label">
                  {source.label}
                </span>

                <span className="graph-arrow">
                  →
                </span>

                <span className="graph-node-label">
                  {target.label}
                </span>

                <span className="graph-relationship-type">
                  {edge.relationship}
                </span>
              </div>
            );
          })}

          {!edges.length && (
            <div className="empty-state">
              No graph relationships detected.
            </div>
          )}
        </div>
      </Panel>

      {/* GRAPH ENTITIES */}

      <Panel>
        <Heading>Infrastructure Entities</Heading>

        <div className="entity-list">
          {nodes.map((node) => (
            <div
              className="entity-row"
              key={node.id}
            >
              <div>
                <span className="entity-type">
                  {node.type}
                </span>

                <strong>{node.label}</strong>
              </div>

              <span className="entity-id">
                {node.id}
              </span>
            </div>
          ))}

          {!nodes.length && (
            <div className="empty-state">
              No infrastructure entities found.
            </div>
          )}
        </div>
      </Panel>

      {/* GEOLOCATION */}

      <Panel>
        <Heading>IP Geolocation</Heading>

        <div className="entity-list">
          {geolocation?.map((geo) => (
            <div
              className="entity-row"
              key={geo.ip}
            >
              <div>
                <span className="entity-type">
                  IP ADDRESS
                </span>

                <strong>{geo.ip}</strong>
              </div>

              <div>
                <span>
                  {geo.city || "Unknown"},{" "}
                  {geo.country || "Unknown"}
                </span>

                <small>
                  {geo.isp || "ISP unavailable"}
                </small>
              </div>
            </div>
          ))}

          {!geolocation?.length && (
            <div className="empty-state">
              No geolocation information available.
            </div>
          )}
        </div>
      </Panel>

      {/* IOCs */}

      <Panel>
        <Heading>Indicators of Compromise</Heading>

        <div className="metrics-grid">
          <Metric
            label="IP ADDRESSES"
            value={iocs.ips?.length ?? 0}
            sub="Detected"
          />

          <Metric
            label="DOMAINS"
            value={iocs.domains?.length ?? 0}
            sub="Detected"
          />

          <Metric
            label="URLS"
            value={iocs.urls?.length ?? 0}
            sub="Detected"
          />

          <Metric
            label="PUBLIC IPS"
            value={iocs.publicIps?.length ?? 0}
            sub="External infrastructure"
          />
        </div>
      </Panel>

      {/* CORRELATIONS */}

      <Panel>
        <Heading>Related Intelligence</Heading>

        <div className="entity-list">
          {correlations?.map(
            (correlation, index) => (
              <div
                className="entity-row"
                key={index}
              >
                <div>
                  <span className="entity-type">
                    {correlation.type}
                  </span>

                  <strong>
                    {correlation.indicator}
                  </strong>
                </div>

                <div>
                  <span>
                    {correlation.relationship}
                  </span>

                  <small>
                    Previous email #
                    {correlation.previousEmailId}
                  </small>
                </div>

                <Badge>
                  {correlation.severity}
                </Badge>
              </div>
            )
          )}

          {!correlations?.length && (
            <div className="empty-state">
              No previous correlations found.
            </div>
          )}
        </div>
      </Panel>

      {/* FORENSIC TIMELINE */}

      <Panel>
        <Heading>Forensic Timeline</Heading>

        <div className="timeline">
          {forensicTimeline?.map(
            (event, index) => (
              <div
                className="timeline-item"
                key={index}
              >
                <div className="timeline-time">
                  {event.timestamp}
                </div>

                <div className="timeline-content">
                  <strong>
                    {event.event}
                  </strong>

                  <p>
                    {event.description}
                  </p>
                </div>
              </div>
            )
          )}

          {!forensicTimeline?.length && (
            <div className="empty-state">
              No forensic events detected.
            </div>
          )}
        </div>
      </Panel>
    </div>
  );
}

function Cases({
  analysis,
}) {
  const score =
    analysis?.threatScore?.score ?? 0;

  const risk =
    analysis?.threatScore?.riskLevel ??
    "UNKNOWN";

  const email =
    analysis?.email ?? {};

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            CASES & REPORTS
          </div>

          <h1>Cases & Reports</h1>

          <p>
            Review analyzed emails and
            forensic investigation reports.
          </p>
        </div>
      </div>

      <div className="metrics-grid">
        <Metric
          label="TOTAL ANALYSES"
          value={
            analysis ? "1" : "0"
          }
          sub="Current session"
        />

        <Metric
          label="CRITICAL"
          value={
            risk === "CRITICAL"
              ? "1"
              : "0"
          }
          sub="Current analysis"
        />

        <Metric
          label="THREAT SCORE"
          value={
            analysis
              ? `${score}/100`
              : "—"
          }
          sub={risk}
        />

        <Metric
          label="REPORTS"
          value={
            analysis ? "1" : "0"
          }
          sub="Available"
        />
      </div>

      <Panel>
        <Heading>
          Investigations
        </Heading>

        {!analysis ? (
          <div className="empty-state">
            <h2>
              No investigations yet
            </h2>

            <p>
              Upload an email from Threat
              Detection to create an
              investigation.
            </p>
          </div>
        ) : (
          <div className="case-list">
            <div className="case-row">
              <div>
                <span className="entity-type">
                  ANALYSIS #{analysis.analysisId}
                </span>

                <strong>
                  {email.subject ||
                    "Untitled email"}
                </strong>

                <small>
                  {email.sender ||
                    "Unknown sender"}
                </small>
              </div>

              <div>
                <span>
                  {email.date || "—"}
                </span>
              </div>

              <Badge>
                {risk}
              </Badge>

              <strong>
                {score}/100
              </strong>
            </div>
          </div>
        )}
      </Panel>

      {analysis && (
        <Panel>
          <Heading>
            Investigation Report
          </Heading>

          <div className="report-summary">
            <div>
              <span>CASE</span>
              <strong>
                #{analysis.analysisId}
              </strong>
            </div>

            <div>
              <span>RISK</span>
              <strong>{risk}</strong>
            </div>

            <div>
              <span>SCORE</span>
              <strong>
                {score}/100
              </strong>
            </div>

            <div>
              <span>SUBJECT</span>
              <strong>
                {email.subject || "—"}
              </strong>
            </div>
          </div>

          <div className="report-reasons">
            <h3>
              Detection Summary
            </h3>

            {analysis.threatScore?.reasons?.map(
              (reason, index) => (
                <div
                  className="score-reason"
                  key={index}
                >
                  <div>
                    <strong>
                      {reason.signal}
                    </strong>

                    <p>
                      {reason.description}
                    </p>
                  </div>

                  <strong>
                    +{reason.points}
                  </strong>
                </div>
              )
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}

function CaseInfo({ title, children }) {
  return (
    <section className="case-info">
      <h3>{title}</h3>
      <div>{children}</div>
    </section>
  )
}

function Footer({
  hint,
  secondary,
  primary,
  onSecondary,
  onPrimary,
}) {
  return (
    <div className="workflow-footer">
      <span>{hint}</span>
      <div className="button-row">
        <Button onClick={onSecondary}>{secondary}</Button>
        <Button primary onClick={onPrimary}>
          {primary} <span>→</span>
        </Button>
      </div>
    </div>
  )
}

function Report({ close }) {
  return (
    <div
      className="report-modal"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.currentTarget === e.target && close()}
    >
      <article className="report">
        <header>
          <span>Forensic Report Preview</span>
          <div className="button-row">
            <Button onClick={() => window.print()}>PRINT / SAVE PDF</Button>
            <Button
              className="close"
              aria-label="Close report"
              onClick={close}
            >
              ×
            </Button>
          </div>
        </header>

        <main>
          <b className="report-brand">TRACE</b>
          <span className="report-classification">
            CONFIDENTIAL · FORENSIC INVESTIGATION REPORT
          </span>
          <h2>Suspected Business Email Compromise</h2>
          <p>Case TR-2026-00124 · Generated 31 Aug 2026</p>

          <div className="report-metrics">
            <span>
              Severity <b className="critical">CRITICAL</b>
            </span>
            <span>
              Threat Score <b>91 / 100</b>
            </span>
            <span>
              Status <b>OPEN</b>
            </span>
          </div>

          {[
            [
              'Case Information',
              'Case TR-2026-00124 documents analysis of a suspected Business Email Compromise email received by employee@company.com on 31 Aug 2026 at 10:31 AM.',
            ],
            [
              'Executive Summary',
              'The email presented a time-sensitive payment request using a deceptive sending identity. Authentication and infrastructure signals substantiate a high-confidence risk determination.',
            ],
            [
              'Key Findings',
              'DMARC and SPF authentication failed. Reply-To address does not match the sender identity. example-security.com was identified as a lookalike domain.',
            ],
            [
              'Email Analysis',
              'From: finance@example-security.com · Reply-To: accounts@example-mail.com · Subject: Urgent payment required',
            ],
            [
              'Indicators of Compromise',
              'IP 185.xxx.xxx.xxx · Domain example-security.com · URL example-security.com/login',
            ],
            [
              'Infrastructure Intelligence',
              'IP 185.xxx.xxx.xxx is associated with AS12345 (Example Hosting). Approximate infrastructure location: Frankfurt, Germany.',
            ],
            [
              'Correlation',
              'Related case references: TR-2026-00118 and TR-2026-00121.',
            ],
            [
              'Investigation Timeline',
              '10:31 Email received · 10:34 Threat correlation completed.',
            ],
            [
              'Analyst Notes',
              'Hold all payment instructions from the sender pending out-of-band verification via a trusted channel.',
            ],
          ].map(([title, text]) => (
            <section key={title}>
              <h3>{title}</h3>
              <p>{text}</p>
            </section>
          ))}
        </main>
      </article>
    </div>
  )
}

export default function App() {
  const [analysis, setAnalysis] = useState(null);
  const [investigations, setInvestigations] = useState([]);

useEffect(() => {
  const loadInvestigations = async () => {
    try {
      const API_BASE =
        import.meta.env.VITE_API_BASE_URL ||
        "http://localhost:8787";

      const response = await fetch(
        `${API_BASE}/api/v1/investigations`
      );

      const data = await response.json();

      if (data.success) {
        setInvestigations(data.investigations || []);
      }
    } catch (error) {
      console.error("Failed to load investigations:", error);
    }
  };

  loadInvestigations();
}, [analysis]);
  const [page, setPage] = useState('overview')
  const [toast, setToast] = useState('')
  const [report, setReport] = useState(false)


  const navigate = (next) => {
    setPage(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const notify = (message) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <div className="app">
      <Sidebar active={page} change={navigate} />

      <main className="main">
        <Header page={page} />

        <div className="content">
          {page === 'overview' && <Overview navigate={navigate} analysis={analysis} investigations={investigations}/>}
          {page === 'detection' && (
            <Detection navigate={navigate} analysis={analysis} setAnalysis={setAnalysis}notify={notify} />
          )}
          {page === 'forensic' && (
            <Forensic
              navigate={navigate}
              notify={notify}
              analysis={analysis}
              report={() => setReport(true)}
            />
          )}
          {page === 'cases' && (
            <Cases
              notify={notify}
              analysis={analysis}
              report={() => setReport(true)}
            />
          )}
        </div>
      </main>

      {report && <Report close={() => setReport(false)} />}

      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}