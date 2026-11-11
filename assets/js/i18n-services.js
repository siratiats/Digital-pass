/* ==========================================================================
   Service pages (/services/*): English copy and page titles.
   Arabic copy lives in each page's HTML (services/<page>/index.html).
   Loaded after i18n.js, before main.js.
   ========================================================================== */
(function () {
  var I = window.DP_I18N;
  if (!I) return;

  var META = {
    "salla": {
      "ar": {
        "title": "تصميم وتطوير متاجر سلة وثيمات مخصصة | Digital Pass",
        "description": "ثيمات مخصصة وتطبيقات وربط لمتجرك على سلة، للأفراد والشركات الصغيرة والمتوسطة في السعودية والخليج. تواصل معنا بالاتصال أو واتساب."
      },
      "en": {
        "title": "Salla Store Development & Custom Themes | Digital Pass",
        "description": "Custom themes, apps and integrations for your Salla store, for individuals and SMEs in Saudi Arabia and the Gulf. Call or message us on WhatsApp."
      }
    },
    "mobile-apps": {
      "ar": {
        "title": "تطوير تطبيقات الجوال iOS وAndroid | Digital Pass",
        "description": "نصمّم ونبني تطبيقات iOS وAndroid من الفكرة إلى النشر في المتاجر، ونديرها بعد الإطلاق، للأفراد والشركات الصغيرة والمتوسطة في السعودية والخليج."
      },
      "en": {
        "title": "iOS & Android App Development | Digital Pass",
        "description": "We design and build iOS and Android apps from idea to app store launch, and run them after launch, for individuals and SMEs in Saudi Arabia and the Gulf."
      }
    },
    "websites": {
      "ar": {
        "title": "تصميم وتطوير المواقع الإلكترونية | Digital Pass",
        "description": "نصمّم ونبني مواقع تعريفية ومتاجر إلكترونية سريعة ومتجاوبة بالعربي والإنجليزي، للأفراد والشركات الصغيرة والمتوسطة في السعودية والخليج."
      },
      "en": {
        "title": "Website Design & Development | Digital Pass",
        "description": "We design and build fast, responsive company websites and online stores in Arabic and English, for individuals and SMEs in Saudi Arabia and the Gulf."
      }
    },
    "custom-systems": {
      "ar": {
        "title": "أنظمة مخصصة ولوحات تحكم ERP وCRM | Digital Pass",
        "description": "نبني أنظمة داخلية ولوحات تحكم ERP وCRM على مقاس سير عملك، ونربطها بأنظمتك، للأفراد والشركات الصغيرة والمتوسطة في السعودية والخليج."
      },
      "en": {
        "title": "Custom Systems, ERP, CRM & Dashboards | Digital Pass",
        "description": "We build internal systems, ERP, CRM and dashboards around your workflow and connect them to your tools, for individuals and SMEs in Saudi Arabia and the Gulf."
      }
    }
  };

  var EN = {
    "sp.crumbsLabel": "Breadcrumb",
    "sp.home": "Home",
    "sp.services": "Services",
    "sp.offerLabel": "What we offer",
    "sp.fitLabel": "Who it's for",
    "sp.faqLabel": "FAQ",
    "sp.faqTitle": "Quick answers",
    "sp.faqLead": "Didn't find your answer? Ask us directly by phone or WhatsApp.",
    "sp.moreLabel": "More services",
    "sp.moreTitle": "We cover your whole digital journey",
    "sp.viewService": "View service",
    "salla.name": "Salla Stores & Custom Themes",
    "salla.short": "Custom themes, apps and integrations for your Salla store.",
    "salla.lead": "We help you build your Salla store with an identity of its own, and add the apps and integrations it needs to run more efficiently.",
    "salla.offerTitle": "Everything your Salla store needs",
    "salla.offerLead": "From how your store looks to what happens behind the scenes, we build around your products and customers.",
    "salla.fit": "For Salla store owners, new and existing, from individuals and small and medium-sized businesses in Saudi Arabia and the Gulf.",
    "salla.h1": "Salla stores <span class=\"text-grad\">&amp; custom themes</span>",
    "salla.chip1": "Salla themes",
    "salla.chip2": "Salla apps",
    "salla.chip3": "Integrations",
    "salla.chip4": "Automation",
    "salla.c1t": "A custom theme for your store",
    "salla.c1d": "We design and code a theme made for your store instead of a ready-made template. It reflects your brand and runs fast on mobile and desktop.",
    "salla.c2t": "A tailored buying experience",
    "salla.c2d": "We adjust your store pages and checkout flow to fit your products and make ordering easier for your customers.",
    "salla.c3t": "Salla apps & add-ons",
    "salla.c3d": "We build apps and add-ons inside Salla that solve a specific need in your store.",
    "salla.c4t": "Connect your store to your systems",
    "salla.c4d": "We connect your store to your other systems, such as inventory, accounting and customer management, so everything works as one.",
    "salla.c5t": "Automate repetitive tasks",
    "salla.c5d": "We automate repetitive manual work in your store to save your team time and reduce errors.",
    "salla.c6t": "Support after launch",
    "salla.c6d": "We stay with you after launch for updates and ongoing improvements.",
    "salla.q1": "I already have a Salla store. Can you improve it?",
    "salla.a1": "Yes. We work on existing stores as well as new ones, and we start by understanding where your store is today and what it needs.",
    "salla.q2": "What's the difference between a custom theme and a ready-made template?",
    "salla.a2": "A ready-made template is used by many stores with the same look. A custom theme is designed for your store alone, so it reflects your brand and we control its speed and details.",
    "salla.q3": "How much does a theme or app cost?",
    "salla.a3": "It depends on your requirements. We agree on a written scope and a clear cost before we start.",
    "salla.q4": "Do you offer support after delivery?",
    "salla.a4": "Yes, we stay with you after launch for updates and ongoing improvements.",
    "salla.q5": "Do you serve stores outside Saudi Arabia?",
    "salla.a5": "Yes, we serve individuals and small and medium-sized businesses in Saudi Arabia and the Gulf.",
    "apps.name": "Mobile App Development",
    "apps.short": "iOS and Android apps, from idea to launch and beyond.",
    "apps.lead": "We design and build iOS and Android apps with a clear user experience, from idea to app store launch, then run them with you after launch.",
    "apps.offerTitle": "From an idea to an app in your customers' hands",
    "apps.offerLead": "We're with you at every step, and we stay after the app is live in the stores.",
    "apps.fit": "For individuals with an idea, and small and medium-sized businesses that need an app for their customers or their team, in Saudi Arabia and the Gulf.",
    "apps.h1": "Mobile app <span class=\"text-grad\">development</span>",
    "apps.chip1": "iOS",
    "apps.chip2": "Android",
    "apps.chip3": "Web apps",
    "apps.chip4": "UI/UX",
    "apps.c1t": "From idea to a clear plan",
    "apps.c1d": "We understand your idea and your users, then define the first release and the scope of work.",
    "apps.c2t": "User experience design",
    "apps.c2d": "We design clear, easy interfaces and review them with you before any code is written.",
    "apps.c3t": "App development",
    "apps.c3d": "We build the app for iOS and Android, or as a web app, depending on what you need.",
    "apps.c4t": "App store publishing",
    "apps.c4d": "We prepare the app for publishing on the App Store and Google Play.",
    "apps.c5t": "Connect the app to your systems",
    "apps.c5d": "We connect the app to your existing systems through APIs so it works with the rest of your business.",
    "apps.c6t": "App management after launch",
    "apps.c6d": "Hosting, updates, performance monitoring and ongoing support, so your app keeps running without interruption.",
    "apps.q1": "Do you build for both iPhone and Android?",
    "apps.a1": "Yes, we build for iOS and Android, and we recommend what fits your project best.",
    "apps.q2": "How long does it take to build an app?",
    "apps.a2": "It depends on the size of the app and its features. Before we start, we agree on clear stages and dates we stick to.",
    "apps.q3": "Do you publish the app to the stores?",
    "apps.a3": "Yes, we prepare the app and publish it on the App Store and Google Play.",
    "apps.q4": "Who runs the app after launch?",
    "apps.a4": "We offer app management after launch: hosting, updates, performance monitoring and technical support.",
    "apps.q5": "I only have an idea. Where do I start?",
    "apps.a5": "Call or message us on WhatsApp. We start by understanding your idea, then suggest a clear plan for the first release.",
    "web.name": "Website Design & Development",
    "web.short": "Company websites and online stores in Arabic and English.",
    "web.lead": "We build company websites and online stores designed around your brand, fast on every device, in Arabic and English.",
    "web.offerTitle": "A website that represents you and serves your customers",
    "web.offerLead": "We care about design, content and speed together, because your website is often the first thing a customer sees of you.",
    "web.fit": "For individuals and small and medium-sized businesses that need a new website or want to improve their current one, in Saudi Arabia and the Gulf.",
    "web.h1": "Website design <span class=\"text-grad\">&amp; development</span>",
    "web.chip1": "Company websites",
    "web.chip2": "Online stores",
    "web.chip3": "Mobile-friendly",
    "web.chip4": "Arabic & English",
    "web.c1t": "Company websites",
    "web.c1d": "A site that presents your company and services clearly, and makes it easy for customers to reach you.",
    "web.c2t": "Online stores",
    "web.c2d": "A store that shows your products and takes orders, designed around your brand.",
    "web.c3t": "Designed around your brand",
    "web.c3d": "We design the site to reflect your brand, instead of a recycled template.",
    "web.c4t": "Works on every device",
    "web.c4d": "Your site runs fast and looks right on mobile, tablet and desktop.",
    "web.c5t": "Arabic and English",
    "web.c5d": "We build the site in both languages, and the page direction switches with the language.",
    "web.c6t": "Management after launch",
    "web.c6d": "We stay with you after launch for updates and ongoing improvements.",
    "web.q1": "What's the difference between a company website and an online store?",
    "web.a1": "A company website presents your business and services and receives customer inquiries. An online store shows products and takes orders.",
    "web.q2": "Will the site support Arabic and English?",
    "web.a2": "Yes, we build websites in Arabic and English, and the page direction switches with the language.",
    "web.q3": "Will the site work on mobile?",
    "web.a3": "Yes, we build responsive websites that work on mobile, tablet and desktop.",
    "web.q4": "How much does a website cost?",
    "web.a4": "It depends on the type of site, the number of pages and the features. We agree on a written scope and a clear cost before we start.",
    "web.q5": "Do you manage the site after launch?",
    "web.a5": "Yes, we stay with you after launch for updates and ongoing improvements.",
    "sys.name": "Custom Systems & Dashboards",
    "sys.short": "ERP, CRM and dashboards built around your business.",
    "sys.lead": "We build internal systems around your workflow: operations, inventory, customers and resources, and connect them so they work as one.",
    "sys.offerTitle": "A system that fits how you work, not the other way around",
    "sys.offerLead": "We start by understanding your workflow, then build the system around it step by step.",
    "sys.fit": "For small and medium-sized businesses running on spreadsheets and manual work that want a system to organize it, and for individuals with projects, in Saudi Arabia and the Gulf.",
    "sys.h1": "Custom systems <span class=\"text-grad\">&amp; dashboards</span>",
    "sys.chip1": "ERP",
    "sys.chip2": "CRM",
    "sys.chip3": "Dashboards",
    "sys.chip4": "Automation",
    "sys.chip5": "API integration",
    "sys.c1t": "Resource planning (ERP)",
    "sys.c1d": "One system for your operations, inventory and resources, designed around how you work.",
    "sys.c2t": "Customer management (CRM)",
    "sys.c2d": "Track your customers, their orders and your conversations from one screen.",
    "sys.c3t": "Dashboards & reports",
    "sys.c3d": "Your key numbers in plain sight, with reports that help you decide.",
    "sys.c4t": "Internal portals",
    "sys.c4d": "Portals where your team gets tasks done and follows up on requests.",
    "sys.c5t": "Automate manual work",
    "sys.c5d": "We turn manual processes into digital ones to save time and reduce errors.",
    "sys.c6t": "Connect your systems",
    "sys.c6d": "We connect your existing systems through APIs so they work as one.",
    "sys.q1": "Why a custom system instead of off-the-shelf software?",
    "sys.a1": "Off-the-shelf software makes you work its way. A custom system is built around how you work, and grows with your business.",
    "sys.q2": "Can the system connect to the tools we already use?",
    "sys.a2": "In most cases, yes, through APIs, so everything works as one.",
    "sys.q3": "Is our data safe?",
    "sys.a3": "We treat our clients' data and systems as our own, and data security comes first in every decision.",
    "sys.q4": "How long does it take to build a system?",
    "sys.a4": "It depends on the size of the system. We split the work into clear stages, with regular progress reports.",
    "sys.q5": "Do you offer support after launch?",
    "sys.a5": "Yes, we run and improve the system with you after launch."
  };

  for (var key in EN) I.en[key] = EN[key];
  var page = document.documentElement.getAttribute("data-page");
  if (META[page]) I.meta = META[page];
})();
