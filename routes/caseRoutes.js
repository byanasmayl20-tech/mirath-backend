const express = require('express');
const router = express.Router();
const caseController = require('../controllers/caseController');

// 1. رابط إضافة وتخزين قضية جديدة
router.post('/calculate', caseController.createCase);

// 2. رابط جلب كل القضايا المحفوظة
router.get('/', caseController.getCases);

module.exports = router;
//ملف عناوين الطرق