import Review from '../models/review.js';
import Booking from '../models/booking.js';
import User from '../models/user.js';

const createReview = async (req, res) => {
    try {
        const { bookingId, seekerId, providerId, rating, comment, reviewDate } = req.body;

        if (!bookingId || !seekerId || !providerId || !rating || !reviewDate) {
            return res.status(400).json({ message: "Please fill all the required fields." });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        const newReview = new Review({
            bookingId,
            seekerId,
            ProviderId: providerId,
            rating,
            comment,
            reviewDate
        });

        await newReview.save();

        return res.status(201).json({
            message: "Review created successfully",
            review: newReview
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getReviewsByBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required." });
        }

        const review = await Review.findOne({ bookingId: bookingId })
            .populate('bookingId')
            .populate('seekerId')
            .populate('ProviderId');

        if (!review) {
            return res.status(404).json({ message: "No review found for this booking." });
        }

        return res.status(200).json({
            message: "Review retrieved successfully",
            review: review
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getReviewsForProvider = async (req, res) => {
    try {
        const { providerId } = req.params;

        if (!providerId) {
            return res.status(400).json({ message: "Provider ID is required." });
        }

        const reviews = await Review.find({ ProviderId: providerId })
            .populate('bookingId')
            .populate('seekerId')
            .populate('ProviderId');

        if (reviews.length === 0) {
            return res.status(404).json({ message: "No reviews found for this provider." });
        }

        const averageRating = (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2);

        return res.status(200).json({
            message: "Reviews retrieved successfully",
            count: reviews.length,
            averageRating: parseFloat(averageRating),
            reviews: reviews
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { rating, comment } = req.body;

        if (!reviewId) {
            return res.status(400).json({ message: "Review ID is required." });
        }

        if (rating && (rating < 1 || rating > 5)) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        const updatedReview = await Review.findByIdAndUpdate(
            reviewId,
            { rating, comment },
            { new: true }
        );

        if (!updatedReview) {
            return res.status(404).json({ message: "Review not found." });
        }

        return res.status(200).json({
            message: "Review updated successfully",
            review: updatedReview
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;

        if (!reviewId) {
            return res.status(400).json({ message: "Review ID is required." });
        }

        const deletedReview = await Review.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ message: "Review not found." });
        }

        return res.status(200).json({
            message: "Review deleted successfully",
            review: deletedReview
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export { createReview, getReviewsByBooking, getReviewsForProvider, updateReview, deleteReview };
