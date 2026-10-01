function AppHeader({ user, currentPage, onNavigate, onSignOut }) {
  const links = user.role === 'Provider'
    ? [{ id: 'dashboard', label: 'My listing' }, { id: 'profile', label: 'Profile' }]
    : [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'find', label: 'Find labour' },
        { id: 'bookings', label: 'Bookings' },
        { id: 'profile', label: 'Profile' },
      ];

  return (
    <header className="app-header">
      <button className="app-brand" type="button" onClick={() => onNavigate('dashboard')}>
        <span className="brand-mark">LL</span>
        <span>LabourLink</span>
      </button>
      <nav className="app-nav" aria-label="Main navigation">
        {links.map((link) => (
          <button
            className={currentPage === link.id ? 'active' : ''}
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
          >
            {link.label}
          </button>
        ))}
      </nav>
      <button className="sign-out-button" type="button" onClick={onSignOut}>Sign out</button>
    </header>
  );
}

export default AppHeader;
