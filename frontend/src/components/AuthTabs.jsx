function AuthTabs({ mode, onModeChange }) {
  const isRegistering = mode === 'register';

  return (
    <div className="mode-switch" role="tablist" aria-label="Account access">
      <button className={!isRegistering ? 'active' : ''} onClick={() => onModeChange('login')} role="tab" aria-selected={!isRegistering} type="button">Sign in</button>
      <button className={isRegistering ? 'active' : ''} onClick={() => onModeChange('register')} role="tab" aria-selected={isRegistering} type="button">Create account</button>
    </div>
  );
}

export default AuthTabs;
