import express  from 'express';
import mongoose from 'mongoose';
import connectDb from './config/db.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

import User from './models/user.js';
import Booking from './models/booking.js';
import Category from'./models/category.js';
import Review from './models/review.js';
import LabourAvailability from './models/labourAvailability.js';
import userRoutes from './routes/userRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import labourAvailabilityRoutes from './routes/labourAvailabilityRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';



const app =express();

const PORT = process.env.PORT || 5000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/labour-availability', labourAvailabilityRoutes);
app.use('/api/reviews', reviewRoutes);

connectDb()

const createCollections = async () => {
    await User.createCollection();
    await Review.createCollection();
    await Booking.createCollection();
    await Category.createCollection();
    await LabourAvailability.createCollection();
};

app.get('/',(req,res)=>{
    res.send('your express server is running');
});

app.listen(PORT,()=>
    {
        console.log('Listening at ', PORT);
    });

