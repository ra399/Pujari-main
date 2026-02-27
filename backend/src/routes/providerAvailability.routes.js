import express from 'express';
import {
  addAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
  bulkUpdateAvailability,
} from '../controllers/providerAvailability.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import roleMiddleware from '../middlewares/role.middleware.js';
import { ROLES } from '../utils/constants.js';
import { getProviderAvailability } from '../controllers/public.controller.js';

const router = express.Router();

// Middleware Group
const providerAuth = [requireAuth, roleMiddleware(ROLES.PROVIDER)];

router.post(
  '/',
  ...providerAuth,
  addAvailability
);

router.post(
  '/bulk',
  ...providerAuth,
  bulkUpdateAvailability
);

router.get(
  '/me',
  ...providerAuth,
  getMyAvailability
);

router.patch(
  '/:id',
  ...providerAuth,
  updateAvailability
);

router.delete(
  '/:id',
  ...providerAuth,
  deleteAvailability
);

// Public Generic Route (Must be last)
router.get(
    '/:id',
    getProviderAvailability
);

export default router;

