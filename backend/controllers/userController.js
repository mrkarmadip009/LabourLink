import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

import User from '../models/user.js';

export const createUser = async (req, res) => {
    try {
        const {username, email, name, password, mobile, role, address, location} = req.body;

        if(!username || !email || !name || !password || !mobile || !role || !address) {
            return res.status(400).json({message : "Please fill all the fields."});
        }

        const userExists = await User.findOne({ username });
        if(userExists) {
            return res.status(400).json({ message: "Please fill all fields."});
        }

        const newUser = new User({username, email, name, password, mobile, role, address, location});
        await newUser.save();

        return res.status(201).json({
            message: "user created successfully",
            user : {
                id: newUser._id,
                username: newUser.username,
                name: newUser.name,
                email: newUser.email,
                mobile: newUser.mobile,
                role: newUser.role,
                address: newUser.address,
                location: newUser.location
            }
        });
        

    } catch(error) {
        return res.status(500).json({ message : 'Server Error', error : error.message});
    }
};

export const getUser = async (req, res) => {
    try {
        const { username } = req.query;

        // If no username is provided, use authenticated user from JWT.
        if (!username) {
            const authUser = await User.findById(req.user).select('-password');

            if (!authUser) {
                return res.status(404).json({ message: 'User not found.' });
            }

            return res.status(200).json({
                message: 'User fetched successfully.',
                user: authUser
            });
        }

        const user = await User.findOne({ username });
        if(!user) {
            return res.status(400).json({ message: 'User not available.'});
        }

        return res.status(200).json({
            message : "User fetched successfully.",
            user : {
                id : user._id,
                username : user.username,
                email : user.email,
                name : user.name,
                mobile : user.mobile,
                role : user.role,
                address : user.address
            }
        })
    } catch(error) {
        return res.status(500).json({ message: "Server Error", error : error.message});
    }
};

export const login = async (req, res) => {
    try {
        const {username, password} = req.body;

        if(!username || !password) {
            return res.status(400).json({
                message: "Username and password are required."
            });
        }

        const foundUser = await User.findOne({ username });

        if(!foundUser) return res.status(401).json({message : "User not found."});
        
        const match = await bcrypt.compare(password, foundUser.password);
        if (!match) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const accessToken = jwt.sign(
            {userId: foundUser._id},
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '15m'}
        );

        const refreshToken = jwt.sign(
            { userId: foundUser._id},
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d'}
        );

        res.cookie('jwt', refreshToken, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            accessToken,
            refreshToken,
            message: "Login successful.",
            user: {
                id: foundUser._id,
                username: foundUser.username,
                email: foundUser.email,
                name: foundUser.name,
                mobile: foundUser.mobile,
                role: foundUser.role,
                address: foundUser.address
            }
        });
    } catch(error) {
        return res.status(500).json({
            message: "Server Error",
            error: error.message
        });
    }

};

export const refreshAccessToken = async (req, res) => {
    try {
        const tokenFromCookie = req.cookies?.jwt;
        const tokenFromBody = req.body?.refreshToken;
        const refreshToken = tokenFromCookie || tokenFromBody;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required.' });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid or expired refresh token.' });
            }

            const user = await User.findById(decoded.userId).select('-password');
            if (!user) {
                return res.status(401).json({ message: 'User not found.' });
            }

            const accessToken = jwt.sign(
                { userId: user._id },
                process.env.ACCESS_TOKEN_SECRET,
                { expiresIn: '15m' }
            );

            return res.status(200).json({
                accessToken,
                message: 'Access token refreshed.'
            });
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

export const logout = async (req, res) => {
    res.clearCookie('jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
    });

    return res.status(200).json({ message: 'Logout successful.' });
};

export const deleteUser = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username) {
            return res.status(400).json({ message: 'Username is required.' });
        }

        const userExists = await User.findOne({ username });

        if(!userExists) {
            return res.status(400).json({
                message: "User does not exist."
            });
        }

        await User.deleteOne({ username });
        return res.status(200).json({
            message : "User deleted successfully."
        });
    } catch(error) {
        return res.status(500).json({ message: "Server Error", error : error.message});
    }
}




