import express  from 'express';
import cors from 'cors';
import connectDb from './config/db.js';
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



const app = express();


const PORT = process.env.PORT || 3000;
const allowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/labour-availability', labourAvailabilityRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/api/test', (req, res) => {
    res.status(200).json({
        message: 'Backend connected successfully.',
        status: 'ok',
    });
});

connectDb();

const createCollections = async () => {
    await User.createCollection();
    await Review.createCollection();
    await Booking.createCollection();
    await Category.createCollection();
    await LabourAvailability.createCollection();
};

app.get('/', (req, res) => {
    res.send('your express server is running');
});

app.listen(PORT, () => {
    console.log('Listening at ', PORT);
});

