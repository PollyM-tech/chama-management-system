"use client";

import Image from "next/image";
import Link from "next/link";
import logo from "./logo.png";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  Home,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Phone,
  Settings,
  ShieldCheck,
  Smartphone,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

const contactEmail = "lintechtelecom@gmail.com";
const contactPhone = "+254714660729 / +254758741425";

type DashboardTab = "dashboard" | "members" | "loans" | "settings";

const dashboardFrames = [
  {
    balance: "KES 428,500",
    savings: "KES 428,500",
    members: "32 Members",
    loans: "KES 96,000",
    progress: 64,
    growth: "↗ 12% from last month",
    transactions: [
      ["Mary Wanjiku", "KES 5,000"],
      ["James Kariuki", "KES 3,500"],
      ["Amina Nasir", "KES 4,000"],
    ],
  },
  {
    balance: "KES 462,900",
    savings: "KES 462,900",
    members: "36 Members",
    loans: "KES 112,000",
    progress: 72,
    growth: "↗ 18% from last month",
    transactions: [
      ["Peter Mwangi", "KES 6,000"],
      ["Grace Njeri", "KES 2,500"],
      ["Kevin Otieno", "KES 7,000"],
    ],
  },
  {
    balance: "KES 489,250",
    savings: "KES 489,250",
    members: "41 Members",
    loans: "KES 128,500",
    progress: 81,
    growth: "↗ 21% from last month",
    transactions: [
      ["Lilian Achieng", "KES 4,500"],
      ["Samuel Maina", "KES 8,000"],
      ["Fatuma Ali", "KES 3,000"],
    ],
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <Navbar />
      <HeroSection />
      <TrustMetrics />
      <FeaturesSection />
      <HowItWorks />
      <MobileShowcase />
      <ComparisonSection />
      <SecuritySection />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
      <AnimationStyles />
    </main>
  );
}

function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="SmartChama logo"
            className="h-10 w-10 rounded-xl object-contain"
            priority
          />
          <span className="text-xl font-black tracking-tight">
            Smart<span className="text-emerald-700">Chama</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-slate-600 lg:flex">
          <a href="#" className="text-emerald-700">
            Home
          </a>
          <a href="#features" className="transition hover:text-emerald-700">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-emerald-700">
            How It Works
          </a>
          <a href="#pricing" className="transition hover:text-emerald-700">
            Pricing
          </a>
          <a href="#security" className="transition hover:text-emerald-700">
            Security
          </a>
          <a href="#testimonials" className="transition hover:text-emerald-700">
            Testimonials
          </a>
          <a href="#faqs" className="transition hover:text-emerald-700">
            FAQs
          </a>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link
            href="/login"
            className="text-sm font-semibold text-slate-700 transition hover:text-emerald-700"
          >
            Login
          </Link>
          <Link
            href="/login"
            className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
          >
            Create Chama
          </Link>
        </div>

        <button
          aria-label="Open menu"
          className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
        >
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50/70 to-white pb-16 pt-28 sm:pb-20 lg:pb-24">
      <div className="absolute right-[-220px] top-[-250px] h-[520px] w-[520px] rounded-full bg-emerald-800/10 blur-2xl" />
      <div className="absolute left-[-180px] top-56 h-[360px] w-[360px] rounded-full bg-emerald-400/10 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="animate-fade-slide">
          <div className="mb-6 inline-flex items-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-extrabold text-emerald-800 shadow-sm">
            Built for Modern Kenyan Chamas 🇰🇪
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Manage Your Chama with{" "}
            <span className="text-emerald-700">Clarity, Trust</span> and{" "}
            <span className="text-emerald-700">Speed.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            SmartChama helps groups track contributions, loans, savings, member
            records, reports, and activities in one secure dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-700/20 transition hover:-translate-y-0.5 hover:bg-emerald-800"
            >
              Create Your Chama <ChevronRight size={18} />
            </Link>

            <a
              href="#demo"
              className="inline-flex items-center justify-center rounded-xl border border-emerald-700 bg-white px-6 py-3.5 text-sm font-extrabold text-emerald-700 transition hover:-translate-y-0.5 hover:bg-emerald-50"
            >
              View Live Dashboard
            </a>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  );
}

