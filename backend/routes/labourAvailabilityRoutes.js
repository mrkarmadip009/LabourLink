import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import labourAvailabilityController from '../controllers/labourAvailabilityController.js';

const router = express.Router();

router.get('/categories', labourAvailabilityController.getCategory);
router.post('/categories', verifyJWT, labourAvailabilityController.addCategory);
router.post('/', verifyJWT, labourAvailabilityController.addLabourList);
router.get('/', verifyJWT, labourAvailabilityController.getLabourList);

export default router;
