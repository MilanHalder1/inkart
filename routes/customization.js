'use strict';

const router = require('express').Router();
const { protect } = require('../middleware/Auth');
const {
  uploadBackgroundImage,
  saveDesign,
  uploadPreviewImage,
  getDesign,
  getUserDesigns,
  deleteDesign,
} = require('../controllers/customization');

router.use(protect);

router.get('/', getUserDesigns);
router.post('/', saveDesign);
router.get('/:customizationId', getDesign);
router.delete('/:customizationId', deleteDesign);
router.post('/products/:productId/background', uploadBackgroundImage);
router.patch('/:customizationId/preview', uploadPreviewImage);

module.exports = router;  