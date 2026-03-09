const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

// POST /api/v1/auth/register
router.post('/register', asyncHandler(authController.register));

// POST /api/v1/auth/login
router.post('/login', asyncHandler(authController.login));

// POST /api/v1/auth/refresh
router.post('/refresh', asyncHandler(authController.refresh));

// GET /api/v1/auth/me
router.get('/me', authMiddleware, asyncHandler(authController.me));

module.exports = router;
