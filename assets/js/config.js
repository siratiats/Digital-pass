/* ==========================================================================
   إعدادات التواصل (Contact settings)
   هذا هو الملف الوحيد الذي تحتاج تعديله لتغيير أرقام التواصل.
   This is the only file you need to edit to change the contact numbers.

   - أي قيمة تتركها فارغة "" يُخفى عنصرها من الموقع تلقائياً.
     Any value left empty "" is hidden from the site automatically.
   ========================================================================== */

window.DP_CONFIG = {
  /* رقم خدمة العملاء للاتصال وواتساب: 0532883401
     Customer service number, used for both calls and WhatsApp.
     إذا غيّرت الرقم، غيّره كمان في البيانات المنظمة (application/ld+json) في index.html.
     If you change it, update the structured data in index.html too. */
  phone: "+966532883401",        // رقم الاتصال بالصيغة الدولية، يُستخدم في رابط الاتصال
  phoneDisplay: "053 288 3401",  // الرقم كما يظهر للزائر
  whatsapp: "966532883401",      // رقم دولي بدون + أو أصفار بادئة، يُستخدم في wa.me

  /* روابط الحسابات الكاملة، مثل: "https://www.linkedin.com/company/digitalpass" */
  social: {
    linkedin: "",
    x: "",
    instagram: ""
  }
};
