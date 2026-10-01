import { useState } from 'react';
import { getCurrentLocation } from '../services/geolocation';

function AuthForm({
  form,
  feedback,
  isRegistering,
  isSubmitting,
  showPassword,
  onChange,
  onSubmit,
  onTogglePassword,
  onSetLocation,
}) {
  const [locationStatus, setLocationStatus] = useState('');
  const captureLocation = async () => {
    setLocationStatus('Getting location...');
    try {
      onSetLocation(await getCurrentLocation());
      setLocationStatus('Location captured');
    } catch (error) {
      setLocationStatus(error.message);
    }
  };
  return (
    <form onSubmit={onSubmit} className="auth-form">
      {isRegistering && (
        <div className="field-row reveal">
          <label>
            <span>Full name</span>
            <input
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          </label>
          <label>
            <span>Mobile number</span>
            <input
              name="mobile"
              value={form.mobile}
              onChange={onChange}
              placeholder="10-digit number"
              inputMode="numeric"
              autoComplete="tel"
              required
            />
          </label>
        </div>
      )}
      <label>
        <span>Username</span>
        <input
          name="username"
          value={form.username}
          onChange={onChange}
          placeholder="Choose a username"
          autoComplete="username"
          required
        />
      </label>
      {isRegistering && (
        <label className="reveal">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>
      )}
      <label>
        <span>Password</span>
        <div className="password-field">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={onChange}
            placeholder={
              isRegistering
                ? "8+ chars, upper, lower, number, symbol"
                : "Enter your password"
            }
            autoComplete={isRegistering ? "new-password" : "current-password"}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={onTogglePassword}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
      </label>
      {isRegistering && (
        <>
          <label className="reveal">
            <span>Street address</span>
            <input
              name="street"
              value={form.address.street}
              onChange={onChange}
              placeholder="House number and street"
              autoComplete="street-address"
              required
            />
          </label>
          <div className="field-row reveal">
            <label>
              <span>City</span>
              <input
                name="city"
                value={form.address.city}
                onChange={onChange}
                placeholder="City"
                autoComplete="address-level2"
                required
              />
            </label>
            <label>
              <span>State</span>
              <input
                name="state"
                value={form.address.state}
                onChange={onChange}
                placeholder="State"
                autoComplete="address-level1"
                required
              />
            </label>
          </div>
          <div className="field-row reveal">
            <label>
              <span>Postal code</span>
              <input
                name="zipCode"
                value={form.address.zipCode}
                onChange={onChange}
                placeholder="Postal code"
                inputMode="numeric"
                autoComplete="postal-code"
                required
              />
            </label>
            <label>
              <span>I am joining as</span>
              <select name="role" value={form.role} onChange={onChange}>
                <option value="Seeker">Someone hiring</option>
                <option value="Provider">A service provider</option>
              </select>
            </label>
          </div>
          <div className="location-capture reveal">
            <button className="secondary-button" type="button" onClick={captureLocation}>
              Use my current location
            </button>
            <span>{locationStatus || 'Recommended for nearby labour search'}</span>
          </div>
        </>
      )}
      {feedback && (
        <p className={`feedback ${feedback.type}`} role="alert">
          {feedback.text}
        </p>
      )}
      <button className="submit-button" type="submit" disabled={isSubmitting}>
        <span>
          {isSubmitting
            ? "Please wait..."
            : isRegistering
              ? "Create account"
              : "Sign in"}
        </span>
        {!isSubmitting && (
          <span className="arrow" aria-hidden="true">
            -&gt;
          </span>
        )}
      </button>
    </form>
  );
}

export default AuthForm;
