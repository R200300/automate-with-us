import {
  Bot,
  PhoneCall,
  MessageSquare,
  Headset,
  Target,
  CalendarCheck,
  Users,
  Mail,
  Workflow,
  Sparkles,
} from "lucide-react";

export const services = [
  {
    slug: "ai-voice-agents",
    icon: PhoneCall,
    title: "AI Voice Agents",
    description:
      "Human-sounding voice agents answer every call, qualify the caller, and book the job — 24 hours a day.",
    outcomes: ["Never miss a call again", "Answers in under 2 seconds", "Books jobs while you sleep"],
  },
  {
    slug: "ai-chatbots",
    icon: Bot,
    title: "AI Chatbots",
    description:
      "Website chatbots trained on your business that answer questions instantly and turn visitors into leads.",
    outcomes: ["Instant answers", "Trained on your content", "Captures visitor details"],
  },
  {
    slug: "customer-support-automation",
    icon: Headset,
    title: "Customer Support Automation",
    description:
      "Resolve common tickets automatically and send only the tricky ones to your team, with full context.",
    outcomes: ["Up to 70% tickets auto-resolved", "Faster replies", "Happier customers"],
  },
  {
    slug: "lead-generation-automation",
    icon: Target,
    title: "Lead Generation Automation",
    description:
      "Find, enrich, and reach out to your ideal customers automatically, then hand warm leads to your sales team.",
    outcomes: ["More qualified leads", "Zero manual list building", "Follow-up on autopilot"],
  },
  {
    slug: "appointment-booking",
    icon: CalendarCheck,
    title: "Appointment Booking",
    description:
      "AI books, confirms, reminds, and reschedules appointments straight into your calendar.",
    outcomes: ["Fewer no-shows", "No back-and-forth emails", "Calendar always full"],
  },
  {
    slug: "whatsapp-automation",
    icon: MessageSquare,
    title: "WhatsApp Automation",
    description:
      "Reply, nurture, and sell on WhatsApp automatically — the channel your customers actually read.",
    outcomes: ["98% open rates", "Instant replies", "Broadcast campaigns"],
  },
  {
    slug: "crm-automation",
    icon: Users,
    title: "CRM Automation",
    description:
      "Every lead, note, and next step logged automatically so your pipeline is always clean and current.",
    outcomes: ["No more manual data entry", "Clean pipeline", "Smart deal reminders"],
  },
  {
    slug: "email-automation",
    icon: Mail,
    title: "Email Automation",
    description:
      "Personalised email sequences that follow up until your prospect replies or books a call.",
    outcomes: ["Higher reply rates", "Personalised at scale", "Automatic follow-ups"],
  },
  {
    slug: "workflow-automation",
    icon: Workflow,
    title: "Workflow Automation",
    description:
      "Connect your tools and remove the copy-paste work between forms, sheets, invoices, and apps.",
    outcomes: ["Hours saved weekly", "Fewer human errors", "All tools connected"],
  },
  {
    slug: "custom-ai-solutions",
    icon: Sparkles,
    title: "Custom AI Solutions",
    description:
      "Have something unique? We design and build AI systems around your exact process and data.",
    outcomes: ["Built for your process", "Own your system", "Scales with you"],
  },
];

export const industries = [
  {
    name: "Real Estate",
    description: "Answer buyer enquiries instantly, qualify leads, and book viewings automatically.",
    wins: ["24/7 enquiry response", "Auto-qualified buyers", "Viewings booked in seconds"],
  },
  {
    name: "Healthcare & Clinics",
    description: "Handle patient calls, bookings, reminders, and follow-ups without extra front-desk staff.",
    wins: ["Fewer no-shows", "Shorter hold times", "Reminders on autopilot"],
  },
  {
    name: "Home Services",
    description: "Plumbers, HVAC, and electricians capture every job even when the team is on-site.",
    wins: ["Never miss a job call", "Instant quotes", "Smart dispatch"],
  },
  {
    name: "E-commerce & Retail",
    description: "Answer order questions, recover carts, and support shoppers on every channel.",
    wins: ["Cart recovery", "Order status bots", "Faster support"],
  },
  {
    name: "Professional Services",
    description: "Law, accounting, and consulting firms qualify enquiries and book consultations.",
    wins: ["Qualified enquiries", "Auto intake forms", "Consultations booked"],
  },
  {
    name: "Fitness & Wellness",
    description: "Gyms, spas, and studios fill classes and win back lapsed members automatically.",
    wins: ["Class reminders", "Win-back campaigns", "Membership upsells"],
  },
  {
    name: "Education & Coaching",
    description: "Answer course questions, nurture applicants, and book discovery calls.",
    wins: ["Faster enrolment", "Nurtured applicants", "Higher show-up rates"],
  },
  {
    name: "Logistics & Field Ops",
    description: "Automate dispatch updates, driver check-ins, and customer notifications.",
    wins: ["Live status updates", "Less phone chasing", "Fewer errors"],
  },
];

