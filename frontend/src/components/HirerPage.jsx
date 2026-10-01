import AppHeader from './AppHeader';

function HirerPage({ user, currentPage, onNavigate, onSignOut }) {
  const address = user.address || {};
  const location = [address.city, address.state].filter(Boolean).join(", ");

  return (
    <main className="hirer-page">
      <AppHeader {...{ user, currentPage, onNavigate, onSignOut }} />

      <section className="hirer-hero">
        <div>
          <p className="eyebrow">Hirer workspace / 01</p>
          <h1>
            Good morning,
            <br />
            <em>{user.name || user.username}.</em>
          </h1>
          <p className="hirer-intro">
            Your account is ready. Start by finding the people who can move your
            next job forward.
          </p>
        </div>
        <div className="account-seal">
          <span className="status-dot" />
          <strong>Account active</strong>
          <small>Ready to hire locally</small>
        </div>
      </section>

      <section className="hirer-content">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Your details</p>
            <h2>Account profile</h2>
          </div>
          <span className="profile-role">Hirer</span>
        </div>
        <div className="details-grid">
          <article className="detail-card">
            <span className="detail-label">Full name</span>
            <strong>{user.name || "Not provided"}</strong>
            <span className="detail-label">Username</span>
            <strong>@{user.username || "Not provided"}</strong>
          </article>
          <article className="detail-card">
            <span className="detail-label">Email address</span>
            <strong>{user.email || "Not provided"}</strong>
            <span className="detail-label">Mobile number</span>
            <strong>{user.mobile || "Not provided"}</strong>
          </article>
          <article className="detail-card">
            <span className="detail-label">Location</span>
            <strong>{location || "Not provided"}</strong>
            <span className="detail-label">Address</span>
            <strong>{address.street || "Not provided"}</strong>
          </article>
        </div>
      </section>

      <section className="hirer-next">
        <div>
          <p className="eyebrow">Next step</p>
          <h2>Find trusted help for your work.</h2>
          <p>
            Browse local labour availability by category, price, location, and
            gender.
          </p>
        </div>
        <button className="primary-action" type="button" onClick={() => onNavigate('find')}>
          Explore availability <span aria-hidden="true">-&gt;</span>
        </button>
      </section>
    </main>
  );
}

export default HirerPage;
