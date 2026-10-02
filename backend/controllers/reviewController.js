import Review from '../models/review.js';
import Booking from '../models/booking.js';
import LabourAvailability from '../models/labourAvailability.js';

const getReferenceId = (value) => {
    if (!value) return null;
    if (typeof value.toHexString === 'function') return value;
    if (value._id) return value._id;
    if (value.id) return value.id;
    return value;
};

const createReview = async (req, res) => {
    try {
        const { bookingId, seekerId: requestedSeekerId, rating, comment } = req.body;
        const hasRating = Object.prototype.hasOwnProperty.call(req.body, 'rating');
        const numericRating = rating === undefined || rating === null || rating === ''
            ? 5
            : Number(rating);

        if (!bookingId || !hasRating || !Number.isFinite(numericRating)) {
            return res.status(400).json({ message: "Please fill all the required fields." });
        }

        if (numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5." });
        }

        const booking = await Booking.findById(bookingId).populate({
            path: 'listingId',
            populate: { path: 'providerId' }
        });
        if (!booking) {
            return res.status(404).json({ message: "Booking not found." });
        }
        let rawBooking = null;
        let seekerId = getReferenceId(booking.seekerid || booking.seekerId);
        if (!seekerId) {
            rawBooking = await Booking.collection.findOne(
                { _id: booking._id },
                { projection: { seekerid: 1, seekerId: 1, listingId: 1, providerId: 1, providerid: 1 } }
            );
            seekerId = getReferenceId(rawBooking?.seekerid || rawBooking?.seekerId);
        }
        const bookingListing = booking.listingId;
        const populatedListing = bookingListing && bookingListing.providerId
            ? bookingListing
            : null;
        const listingId = getReferenceId(populatedListing || bookingListing || rawBooking?.listingId);
        let listing = populatedListing ||
            (listingId ? await LabourAvailability.findById(listingId).select('providerId') : null);
        let providerId = getReferenceId(listing?.providerId || booking.providerId || booking.providerid);
        if (!providerId && listingId) {
            const rawListing = await LabourAvailability.collection.findOne(
                { _id: listingId },
                { projection: { providerId: 1, providerid: 1 } }
            );
            providerId = getReferenceId(rawListing?.providerId || rawListing?.providerid);
            if (providerId && !listing) listing = rawListing;
        }
        if (!seekerId || !providerId) {
            if (listingId && !listing && !providerId) {
                return res.status(400).json({ message: "This booking's labour listing no longer exists, so the provider cannot be identified." });
            }
            const missing = [
                !seekerId && 'seeker',
                !listingId && 'listing',
                !providerId && 'provider'
            ].filter(Boolean).join(', ');
            return res.status(400).json({ message: `Booking is missing ${missing || 'seeker or provider'} information.` });
        }
        if (requestedSeekerId && String(seekerId) !== String(requestedSeekerId)) {
            return res.status(403).json({ message: "You can only review your own booking." });
        }
        if (booking.status !== "accepted" || booking.paymentStatus !== "completed") {
            return res.status(400).json({ message: "A review is allowed only after the booking is accepted and payment is completed." });
        }
        if (listing && String(getReferenceId(listing.providerId)) !== String(providerId)) {
            return res.status(400).json({ message: "The provider does not match this booking." });
        }
        const existingReview = await Review.findOne({ bookingId });
        if (existingReview) {
            return res.status(409).json({ message: "This booking has already been reviewed." });
        }

        const newReview = new Review({
            bookingId,
            seekerId,
            ProviderId: providerId,
            rating: numericRating,
            comment,
            reviewDate: new Date()
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
