const express = require('express')
const router = express.Router()
const Estate = require('../models/Estate')
const Heir=require('../models/Heir')//استيراد نموذج الورثة لحفظهم اولا
const { model } = require('mongoose')
const { calculateInheritance } = require('../calculatorService')

// مسار لإضافة تفاصيل التركة والتركة الصافية
router.post('/add-estate', async (req, res) => {
  try {
    console.log("البيانات الواصلة للسيرفر:", req.body)
    const { deceasedGender, liquidationDetails, inheritors } = req.body
    
    // استخراج قيم التصفية بحسب الهيكلية المرسلة
    const gross = liquidationDetails?.grossEstate || 0
    const funeral = liquidationDetails?.funeralExpenses || 0
    const secured = liquidationDetails?.securedDebts || 0
    const unsecured = liquidationDetails?.unsecuredDebts || 0
    const divine = liquidationDetails?.divineDebts || 0
    const wills = liquidationDetails?.willAmount || 0

    // حساب صافي التركة بدقة
    const netEstate = gross - (funeral + secured + unsecured + divine + wills)
//حفظ الورثة الواردة بياناتهم اولا واستحراج ال IDs الخاصة بهم
 // 1. إنشاء وحفظ التركة أولاً
const newEstate = new Estate({
  deceasedGender,
  liquidationDetails,
  netEstate,
  inheritors: []
})
const savedEstate = await newEstate.save()

// 2. حفظ الورثة وربطهم بـ estate الجديد تلقائياً
let heirIds = []
if (inheritors && Array.isArray(inheritors) && inheritors.length > 0) {
  const SavedHeirsPromises = inheritors.map(async (heirData) => {
    const newHeir = new Heir({
      ...heirData,
      estate: savedEstate._id,
      category: heirData.category || "primary" // قيمة افتراضية لتجنب الخطأ
    })
    const savedHeir = await newHeir.save()
    return savedHeir._id
  })
  heirIds = await Promise.all(SavedHeirsPromises)

  // 3. تحديث التركة بمعرفات الورثة
  savedEstate.inheritors = heirIds
  await savedEstate.save()
}

// 4. جلب تفاصيل التركة كاملة للإرجاع
const populatedEstate = await Estate.findById(savedEstate._id).populate({
  path: 'inheritors',
  strictPopulate: false
});

   // const savedEstate = await newEstate.save()
    //تم حفظ تفاصيل التركة مع تفاصيل  الورثة كاملة (populate)في الرد
    const populatedEstat=await Estate.findById(savedEstate._id).populate({path:'inheritors',
      strictPopulate:false}
    )
    res.status(201).json({
      message: 'تم حفظ تفاصيل التركة والديون والوصايا بنجاح في قاعدة البيانات!',
      data: populatedEstat
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// جلب تفاصيل تركة معينة مع بيانات الورثة
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params
        // البحث عن التركة وتعبئة بيانات الورثة المرتبطين بها
        const estate = await Estate.findById(id).populate('inheritors')

        if (!estate) {
            return res.status(404).json({ message: "التركة غير موجودة" })
        }

        res.status(200).json(estate)
    } catch (error) {
        console.error("خطأ في جلب بيانات التركة:", error)
        res.status(500).json({ message: "حدث خطأ في السيرفر", error: error.message })
    }
})
// مسار إضافة تركة جديدة
router.post('/', async (req, res) => {
  try {
    const estate = new Estate(req.body)
    const savedEstate = await estate.save()
    res.status(201).json(savedEstate)
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
})
// مسار تشغيل محرك الحسابات
router.post('/calculate/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log("الـ ID المطلوب بحثه:", id)

    // طباعة كل السجلات المخزنة في قاعدة البيانات لنرى ما بداخله
    const allEstates = await Estate.find({})
    console.log("جميع التركات الموجودة في القاعدة حالياً:", allEstates)

    const estate = await Estate.findById(id)
    if (!estate) {
      return res.status(404).json({ message: "التركة غير موجودة" })
    }

   const inheritors = await Heir.find({ estate: id })

// فحص وتطبيق المسألة الأكدرية مباشرة
const hasHusband = inheritors.some(i => i.relation === 'husband' && !i.isBlocked)
const hasMother = inheritors.some(i => (i.relation === 'mother' || i.relation === 'grandmother') && !i.isBlocked)
const hasGrandfather = inheritors.some(i => i.relation === 'grandfather' && !i.isBlocked)
const hasSister = inheritors.some(i => (i.relation === 'sister' || i.relation === 'paternal_sister') && !i.isBlocked)
const activeCount = inheritors.filter(i => !i.isBlocked).length

let result

if (hasHusband && hasMother && hasGrandfather && hasSister && activeCount === 4) {
    const totalEstate = estate.netEstate || 0;
    const updatedInheritors = inheritors.map(h => {
        let ratio = "0";
        let amount = 0;
        if (h.relation === 'husband') {
            ratio = "3/9";
            amount = (totalEstate * 3) / 9;
        } else if (h.relation === 'mother' || h.relation === 'grandmother') {
            ratio = "2/9";
            amount = (totalEstate * 2) / 9;
        } else if (h.relation === 'grandfather') {
            ratio = "4/9";
            amount = (totalEstate * 4) / 9;
        } else if (h.relation === 'sister' || h.relation === 'paternal_sister') {
            ratio = "2/9";
            amount = (totalEstate * 2) / 9;
        }
        return {
            ...h._doc,
            shareRatio: ratio,
            shareAmount: amount
        }
    })

    result = {
        netEstate: totalEstate,
        inheritors: updatedInheritors
    }
} else {
    result = calculateInheritance(estate, inheritors)
}

res.status(200).json({
    message: "تم حساب التركة بنجاح",
    data: result
})

  } catch (error) {
    console.error("خطأ أثناء الحساب:", error);
    res.status(500).json({ message: "حدث خطأ أثناء الحساب", error: error.message })
  }
})

module.exports = router