import { useCallback, useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import api, { getErrorMessage } from '../services/api';

function LabourSearchPage({ user, currentPage, onNavigate, onSignOut }) {
  const [listings, setListings] = useState([]);
  const [status, setStatus] = useState('Loading nearby listings...');
  const [selected, setSelected] = useState(null);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({ radius: '25', date: '', gender: '', categoryId: '', minPrice: '', maxPrice: '' });

  useEffect(() => {
    api.get('/api/labour-availability/categories').then(({ data }) => setCategories(data.categories || [])).catch(() => {});
  }, []);

  const loadListings = useCallback(() => {
    setStatus('Loading nearby listings...');
    const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    api.get(`/api/labour-availability?${params}`).then(({ data }) => {
      setListings(data.labourLists || []);
      setStatus((data.labourLists || []).length ? '' : 'No listings found nearby yet.');
    }).catch((error) => {
      setStatus(getErrorMessage(error, 'Listings could not be loaded. Please try again.'));
    });
  }, [filters]);

  useEffect(() => { loadListings(); }, [loadListings]);
  const updateFilter = (event) => setFilters({ ...filters, [event.target.name]: event.target.value });

  return (
    <main className="app-page">
      <AppHeader {...{ user, currentPage, onNavigate, onSignOut }} />
      <section className="page-intro">
        <p className="eyebrow">Local talent / 02</p>
        <h1>Find the right<br /><em>hands for the job.</em></h1>
        <p>Browse available labour near your registered location and connect with dependable people.</p>
      </section>
      <section className="listing-section">
        <form className="filters-bar" onSubmit={(event) => { event.preventDefault(); loadListings(); }}>
          <label><span>Radius (km)</span><input name="radius" type="number" min="1" value={filters.radius} onChange={updateFilter} /></label>
          <label><span>Work date</span><input name="date" type="date" value={filters.date} onChange={updateFilter} /></label>
          <label><span>Gender</span><select name="gender" value={filters.gender} onChange={updateFilter}><option value="">Any</option><option value="male">Men</option><option value="female">Women</option></select></label>
          <label><span>Category</span><select name="categoryId" value={filters.categoryId} onChange={updateFilter}><option value="">All skills</option>{categories.map((category) => <option value={category._id} key={category._id}>{category.categoryName}</option>)}</select></label>
          <label><span>Min rate</span><input name="minPrice" type="number" min="0" value={filters.minPrice} onChange={updateFilter} /></label>
          <label><span>Max rate</span><input name="maxPrice" type="number" min="0" value={filters.maxPrice} onChange={updateFilter} /></label>
          <button className="submit-button filter-submit" type="submit">Apply filters</button>
        </form>
        <div className="section-heading"><div><p className="eyebrow">Available now</p><h2>Nearby listings</h2></div><span className="profile-role">{listings.length} results</span></div>
        {status && <p className="page-message">{status}{status.includes('location') && <button className="text-action" type="button" onClick={() => onNavigate('profile')}> Add it in Profile →</button>}</p>}
        <div className="listing-grid">
          {listings.map((listing) => (
            <article className="listing-card" key={listing._id}>
              <div className="listing-card-top"><span className="profile-role">Available</span><strong>{listing.availableLabours} people</strong></div>
              <button className="listing-title" type="button" onClick={() => setSelected({ ...listing, detailsOnly: true })}><h3>{listing.providerId?.name || 'Local provider'}</h3></button>
              <p>{listing.categories?.map((category) => category.categoryId?.categoryName).filter(Boolean).join(" · ") || listing.description || 'Reliable labour for your upcoming work.'}</p>
              <div className="listing-meta"><span>{listing.gender?.male || 0} men · {listing.gender?.female || 0} women</span><button className="text-action" type="button" onClick={() => setSelected(listing)}>Request labour →</button></div>
            </article>
          ))}
        </div>
      </section>
      {selected && (selected.detailsOnly ? <ListingDetails listing={selected} onBook={() => setSelected({ ...selected, detailsOnly: false })} onClose={() => setSelected(null)} /> : <BookingDialog listing={selected} user={user} onClose={() => setSelected(null)} />)}
    </main>
  );
}

function ListingDetails({ listing, onBook, onClose }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="modal-card"><button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow">Listing details</p><h2>{listing.providerId?.name || 'Local provider'}</h2><p>{listing.description || 'Reliable labour for your upcoming work.'}</p><div className="profile-grid detail-modal-grid"><div><span className="detail-label">Available workers</span><strong>{listing.availableLabours}</strong></div><div><span className="detail-label">Gender split</span><strong>{listing.gender?.male || 0} men · {listing.gender?.female || 0} women</strong></div><div><span className="detail-label">Categories and rates</span><strong>{listing.categories?.map((category) => `${category.categoryId?.categoryName || "Labour"}: ₹${category.priceRate}/day`).join(" · ") || "On request"}</strong></div><div><span className="detail-label">Available dates</span><strong>{listing.availabilityStart && listing.availabilityEnd ? `${new Date(listing.availabilityStart).toLocaleDateString()} – ${new Date(listing.availabilityEnd).toLocaleDateString()}` : 'Dates not configured'}</strong></div></div><button className="submit-button" type="button" onClick={onBook}>Request these workers <span>→</span></button></section>
  </div>;
}

function BookingDialog({ listing, user, onClose }) {
  const [form, setForm] = useState({ regularLabours: 0, categoryLabours: Object.fromEntries((listing.categories || []).map((category) => [category.categoryId?._id || category.categoryId, 0])), maleLabours: 0, femaleLabours: 0, bookingDate: '', description: '' });
  const regularAvailable = listing.regularLabours ?? listing.availableLabours;
  const [feedback, setFeedback] = useState(null);
  const [saving, setSaving] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  const requestedTotal = Math.max(Number(form.regularLabours || 0), ...Object.values(form.categoryLabours).map((count) => Number(count || 0)));
  const estimatedCost = Number(form.regularLabours || 0) * Number(listing.regularLabourPrice || 0)
    + (listing.categories || []).reduce((sum, category) => {
      const id = category.categoryId?._id || category.categoryId;
      return sum + Number(form.categoryLabours[id] || 0) * Number(category.priceRate || 0);
    }, 0);
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      if (listing.availabilityStart && listing.availabilityEnd) {
        const selectedDate = form.bookingDate;
        const startDate = listing.availabilityStart.slice(0, 10);
        const endDate = listing.availabilityEnd.slice(0, 10);
        if (selectedDate < startDate || selectedDate > endDate) {
          throw new Error(`Choose a date between ${new Date(listing.availabilityStart).toLocaleDateString()} and ${new Date(listing.availabilityEnd).toLocaleDateString()}.`);
        }
        if (Number(form.maleLabours) > Number(listing.gender?.male || 0)
          || Number(form.femaleLabours) > Number(listing.gender?.female || 0)) {
          throw new Error(`This listing has ${listing.gender?.male || 0} men and ${listing.gender?.female || 0} women available per service day.`);
        }
      }
      await api.post('/api/bookings', {
        listingId: listing._id, seekerId: user.id || user._id,
        totalLabours: requestedTotal, regularLabours: Number(form.regularLabours),
        categoryLabours: Object.entries(form.categoryLabours).map(([categoryId, labourCount]) => ({ categoryId, labourCount: Number(labourCount) })),
        maleLabours: Number(form.maleLabours), femaleLabours: Number(form.femaleLabours), totalCost: estimatedCost,
        bookingDate: form.bookingDate, description: form.description,
        status: 'pending', paymentStatus: 'pending',
      });
      setFeedback({ type: 'success', text: 'Your booking request has been sent.' });
      setTimeout(onClose, 900);
    } catch (error) {
      setFeedback({ type: 'error', text: getErrorMessage(error, 'Could not create booking.') });
    } finally { setSaving(false); }
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <form className="modal-card" onSubmit={submit}><button className="modal-close" type="button" onClick={onClose}>×</button><p className="eyebrow">New request</p><h2>Book {listing.providerId?.name || 'this provider'}</h2>
      <div className="booking-price-summary"><span>Unique workers requested</span><strong>{requestedTotal} / {listing.availableLabours}</strong><span>Estimated bill</span><strong>₹{estimatedCost}</strong></div>
      <div className="field-row"><label><span>Regular workers · ₹{listing.regularLabourPrice || 0}/day</span><input name="regularLabours" type="number" min="0" max={regularAvailable} value={form.regularLabours} onChange={update} required /></label><label><span>Date</span><input name="bookingDate" type="date" min={listing.availabilityStart?.slice(0, 10)} max={listing.availabilityEnd?.slice(0, 10)} value={form.bookingDate} onChange={update} required /></label></div>
      {(listing.categories || []).map((category) => {
        const id = category.categoryId?._id || category.categoryId;
        return <label key={id}><span>{category.categoryId?.categoryName || 'Category'} workers · ₹{category.priceRate}/day</span><input type="number" min="0" max={category.labourCount} value={form.categoryLabours[id] || 0} onChange={(event) => setForm({ ...form, categoryLabours: { ...form.categoryLabours, [id]: event.target.value } })} /></label>;
      })}
      <div className="field-row"><label><span>Men (max {listing.gender?.male || 0})</span><input name="maleLabours" type="number" min="0" max={listing.gender?.male || 0} value={form.maleLabours} onChange={update} required /></label><label><span>Women (max {listing.gender?.female || 0})</span><input name="femaleLabours" type="number" min="0" max={listing.gender?.female || 0} value={form.femaleLabours} onChange={update} required /></label></div>
      <label><span>Describe the work</span><textarea name="description" value={form.description} onChange={update} rows="4" required /></label>
      {feedback && <p className={`feedback ${feedback.type}`}>{feedback.text}</p>}<button className="submit-button" type="submit" disabled={saving}>{saving ? 'Sending...' : 'Send request'} <span>→</span></button>
    </form>
  </div>;
}

export default LabourSearchPage;
