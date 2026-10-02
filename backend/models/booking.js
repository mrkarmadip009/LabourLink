import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    listingId: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "LabourAvailability",
        required: true
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    seekerid: {
        type:mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    totalLabours: {
        type: Number,
        required: true,
        min: 1
    },

    regularLabours: {
        type: Number,
        default: 0,
        min: 0
    },

    categoryLabours: [{
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },
        labourCount: {
            type: Number,
            required: true,
            min: 0
        }
    }],

    maleLabours: {
        type: Number,
        required: true,
        min: 0
    },

    femaleLabours: {
        type: Number,
        required: true,
        min: 0
    },

    bookingDate: {
        type: Date,
        required: true
    },

    totalCost: {
        type: Number,
        required: true,
        min: 0
    },

    description: {
        type: String,
        required: true
    },

    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending"
    },

    paymentStatus: {
        type: String,
        enum: ["pending", "completed"],
        default: "pending"
    }
}, {
    timestamps: true,
});

export default mongoose.model("Booking", bookingSchema);