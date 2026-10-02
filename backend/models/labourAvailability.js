import mongoose from "mongoose";

const pointSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ["Point"],
        default: "Point"
    },
    coordinates: {
        type: [Number],
        validate: {
            validator: coordinates => coordinates.length === 2,
            message: "Location coordinates must contain longitude and latitude."
        }
    }
}, { _id: false });

const labourCategorySchema =new mongoose.Schema(
    {
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true
        },

        labourCount: {
            type: Number,
            required: true,
            min: 0
        },

        priceRate: {
            type: Number,
            required: true,
            min: 0
        },
    },
    {_id: false}
);

const labourAvailabilitySchema = new mongoose.Schema({
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    totalLabours: {
        type: Number,
        required: true,
        min: 0
    },

    availableLabours: {
        type: Number,
        required: true,
        min: 0
    },

    regularLabours: {
    type: Number,
    default: 0,
    min: 0
    },

    regularLabourPrice: {
    type: Number,
    default: 0,
    min: 0
    },

    gender: {
        male: {
            type: Number,
            default: 0,
            min: 0
        },
        female: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    categories: [labourCategorySchema],

    location: {
        type: pointSchema,
        default: null
    },

    description: {
        type: String,
        trim: true
    },

    availabilityStart: Date,
    availabilityEnd: Date,

    
}, {
    timestamps: true
});

labourAvailabilitySchema.pre('validate', function () {
    const male = this.gender?.male || 0;
    const female = this.gender?.female || 0;
    if (male + female > this.availableLabours) {
        throw new Error("Men and women workers together cannot exceed available workers.");
    }
    if ((this.regularLabours || 0) > this.availableLabours
        || (this.categories || []).some(category => category.labourCount > this.availableLabours)) {
        throw new Error("Regular or category workers cannot exceed available workers.");
    }
});

labourAvailabilitySchema.index({ location: "2dsphere" });

export default mongoose.model("LabourAvailability", labourAvailabilitySchema);