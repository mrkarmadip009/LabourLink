import express from 'express';
import verifyJWT from '../middleware/verifyJWT.js';
import labourAvailabilityController from '../controllers/labourAvailabilityController.js';

const router = express.Router();

router.get('/categories', labourAvailabilityController.getCategory);
router.post('/categories', verifyJWT, labourAvailabilityController.addCategory);
router.post('/', verifyJWT, labourAvailabilityController.addLabourList);
router.get('/', verifyJWT, labourAvailabilityController.getLabourList);
router.get('/mine', verifyJWT, labourAvailabilityController.getProviderListings);
router.put('/:listingId', verifyJWT, labourAvailabilityController.updateLabourList);
router.delete('/:listingId', verifyJWT, labourAvailabilityController.deleteLabourList);

export default router;
