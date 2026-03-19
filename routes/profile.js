'use strict';

const router = require('express').Router();
const { protect } = require('../middleware/Auth');

const { getProfile, updateProfile, addAddress, updateAddress, deleteAddress, getOrderHistory } = require('../controllers/profile');
const { createUploader } = require('../config/cloudinary');

const avatarUpload = createUploader('avatars').single('avatar');

router.use(protect);

router.get('/me', getProfile);
router.patch('/me', avatarUpload, updateProfile);


router.post('/me/addresses', addAddress);
router.patch('/me/addresses/:addressId', updateAddress);
router.delete('/me/addresses/:addressId', deleteAddress);
router.get('/me/orders', getOrderHistory);

module.exports = router;