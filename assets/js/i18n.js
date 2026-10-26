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

  /* Strings used from JavaScript (validation, form states) */
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
      langButton: "English",
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
      langButton: "عربي",
      menuOpen: "Open menu",
      menuClose: "Close menu"
    }
  },

  /* data-i18n / data-i18n-html / data-i18n-ph / data-i18n-aria keys */
  en: {
    "a11y.skip": "Skip to content",

    "nav.label": "Main navigation",
    "nav.services": "Services",
    "nav.process": "How we work",
    "nav.about": "About",
    "nav.values": "Values",
    "nav.contact": "Contact us",
    "nav.menu": "Open menu",

    "hero.badge": "Digital solutions for businesses",
    "hero.title": "Your key to <span class=\"text-grad\">digital</span>",
    "hero.lead": "We build systems and apps that fit your business — and run them with you after launch.",
    "hero.cta": "Start your project",
    "hero.cta2": "Explore our services",
    "hero.p1": "Written scope before we start",
    "hero.p2": "Regular, transparent progress reports",
    "hero.p3": "Ongoing support after delivery",
    "hero.chipDone": "Done",
    "hero.chipUpdate": "Update published",
    "hero.chipProgress": "In progress",

    "services.title": "Our services",
    "services.lead": "Services that cover your whole digital journey — from idea to operation.",
    "services.g1": "Systems & apps",
    "services.g2": "Websites & e-commerce",
    "services.request": "Request this service",

    "s1.title": "Custom systems",
    "s1.desc": "We design and build internal systems around how your company works: operations, inventory, customers and resources.",
    "s1.t3": "Dashboards",
    "s1.t4": "Internal portals",

    "s2.title": "App development",
    "s2.desc": "Mobile and web apps with a clear user experience — from idea and design to publishing in the stores.",

    "s3.title": "App management",
    "s3.desc": "Hosting, updates, performance monitoring and ongoing technical support, so your app stays up without interruption.",
    "s3.t1": "Hosting",
    "s3.t2": "Monitoring",
    "s3.t3": "Updates",
    "s3.t4": "Technical support",

    "s4.title": "Digital solutions",
    "s4.desc": "We turn manual processes into digital ones, and connect your systems so they work as one.",
    "s4.t1": "Automation",
    "s4.t2": "API integration",
    "s4.t3": "Data analytics",
    "s4.t4": "Consulting",

    "s5.title": "Web development",
    "s5.desc": "We build websites of every kind: corporate sites that present your company and online stores that sell your products — designed around your brand and fast on every device.",
    "s5.t1": "Corporate websites",
    "s5.t2": "Online stores",
    "s5.t3": "Mobile-friendly",
    "s5.t4": "Arabic & English",

    "s6.title": "Salla store solutions",
    "s6.desc": "Technical solutions inside your Salla store: apps and add-ons that solve a specific need, and integrations that connect your store to your other systems.",
    "s6.t1": "Salla apps",
    "s6.t2": "Integrations",
    "s6.t3": "Automation",
    "s6.t4": "Store customization",

    "s7.title": "Custom themes",
    "s7.desc": "We design and build a custom, high-quality theme for your website or store instead of an off-the-shelf template — a look no one else has, and fast performance.",
    "s7.t1": "Custom design",
    "s7.t2": "Salla themes",
    "s7.t3": "High performance",

    "process.title": "How we work",
    "process.lead": "Four clear stages — at each one you know where we are and what comes next.",
    "step1.title": "Discover",
    "step1.desc": "We sit with your team and understand how your work flows.",
    "step2.title": "Design",
    "step2.desc": "We map out the solution and the user experience.",
    "step3.title": "Build",
    "step3.desc": "We develop and test in clear stages.",
    "step4.title": "Run",
    "step4.desc": "We launch, manage and keep improving.",

    "about.title": "About us",
    "about.p1": "Digital Pass is a digital solutions company that builds custom systems for businesses based on what they need, and develops and runs apps after launch. We treat technology as a key that opens a new door to growth — not an extra burden.",
    "about.p2": "If Digital Pass were a person, it would be an experienced engineer who explains the solution calmly and clearly — and leaves you confident you're in safe hands.",
    "about.belief": "Good technology isn't seen… it's felt in how fast and easy work becomes.",
    "about.weAre": "We are",
    "about.weAreNot": "We are not",
    "t1.is": "Reliable", "t1.not": "Rigid",
    "t2.is": "Smart", "t2.not": "Arrogant",
    "t3.is": "Approachable", "t3.not": "Casual",
    "t4.is": "Practical", "t4.not": "Dull",
    "t5.is": "Ambitious", "t5.not": "Exaggerating",
    "about.archetype": "Archetype: The Guide",
    "about.archetypeDesc": "Knows the way well, and walks with the client step by step until they arrive.",

    "vision.title": "Vision, mission & promise",
    "vision.label": "Vision",
    "vision.text": "To be the gateway through which businesses cross into the digital future <span class=\"accent\">with confidence</span>.",
    "vision.q": "Why we exist",
    "mission.label": "Mission",
    "mission.text": "We build systems and apps tailored to each company, and run them alongside it after launch — so its business works more efficiently, with less effort.",
    "mission.q": "What we do every day",
    "promise.title": "Your Key to Digital",
    "promise.text": "We give businesses safe, easy access to the digital capabilities that suit them.",

    "values.title": "Our values",
    "values.lead": "Four values that guide how we work with clients and with each other.",
    "values.how": "How it shows in our work",
    "v1.title": "Trust",
    "v1.desc": "We protect our clients' data and systems as if they were our own, and we deliver on what we promise.",
    "v1.i1": "Data security is a priority in every decision",
    "v1.i2": "Realistic promises and deadlines we keep",
    "v1.i3": "Well-considered access permissions for every system",
    "v2.title": "Clarity",
    "v2.desc": "Simple language, known stages, and clear costs from the start.",
    "v2.i1": "No complex jargon with clients",
    "v2.i2": "Regular, transparent progress reports",
    "v2.i3": "A written scope before we start",
    "v3.title": "Craft",
    "v3.desc": "Clean code and a thoughtful user experience, down to the smallest detail.",
    "v3.i1": "Review and testing before every launch",
    "v3.i2": "Design that serves the user, not just the look",
    "v3.i3": "Documentation that makes future work easier",
    "v4.title": "Partnership",
    "v4.desc": "We don't deliver and disappear — we stay with clients after launch and grow with them.",
    "v4.i1": "Ongoing support and development after delivery",
    "v4.i2": "We understand the business before we code",
    "v4.i3": "We measure results together and improve",

    "cta.title": "Is your business ready to go digital?",
    "cta.text": "We build the system your business needs — and stay with you after launch.",
    "cta.btn": "Book a call",

    "contact.title": "Contact us",
    "contact.lead": "Tell us about your business and what you need — we'll come back with clear next steps.",
    "contact.email": "Email",
    "contact.phone": "Phone",
    "contact.whatsapp": "WhatsApp",
    "contact.whatsappCta": "Message us directly",
    "contact.whatsappAria": "Chat with us on WhatsApp",
    "contact.location": "Location",

    "form.title": "Request a consultation",
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

    "footer.about": "A digital solutions company that builds systems and apps that fit each business — and runs them after launch.",
    "footer.services": "Services",
    "footer.company": "Company",
    "footer.contact": "Contact",
    "footer.rights": "All rights reserved."
  }
};
