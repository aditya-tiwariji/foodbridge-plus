import express from 'express';
import { geocode, reverseGeocode } from '../controllers/locationController.js';

const router = express.Router();

// Public routes allowing both GET and POST requests
router.route('/geocode')
  .get(geocode)
  .post(geocode);

router.route('/reverse-geocode')
  .get(reverseGeocode)
  .post(reverseGeocode);

export default router;
