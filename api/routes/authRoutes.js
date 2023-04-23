"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const router = require('express').Router();
const authController = require('../controllers/authController');
router.post('/login', authController.user_login_post);
router.post('/signup', authController.user_signup_post);
exports.default = router;
