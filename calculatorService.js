// دالة حساب وتوزيع التركة الشاملة
const calculateInheritance = (estate, inheritors) => {

     var totalEstate =Number(estate.netEstate)|| 100000; // صافي التركة
     var remainingEstate = totalEstate;
    // 1. فحص وجود الفروع والأصول للتحقق من الحجب والأنصبة
    const sons = inheritors.filter(i => i.relation === 'son');
    const daughters = inheritors.filter(i => i.relation === 'daughter');
    const hasSons = sons.length > 0;
    const hasDaughters = daughters.length > 0;
    const hasChildren = hasSons || hasDaughters;

    const father = inheritors.find(i => i.relation === 'father');
    const mother = inheritors.find(i => i.relation === 'mother');
    const wives = inheritors.filter(i => i.relation === 'wife');
    const husband = inheritors.find(i => i.relation === 'husband');

    let updatedInheritors = inheritors.map(i => ({ ...(i._doc || i), isBlocked: false, shareRatio: "0", shareAmount: 0 }));

    // --- المرحلة الأولى: تطبيق قواعد الحجب (Blocking Rules) ---
    updatedInheritors = updatedInheritors.map(inheritor => {
        // الابن يحجب الإخوة والأعمام وأولاد الإخوة
        if (['brother', 'sister', 'uncle', 'nephew'].includes(inheritor.relation) && hasSons) {
            inheritor.isBlocked = true;
        }
        // الأب يحجب الجد والإخوة
        if (['grandfather', 'brother', 'sister'].includes(inheritor.relation) && father) {
            inheritor.isBlocked = true;
        }
        return inheritor;
    });

    let totalAllocatedRatio = 0; // مجموع الفروض الموزعة

    // --- المرحلة الثانية: حساب أصحاب الفروض (Fixed Shares) ---
    updatedInheritors = updatedInheritors.map(inheritor => {
        if (inheritor.isBlocked) return inheritor;

        // 1. الزوجة (Wife) - الثمن مع وجود فرع وارث، والربع عند عدمه (يوزع بالتساوي إذا كثرت الزوجات)
        if (inheritor.relation === 'wife') {
            const ratio = hasChildren ? (1 / 8) / wives.length : (1 / 4) / wives.length;
            inheritor.shareRatio = hasChildren ?" 1/8 (مقسمة)" : " 1/4 (مقسمة) ";
            inheritor.shareAmount = totalEstate * ratio;
            totalAllocatedRatio += ratio;
        }

        // 2. الزوج (Husband) - الربع مع وجود فرع وارث، والنصف عند عدمه
        if (inheritor.relation === 'husband') {
            const ratio = hasChildren ? (1 / 4) : (1 / 2);
            inheritor.shareRatio = hasChildren ? "1/4" : "1/2";
            inheritor.shareAmount = totalEstate * ratio;
            totalAllocatedRatio += ratio;
        }

        // 3. الأم (Mother) - السدس مع الفرع الوارث، والثلث عند عدمه
        if (inheritor.relation === 'mother') {
            const ratio = hasChildren ? (1 / 6) : (1 / 3);
            inheritor.shareRatio = hasChildren ? "1/6" : "1/3";
            inheritor.shareAmount = totalEstate * ratio;
            totalAllocatedRatio += ratio;
        }

        // 4. الأب (Father) - السدس فرضاً مع وجود فرع وارث مذكّر (الابن)
        if (inheritor.relation === 'father' && hasSons) {
            const ratio = 1 / 6;
            inheritor.shareRatio = "1/6";
            inheritor.shareAmount = totalEstate * ratio;
            totalAllocatedRatio += ratio;
        }

        // 5. البنات فرضاً (عند عدم وجود أبناء يعصّبونهن)
        if (inheritor.relation === 'daughter' && !hasSons) {
            let ratio = 0;
            if (daughters.length === 1) {
                ratio = (1 / 2); // البنت الواحدة لها النصف
                inheritor.shareRatio = "1/2";
            } else {
                ratio = (2 / 3) / daughters.length; // أكثر من بنت لهن الثلثان بالتساوي
                inheritor.shareRatio = "2/3 (مقسمة)";
            }
            inheritor.shareAmount = totalEstate * ratio;
            totalAllocatedRatio += ratio;
        }

        return inheritor;
    });
   // --- المرحلة المتقدمة: معالجة العول (Awl) والرد (Radd) ---

  // 1. حالة العول (Awl): إذا تجاوز مجموع حصص أصحاب الفروض إجمالي التركة (totalAllocatedRatio > 1)
  if (totalAllocatedRatio > 1) {
    updatedInheritors.forEach(i => {
      if (i.shareAmount > 0) {
        // تخفيض حصص جميع أصحاب الفروض بنسبة وتناسب عادلة
        const adjustedShare = i.shareAmount / totalAllocatedRatio;
        i.shareAmount = Number(adjustedShare.toFixed(2));
        i.shareRatio = i.shareRatio + " (معول)";
      }
    });
    remainingEstate = 0; // لا يبقى شيء للتعصيب بعد العول
  } 
  
  // 2. حالة الرد (Radd): إذا لم تستغرق الفروض كامل التركة، ولم يوجد عصبة يأخذون الباقي
  else {
    // حساب المبلغ المتبقي فعلياً بعد الفروض
    const allocatedSum = updatedInheritors.reduce((acc, curr) => acc + (curr.shareAmount || 0), 0);
    remainingEstate = totalEstate - allocatedSum;

    // هل يوجد عصبة (مثل الأبناء أو الأب لوحده)؟
    const hasResiduaries = sons.length > 0 || (father && !hasChildren);

    if (remainingEstate > 0 && !hasResiduaries) {
      // رد الباقي على أصحاب الفروض عدا الزوج والزوجة (وفقاً لجمهور الفقهاء)
      const raddEligible = updatedInheritors.filter(i => 
        i.relation !== 'wife' && i.relation !== 'husband' && i.shareAmount > 0
      );

      // حساب مجموع نسب الورثة المؤهلين للرد
      let sumEligibleAmounts = raddEligible.reduce((sum, i) => sum + i.shareAmount, 0);

      if (sumEligibleAmounts > 0) {
        raddEligible.forEach(i => {
          // توزيع الباقي بنسبة حصصهم الأساسية
          const raddShare = (i.shareAmount / sumEligibleAmounts) * remainingEstate;
          i.shareAmount = Number((i.shareAmount + raddShare).toFixed(2));
          i.shareRatio = i.shareRatio + " (مردود عليها)";
        });
        remainingEstate = 0;
      }
    }
  } 

    // --- المرحلة الثالثة: توزيع الباقي تعصيباً (Residuaries / العصَبة) ---
     remainingEstate = totalEstate - updatedInheritors.reduce((acc, curr) => acc + (curr.shareAmount || 0), 0);
    if (remainingEstate > 0) {
        // حالة وجود أبناء وبنات (للذكر مثل حظ الأنثيين)
        if (hasSons) {
            const totalShares = (sons.length * 2) + daughters.length; // الابن بسهمين والبنت بسهم
            const shareValue = remainingEstate / totalShares;

            updatedInheritors = updatedInheritors.map(inheritor => {
                if (inheritor.relation === 'son') {
                    inheritor.shareAmount = shareValue * 2;
                    inheritor.shareRatio = "عصبة (سهمين)";
                } else if (inheritor.relation === 'daughter' && hasSons) {
                    inheritor.shareAmount = shareValue * 1;
                    inheritor.shareRatio = "عصبة (سهم واحد)";
                }
                return inheritor;
            });
        } 
        // حالة عدم وجود أبناء وكان الأب موجوداً (يأخذ الباقي تعصيباً)
        else if (father && !hasSons) {
            updatedInheritors = updatedInheritors.map(inheritor => {
                if (inheritor.relation === 'father') {
                    inheritor.shareAmount += remainingEstate;
                    inheritor.shareRatio = father.shareAmount > remainingEstate ? "1/6 + عصبة (الباقي)" : "عصبة (الباقي)";
                }
                return inheritor;
            });
        }
    }

    return {
        netEstate: totalEstate,
        inheritors: updatedInheritors
    };
};

module.exports = { calculateInheritance };
