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
     إذا تُرك فارغاً: يفتح النموذج واتساب برسالة جاهزة فيها تفاصيل الطلب إلى رقم واتساب أدناه.
     Form endpoint (POST, FormData). Empty = opens WhatsApp with the request pre-filled to `whatsapp`. */
  formEndpoint: "",

  /* رقم خدمة العملاء على واتساب (0532883201) — رقم دولي بدون + أو أصفار بادئة، يُستخدم في wa.me.
     Customer service WhatsApp number in international format, no + or leading zeros. */
  whatsapp: "966532883201",

  /* التواصل عبر واتساب فقط — البريد والجوال والموقع مخفية لأنها فارغة.
     WhatsApp only — email, phone and location stay hidden while empty. */
  email: "",
  phone: "",
  location: {
    ar: "",
    en: ""
  },

  /* روابط الحسابات الكاملة، مثل: "https://www.linkedin.com/company/digitalpass" */
  social: {
    linkedin: "",
    x: "",
    instagram: ""
  }
};
