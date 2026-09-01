import express from 'express';

import { createUser, getUser, login, deleteUser, refreshAccessToken, logout, updateUserProfile } from '../controllers/userController.js';
import verifyJWT from '../middleware/verifyJWT.js';

const router = express.Router();

router.post('/', createUser);
router.post('/login', login);
router.post('/refresh', refreshAccessToken);
router.post('/logout', logout);

router.route('/')
    .get(verifyJWT, getUser)
    .put(verifyJWT, updateUserProfile)
    .delete(verifyJWT, deleteUser);
    
export default router;