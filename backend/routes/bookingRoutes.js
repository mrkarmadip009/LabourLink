import express from 'express';
import { book, getBookingsBySeeker, getBookingsByListing, updateBookingStatus, updatePaymentStatus, deleteBooking } from '../controllers/bookingController.js';

const router = express.Router();

// Create a new booking
router.post('/', book);

// Get all bookings for a seeker
router.get('/seeker/:seekerId', getBookingsBySeeker);

// Get all bookings for a listing (provider)
router.get('/listing/:listingId', getBookingsByListing);

// Update booking status (accept/reject)
router.put('/:bookingId/status', updateBookingStatus);

// Update payment status
router.put('/:bookingId/payment', updatePaymentStatus);

// Delete a booking
router.delete('/:bookingId', deleteBooking);

export default router;
