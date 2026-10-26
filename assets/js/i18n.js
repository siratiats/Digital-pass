/* ==========================================================================
   English copy. Arabic is the default and lives in index.html itself;
   main.js caches it from the DOM so switching back restores it exactly.
   Tone (brand guide p.7): plain, confident, friendly.
   ========================================================================== */

window.DP_I18N = {
  meta: {
    ar: {
      title: "Digital Pass — مفتاحك إلى العالم الرقمي",
      description: "Digital Pass شركة حلول رقمية تبني للشركات أنظمة مخصّصة وتطبيقات ومواقع ومتاجر إلكترونية وحلولاً لمتاجر سلة، وتديرها معها بعد الإطلاق."
    },
    en: {
      title: "Digital Pass — Your Key to Digital",
      description: "Digital Pass is a digital solutions company that builds custom systems, apps, websites, online stores and Salla solutions for businesses — and runs them after launch."
    }
  },

  /* Strings used from JavaScript (validation, form states, buttons) */
  messages: {
    ar: {
      required: "هذا الحقل مطلوب.",
      email: "البريد الإلكتروني غير صحيح.",
      phone: "الرقم غير مكتمل.",
      sending: "جارٍ الإرسال…",
      success: "وصلنا طلبك. سنتواصل معك قريباً لنفهم احتياجك.",
      error: "لم يكتمل الإرسال. حاول مرة أخرى، وإن تكرر الخطأ راسلنا على البريد مباشرة.",
      mailto: "فتحنا تطبيق البريد لديك برسالة جاهزة — أرسلها وسنعود إليك قريباً.",
      mailSubject: "طلب استشارة من الموقع",
      langButton: "EN",
      menuOpen: "فتح القائمة",
      menuClose: "إغلاق القائمة"
    },
    en: {
      required: "This field is required.",
      email: "Enter a valid email address.",
      phone: "The number looks incomplete.",
      sending: "Sending…",
      success: "We've got your request. We'll be in touch soon to understand what you need.",
      error: "Your request didn't go through. Please try again — if it keeps happening, email us directly.",
      mailto: "We've opened your email app with a ready message — send it and we'll get back to you soon.",
      mailSubject: "Consultation request from the website",
      langButton: "ع",
      menuOpen: "Open menu",
      menuClose: "Close menu"
    }
  },

  /* data-i18n / data-i18n-html / data-i18n-ph / data-i18n-aria keys */
  en: {
    "a11y.skip": "Skip to content",

    "nav.label": "Main navigation",
    "nav.services": "Services",
    "nav.work": "What we build",
    "nav.process": "How we work",
    "nav.about": "About",
    "nav.cta": "Start a project",
    "nav.menu": "Open menu",

    "hero.eyebrow": "Digital solutions for businesses",
    "hero.title": "Your key to <span class=\"text-grad\">digital</span>",
    "hero.lead": "We design and build the systems, apps and websites your business needs — and stay with you after launch.",
    "hero.cta": "Start a project",
    "hero.cta2": "Explore our services",
    "hero.c1": "Custom systems",
    "hero.c2": "Mobile & web apps",
    "hero.c3": "Websites & online stores",
    "hero.c4": "Salla store solutions",

    "about.label": "About us",
    "about.statement": "Good technology isn't seen… <span class=\"soft\">it's felt in how fast and easy work becomes.</span>",
    "about.text": "Digital Pass is a digital solutions company. We build custom systems around what each business needs, and develop and run apps and websites after launch. We treat technology as a key that opens a new door to growth for our clients — not an extra burden.",
    "about.visionT": "Our vision",
    "about.vision": "To be the gateway through which businesses cross into the digital future with confidence.",
    "about.missionT": "Our mission",
    "about.mission": "We build systems and apps tailored to each company, and run them alongside it after launch — so its business works more efficiently, with less effort.",

    "services.label": "Services",
    "services.title": "From idea to operation",
    "services.lead": "We cover your whole digital journey: we build what your business needs, and run it with you after launch.",
    "services.g1": "Systems & apps",
    "services.g2": "Websites & e-commerce",

    "s1.title": "Custom systems",
    "s1.desc": "We design and build internal systems around how your company works: operations, inventory, customers and resources.",
    "s1.tags": "ERP · CRM · Dashboards · Internal portals",
    "s2.title": "App development",
    "s2.desc": "Mobile and web apps with a clear user experience — from idea and design to publishing in the stores.",
    "s2.tags": "iOS · Android · Web Apps · UI/UX",
    "s3.title": "App management",
    "s3.desc": "Hosting, updates, performance monitoring and ongoing technical support, so your app stays up without interruption.",
    "s3.tags": "Hosting · Monitoring · Updates · Technical support",
    "s4.title": "Digital solutions",
    "s4.desc": "We turn manual processes into digital ones, and connect your systems so they work as one.",
    "s4.tags": "Automation · API integration · Data analytics · Consulting",
    "s5.title": "Web development",
    "s5.desc": "Websites of every kind: corporate sites that present your company and online stores that sell your products — designed around your brand and fast on every device.",
    "s5.tags": "Corporate websites · Online stores · Mobile-friendly · Arabic & English",
    "s6.title": "Salla store solutions",
    "s6.desc": "Technical solutions inside your Salla store: apps and add-ons that solve a specific need, and integrations that connect your store to your other systems.",
    "s6.tags": "Salla apps · Integrations · Automation · Store customization",
    "s7.title": "Custom themes",
    "s7.desc": "A custom, high-quality theme for your website or store instead of an off-the-shelf template — a look no one else has, and fast performance.",
    "s7.tags": "Custom design · Salla themes · High performance · UI/UX",

    "work.label": "What we build",
    "work.title": "Clear interfaces that work every day",
    "work.lead": "Dashboards, apps and online stores — designed to serve the people who use them, not just to look good.",
    "work.c1t": "Systems & dashboards",
    "work.c1s": "ERP · CRM · Reports",
    "work.c2t": "Mobile apps",
    "work.c2s": "iOS · Android",
    "work.c3t": "Websites & online stores",
    "work.c3s": "Corporate sites · Stores · Salla",

    "process.label": "How we work",
    "process.title": "Four clear stages. No surprises.",
    "process.lead": "At every stage you know where we are and what comes next.",
    "step1.title": "Discover",
    "step1.desc": "We sit with your team and understand the workflow and the problem before proposing any solution.",
    "step2.title": "Design",
    "step2.desc": "We map out the solution and the user experience, and agree a written scope with you.",
    "step3.title": "Build",
    "step3.desc": "We develop and test in clear stages, with regular progress reports.",
    "step4.title": "Run",
    "step4.desc": "We launch, then manage and keep improving so everything keeps working as it should.",

    "why.label": "Why Digital Pass",
    "why.title": "We don't deliver and disappear",
    "why.lead": "We stay with our clients after launch and grow with them. These four values guide how we work.",
    "v1.title": "Trust",
    "v1.desc": "We protect our clients' data and systems as if they were our own, and we deliver on what we promise.",
    "v1.i1": "Data security in every decision",
    "v1.i2": "Realistic promises and deadlines we keep",
    "v2.title": "Clarity",
    "v2.desc": "Simple language, known stages, and clear costs from the start.",
    "v2.i1": "A written scope before we start",
    "v2.i2": "Regular, transparent progress reports",
    "v3.title": "Craft",
    "v3.desc": "Clean code and a thoughtful user experience, down to the smallest detail.",
    "v3.i1": "Review and testing before every launch",
    "v3.i2": "Documentation that makes future work easier",
    "v4.title": "Partnership",
    "v4.desc": "We understand the business before we code, and we measure results together and improve.",
    "v4.i1": "Ongoing support and development after delivery",
    "v4.i2": "Direct contact with the team doing the work",

    "contact.label": "Contact us",
    "contact.title": "Is your business ready to go digital?",
    "contact.lead": "Tell us about your business and what you need — we'll come back with clear next steps.",
    "contact.email": "Email",
    "contact.phone": "Phone",
    "contact.whatsapp": "WhatsApp",
    "contact.whatsappCta": "Message us directly",
    "contact.whatsappAria": "Chat with us on WhatsApp",
    "contact.location": "Location",

    "form.name": "Name",
    "form.namePh": "Your name",
    "form.company": "Company",
    "form.companyPh": "Optional",
    "form.email": "Email",
    "form.phone": "Mobile number",
    "form.service": "Service needed",
    "form.servicePh": "Choose a service",
    "form.unsure": "Not sure yet",
    "form.message": "Project details",
    "form.messagePh": "Tell us about your idea or the problem you want to solve",
    "form.submit": "Send request",
    "form.privacy": "We only use your details to reply to your request.",

    "footer.tagline": "Your Key to Digital",
    "footer.about": "A digital solutions company that builds systems, apps and websites that fit each business — and runs them after launch.",
    "footer.services": "Services",
    "footer.company": "Company",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved."
  }
};
