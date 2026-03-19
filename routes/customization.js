'use strict';

const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const {
  uploadBackgroundImage,
  saveDesign,
  uploadPreviewImage,
  getDesign,
  getUserDesigns,
  deleteDesign,
} = require('../../controllers/user/customization.controller');

router.use(protect);

router.get('/', getUserDesigns);
router.post('/', saveDesign);
router.get('/:customizationId', getDesign);
router.delete('/:customizationId', deleteDesign);
router.post('/products/:productId/background', uploadBackgroundImage);
router.patch('/:customizationId/preview', uploadPreviewImage);

module.exports = router;