export const testimonials = [
  {
    quote:
      "Our AI voice agent answers every call now. We booked 38 extra jobs in the first month and stopped losing after-hours leads.",
    name: "Daniel Reeves",
    role: "Owner, Reeves Plumbing — Austin, USA",
  },
  {
    quote:
      "The chatbot answers 8 out of 10 questions on its own. My support team finally has time for the hard cases.",
    name: "Priya Anand",
    role: "Operations Head, Northline Retail — Toronto, Canada",
  },
  {
    quote:
      "Lead follow-up used to take my team 12 hours a week. Now it runs itself, and replies went up by 46%.",
    name: "Emma Whitfield",
    role: "Director, Whitfield Property — Manchester, UK",
  },
  {
    quote:
      "Nexora set up WhatsApp automation for our clinic. No-shows dropped by a third within six weeks.",
    name: "Dr. Liam Carter",
    role: "Founder, Carter Dental — Sydney, Australia",
  },
  {
    quote:
      "Simple, clear, and fast. They explained everything without tech jargon and went live in under three weeks.",
    name: "Marcus Hall",
    role: "CEO, Hall & Co Accounting — Chicago, USA",
  },
  {
    quote:
      "Our CRM is finally clean. Every call and email logs itself, so nothing slips through the cracks.",
    name: "Sofia Marino",
    role: "Sales Manager, Vertex Solar — Melbourne, Australia",
  },
];

export const trustBadges = [
  "100+ automations shipped",
  "Serving USA, UK, Canada & Australia",
  "GDPR-friendly data handling",
  "Go live in 2–4 weeks",
  "30-day support included",
];

export const stats = [
  { value: "120+", label: "Automations delivered" },
  { value: "18h", label: "Saved per week, on average" },
  { value: "42%", label: "More qualified leads" },
  { value: "4.9/5", label: "Average client rating" },
];

export const processSteps = [
  {
    title: "Free Discovery Call",
    description:
      "We spend 30 minutes learning your process and spotting the tasks that eat the most time.",
  },
  {
    title: "Automation Blueprint",
    description:
      "You get a clear plan: what we automate, the tools we use, the timeline, and the expected return.",
  },
  {
    title: "Build & Test",
    description:
      "We build your AI system, connect your tools, and test it with real conversations before launch.",
  },
  {
    title: "Launch & Improve",
    description:
      "We go live, watch the results, and keep tuning every month so performance keeps climbing.",
  },
];

export const whyUs = [
  {
    icon: Sparkles,
    title: "Built for your business, not a template",
    description:
      "Every automation is designed around how you actually work — your tools, your tone, your process.",
  },
  {
    icon: Workflow,
    title: "Live in weeks, not months",
    description: "Most projects go live in 2 to 4 weeks with a clear plan and weekly progress updates.",
  },
  {
    icon: Users,
    title: "Plain English, no jargon",
    description: "We explain everything simply, so you always know what is being built and why.",
  },
  {
    icon: Target,
    title: "Focused on results",
    description: "We measure time saved, leads captured, and revenue added — not vanity metrics.",
  },
  {
    icon: Headset,
    title: "Real ongoing support",
    description: "You get a dedicated point of contact and 30 days of support after launch, minimum.",
  },
  {
    icon: Bot,
    title: "Safe and compliant",
    description: "Your data stays yours. We follow strict privacy practices and secure integrations.",
  },
];

export const faqs = [
  {
    q: "How fast can we go live?",
    a: "Most projects launch in 2 to 4 weeks. Simple chatbots or booking flows can be ready in about 7 days.",
  },
  {
    q: "Do I need technical skills?",
    a: "No. We handle the setup, the integrations, and the testing. You get a simple dashboard and a short training session.",
  },
  {
    q: "Will AI sound robotic to my customers?",
    a: "No. We train the voice and chat agents on your tone and real examples, so conversations feel natural and on-brand.",
  },
  {
    q: "Which tools do you connect to?",
    a: "We work with the tools you already use — HubSpot, GoHighLevel, Salesforce, Zoho, Calendly, Google Workspace, WhatsApp, Slack, Shopify, and more.",
  },
  {
    q: "What does it cost?",
    a: "Projects start at $1,200 one-time, with monthly management from $499. We give you a fixed quote after the free discovery call.",
  },
  {
    q: "Is my customer data safe?",
    a: "Yes. We use secure, permission-based integrations, never sell data, and follow GDPR-friendly practices.",
  },
  {
    q: "What if it does not work for us?",
    a: "We start with a small, high-impact automation and prove the value first. If the numbers are not there, you are not locked into a long contract.",
  },
];

