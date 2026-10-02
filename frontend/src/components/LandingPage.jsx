function LandingPage({ onGetStarted }) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="landing-brand">
          <span className="brand-mark">LL</span>
          <span>LabourLink</span>
        </div>
        <button className="landing-login" type="button" onClick={() => onGetStarted('login')}>
          Sign in
        </button>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero-copy">
          <p className="eyebrow">A better way to get work done</p>
          <h1>Find the right people for <em>the work ahead.</em></h1>
          <p className="landing-lead">
            LabourLink brings local labour providers and seekers together,
            making it easier to find trusted workers and meaningful work.
          </p>
          <div className="landing-actions">
            <button className="submit-button" type="button" onClick={() => onGetStarted('register')}>
              <span>Get started</span><span className="arrow">-&gt;</span>
            </button>
            <button className="landing-text-action" type="button" onClick={() => onGetStarted('login')}>
              I already have an account
            </button>
          </div>
        </div>
        <div className="landing-hero-art" aria-label="LabourLink platform highlights">
          <div className="landing-art-circle" />
          <div className="landing-art-card landing-art-card-main">
            <span className="art-label">LabourLink</span>
            <strong>Good work<br /><em>finds its way.</em></strong>
            <span className="art-line" />
            <small>Local people. Reliable work.</small>
          </div>
          <div className="landing-art-card landing-art-card-small">
            <span className="status-dot" />
            <span><strong>Trusted connections</strong><small>Built around your community</small></span>
          </div>
        </div>
      </section>

      <section className="landing-features" aria-label="Platform benefits">
        <article><span>01</span><h2>Find locally</h2><p>Discover workers and opportunities close to where the work happens.</p></article>
        <article><span>02</span><h2>Book clearly</h2><p>See availability, categories, pricing, and dates before you commit.</p></article>
        <article><span>03</span><h2>Work confidently</h2><p>Keep requests, payments, and reviews together in one simple place.</p></article>
      </section>
    </main>
  );
}

export default LandingPage;
