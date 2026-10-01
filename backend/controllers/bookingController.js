import Booking from '../models/booking.js';
import User from '../models/user.js';
import LabourAvailability from '../models/labourAvailability.js';

const book = async (req, res) => {
    try {
        const { listingId, seekerId, totalLabours, maleLabours, femaleLabours, bookingDate, totalCost, description, status, paymentStatus} = req.body;

        if(!listingId || !seekerId || totalLabours === undefined || maleLabours === undefined || femaleLabours === undefined || !bookingDate || totalCost === undefined || !description || !status || !paymentStatus) {
            return res.status(400).json({ message: "Please fill all the fields." });
        }

        const listing = await LabourAvailability.findById(listingId).select('availabilityStart availabilityEnd availableLabours');
        if (!listing) {
            return res.status(404).json({ message: "Labour listing not found." });
        }

        const requestedDate = new Date(bookingDate);
        if (!listing.availabilityStart || !listing.availabilityEnd) {
            return res.status(400).json({ message: "This provider has not configured an availability date range." });
        }
        if (Number.isNaN(requestedDate.getTime())) {
            return res.status(400).json({ message: "Booking date is invalid." });
        }
        const requestedDateKey = requestedDate.toISOString().slice(0, 10);
        const startDateKey = listing.availabilityStart.toISOString().slice(0, 10);
        const endDateKey = listing.availabilityEnd.toISOString().slice(0, 10);
        if (requestedDateKey < startDateKey
            || requestedDateKey > endDateKey) {
            return res.status(400).json({ message: "Booking date must be within the provider's availability range." });
        }
        if (Number(totalLabours) > listing.availableLabours) {
            return res.status(409).json({ message: "The requested number of workers is not currently available." });
        }

        const newBooking = new Booking({
            listingId,
            seekerid: seekerId,
            totalLabours,
            maleLabours,
            femaleLabours,
            bookingDate,
            totalCost,
            description,
            status,
            paymentStatus
        });

        await newBooking.save();

        return res.status(201).json({
            message: "Booking created successfully",
            booking: newBooking
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};



const getBookingsBySeeker = async (req, res) => {
    try {
        const { seekerId } = req.params;

        if (!seekerId) {
            return res.status(400).json({ message: "Seeker ID is required." });
        }

        const bookings = await Booking.find({ seekerid: seekerId })
            .populate('listingId')
            .populate('seekerid');

        if (bookings.length === 0) {
            return res.status(404).json({ message: "No booking history found for this seeker." });
        }

        return res.status(200).json({
            message: "Booking history retrieved successfully",
            count: bookings.length,
            bookings: bookings
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const getBookingsByListing = async (req, res) => {
    try {
        const { listingId } = req.params;

        if (!listingId) {
            return res.status(400).json({ message: "Listing ID is required." });
        }

        const bookings = await Booking.find({ listingId: listingId })
            .populate('listingId')
            .populate('seekerid');

        if (bookings.length === 0) {
            return res.status(404).json({ message: "No bookings found for this listing." });
        }

        return res.status(200).json({
            message: "Bookings retrieved successfully",
            count: bookings.length,
            bookings: bookings
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const updateBookingStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { status } = req.body;

        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required." });
        }

        if (!status || !["pending", "accepted", "rejected"].includes(status)) {
            return res.status(400).json({ message: "Valid status (pending, accepted, rejected) is required." });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { status: status },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(status === "accepted" ? 409 : 404).json({
                message: status === "accepted"
                    ? "This booking is no longer pending."
                    : "Booking not found."
            });
        }

        if (status === "accepted" && updatedBooking.listingId && updatedBooking.totalLabours) {
            const listing = await LabourAvailability.findOneAndUpdate(
                {
                    _id: updatedBooking.listingId,
                    availableLabours: { $gte: updatedBooking.totalLabours }
                },
                { $inc: { availableLabours: -updatedBooking.totalLabours } },
                { new: true }
            );

            if (!listing) {
                await Booking.findByIdAndUpdate(bookingId, { status: "pending" }, { new: true });
                return res.status(409).json({
                    message: "Not enough available labour to accept this booking."
                });
            }
        }

        return res.status(200).json({
            message: status === "accepted"
                ? "Booking status updated successfully; labour availability updated."
                : "Booking status updated successfully",
            booking: updatedBooking
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const updatePaymentStatus = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { paymentStatus } = req.body;

        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required." });
        }

        if (!paymentStatus || !["pending", "completed"].includes(paymentStatus)) {
            return res.status(400).json({ message: "Valid payment status (pending, completed) is required." });
        }

        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId,
            { paymentStatus: paymentStatus },
            { new: true }
        );

        if (!updatedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        return res.status(200).json({
            message: "Payment status updated successfully",
            booking: updatedBooking
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

const deleteBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;

        if (!bookingId) {
            return res.status(400).json({ message: "Booking ID is required." });
        }

        const deletedBooking = await Booking.findByIdAndDelete(bookingId);

        if (!deletedBooking) {
            return res.status(404).json({ message: "Booking not found." });
        }

        if (deletedBooking.status === "accepted" && deletedBooking.listingId && deletedBooking.totalLabours) {
            await LabourAvailability.findByIdAndUpdate(
                deletedBooking.listingId,
                { $inc: { availableLabours: deletedBooking.totalLabours } },
                { new: true }
            );
        }

        return res.status(200).json({
            message: "Booking deleted successfully",
            booking: deletedBooking
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export { book, getBookingsBySeeker, getBookingsByListing, updateBookingStatus, updatePaymentStatus, deleteBooking };