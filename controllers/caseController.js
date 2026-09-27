const Case = require('../models/Case');

// إنشاء وحساب قضية تركة جديدة
exports.createCase = async (req, res) => {
  try {
    const { deceasedGender, liquidationDetails, inheritors, calculationSummary } = req.body;

    const newCase = new Case({
      deceasedGender,
      liquidationDetails,
      inheritors,
      calculationSummary
    });

    const savedCase = await newCase.save();
    res.status(201).json({ success: true, data: savedCase });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// جلب جميع القضايا المحفوظة
exports.getCases = async (req, res) => {
  try {
    const cases = await Case.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: cases });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
//ملف المعالجة و الحسابات