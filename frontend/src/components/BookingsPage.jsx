import { useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import api, { getErrorMessage } from '../services/api';

function BookingsPage({ user, currentPage, onNavigate, onSignOut }) {
  const [bookings, setBookings] = useState([]);
  const userId = user.id || user._id;
  const [message, setMessage] = useState(userId ? 'Loading your bookings...' : 'Your account ID is not available. Please sign in again.');

  useEffect(() => {
    if (!userId) return undefined;
    api.get(`/api/bookings/seeker/${userId}`)
      .then(({ data }) => {
        setBookings(data.bookings || []);
        setMessage((data.bookings || []).length ? '' : 'You have no bookings yet.');
      })
      .catch((error) => setMessage(error.response?.status === 404 ? 'You have no bookings yet.' : getErrorMessage(error, 'Bookings could not be loaded.')));
  }, [userId]);

  const cancelBooking = async (bookingId) => {
    try {
      await api.delete(`/api/bookings/${bookingId}`);
      setBookings((current) => current.filter((booking) => booking._id !== bookingId));
    } catch (error) {
      setMessage(getErrorMessage(error, 'Could not cancel this booking.'));
    }
  };

  const updatePayment = async (bookingId) => {
    try {
      const { data } = await api.put(`/api/bookings/${bookingId}/payment`, { paymentStatus: 'completed' });
      setBookings((current) => current.map((booking) => booking._id === bookingId ? data.booking : booking));
    } catch (error) {
      setMessage(getErrorMessage(error, 'Could not update payment status.'));
    }
  };

  return (
    <main className="app-page">
      <AppHeader {...{ user, currentPage, onNavigate, onSignOut }} />
      <section className="page-intro compact"><p className="eyebrow">Your activity / 03</p><h1>Keep work<br /><em>moving forward.</em></h1><p>Track requests, confirmed jobs, and payment status in one place.</p></section>
      <section className="listing-section"><div className="section-heading"><div><p className="eyebrow">Booking history</p><h2>Your requests</h2></div></div>
        {message && <p className="page-message">{message}</p>}
        <div className="booking-list">{bookings.map((booking) => (
          <article className="booking-card" key={booking._id}>
            <div><span className="detail-label">Booking date</span><strong>{new Date(booking.bookingDate).toLocaleDateString()}</strong></div>
            <div><span className="detail-label">Request</span><strong>{booking.description}</strong></div>
            <div><span className="detail-label">Status</span><span className={`booking-status ${booking.status}`}>{booking.status}</span></div>
            <div><span className="detail-label">Total</span><strong>₹{booking.totalCost}</strong><span className={`booking-status ${booking.paymentStatus}`}>{booking.paymentStatus} payment</span></div>
            {booking.status === 'pending' && <button className="text-action" type="button" onClick={() => cancelBooking(booking._id)}>Cancel request</button>}
            {booking.status === 'accepted' && booking.paymentStatus === 'pending' && <button className="text-action" type="button" onClick={() => updatePayment(booking._id)}>Mark payment complete</button>}
          </article>
        ))}</div>
      </section>
    </main>
  );
}

export default BookingsPage;
