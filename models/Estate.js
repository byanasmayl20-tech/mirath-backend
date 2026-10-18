const mongoose = require('mongoose');

// تعريف مخطط التركة (Estate Schema) الخاص بحاسبة المواريث
const estateSchema = new mongoose.Schema({
  
  // جنس المتوفى (ذكر / أنثى) - أساسي لتحديد أنصبة الورثة الشرعية
  deceasedGender: {
    type: String,
    enum: ['male', 'female'], // يقتصر الخيار على ذكر أو أنثى فقط
    required: true            // حقل إجباري لا يمكن حفظ التركة بدونه
  },

  // تفاصيل تصفية التركة قبل توزيع الميراث (الحقوق المتعلقة بالتركة)
  liquidationDetails: {
    // إجمالي التركة (رأس المال أو مجموع أموال المتوفى)
    grossEstate: { 
      type: Number, 
      required: true 
    },

    // مؤن التجهيز والتدفين بالمعروف
    funeralExpenses: { 
      type: Number, 
      default: 0 
    },

    // الديون العينية (الموثقة برهن أو التي لها أسبقية)
    securedDebts: { 
      type: Number, 
      default: 0 
    },

    // الديون العادية/المطلقة (ديون العباد غير الموثقة برهن)
    unsecuredDebts: { 
      type: Number, 
      default: 0 
    },

    // الديون الإلهية (ديون الله كالكفارات، الزكاة، والحج)
    divineDebts: { 
      type: Number, 
      default: 0 
    },

    // مقدار الوصية (بحدود الثلث للغرباء)
    willAmount: { 
      type: Number, 
      default: 0 
    },

    // صافي التركة القابل للتوزيع على الورثة (بعد سداد كافة الحقوق والديون والوصايا)
    netEstate: { 
      type: Number, 
      required: true 
    }
  },

  // مصفوفة تُربط بقائمة الورثة المستحقين (ربط العلاقات بجدول Heir)
  inheritors: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Heir' // إشارة إلى نموذج Heir الخاص بالورثة
  }]

}, { 
  // خيار لإضافة تاريخ إنشاء وتحديث السجل تلقائياً (createdAt, updatedAt)
  timestamps: true 
})

// تصدير النموذج باسم Estate لاستخدامه في باقي أجزاء المشروع
module.exports = mongoose.model('Estate', estateSchema)