export const pricingPlans = [
  {
    name: "Starter",
    price: "$1,200",
    cadence: "one-time setup + $499/mo",
    description: "Perfect for small teams automating their first big time drain.",
    features: [
      "1 AI solution (chatbot or booking)",
      "Up to 3 tool integrations",
      "Custom training on your content",
      "Basic analytics dashboard",
      "30 days of support",
    ],
    cta: "Start with Starter",
    featured: false,
  },
  {
    name: "Growth",
    price: "$3,500",
    cadence: "one-time setup + $999/mo",
    description: "Our most popular plan for businesses ready to automate sales and support.",
    features: [
      "Up to 3 AI solutions",
      "AI voice agent included",
      "Unlimited tool integrations",
      "CRM + WhatsApp automation",
      "Monthly optimisation calls",
      "Priority support",
    ],
    cta: "Choose Growth",
    featured: true,
  },
  {
    name: "Scale",
    price: "Custom",
    cadence: "tailored to your operation",
    description: "For multi-location and high-volume teams that need a full AI operating layer.",
    features: [
      "Unlimited AI solutions",
      "Custom AI models & workflows",
      "Multi-location and multi-language",
      "Dedicated automation engineer",
      "Quarterly strategy reviews",
      "SLA-backed support",
    ],
    cta: "Talk to Us",
    featured: false,
  },
];

export const posts = [
  {
    slug: "ai-voice-agents-small-business",
    title: "AI Voice Agents: How Small Businesses Stop Losing After-Hours Calls",
    excerpt:
      "Missed calls are missed money. Here is how a voice agent answers every call, qualifies the caller, and books the job automatically.",
    category: "AI Voice",
    readTime: "6 min read",
    date: "July 18, 2026",
  },
  {
    slug: "chatbot-vs-live-chat",
    title: "AI Chatbot vs Live Chat: Which One Actually Converts More Leads?",
    excerpt:
      "We compared response times, cost, and conversion rates across 40 client websites. The results surprised most owners.",
    category: "Chatbots",
    readTime: "5 min read",
    date: "July 9, 2026",
  },
  {
    slug: "whatsapp-automation-guide",
    title: "The Simple Guide to WhatsApp Automation for Service Businesses",
    excerpt:
      "From instant replies to review requests — seven WhatsApp flows you can launch this month.",
    category: "WhatsApp",
    readTime: "7 min read",
    date: "June 27, 2026",
  },
  {
    slug: "automate-first-90-days",
    title: "What to Automate First: A 90-Day Plan for SMBs",
    excerpt:
      "Do not automate everything at once. This phased plan shows what to fix in month one, two, and three.",
    category: "Strategy",
    readTime: "8 min read",
    date: "June 14, 2026",
  },
  {
    slug: "crm-automation-clean-pipeline",
    title: "CRM Automation: How to Keep a Clean Pipeline Without Data Entry",
    excerpt:
      "Your sales team should sell, not type. Here is the setup that logs every touchpoint automatically.",
    category: "CRM",
    readTime: "5 min read",
    date: "May 30, 2026",
  },
  {
    slug: "ai-roi-calculator",
    title: "How to Calculate the ROI of AI Automation (With Real Numbers)",
    excerpt:
      "A simple formula to work out how much time and money an automation will save before you buy it.",
    category: "Strategy",
    readTime: "6 min read",
    date: "May 16, 2026",
  },
];

export const caseStudies = [
  {
    client: "Reeves Plumbing",
    industry: "Home Services · Austin, USA",
    challenge:
      "Half of all inbound calls went unanswered because the crew was on-site, and after-hours leads went to competitors.",
    solution:
      "An AI voice agent that answers every call, qualifies the job, quotes call-out fees, and books straight into the dispatch calendar.",
    results: [
      { value: "+38", label: "extra jobs in month one" },
      { value: "100%", label: "calls answered" },
      { value: "$41k", label: "added revenue in 90 days" },
    ],
    quote:
      "We stopped losing after-hours work overnight. It paid for itself in two weeks.",
  },
  {
    client: "Carter Dental",
    industry: "Healthcare · Sydney, Australia",
    challenge:
      "No-shows were running at 22% and the front desk spent hours each day on reminder calls and rescheduling.",
    solution:
      "WhatsApp and SMS booking automation with smart reminders, easy rescheduling, and automatic waitlist filling.",
    results: [
      { value: "-33%", label: "no-show rate" },
      { value: "14h", label: "front-desk hours saved weekly" },
      { value: "4.9★", label: "patient satisfaction" },
    ],
    quote: "The front desk finally has time to look after patients in the room.",
  },
  {
    client: "Whitfield Property",
    industry: "Real Estate · Manchester, UK",
    challenge:
      "Portal leads were followed up manually, often more than 12 hours late, and many went cold before an agent called.",
    solution:
      "Instant AI lead response, qualification questions, viewing booking, and automatic CRM logging with nurture sequences.",
    results: [
      { value: "+46%", label: "lead reply rate" },
      { value: "90s", label: "average first response" },
      { value: "12h", label: "team hours saved weekly" },
    ],
    quote: "Every lead gets a reply in seconds now. Our agents only speak to serious buyers.",
  },
  {
    client: "Northline Retail",
    industry: "E-commerce · Toronto, Canada",
    challenge:
      "Support was flooded with order-status and returns questions, and response times stretched past 24 hours.",
    solution:
      "An AI support agent connected to Shopify that answers order questions, starts returns, and escalates complex cases with full context.",
    results: [
      { value: "72%", label: "tickets auto-resolved" },
      { value: "3 min", label: "average first response" },
      { value: "-$4.2k", label: "monthly support cost" },
    ],
    quote: "Customers get answers instantly, and our agents handle only the cases that need a human.",
  },
];
