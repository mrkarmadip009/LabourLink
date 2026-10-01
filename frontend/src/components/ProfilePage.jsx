import AppHeader from './AppHeader';
import { useState } from 'react';
import api, { getErrorMessage } from '../services/api';
import { getCurrentLocation } from '../services/geolocation';

function ProfilePage({ user, currentPage, onNavigate, onSignOut }) {
  const address = user.address || {};
  const [form, setForm] = useState({ name: user.name || '', email: user.email || '', mobile: user.mobile || '', street: address.street || '', city: address.city || '', state: address.state || '', zipCode: address.zipCode || '' });
  const [feedback, setFeedback] = useState(null);
  const [editing, setEditing] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const save = async (event) => {
    event.preventDefault();
    try {
      const { data } = await api.put('/api/users', { name: form.name, email: form.email, mobile: form.mobile, address: { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode }, location: user.location });
      localStorage.setItem('user', JSON.stringify(data.user));
      setFeedback({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
      window.location.reload();
    } catch (error) { setFeedback({ type: 'error', text: getErrorMessage(error, 'Could not update profile.') }); }
  };
  const captureLocation = async () => {
    setLocationStatus('Getting location...');
    try {
      const location = await getCurrentLocation();
      const { data } = await api.put('/api/users', { location });
      localStorage.setItem('user', JSON.stringify(data.user));
      setLocationStatus('Location saved. Nearby search is ready.');
      window.location.reload();
    } catch (error) {
      setLocationStatus(error.message || getErrorMessage(error, 'Could not save location.'));
    }
  };
  const deleteAccount = async () => {
    if (!window.confirm('Delete your LabourLink account? This cannot be undone.')) return;
    try {
      await api.delete('/api/users', { data: { username: user.username } });
      localStorage.clear();
      window.location.reload();
    } catch (error) { setFeedback({ type: 'error', text: getErrorMessage(error, 'Could not delete account.') }); }
  };
  return (
    <main className="app-page">
      <AppHeader {...{ user, currentPage, onNavigate, onSignOut }} />
      <section className="page-intro compact"><p className="eyebrow">Your account / 04</p><h1>Everything about<br /><em>your workday.</em></h1><p>Keep your contact details ready so every connection starts with confidence.</p></section>
      <section className="profile-panel"><div className="section-heading"><div><p className="eyebrow">Personal details</p><h2>{user.name || user.username}</h2></div><div><span className="profile-role">{user.role}</span><button className="text-action edit-button" type="button" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : 'Edit profile'}</button></div></div>
        {!editing ? <><div className="profile-grid"><div><span className="detail-label">Username</span><strong>@{user.username}</strong></div><div><span className="detail-label">Email</span><strong>{user.email}</strong></div><div><span className="detail-label">Mobile</span><strong>{user.mobile}</strong></div><div><span className="detail-label">Location</span><strong>{[address.city, address.state].filter(Boolean).join(', ') || 'Not provided'}</strong></div></div><div className="location-capture profile-location"><button className="secondary-button" type="button" onClick={captureLocation}>Use my current location</button><span>{locationStatus || (user.location?.coordinates ? 'GPS location saved' : 'Add GPS location for nearby search')}</span></div><button className="danger-action" type="button" onClick={deleteAccount}>Delete account</button></> : <form className="profile-form" onSubmit={save}><div className="field-row"><label><span>Full name</span><input name="name" value={form.name} onChange={update} required /></label><label><span>Mobile</span><input name="mobile" value={form.mobile} onChange={update} required /></label></div><label><span>Email</span><input name="email" type="email" value={form.email} onChange={update} required /></label><div className="field-row"><label><span>Street</span><input name="street" value={form.street} onChange={update} required /></label><label><span>City</span><input name="city" value={form.city} onChange={update} required /></label></div><div className="field-row"><label><span>State</span><input name="state" value={form.state} onChange={update} required /></label><label><span>Postal code</span><input name="zipCode" value={form.zipCode} onChange={update} required /></label></div>{feedback && <p className={`feedback ${feedback.type}`}>{feedback.text}</p>}<button className="submit-button" type="submit">Save changes <span>→</span></button></form>}
      </section>
    </main>
  );
}

export default ProfilePage;
