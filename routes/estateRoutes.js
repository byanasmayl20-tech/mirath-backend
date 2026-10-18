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
    let heirIds=[]
    if (inheritors && Array.isArray(inheritors) && inheritors.length > 0) {
      const SavedHeirsPromises = inheritors.map(async (heirData) => {
        const newHeir = new Heir(heirData);
        const savedHeir = await newHeir.save();
        return savedHeir._id;
      });

      heirIds = await Promise.all(SavedHeirsPromises);
      console.log("معرّفات الورثة بعد الحفظ (heirIds):", heirIds);
    }
    
    // إنشاء كائن التركة الجديد
    const newEstate = new Estate({
      deceasedGender,
      liquidationDetails: {
        ...liquidationDetails,
        netEstate
      },
      inheritors:heirIds
    })

    const savedEstate = await newEstate.save()
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
// مسار تشغيل محرك الحسابات
router.post('/calculate/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // 1. البحث عن التركة أولاً
    const estate = await Estate.findById(id);
    if (!estate) {
      return res.status(404).json({ message: "التركة غير موجودة" });
    }

    // 2. جلب كل الورثة المرتبطين بهذه التركة مباشرة من قاعدة البيانات
    const inheritors = await Heir.find({ estate: id });

    // 3. تشغيل المحرك
    const result = calculateInheritance(estate, inheritors);
        res.status(200).json({
            message: "تم حساب التركة بنجاح",
            data: result
        });
    } catch (error) {
        console.error("خطأ في حساب التركة:", error);
        res.status(500).json({ message: "حدث خطأ أثناء الحساب", error: error.message });
    }
})

module.exports = router