// دالة حساب وتوزيع التركة الشاملة
const calculateInheritance = (estate, inheritors) => {

     var totalEstate =Number(estate.netEstate)|| 100000; // صافي التركة
     var remainingEstate = totalEstate
     // --- 1. حساب المصاريف والديون أولاً ---
    const totalDebtsAndExpenses = funeralExpenses + securedDebts + unsecuredDebts + divineDebts;
    
    // --- 2. التحقق من الوصية وقاعدتها الفقهية (لوارث أو غير وارث) ---
    let finalWillAmount = 0;
    
    if (estate.liquidationDetails && estate.liquidationDetails.willAmount > 0) {
        const netBeforeWill = estate.liquidationDetails.grossEstate - totalDebtsAndExpenses;
        const maxThird = netBeforeWill / 3; // أقصى حد للوصية هو الثلث

        // فحص ما إذا كان الموصى له وارثاً أم لا
        if (estate.liquidationDetails.isWillToHeir) {
            // قاعدة: لا وصية لوارث إلا بموافقة وباقي الورثة
            if (estate.liquidationDetails.isApprovedByOtherHeirs) {
                finalWillAmount = Math.min(estate.liquidationDetails.willAmount, netBeforeWill);
            } else {
                // إذا لم توافق بقية الورثة، تُحجب الوصية لوارث تماماً
                finalWillAmount = 0; 
            }
        } else {
            // وصية لغير وارث: تنفذ في حدود الثلث كحد أقصى
            finalWillAmount = Math.min(estate.liquidationDetails.willAmount, maxThird);
        }
    }
   // حساب القاسم المشترك الأكبر (يستخدم للتوافق والتداخل)
    function getGCD(a, b) {
      return b === 0 ? a : getGCD(b, a % b);
    }

// حساب المضاعف المشترك الأصغر (يمثل النسب الأربع لربط المقامات وأصول المسائل)
    function getLCM(a, b) {
     if (a === 0 || b === 0) return 0;
      return (a * b) / getGCD(a, b);
    }
    // دالة تصحيح الأسهم بناءً على عدد الرؤوس والنسب الأربع
function correctBaseShare(inheritors, baseOrigin) {
  let correctionFactor = 1;

  inheritors.forEach(inheritor => {
    const heads = inheritor.count || 1; // عدد الرؤوس
    const shares = inheritor.shares;   // عدد الأسهم

    if (shares % heads !== 0) { // في حال وجود انكسار (عدم تماثل)
      const gcd = getGCD(shares, heads);
      const headsPart = heads / gcd; // التوافق أو التباين (جزء السهم)
      
      // تطبيق التداخل أو التباين بين أجزاء السهام للحصول على جزء السهم الكلي
      correctionFactor = getLCM(correctionFactor, headsPart);
    }
  });

  // أصل المسألة بعد التصحيح
  const correctedOrigin = baseOrigin * correctionFactor;
  return { correctedOrigin, correctionFactor };
 }
    // --- 3. حساب صافي التركة النهائي القابل للتوزيع على الورثة ---
    const netEstate = estate.liquidationDetails.grossEstate - totalDebtsAndExpenses - finalWillAmount;
    // 1. فحص وجود الفروع والأصول للتحقق من الحجب والأنصبة
    const sons = inheritors.filter(i => i.relation === 'son')
    const daughters = inheritors.filter(i => i.relation === 'daughter')
    const hasSons = sons.length > 0
    const hasDaughters = daughters.length > 0
    const hasChildren = hasSons || hasDaughters

    const father = inheritors.find(i => i.relation === 'father')
    const mother = inheritors.find(i => i.relation === 'mother')
    const wives = inheritors.filter(i => i.relation === 'wife')
    const husband = inheritors.find(i => i.relation === 'husband')

    let updatedInheritors = inheritors.map(i => ({ ...(i._doc || i), isBlocked: false, shareRatio: "0", shareAmount: 0 }))

    // --- المرحلة الأولى: تطبيق قواعد الحجب (Blocking Rules) ---
    updatedInheritors = updatedInheritors.map(inheritor => {
        // الابن يحجب الإخوة والأعمام وأولاد الإخوة
        if (['brother', 'sister', 'uncle', 'nephew'].includes(inheritor.relation) && hasSons) {
            inheritor.isBlocked = true
        }
        // الأب يحجب الجد والإخوة
        if (['grandfather', 'brother', 'sister'].includes(inheritor.relation) && father) {
            inheritor.isBlocked = true
        }
        // ---  قواعد حجب الحرمان (Exclusion) ---
    // الأخ لأم أو الأخت لأم يُحجَبون بوجود الأب أو الفرع الوارث (الأبناء)
    if (['maternal_brother', 'maternal_sister'].includes(inheritor.relation) && (father || hasChildren)) {
        inheritor.isBlocked = true;
    }

    // --- قواعد حجب النقصان (Nuqsan Reduction) ---
    // الزوج: ينزل من النصف (1/2) إلى الربع (1/4) عند وجود فرع وارث
    if (inheritor.relation === 'husband' && hasChildren) {
        inheritor.share = 1 / 4;
    }

    // الزوجة: تنزل من الربع (1/4) إلى الثمن (1/8) عند وجود فرع وارث
    if (inheritor.relation === 'wife' && hasChildren) {
        inheritor.share = 1 / 8;
    }

    // الأم: تنزل من الثلث (1/3) إلى السدس (1/6) عند وجود فرع وارث أو جمع من الإخوة
    if (inheritor.relation === 'mother' && (hasChildren || siblingCount >= 2)) {
        inheritor.share = 1 / 6;
    }
    // --- موانع الإرث (اختلاف الدين أو القتل) ---
   // if (inheritor.isKafir || inheritor.isKiller) {
      //  inheritor.isBlocked = true;
      //  inheritor.note = "محجوب بسبب موانع الإرث (قتل أو اختلاف دين)";
    //}
        return inheritor
    })

// --- فحص وحساب المسألتين العمريتين (الغراوين) ---
    const isOmariyyatan = !hasChildren && father && mother && (husband || (wives && wives.length === 1))
    if (isOmariyyatan) {
        updatedInheritors = updatedInheritors.map(inheritor => {
            
            // --- فحص وحساب المسألة المشتركة ---
const husbandObj = updatedInheritors.find(i => i.relation === 'husband' && !i.isBlocked)
const motherObj = updatedInheritors.find(i => (i.relation === 'mother' || i.relation === 'grandmother') && !i.isBlocked)
const maternalSiblings = updatedInheritors.filter(i => (i.relation === 'maternal_brother' || i.relation === 'maternal_sister') && !i.isBlocked)
const fullBrothers = updatedInheritors.filter(i => (i.relation === 'brother' || i.relation === 'sister') && !i.isBlocked)
const hasFullBrother = fullBrothers.some(i => i.relation === 'brother')
const isShared = husbandObj && motherObj && maternalSiblings.length >= 1 && fullBrothers.length >= 1

if (isShared) {
    updatedInheritors = updatedInheritors.map(inheritor => {
        if (inheritor.isBlocked) return inheritor

        if (inheritor.relation === 'husband') {
            inheritor.shareRatio = "1/2"
            inheritor.shareAmount = Number((totalEstate * 0.5).toFixed(2))
        } else if (inheritor.relation === 'mother' || inheritor.relation === 'grandmother') {
            inheritor.shareRatio = "1/6"
            inheritor.shareAmount = Number((totalEstate * (1/6)).toFixed(2))
            } else if (['maternal_brother', 'maternal_sister', 'brother', 'sister'].includes(inheritor.relation)) {
            const totalSharedGroup = maternalSiblings.length + fullBrothers.length
            const sharePerPerson = (1 / 3) / totalSharedGroup
            inheritor.shareRatio = '1/3 / ${totalSharedGroup} (المشتركة)'
            inheritor.shareAmount = Number((totalEstate * sharePerPerson).toFixed(2))
        }
        return inheritor
    })
}
       
    })

// --- فحص وحساب المسألة الأكدرية ---
    const grandfatherObj = updatedInheritors.find(i => i.relation === 'grandfather' && !i.isBlocked)
    const sisterObj = updatedInheritors.find(i => (i.relation === 'sister' || i.relation === 'paternal_sister') && !i.isBlocked)
    const father = updatedInheritors.find(i => i.relation === 'father' && !i.isBlocked)
    const hasSons = updatedInheritors.some(i => i.relation === 'son' && !i.isBlocked)
    const brothersAndSisters = updatedInheritors.filter(i => 
        ['brother', 'sister', 'paternal_brother', 'paternal_sister'].includes(i.relation) && !i.isBlocked
    )

    const isAkdariyyah = husbandObj && motherObj && grandfatherObj && sisterObj && !father && !hasSons && brothersAndSisters.length === 1
        console.log("IS AKDARIYYAH?:", isAkdariyyah)
    if (isAkdariyyah) {
        updatedInheritors = updatedInheritors.map(inheritor => {
            if (inheritor.isBlocked) return inheritor

            if (inheritor.relation === 'husband') {
                inheritor.shareRatio = "3/9 (عول - الأكدرية)"
                inheritor.shareAmount = Number((totalEstate * (3 / 9)).toFixed(2))
            } else if (inheritor.relation === 'mother' || inheritor.relation === 'grandmother') {
                inheritor.shareRatio = "2/9 (عول - الأكدرية)"
                inheritor.shareAmount = Number((totalEstate * (2 / 9)).toFixed(2))
            } else if (inheritor.relation === 'grandfather') {
                inheritor.shareRatio = "4/9 (الأكدرية)"
                inheritor.shareAmount = Number((totalEstate * (4 / 9)).toFixed(2))
            } else if (inheritor.relation === 'sister' || inheritor.relation === 'paternal_sister') {
                inheritor.shareRatio = "2/9 (الأكدرية)"
                inheritor.shareAmount = Number((totalEstate * (2 / 9)).toFixed(2))
            }
            return inheritor
        })

        return {
            netEstate: totalEstate,
            inheritors: updatedInheritors
        }
    // --- حالة الأخ المبارك (جد + أخت شقيقة + أخت لأب + أخ لأب) ---
    const hasFullSister = inheritors.some(i => i.relation === 'sister' && !i.isBlocked)
    const hasPaternalSister = inheritors.some(i => i.relation === 'paternal_sister' && !i.isBlocked)
    const hasPaternalBrother = inheritors.some(i => i.relation === 'paternal_brother' && !i.isBlocked)

    if (hasGrandfather && hasFullSister && hasPaternalSister && hasPaternalBrother && activeCount === 4) {
        updatedInheritors = updatedInheritors.map(inheritor => {
            if (inheritor.isBlocked) return inheritor
            if (inheritor.relation === 'grandfather') {
                inheritor.shareRatio = "1/2 (مباركة)";0
                inheritor.shareAmount = Number((totalEstate * 0.5).toFixed(2));
            } else if (inheritor.relation === 'sister') {
                inheritor.shareRatio = "1/2 (مباركة)"
                inheritor.shareAmount = Number((totalEstate * 0.5).toFixed(2));
            } else {
                inheritor.shareRatio = "0"
                inheritor.shareAmount = 0
            }
            return inheritor
        })
        return {
            netEstate: totalEstate,
            inheritors: updatedInheritors
        }
    }

    // --- حالة الأخ المشؤوم (جد + أم + أخت شقيقة + أخ لأب) ---
    const hasMotherCheck = inheritors.some(i => (i.relation === 'mother' || i.relation === 'grandmother') && !i.isBlocked)
    
    if (hasGrandfather && hasMotherCheck && hasFullSister && hasPaternalBrother && activeCount === 4) {
        updatedInheritors = updatedInheritors.map(inheritor => {
            if (inheritor.isBlocked) return inheritor
            if (inheritor.relation === 'mother' || inheritor.relation === 'grandmother') {
                inheritor.shareRatio = "1/3 (مشؤومة)"
                inheritor.shareAmount = Number((totalEstate / 3).toFixed(2));
            } else if (inheritor.relation === 'grandfather') {
                inheritor.shareRatio = "1/3 (مشؤومة)"
                inheritor.shareAmount = Number((totalEstate / 3).toFixed(2));
            } else if (inheritor.relation === 'sister') {
                inheritor.shareRatio = "1/3 (مشؤومة)"
                inheritor.shareAmount = Number((totalEstate / 3).toFixed(2));
            } else {
                inheritor.shareRatio = "0"
                inheritor.shareAmount = 0
            }
            return inheritor
        })
        return {
            netEstate: totalEstate,
            inheritors: updatedInheritors
        }
    }
            } else if (inheritor.relation === 'wife') {
                inheritor.shareRatio = "1/4"
                inheritor.shareAmount = totalEstate * (1 / 4)
            } else if (inheritor.relation === 'mother') {
                // الأم تأخذ ثلث الباقي (الذي يعادل 1/6 في وجود الزوج أو 1/4 في وجود الزوجة)
                const spouseShareFraction = husband ? (1 / 2) : (1 / 4)
                const remainingAfterSpouse = 1 - spouseShareFraction
                const motherRatio = remainingAfterSpouse / 3
                
                inheritor.shareRatio = "ثلث الباقي"
                inheritor.shareAmount = totalEstate * motherRatio
            } else if (inheritor.relation === 'father') {
                // الأب يأخذ الباقي تعصيباً
                const spouseShareFraction = husband ? (1 / 2) : (1 / 4)
                const remainingAfterSpouse = 1 - spouseShareFraction
                const motherRatio = remainingAfterSpouse / 3
                const fatherRatio = remainingAfterSpouse - motherRatio
                
                inheritor.shareRatio = "عصبة (الباقي)"
                inheritor.shareAmount = totalEstate * fatherRatio
            }
            return inheritor
        }

        // إرجاع النتيجة نهائياً لأن العمريتين تستغرقان التركة بالكامل بلا عول ولا رد
        return {
            netEstate: totalEstate,
            inheritors: updatedInheritors
        }    
}

module.exports = { calculateInheritance }