function DashboardMockup() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % dashboardFrames.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  const data = dashboardFrames[frameIndex];

  return (
    <div id="demo" className="relative flex justify-center lg:justify-end">
      <div className="dashboard-float relative w-full max-w-[700px] rounded-[2rem] bg-white p-3 shadow-2xl shadow-emerald-900/15 ring-1 ring-slate-200 sm:p-4 lg:rotate-[-1.5deg]">
        <div className="flex overflow-hidden rounded-[1.5rem] bg-slate-50">
          <aside className="hidden w-[158px] bg-[#003f20] px-4 py-6 text-white sm:block">
            <div className="mb-7 flex items-center gap-2 text-xs font-extrabold">
              <Users size={16} />
              SmartChama
            </div>

            <SideItem
              active={activeTab === "dashboard"}
              icon={<Home size={15} />}
              label="Dashboard"
              onClick={() => setActiveTab("dashboard")}
            />
            <SideItem
              active={activeTab === "members"}
              icon={<Users size={15} />}
              label="Members"
              onClick={() => setActiveTab("members")}
            />
            <SideItem
              icon={<Wallet size={15} />}
              label="Contributions"
              onClick={() => setActiveTab("dashboard")}
            />
            <SideItem
              active={activeTab === "loans"}
              icon={<Activity size={15} />}
              label="Loans"
              onClick={() => setActiveTab("loans")}
            />
            <SideItem
              icon={<FileText size={15} />}
              label="Reports"
              onClick={() => setActiveTab("dashboard")}
            />
            <SideItem
              icon={<Bell size={15} />}
              label="Activities"
              onClick={() => setActiveTab("dashboard")}
            />
            <SideItem
              active={activeTab === "settings"}
              icon={<Settings size={15} />}
              label="Settings"
              onClick={() => setActiveTab("settings")}
            />
          </aside>

          <section className="min-w-0 flex-1 p-4 sm:p-5">
            {activeTab === "dashboard" && <DashboardPanel data={data} />}
            {activeTab === "members" && <MembersPanel />}
            {activeTab === "loans" && <LoansPanel />}
            {activeTab === "settings" && <SettingsPanel />}
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardPanel({ data }: { data: (typeof dashboardFrames)[number] }) {
  return (
    <div className="panel-fade">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          Dashboard
        </h2>
        <span className="rounded-full bg-white px-3 py-2 text-[11px] font-bold text-slate-500 shadow-sm">
          Live Update
        </span>
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-green-950 p-5 text-white shadow-lg">
        <p className="text-xs font-medium text-emerald-100">
          Total Chama Balance
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-2xl font-black sm:text-3xl">{data.balance}</p>
            <p className="mt-3 text-xs text-emerald-100">{data.growth}</p>
          </div>

          <svg
            className="hidden sm:block"
            width="170"
            height="80"
            viewBox="0 0 210 95"
            fill="none"
          >
            <path
              className="chart-draw"
              d="M4 74C30 48 44 37 66 47C89 58 97 61 119 35C141 9 159 33 172 38C184 43 194 17 206 11"
              stroke="rgba(255,255,255,.75)"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard
          title="Total Savings"
          value={data.savings}
          sub="Available balance"
        />
        <InfoCard
          title="Active Members"
          value={data.members}
          sub="100% active"
        />
        <InfoCard
          title="Loans Issued"
          value={data.loans}
          sub="Active loan book"
        />
        <InfoCard
          title="Repayment Progress"
          value={`${data.progress}%`}
          sub="This month"
        />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div className="hover-card rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 text-sm font-black">Recent Transactions</h3>
          {data.transactions.map(([name, amount]) => (
            <div
              key={name}
              className="mb-3 flex items-center justify-between gap-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-emerald-100" />
                <div className="min-w-0">
                  <p className="truncate text-xs font-black">{name}</p>
                  <p className="text-[11px] text-slate-400">Today, 10:24 AM</p>
                </div>
              </div>
              <p className="shrink-0 text-[11px] font-black">{amount}</p>
            </div>
          ))}
        </div>

        <div className="hover-card rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
          <h3 className="mb-4 text-sm font-black">Loan Repayment Progress</h3>
          <Progress label="Savings Target" value={78} />
          <Progress label="Loan Repayment" value={data.progress} />
          <Progress label="Attendance" value={91} />
        </div>
      </div>
    </div>
  );
}

function MembersPanel() {
  const members = [
    ["Mary Wanjiku", "Treasurer", "KES 48,000", "Active"],
    ["James Kariuki", "Chairperson", "KES 55,500", "Active"],
    ["Amina Nasir", "Member", "KES 36,250", "Active"],
    ["Peter Mwangi", "Secretary", "KES 42,000", "Active"],
  ];

  return (
    <div className="panel-fade">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            Members
          </h2>
          <p className="text-xs text-slate-500">41 registered members</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700">
          +4 this month
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard title="Active Members" value="41" sub="Verified users" />
        <InfoCard title="New Members" value="4" sub="This month" />
        <InfoCard title="Avg Contribution" value="KES 4,800" sub="Per member" />
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h3 className="mb-4 text-sm font-black">Member Directory</h3>
        <div className="space-y-3">
          {members.map(([name, role, amount, status]) => (
            <div
              key={name}
              className="flex items-center justify-between rounded-xl border border-slate-100 p-3 transition hover:-translate-y-0.5 hover:bg-emerald-50/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-800">
                  {name[0]}
                </div>
                <div>
                  <p className="text-xs font-black">{name}</p>
                  <p className="text-[11px] text-slate-500">{role}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-black">{amount}</p>
                <p className="text-[11px] text-emerald-700">{status}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoansPanel() {
  return (
    <div className="panel-fade">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight sm:text-2xl">
            Loans
          </h2>
          <p className="text-xs text-slate-500">
            Loan applications and repayments
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-700">
          3 pending
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard title="Loan Book" value="KES 128,500" sub="Active loans" />
        <InfoCard title="Repaid" value="KES 74,300" sub="This cycle" />
        <InfoCard title="Default Risk" value="Low" sub="Healthy portfolio" />
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h3 className="mb-4 text-sm font-black">Loan Status</h3>
        <Progress label="Repayment Collection" value={81} />
        <Progress label="Approved Loans" value={68} />
        <Progress label="Pending Reviews" value={24} />

        <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
          <p className="text-xs font-black text-emerald-800">
            Next repayment reminder
          </p>
          <p className="mt-1 text-[11px] leading-5 text-emerald-900/70">
            Automated SMS and email reminders scheduled for Friday at 8:00 AM.
          </p>
        </div>
      </div>
    </div>
  );
}

function SettingsPanel() {
  return (
    <div className="panel-fade">
      <div className="mb-5">
        <h2 className="text-xl font-black tracking-tight sm:text-2xl">
          Settings
        </h2>
        <p className="text-xs text-slate-500">
          Control security and group rules
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SettingCard
          title="Role Permissions"
          text="Treasurer, chairperson, secretary, and member access."
        />
        <SettingCard
          title="Audit Trail"
          text="Track every contribution, edit, approval, and report export."
        />
        <SettingCard
          title="SMS Reminders"
          text="Automated contribution and loan repayment reminders."
        />
        <SettingCard
          title="Backup Status"
          text="Cloud backup active and synced 2 minutes ago."
        />
      </div>

      <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h3 className="mb-4 text-sm font-black">Security Health</h3>
        <Progress label="Account Security" value={94} />
        <Progress label="Member Verification" value={88} />
        <Progress label="Backup Coverage" value={100} />
      </div>
    </div>
  );
}

function TrustMetrics() {
  return (
    <section className="relative z-10 -mt-8 px-5 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-4 rounded-3xl bg-white p-4 shadow-xl shadow-slate-900/5 ring-1 ring-slate-100 sm:p-5 md:grid-cols-4">
        <Metric icon={<Users />} end={500} suffix="+" label="Active Chamas" />
        <Metric
          icon={<BarChart3 />}
          end={10000}
          suffix="+"
          label="Transactions Processed"
        />
        <Metric
          icon={<ShieldCheck />}
          end={99.9}
          suffix="%"
          label="System Availability"
        />
        <Metric
          icon={<Wallet />}
          prefix="KES "
          end={500}
          suffix="M+"
          label="Managed Through Platform"
        />
      </div>
    </section>
  );
}

function FeaturesSection() {
  const features: [string, string, ReactNode][] = [
    [
      "Contributions Tracking",
      "Track member contributions automatically.",
      <Wallet key="wallet" />,
    ],
    [
      "Loan Management",
      "Issue loans and monitor repayments.",
      <Activity key="activity" />,
    ],
    [
      "Member Management",
      "Manage member profiles and permissions.",
      <Users key="users" />,
    ],
    [
      "Reports & Statements",
      "Generate financial reports instantly.",
      <FileSpreadsheet key="file" />,
    ],
    [
      "Meeting Records",
      "Store meeting minutes and resolutions.",
      <FileText key="text" />,
    ],
    [
      "Notifications",
      "SMS and email reminders for members.",
      <Bell key="bell" />,
    ],
    ["Mobile Access", "Use SmartChama anywhere.", <Smartphone key="phone" />],
    [
      "Security & Audit Trail",
      "Every transaction is logged.",
      <ShieldCheck key="shield" />,
    ],
  ];

  return (
    <section id="features" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Powerful Features"
          title="Everything Your Chama Needs"
          text="Clean tools for contribution tracking, loans, records, reporting, and accountability."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, desc, icon]) => (
            <FeatureCard key={title} title={title} desc={desc} icon={icon} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Simple Process"
          title="From Chama Setup to Daily Management in Minutes"
          text="Create your group, invite members, track activity, and generate reports without complicated setup."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Step
            number="01"
            title="Create Your Chama"
            text="Register your group and set rules."
          />
          <Step
            number="02"
            title="Invite Members"
            text="Add members through email or phone."
          />
          <Step
            number="03"
            title="Start Managing"
            text="Track savings, loans, and activities."
          />
          <Step
            number="04"
            title="Generate Reports"
            text="Download reports anytime."
          />
        </div>
      </div>
    </section>
  );
}

function MobileShowcase() {
  return (
    <section className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-800 to-green-950 px-5 py-14 text-white sm:px-10 lg:px-14">
          <SectionHeading
            light
            eyebrow="Mobile App Showcase"
            title="Manage Your Chama From Anywhere"
            text="A responsive experience that feels smooth on phones, tablets, and desktops."
          />

          <div className="mt-12 flex flex-wrap items-end justify-center gap-5">
            {[
              ["Member App", "👤", "h-64"],
              ["Contributions", "💸", "h-72"],
              ["Loan Application", "📝", "h-60"],
              ["Reports", "📊", "h-72"],
            ].map(([label, icon, height]) => (
              <div
                key={label}
                className={`${height} phone-float flex w-32 flex-col items-center justify-between rounded-[2rem] border border-white/15 bg-white/10 p-5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/15 sm:w-36`}
              >
                <div className="h-1.5 w-9 rounded-full bg-white/40" />
                <div className="text-center">
                  <p className="text-4xl">{icon}</p>
                  <p className="mt-4 text-sm font-bold">{label}</p>
                </div>
                <div className="h-7 w-7 rounded-full border border-white/30" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  return (
    <section className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 sm:px-6 lg:grid-cols-2 lg:px-8">
        <CompareCard
          title="Traditional Chama"
          bad
          items={[
            "Excel Sheets",
            "Lost Records",
            "Manual Calculations",
            "Delayed Reports",
            "Transparency Issues",
          ]}
        />
        <CompareCard
          title="SmartChama"
          items={[
            "Automated Tracking",
            "Secure Cloud Storage",
            "Instant Reports",
            "Loan Monitoring",
            "Full Transparency",
          ]}
        />
      </div>
    </section>
  );
}

function SecuritySection() {
  return (
    <section id="security" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 text-center sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Security"
          title="Built for Trust and Transparency"
          text="SmartChama keeps records organized, accessible, and protected through secure controls."
        />

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {[
            "Bank-grade encryption",
            "Role-based permissions",
            "Automated backups",
            "Audit logs",
            "Secure cloud infrastructure",
          ].map((item) => (
            <div
              key={item}
              className="hover-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <LockKeyhole className="mx-auto text-emerald-700" />
              <p className="mt-4 text-sm font-bold">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section id="testimonials" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Trusted by Chamas"
          title="What Our Members Say"
          text="Designed for treasurers, chairpersons, and members who want clearer records."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <Testimonial
            name="Mary W."
            role="Treasurer"
            text="Before SmartChama, balancing records took hours. Now it takes minutes."
          />
          <Testimonial
            name="James K."
            role="Chairperson"
            text="Members trust the system because every transaction is visible."
          />
          <Testimonial
            name="Amina N."
            role="Member"
            text="I can check my savings and loan status anytime."
          />
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="pricing" className="bg-white py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Pricing"
          title="Simple Plans for Every Chama"
          text="Start small, then scale as your group grows."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <PriceCard
            title="Starter"
            price="KES 999/month"
            items={["Up to 20 members", "Contributions", "Basic reports"]}
          />
          <PriceCard
            featured
            title="Growth"
            price="KES 2,499/month"
            items={["Up to 100 members", "Loans", "Reports", "Notifications"]}
          />
          <PriceCard
            title="Enterprise"
            price="Custom Pricing"
            items={[
              "Unlimited members",
              "Multi-branch support",
              "Custom integrations",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function FAQSection() {
  return (
    <section id="faqs" className="bg-slate-50 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-6">
        <SectionHeading
          eyebrow="FAQs"
          title="Frequently Asked Questions"
          text="Quick answers for common SmartChama questions."
        />
        <div className="mt-10 space-y-4">
          <FAQ
            q="Can members access using phones?"
            a="Yes. SmartChama is built for mobile and desktop access."
          />
          <FAQ
            q="Does SmartChama support loans?"
            a="Yes. You can manage loan applications, approvals, and repayments."
          />
          <FAQ
            q="Is my data secure?"
            a="Yes, with encrypted cloud storage, role permissions, and audit logs."
          />
          <FAQ
            q="Can I export reports?"
            a="Yes. PDF and Excel report exports are planned for the reporting module."
          />
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="bg-emerald-700 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 text-center sm:px-6">
        <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          Ready to Transform Your Chama?
        </h2>
        <p className="mt-4 text-base leading-7 text-emerald-100">
          Join hundreds of groups already using SmartChama.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-white px-6 py-3.5 text-sm font-black text-emerald-700 transition hover:-translate-y-0.5"
          >
            Create Chama
          </Link>
          <a
            href={`mailto:${contactEmail}`}
            className="rounded-xl border border-white/30 px-6 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/10"
          >
            Schedule Demo
          </a>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#062f1b] text-white">
      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_2fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={logo}
                alt="SmartChama logo"
                className="h-12 w-12 rounded-xl bg-white object-contain p-1"
              />
              <span className="text-xl font-black tracking-tight">
                Smart<span className="text-emerald-300">Chama</span>
              </span>
            </Link>

            <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/80">
              A clean and secure chama management platform for contributions,
              loans, records, reports, and member transparency.
            </p>

            <div className="mt-6 space-y-3 text-sm text-emerald-50/80">
              <p className="flex items-center gap-3">
                <Mail size={16} className="text-emerald-300" />
                {contactEmail}
              </p>
              <p className="flex items-center gap-3">
                <Phone size={16} className="text-emerald-300" />
                {contactPhone}
              </p>
              <p className="flex items-center gap-3">
                <MapPin size={16} className="text-emerald-300" />
                Nairobi, Kenya
              </p>
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            <FooterColumn
              title="Product"
              links={["Features", "Pricing", "Security", "FAQs"]}
            />
            <FooterColumn
              title="Company"
              links={["About", "Testimonials", "Contact", "Demo"]}
            />
            <FooterColumn
              title="Support"
              links={[
                "Help Center",
                "Documentation",
                "Privacy Policy",
                "Terms",
              ]}
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-emerald-50/70 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SmartChama. All rights reserved.</p>
          <p>Built for modern Kenyan savings groups.</p>
        </div>
      </div>
    </footer>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
  light = false,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p
        className={`text-xs font-black uppercase tracking-[0.2em] ${light ? "text-emerald-200" : "text-emerald-700"}`}
      >
        {eyebrow}
      </p>
      <h2
        className={`mt-3 text-3xl font-black tracking-tight sm:text-4xl ${light ? "text-white" : "text-slate-950"}`}
      >
        {title}
      </h2>
      {text && (
        <p
          className={`mt-4 text-base leading-7 ${light ? "text-emerald-50/80" : "text-slate-600"}`}
        >
          {text}
        </p>
      )}
    </div>
  );
}

function SideItem({
  icon,
  label,
  active = false,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`mb-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-bold transition ${active ? "bg-white text-emerald-800 shadow-sm" : "text-white/75 hover:bg-white/10 hover:text-white"}`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function InfoCard({
  title,
  value,
  sub,
}: {
  title: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="hover-card rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <p className="text-[11px] font-bold text-slate-500">{title}</p>
      <p className="mt-2 text-base font-black text-slate-950">{value}</p>
      <p className="mt-1 text-[11px] text-slate-400">{sub}</p>
    </div>
  );
}

function SettingCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="hover-card rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        <ShieldCheck size={18} />
      </div>
      <h3 className="text-sm font-black">{title}</h3>
      <p className="mt-2 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function Progress({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-4">
      <div className="mb-2 flex justify-between text-[11px] font-bold text-slate-500">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="progress-fill h-full rounded-full bg-emerald-600"
          style={{ "--progress": `${value}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

function Metric({
  icon,
  end,
  label,
  prefix = "",
  suffix = "",
}: {
  icon: ReactNode;
  end: number;
  label: string;
  prefix?: string;
  suffix?: string;
}) {
  const count = useCountUp(end);

  return (
    <div className="hover-card rounded-2xl border border-slate-100 bg-white p-5 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>
      <p className="text-2xl font-black tracking-tight text-slate-950">
        {prefix}
        {end % 1 === 0 ? Math.round(count).toLocaleString() : count.toFixed(1)}
        {suffix}
      </p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  );
}

function FeatureCard({
  title,
  desc,
  icon,
}: {
  title: string;
  desc: string;
  icon: ReactNode;
}) {
  return (
    <div className="hover-card group rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 transition group-hover:bg-emerald-700 group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-base font-black">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{desc}</p>
    </div>
  );
}

function Step({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="hover-card rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 text-sm font-black text-white">
        {number}
      </div>
      <h3 className="font-black">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </div>
  );
}

function CompareCard({
  title,
  items,
  bad = false,
}: {
  title: string;
  items: string[];
  bad?: boolean;
}) {
  return (
    <div className="hover-card rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-100 sm:p-8">
      <h3 className="text-2xl font-black tracking-tight">{title}</h3>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 text-sm font-semibold text-slate-700"
          >
            {bad ? (
              <XCircle size={19} className="text-rose-500" />
            ) : (
              <CheckCircle2 size={19} className="text-emerald-700" />
            )}
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function Testimonial({
  name,
  role,
  text,
}: {
  name: string;
  role: string;
  text: string;
}) {
  return (
    <div className="hover-card rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <p className="text-sm leading-7 text-slate-600">“{text}”</p>
      <div className="mt-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-sm font-black text-emerald-800">
          {name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-black">{name}</p>
          <p className="text-xs text-slate-500">{role}</p>
        </div>
      </div>
    </div>
  );
}

function PriceCard({
  title,
  price,
  items,
  featured = false,
}: {
  title: string;
  price: string;
  items: string[];
  featured?: boolean;
}) {
  return (
    <div
      className={`hover-card rounded-3xl p-6 shadow-sm ${featured ? "bg-emerald-700 text-white shadow-emerald-700/20" : "border border-slate-100 bg-white text-slate-950"}`}
    >
      <p
        className={`text-sm font-black ${featured ? "text-emerald-100" : "text-emerald-700"}`}
      >
        {title}
      </p>
      <h3 className="mt-3 text-2xl font-black tracking-tight">{price}</h3>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <div
            key={item}
            className={`flex items-center gap-3 text-sm font-semibold ${featured ? "text-emerald-50" : "text-slate-600"}`}
          >
            <CheckCircle2
              size={18}
              className={featured ? "text-white" : "text-emerald-700"}
            />
            {item}
          </div>
        ))}
      </div>

      <Link
        href="/login"
        className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black transition ${featured ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-emerald-700 text-white hover:bg-emerald-800"}`}
      >
        Get Started <ArrowRight size={17} />
      </Link>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <div className="hover-card rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
      <h3 className="font-black text-slate-950">{q}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{a}</p>
    </div>
  );
}

function FooterColumn({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-300">
        {title}
      </h3>
      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <a
            key={link}
            href={`#${link.toLowerCase().replaceAll(" ", "-")}`}
            className="block text-sm text-emerald-50/75 transition hover:text-white"
          >
            {link}
          </a>
        ))}
      </div>
    </div>
  );
}

function useCountUp(end: number) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduce) {
      setValue(end);
      return;
    }

    const duration = 1200;
    const start = performance.now();

    const tick = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(end * eased);

      if (progress < 1) {
        ref.current = requestAnimationFrame(tick);
      }
    };

    ref.current = requestAnimationFrame(tick);

    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [end]);

  return value;
}

function AnimationStyles() {
  return (
    <style jsx global>{`
      html {
        scroll-behavior: smooth;
      }

      .animate-fade-slide {
        animation: fadeSlide 760ms ease-out both;
      }

      .dashboard-float {
        animation: floatDashboard 7s ease-in-out infinite;
      }

      .phone-float {
        animation: phoneFloat 5s ease-in-out infinite;
      }

      .phone-float:nth-child(2) {
        animation-delay: 0.25s;
      }

      .phone-float:nth-child(3) {
        animation-delay: 0.5s;
      }

      .phone-float:nth-child(4) {
        animation-delay: 0.75s;
      }

      .chart-draw {
        stroke-dasharray: 360;
        stroke-dashoffset: 360;
        animation: drawChart 1.8s ease-out forwards;
      }

      .progress-fill {
        width: var(--progress);
        transform-origin: left;
        animation: progressGrow 1.2s ease-out both;
      }

      .hover-card {
        transition:
          transform 260ms ease,
          box-shadow 260ms ease,
          border-color 260ms ease,
          background-color 260ms ease;
      }

      .hover-card:hover {
        transform: translateY(-7px) scale(1.01);
        box-shadow: 0 22px 45px rgba(6, 95, 70, 0.12);
        border-color: rgba(5, 150, 105, 0.22);
      }

      .panel-fade {
        animation: panelFade 360ms ease-out both;
      }

      @keyframes fadeSlide {
        from {
          opacity: 0;
          transform: translateY(18px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes panelFade {
        from {
          opacity: 0;
          transform: translateY(10px) scale(0.99);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @keyframes floatDashboard {
        0%,
        100% {
          transform: translateY(0) rotate(-1.5deg);
        }
        50% {
          transform: translateY(-8px) rotate(-1.5deg);
        }
      }

      @keyframes phoneFloat {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-7px);
        }
      }

      @keyframes drawChart {
        to {
          stroke-dashoffset: 0;
        }
      }

      @keyframes progressGrow {
        from {
          transform: scaleX(0);
        }
        to {
          transform: scaleX(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        html {
          scroll-behavior: auto;
        }

        *,
        *::before,
        *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          scroll-behavior: auto !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}
