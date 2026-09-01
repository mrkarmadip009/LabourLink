import express from 'express';
import { createReview, getReviewsByBooking, getReviewsForProvider, updateReview, deleteReview } from '../controllers/reviewController.js';

const router = express.Router();

// Create a new review
router.post('/', createReview);

// Get review by booking ID
router.get('/booking/:bookingId', getReviewsByBooking);

// Get all reviews for a provider
router.get('/provider/:providerId', getReviewsForProvider);

// Update a review
router.put('/:reviewId', updateReview);

// Delete a review
router.delete('/:reviewId', deleteReview);

export default router;
