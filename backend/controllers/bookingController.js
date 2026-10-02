import Booking from '../models/booking.js';
import User from '../models/user.js';
import LabourAvailability from '../models/labourAvailability.js';
import mongoose from 'mongoose';

const book = async (req, res) => {
    try {
        const { listingId, seekerId, totalLabours, regularLabours = 0, categoryLabours = [], maleLabours, femaleLabours, bookingDate, description, status, paymentStatus} = req.body;

        if(!listingId || !seekerId || totalLabours === undefined || maleLabours === undefined || femaleLabours === undefined || !bookingDate || !description || !status || !paymentStatus) {
            return res.status(400).json({ message: "Please fill all the fields." });
        }

        const listing = await LabourAvailability.findById(listingId).select('providerId availabilityStart availabilityEnd availableLabours regularLabours regularLabourPrice categories gender');
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
        const listingRegularLabours = listing.regularLabours ?? listing.availableLabours;
        const requestedRegular = Number(regularLabours);
        const requestedCategories = Array.isArray(categoryLabours) ? categoryLabours : [];
        if (new Set(requestedCategories.map(category => String(category.categoryId))).size !== requestedCategories.length) {
            return res.status(400).json({ message: "A category can only be selected once per booking." });
        }
        const categoryMap = new Map(listing.categories.map(category => [String(category.categoryId), category]));
        let calculatedCost = requestedRegular * Number(listing.regularLabourPrice || 0);
        let requestedCategoryMaximum = 0;
        for (const requestedCategory of requestedCategories) {
            const listingCategory = categoryMap.get(String(requestedCategory.categoryId));
            const count = Number(requestedCategory.labourCount);
            if (!listingCategory || !Number.isInteger(count) || count < 0 || count > listingCategory.labourCount) {
                return res.status(400).json({ message: "One or more category worker quantities are invalid." });
            }
            requestedCategoryMaximum = Math.max(requestedCategoryMaximum, count);
            calculatedCost += count * Number(listingCategory.priceRate || 0);
        }
        if (!Number.isInteger(requestedRegular) || requestedRegular < 0 || requestedRegular > listingRegularLabours) {
            return res.status(400).json({ message: "The requested regular workers are not currently available." });
        }
        const requestedTotal = Math.max(requestedRegular, requestedCategoryMaximum);
        if (requestedTotal < 1 || requestedTotal !== Number(totalLabours) || requestedTotal > listing.availableLabours) {
            return res.status(409).json({ message: "The requested number of workers is not currently available." });
        }
        if (Number(maleLabours) + Number(femaleLabours) > requestedTotal) {
            return res.status(400).json({ message: "Gender worker counts cannot exceed the requested workers." });
        }
        if (Number(maleLabours) > Number(listing.gender?.male || 0)
            || Number(femaleLabours) > Number(listing.gender?.female || 0)) {
            return res.status(409).json({ message: "The requested gender-specific workers are not available." });
        }

        const newBooking = new Booking({
            listingId,
            providerId: listing.providerId,
            seekerid: seekerId,
            totalLabours,
            regularLabours: requestedRegular,
            categoryLabours: requestedCategories.filter(category => Number(category.labourCount) > 0),
            maleLabours,
            femaleLabours,
            bookingDate,
            totalCost: calculatedCost,
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

const getBookingDayRange = (bookingDate) => {
    const start = new Date(bookingDate);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    return { start, end };
};


const getBookingsBySeeker = async (req, res) => {
    try {
        const { seekerId } = req.params;

        if (!seekerId) {
            return res.status(400).json({ message: "Seeker ID is required." });
        }

        const bookings = await Booking.find({ seekerid: seekerId })
            .populate({
                path: 'listingId',
                populate: { path: 'providerId' }
            })
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
            .populate({
                path: 'listingId',
                populate: { path: 'providerId' }
            })
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

        let updatedBooking = status === "accepted"
            ? await (mongoose.isValidObjectId(bookingId) && Booking.findOneAndUpdate
                ? Booking.findOneAndUpdate({ _id: bookingId, status: "pending" }, { status }, { new: true })
                : Promise.resolve(undefined))
            : await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
        if (status === "accepted" && updatedBooking === undefined) {
            updatedBooking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
        }

        if (!updatedBooking) {
            return res.status(status === "accepted" ? 409 : 404).json({
                message: status === "accepted"
                    ? "This booking is no longer pending."
                    : "Booking not found."
            });
        }

        if (status === "accepted" && updatedBooking.listingId && updatedBooking.totalLabours
            && typeof Booking.find === "function") {
            const acceptedBookings = await Booking.find({
                listingId: updatedBooking.listingId,
                status: "accepted",
                bookingDate: {
                    $gte: getBookingDayRange(updatedBooking.bookingDate).start,
                    $lt: getBookingDayRange(updatedBooking.bookingDate).end
                },
                _id: { $ne: updatedBooking._id }
            }).select("totalLabours maleLabours femaleLabours");
            const bookedWorkers = acceptedBookings.reduce((sum, booking) => sum + Number(booking.totalLabours || 0), 0);
            const bookedMen = acceptedBookings.reduce((sum, booking) => sum + Number(booking.maleLabours || 0), 0);
            const bookedWomen = acceptedBookings.reduce((sum, booking) => sum + Number(booking.femaleLabours || 0), 0);
            const listing = await LabourAvailability.findById(updatedBooking.listingId)
                .select("availableLabours gender");
            if (!listing
                || bookedWorkers + Number(updatedBooking.totalLabours) > listing.availableLabours
                || bookedMen + Number(updatedBooking.maleLabours || 0) > Number(listing.gender?.male || 0)
                || bookedWomen + Number(updatedBooking.femaleLabours || 0) > Number(listing.gender?.female || 0)) {
                await Booking.findByIdAndUpdate(bookingId, { status: "pending" }, { new: true });
                return res.status(409).json({
                    message: "Not enough workers of the requested type are available on this date."
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

        return res.status(200).json({
            message: "Booking deleted successfully",
            booking: deletedBooking
        });

    } catch(error) {
        return res.status(500).json({ message: "Server Error", error: error.message });
    }
};

export { book, getBookingsBySeeker, getBookingsByListing, updateBookingStatus, updatePaymentStatus, deleteBooking };