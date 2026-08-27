import mongoose from "mongoose";
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  role: {
    type: String,
    enum: ["Provider", "Seeker"],
    required: true,
  },
  address: {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zipCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, default: "India" },
  },
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
  }

}, 
{
    timestamps: {
        createdAt: "created_at",
        updatedAt: "updated_at"
    }
});

userSchema.index({ location: "2dsphere" });

//pre saving, it hashes password before saving
userSchema.pre('save', async function () {
  if(!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});



const User = mongoose.model("User", userSchema);

export default User;
