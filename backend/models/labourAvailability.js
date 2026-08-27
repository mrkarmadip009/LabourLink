import mongoose from "mongoose";

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
    },

    description: {
        type: String,
        trim: true
    }, 

    
}, {
    timestamps: true
});

labourAvailabilitySchema.index({ location: "2dsphere" });

export default mongoose.model("LabourAvailability", labourAvailabilitySchema);