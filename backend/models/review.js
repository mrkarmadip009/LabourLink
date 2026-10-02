import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    bookingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
        required: true
    },

    seekerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    ProviderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    rating: {
        type: Number,
        required: true,
    },

    comment: {
        type: String
    },

    reviewDate: {
        type: Date,
        required: true
    }

}, {
    timestamps: true
});

reviewSchema.index({ bookingId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);