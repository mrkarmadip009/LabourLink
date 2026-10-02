import { useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import api, { getErrorMessage } from '../services/api';

function BookingsPage({ user, currentPage, onNavigate, onSignOut }) {
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState({});
  const [reviewForm, setReviewForm] = useState({});
  const [reviewFeedback, setReviewFeedback] = useState({});
  const userId = user.id || user._id;
  const [message, setMessage] = useState(userId ? 'Loading your bookings...' : 'Your account ID is not available. Please sign in again.');

  useEffect(() => {
    if (!userId) return undefined;
    api.get(`/api/bookings/seeker/${userId}`)
      .then(async ({ data }) => {
        const nextBookings = data.bookings || [];
        setBookings(nextBookings);
        const reviewResults = await Promise.all(nextBookings.map(async (booking) => {
          try {
            const response = await api.get(`/api/reviews/booking/${booking._id}`);
            return [booking._id, response.data.review];
          } catch {
            return [booking._id, null];
          }
        }));
        setReviews(Object.fromEntries(reviewResults));
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

  const submitReview = async (booking) => {
    const form = reviewForm[booking._id] || { rating: 5, comment: '' };
    try {
      const { data } = await api.post('/api/reviews', {
        bookingId: booking._id,
        seekerId: userId,
        rating: Number.parseInt(form.rating, 10),
        comment: form.comment.trim(),
      });
      setReviews((current) => ({ ...current, [booking._id]: data.review }));
      setReviewFeedback((current) => ({ ...current, [booking._id]: 'Review submitted.' }));
    } catch (error) {
      setReviewFeedback((current) => ({ ...current, [booking._id]: getErrorMessage(error, 'Could not submit review.') }));
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
            {booking.status === 'accepted' && booking.paymentStatus === 'completed' && (
              <div className="review-panel">
                <span className="detail-label">Review provider</span>
                {reviews[booking._id] ? (
                  <div className="review-summary"><strong>{'★'.repeat(reviews[booking._id].rating)}{'☆'.repeat(5 - reviews[booking._id].rating)}</strong><span>{reviews[booking._id].comment || 'No comment added.'}</span></div>
                ) : (
                  <>
                    <div className="review-fields">
                      <select value={reviewForm[booking._id]?.rating || 5} onChange={(event) => setReviewForm((current) => ({ ...current, [booking._id]: { ...(current[booking._id] || {}), rating: event.target.value } }))}>
                        {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} stars</option>)}
                      </select>
                      <input placeholder="How were the workers?" value={reviewForm[booking._id]?.comment || ''} onChange={(event) => setReviewForm((current) => ({ ...current, [booking._id]: { ...(current[booking._id] || {}), comment: event.target.value } }))} />
                      <button className="secondary-button" type="button" onClick={() => submitReview(booking)}>Submit review</button>
                    </div>
                    {reviewFeedback[booking._id] && <small className="review-feedback">{reviewFeedback[booking._id]}</small>}
                  </>
                )}
              </div>
            )}
          </article>
        ))}</div>
      </section>
    </main>
  );
}

export default BookingsPage;
