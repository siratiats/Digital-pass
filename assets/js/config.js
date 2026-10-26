/* ==========================================================================
   إعدادات التواصل — Contact settings
   هذا هو الملف الوحيد الذي تحتاج تعديله لربط الموقع.
   This is the only file you need to edit to wire up contact details.

   - أي قيمة تتركها فارغة "" يُخفى عنصرها من الموقع تلقائياً.
     Any value left empty "" is hidden from the site automatically.
   ========================================================================== */

window.DP_CONFIG = {
  /* رابط استقبال نموذج التواصل (POST).
     يعمل مع Formspree أو Web3Forms أو Google Apps Script أو أي API خاص بكم.
     إذا تُرك فارغاً: يفتح النموذج تطبيق البريد لدى الزائر برسالة جاهزة إلى البريد أدناه.
     Form endpoint (POST, FormData). Empty = falls back to a pre-filled mailto: to `email`. */
  formEndpoint: "",

  /* بيانات تجريبية مأخوذة من دليل الهوية — استبدلها بالبيانات الفعلية قبل النشر.
     Sample values from the brand guide — replace before going live. */
  email: "hello@digitalpass.sa",
  phone: "+966 50 000 0000",       // يُعرض كما هو، ويُستخدم للاتصال بعد حذف المسافات
  whatsapp: "966500000000",        // رقم دولي بدون + أو أصفار بادئة — يُستخدم في wa.me

  location: {
    ar: "المملكة العربية السعودية",
    en: "Saudi Arabia"
  },

  /* روابط الحسابات الكاملة، مثل: "https://www.linkedin.com/company/digitalpass" */
  social: {
    linkedin: "",
    x: "",
    instagram: ""
  }
};
