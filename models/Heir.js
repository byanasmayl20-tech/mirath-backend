const mongoose = require('mongoose');

// تعريف هيكل بيانات الوارث (Heir Schema)
const heirSchema = new mongoose.Schema({
  // حقل ربط الوارث بالتركة
  estate: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estate',
    required: true
  },
  
  // اسم أو صلة الوارث (مثلًا: "ابن"، "زوجة"، "أب")
  relation: {
    type: String,
    required: true
  },
  // ... باقي الحقول الموجودة لديكِ ...
  // اسم أو صلة الوارث (مثلاً: "ابن", "بنت", "زوجة", "أب")
  relation: { 
    type: String, 
    required: true 
  },

  // جنس الوارث لتحديد الأحكام الخاصة به
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true //اي الحقل اجباري
  },

  // تصنيف الوارث شرعاً (صاحب فرض، عصبة، إلخ)
  category: { 
    type: String, 
    enum: ['farid', 'asaba', 'dzawi_arkam'], 
    required: true 
  },

  // الحالة الشرعية للحجب (هل الوارث محجوب أم لا؟)
  isBlocked: { 
    type: Boolean, 
    default: false 
  },

  // الحصة أو النصيب الشرعي المقدر (مثلاً: الثُّمُن، الرُّبع، الباقي تعصيباً)
  shareRatio: { 
    type: String, 
    default: null 
  }
}, {
  timestamps: true // لتسجيل وقت الإنشاد والتحديث تلقائياً
})

// تصدير النموذج لنستخدمه في باقي السيرفر
module.exports = mongoose.model('Heir', heirSchema)