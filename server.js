const express = require('express')
const dotenv = require('dotenv')//مسؤولة عن قراءة متغيرات البيئة السرية للملف
const cors = require('cors')//تسمح للتطبيق بالتواصل واستقبال الطلبات من الواجهة الامامية او برامج الاختيار
const connectDB = require('./config/db.js')//الدالة المخصصة لربط المشروع بقاعدة البيانات
const estateRoutes=require('./routes/estateRoutes.js')//مسارات التركات الخاصة بنظام المواريث و التي ستستقبل طلبات المستخدمين

dotenv.config()//

// الاتصال بقاعدة البيانات
connectDB()

const app = express()

// Middleware
app.use(cors())//لتفعيل التعامل مع النطاقات المختلفة
app.use(express.json())//تسمح للسيرفر بفهم وقراءة البيانات المرسلة بصيغة json

//Routes
app.use('/api/estates',estateRoutes)//تخبر السيرفر ان اي طلب يبدا بالرابط /api/estatesيجب ان يتم توجيهه مباشرة للملف

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})

