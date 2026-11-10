/* ==========================================================================
   إعدادات التواصل (Contact settings)
   هذا هو الملف الوحيد الذي تحتاج تعديله لتغيير أرقام التواصل.
   This is the only file you need to edit to change the contact numbers.

   - أي قيمة تتركها فارغة "" يُخفى عنصرها من الموقع تلقائياً.
     Any value left empty "" is hidden from the site automatically.
   ========================================================================== */

window.DP_CONFIG = {
  /* رقم خدمة العملاء للاتصال وواتساب: 0543713897
     Customer service number, used for both calls and WhatsApp. */
  phone: "+966543713897",        // رقم الاتصال بالصيغة الدولية، يُستخدم في رابط الاتصال
  phoneDisplay: "054 371 3897",  // الرقم كما يظهر للزائر
  whatsapp: "966543713897",      // رقم دولي بدون + أو أصفار بادئة، يُستخدم في wa.me

  /* روابط الحسابات الكاملة، مثل: "https://www.linkedin.com/company/digitalpass" */
  social: {
    linkedin: "",
    x: "",
    instagram: ""
  }
};
