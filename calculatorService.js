// دالة حساب وتوزيع التركة الشاملة
const calculateInheritance = (estate, inheritors) => {

     var totalEstate =Number(estate.netEstate)|| 100000; // صافي التركة
     var remainingEstate = totalEstate
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
        })

        // إرجاع النتيجة نهائياً لأن العمريتين تستغرقان التركة بالكامل بلا عول ولا رد
        return {
            netEstate: totalEstate,
            inheritors: updatedInheritors
        }
    }
    let totalAllocatedRatio = 0 // مجموع الفروض الموزعة

    // --- المرحلة الثانية: حساب أصحاب الفروض (Fixed Shares) ---
    updatedInheritors = updatedInheritors.map(inheritor => {
        if (inheritor.isBlocked) return inheritor

        // 1. الزوجة (Wife) - الثمن مع وجود فرع وارث، والربع عند عدمه (يوزع بالتساوي إذا كثرت الزوجات)
        if (inheritor.relation === 'wife') {
            const ratio = hasChildren ? (1 / 8) / wives.length : (1 / 4) / wives.length
            inheritor.shareRatio = hasChildren ?" 1/8 (مقسمة)" : " 1/4 (مقسمة) "
            inheritor.shareAmount = totalEstate * ratio
            totalAllocatedRatio += ratio
        }

        // 2. الزوج (Husband) - الربع مع وجود فرع وارث، والنصف عند عدمه
        if (inheritor.relation === 'husband') {
            const ratio = hasChildren ? (1 / 4) : (1 / 2)
            inheritor.shareRatio = hasChildren ? "1/4" : "1/2"
            inheritor.shareAmount = totalEstate * ratio
            totalAllocatedRatio += ratio
        }

        // 3. الأم (Mother) - السدس مع الفرع الوارث، والثلث عند عدمه
        if (inheritor.relation === 'mother') {
            const ratio = hasChildren ? (1 / 6) : (1 / 3)
            inheritor.shareRatio = hasChildren ? "1/6" : "1/3"
            inheritor.shareAmount = totalEstate * ratio
            totalAllocatedRatio += ratio
        }

        // 4. الأب (Father) - السدس فرضاً مع وجود فرع وارث مذكّر (الابن)
        if (inheritor.relation === 'father' && hasSons) {
            const ratio = 1 / 6
            inheritor.shareRatio = "1/6"
            inheritor.shareAmount = totalEstate * ratio
            totalAllocatedRatio += ratio
        }

        // 5. البنات فرضاً (عند عدم وجود أبناء يعصّبونهن)
        if (inheritor.relation === 'daughter' && !hasSons) {
            let ratio = 0
            if (daughters.length === 1) {
                ratio = (1 / 2) // البنت الواحدة لها النصف
                inheritor.shareRatio = "1/2"
            } else {
                ratio = (2 / 3) / daughters.length // أكثر من بنت لهن الثلثان بالتساوي
                inheritor.shareRatio = "2/3 (مقسمة)"
            }
            inheritor.shareAmount = totalEstate * ratio
            totalAllocatedRatio += ratio
        }

        return inheritor
    })
   // --- المرحلة المتقدمة: معالجة العول (Awl) والرد (Radd) ---

  // 1. حالة العول (Awl): إذا تجاوز مجموع حصص أصحاب الفروض إجمالي التركة (totalAllocatedRatio > 1)
  if (totalAllocatedRatio > 1) {
    updatedInheritors.forEach(i => {
      if (i.shareAmount > 0) {
        // تخفيض حصص جميع أصحاب الفروض بنسبة وتناسب عادلة
        const adjustedShare = i.shareAmount / totalAllocatedRatio
        i.shareAmount = Number(adjustedShare.toFixed(2))
        i.shareRatio = i.shareRatio + " (معول)"
      }
    })
    remainingEstate = 0 // لا يبقى شيء للتعصيب بعد العول
  } 
  
  // 2. حالة الرد (Radd): إذا لم تستغرق الفروض كامل التركة، ولم يوجد عصبة يأخذون الباقي
  else {
    // حساب المبلغ المتبقي فعلياً بعد الفروض
    const allocatedSum = updatedInheritors.reduce((acc, curr) => acc + (curr.shareAmount || 0), 0)
    remainingEstate = totalEstate - allocatedSum

    // هل يوجد عصبة (مثل الأبناء أو الأب لوحده)؟
    const hasResiduaries = sons.length > 0 || (father && !hasChildren)

    if (remainingEstate > 0 && !hasResiduaries) {
        
      // رد الباقي على أصحاب الفروض عدا الزوج والزوجة (وفقاً لجمهور الفقهاء)
      const raddEligible = updatedInheritors.filter(i => 
        i.relation !== 'wife' && i.relation !== 'husband' && i.shareAmount > 0
      )

      // حساب مجموع نسب الورثة المؤهلين للرد
      let sumEligibleAmounts = raddEligible.reduce((sum, i) => sum + i.shareAmount, 0)

      if (sumEligibleAmounts > 0) {
        raddEligible.forEach(i => {
          // توزيع الباقي بنسبة حصصهم الأساسية
          const raddShare = (i.shareAmount / sumEligibleAmounts) * remainingEstate
          i.shareAmount = Number((i.shareAmount + raddShare).toFixed(2))
          i.shareRatio = i.shareRatio + " (مردود عليها)"
        })
        remainingEstate = 0
      }
   }
  
        // حالة وجود أبناء وبنات (للذكر مثل حظ الأنثيين)
        if (hasSons) {
            const totalShares = (sons.length * 2) + daughters.length; // الابن بسهمين والبنت بسهم
            const shareValue = remainingEstate / totalShares

            updatedInheritors = updatedInheritors.map(inheritor => {
                if (inheritor.relation === 'son') {
                    inheritor.shareAmount = shareValue * 2
                    inheritor.shareRatio = "عصبة (سهمين)"
                } else if (inheritor.relation === 'daughter' && hasSons) {
                    inheritor.shareAmount = shareValue * 1
                    inheritor.shareRatio = "عصبة (سهم واحد)"
                }
                return inheritor
            })
        } 
        // حالة عدم وجود أبناء وكان الأب موجوداً (يأخذ الباقي تعصيباً)
        else if (father && !hasSons) {
            updatedInheritors = updatedInheritors.map(inheritor => {
                if (inheritor.relation === 'father') {
                    inheritor.shareAmount += remainingEstate
                    inheritor.shareRatio = father.shareAmount > remainingEstate ? "1/6 + عصبة (الباقي)" : "عصبة (الباقي)"
                }
                return inheritor
            })
        }
    }


    return {
        netEstate: totalEstate,
        inheritors: updatedInheritors
    }
}

module.exports = { calculateInheritance }
