import { dashboardTitle } from '../src/dashboard';

const projects = [
  { name: 'Full House', progress: 68, next: 'Rough-in review', tone: 'sage' },
  { name: 'Bathroom', progress: 42, next: 'Waterproofing gate', tone: 'clay' },
  { name: 'Basement', progress: 24, next: 'Framing inspection', tone: 'gold' },
];

const actions = [
  { count: '04', label: 'Evidence reviews', detail: 'Two due before noon' },
  { count: '02', label: 'Material requests', detail: 'Tile and copper fittings' },
  { count: '01', label: 'Schedule conflict', detail: 'Shared plumbing crew' },
];

export default function HomePage() {
  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#" aria-label="URSAI home">
          <span className="brand-mark" aria-hidden="true">
            U
          </span>
          <span>URSAI</span>
        </a>
        <div className="status">
          <span className="status-dot" /> Foundation preview
        </div>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">Construction operations, clearly connected</p>
          <h1>Know what moved forward—and what needs you next.</h1>
          <p className="intro">
            URSAI brings field work, accepted evidence, material readiness, and project decisions
            into one dependable operating view.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#overview">
              View foundation dashboard
            </a>
            <span>No production systems connected</span>
          </div>
        </div>
        <aside className="today-card" aria-label="Today's focus">
          <div className="card-label">Today’s focus</div>
          <strong>7 decisions</strong>
          <p>Keep three active projects moving without losing the field context.</p>
          <div className="mini-row">
            <span>Data freshness</span>
            <b>Local preview</b>
          </div>
        </aside>
      </section>

      <section className="dashboard" id="overview" aria-labelledby="overview-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Portfolio overview</p>
            <h2 id="overview-title">{dashboardTitle}</h2>
          </div>
          <span className="date-chip">Planning workspace</span>
        </div>

        <div className="project-grid">
          {projects.map((project) => (
            <article className="project-card" key={project.name}>
              <div className={`project-icon ${project.tone}`} aria-hidden="true" />
              <div className="project-title-row">
                <h3>{project.name}</h3>
                <strong>{project.progress}%</strong>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label={`${project.name} accepted progress`}
                aria-valuenow={project.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${project.progress}%` }} />
              </div>
              <p>
                Next milestone <b>{project.next}</b>
              </p>
            </article>
          ))}
        </div>

        <div className="lower-grid">
          <section className="action-list" aria-labelledby="action-title">
            <div className="card-label" id="action-title">
              Requires attention
            </div>
            {actions.map((action) => (
              <div className="action-row" key={action.label}>
                <span className="action-count">{action.count}</span>
                <div>
                  <strong>{action.label}</strong>
                  <p>{action.detail}</p>
                </div>
                <span aria-hidden="true">→</span>
              </div>
            ))}
          </section>
          <aside className="principle-card">
            <p className="eyebrow">Built for trustworthy progress</p>
            <h2>Evidence first. Human accepted.</h2>
            <p>
              This foundation intentionally keeps purchasing, payments, supplier connections, and AI
              automation switched off.
            </p>
            <ul>
              <li>Tenant and project boundaries</li>
              <li>Offline-aware field workflows</li>
              <li>Auditable decisions and ledgers</li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
