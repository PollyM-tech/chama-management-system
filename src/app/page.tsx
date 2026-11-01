import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpenCheck,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ClipboardList,
  FileChartColumn,
  HandCoins,
  HeartHandshake,
  Menu,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DemoDashboard } from "@/components/landing/demo-dashboard";
import { MobileShowcase } from "@/components/landing/mobile-showcase";
import "./landing.css";

export const metadata: Metadata = {
  title: { absolute: "SmartChama — Manage Together. Grow Together." },
  description:
    "A clearer way to manage your chama. Bring your members together, explore a shared savings dashboard, and start your group with SmartChama.",
};

const signUp = "/sign-in?flow=signUp";
const links = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "About us", href: "#about" },
  { label: "FAQs", href: "#faqs" },
];

export default function Home() {
  return (
    <div className="landing-page">
      <a className="landing-skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="landing-top">
        <div className="hero-green-shape" aria-hidden="true" />
        <header className="landing-header landing-container">
          <BrandLogo size="navigation" />
          <nav className="landing-desktop-nav" aria-label="Main navigation">
            {links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="landing-header-actions">
            <Link className="landing-login" href="/sign-in">
              Log in
            </Link>
            <Link
              className="landing-button button-green nav-create"
              href={signUp}
            >
              Create chama <ArrowUpRight size={13} />
            </Link>
          </div>
          <details className="landing-mobile-menu">
            <summary aria-label="Open navigation">
              <Menu size={23} />
            </summary>
            <nav aria-label="Mobile navigation">
              {links.map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
              <Link href={signUp}>
                Create your chama <ArrowRight size={14} />
              </Link>
            </nav>
          </details>
        </header>
        <main id="main-content">
          <section
            className="landing-hero landing-container"
            aria-labelledby="hero-heading"
          >
            <div className="hero-copy">
              <span className="hero-eyebrow">
                <span className="eyebrow-dot" /> Built for Kenyan chamas{" "}
                <span role="img" aria-label="Kenya">
                  🇰🇪
                </span>
              </span>
              <h1 id="hero-heading">
                Manage your chama
                <br />
                with{" "}
                <span>
                  clarity, trust
                  <br />
                  and speed.
                </span>
              </h1>
              <p>
                Good things grow when you grow together. Give your chama one
                shared place for its members, its savings, and its next big
                step.
              </p>
              <div className="hero-actions">
                <Link href={signUp} className="landing-button button-green">
                  Create your chama <ArrowRight size={16} />
                </Link>
                <a href="#features" className="landing-button button-outline">
                  Explore features <ArrowUpRight size={15} />
                </a>
              </div>
              <div className="hero-assurances">
                <div>
                  <span className="assurance-icon">
                    <Users size={17} />
                  </span>
                  <span>
                    <strong>One shared view</strong>
                    <small>A stronger group</small>
                  </span>
                </div>
                <div>
                  <span className="assurance-icon">
                    <Wallet size={17} />
                  </span>
                  <span>
                    <strong>Made for Kenya</strong>
                    <small>Your savings, in KES</small>
                  </span>
                </div>
                <div>
                  <span className="assurance-icon">
                    <ShieldCheck size={17} />
                  </span>
                  <span>
                    <strong>Access with care</strong>
                    <small>Roles for your members</small>
                  </span>
                </div>
              </div>
            </div>
            <DemoDashboard />
          </section>
          <div id="features" className="feature-ribbon landing-container">
            {[
              {
                icon: ShieldCheck,
                title: "Transparent",
                text: "Shared accountability",
              },
              {
                icon: HandCoins,
                title: "Easy",
                text: "Savings & loan previews",
              },
              { icon: BookOpenCheck, title: "Clear", text: "Member records" },
              {
                icon: FileChartColumn,
                title: "Insightful",
                text: "Reporting previews",
              },
            ].map(({ icon: Icon, title, text }) => (
              <a href="#mobile" key={title}>
                <span>
                  <Icon size={20} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </div>
                <ArrowUpRight className="ribbon-arrow" size={15} />
              </a>
            ))}
          </div>
        </main>
      </div>

      <section
        id="how-it-works"
        className="landing-how landing-container"
        aria-labelledby="how-heading"
      >
        <div className="section-heading">
          <span className="section-kicker">A SIMPLE START</span>
          <h2 id="how-heading">
            From chama setup to a shared sense of direction.
          </h2>
          <p>Less back and forth. More moving forward, together.</p>
        </div>
        <div className="steps-grid">
          {[
            {
              number: "01",
              icon: Users,
              title: "Create your chama",
              text: "Create an account, verify your email, and set up your group with its contribution amount and cycle.",
            },
            {
              number: "02",
              icon: Wallet,
              title: "Bring members together",
              text: "Your administrator adds verified members and assigns the right roles for the group.",
            },
            {
              number: "03",
              icon: ChartNoAxesCombined,
              title: "See what’s ahead",
              text: "Explore our vision for clearer contributions, loans, and reports in the interactive preview.",
            },
          ].map(({ number, icon: Icon, title, text }) => (
            <article key={number} className="step-card">
              <span className="step-number">{number}</span>
              <div className="step-icon">
                <Icon size={28} strokeWidth={1.7} />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
              <span className="step-dashed-arrow" aria-hidden="true">
                ⤳
              </span>
            </article>
          ))}
        </div>
      </section>

      <MobileShowcase />

      <section id="about" className="trust-banner landing-container">
        <div>
          <span className="section-kicker">LESS GUESSWORK. MORE TOGETHER.</span>
          <h2>
            Give your chama a dashboard
            <br />
            everyone can trust.
          </h2>
          <p>
            SmartChama starts with people: a clear group structure, verified
            accounts, and access that respects each member’s role. The financial
            tools are our next step.
          </p>
          <Link href={signUp} className="landing-button button-white">
            Get started now <ArrowRight size={15} />
          </Link>
        </div>
        <div className="summary-preview">
          <div className="summary-heading">
            <h3>A clearer day, at a glance</h3>
            <span>
              <span /> Sample
            </span>
          </div>
          <div className="summary-grid">
            {[
              {
                label: "Paid members",
                value: "28 / 32",
                icon: Users,
                color: "green",
              },
              {
                label: "Pending contributions",
                value: "4",
                icon: ClipboardList,
                color: "amber",
              },
              {
                label: "Active loans",
                value: "12",
                icon: Wallet,
                color: "purple",
              },
              {
                label: "Monthly report",
                value: "Ready",
                icon: FileChartColumn,
                color: "blue",
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div className={`summary-item summary-${color}`} key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <i>
                  <Icon size={18} />
                </i>
              </div>
            ))}
          </div>
          <p>Illustrative dashboard preview</p>
        </div>
      </section>

      <section
        className="landing-voices landing-container"
        aria-labelledby="voices-heading"
      >
        <div className="section-heading">
          <span className="section-kicker">EVERY MEMBER MATTERS</span>
          <h2 id="voices-heading">A shared purpose. Different perspectives.</h2>
          <p>The everyday needs shaping SmartChama.</p>
        </div>
        <div className="voices-grid">
          {[
            {
              quote:
                "A clear record of every contribution, so the numbers are easier to explain and everyone stays on the same page.",
              initials: "TR",
              role: "For the treasurer",
              need: "Clarity in every record",
              className: "voice-treasurer",
            },
            {
              quote:
                "One view of the group, so meetings can focus on the next opportunity instead of tracking down updates.",
              initials: "CH",
              role: "For the chairperson",
              need: "Confidence in every decision",
              className: "voice-chair",
            },
            {
              quote:
                "A simple way to understand my savings and follow our progress, with a role that fits my place in the chama.",
              initials: "ME",
              role: "For every member",
              need: "A place in the bigger picture",
              className: "voice-member",
            },
          ].map((voice) => (
            <article className="voice-card" key={voice.role}>
              <MessageCircle size={24} fill="currentColor" strokeWidth={0} />
              <p>{voice.quote}</p>
              <div>
                <span className={`voice-avatar ${voice.className}`}>
                  {voice.initials}
                </span>
                <span>
                  <strong>{voice.role}</strong>
                  <small>{voice.need}</small>
                </span>
              </div>
            </article>
          ))}
        </div>
        <p className="voices-note">
          Illustrative member perspectives, not customer testimonials.
        </p>
      </section>

      <section id="pricing" className="landing-pricing landing-container">
        <div>
          <span className="section-kicker">GROW AT YOUR OWN PACE</span>
          <h2>A thoughtful start for your chama.</h2>
          <p>
            We’re building SmartChama step by step. Create an account and set up
            your group today. Pricing for the full platform is being finalized.
          </p>
        </div>
        <Link href={signUp} className="landing-button button-green">
          Create your account <ArrowRight size={16} />
        </Link>
      </section>

      <section id="faqs" className="landing-faq landing-container">
        <div className="section-heading">
          <span className="section-kicker">A LITTLE MORE CLARITY</span>
          <h2>Before your chama gets started.</h2>
        </div>
        <div className="faq-list">
          {[
            {
              question: "What can I use in SmartChama today?",
              answer:
                "You can create an account, verify your email, sign in securely, create a chama, and see your group memberships. Contributions, loans, investments, and reports are still being developed. The landing-page dashboards show sample data.",
            },
            {
              question: "Are the balances on this page real?",
              answer:
                "No. The dashboard is an interactive demonstration with sample Kenyan shilling amounts. It cycles through four snapshots every 30 seconds by default. You can switch to one-minute updates or pause it using the controls below the preview.",
            },
            {
              question: "How does access to my chama work?",
              answer:
                "Your account needs a verified email and an active membership to access a group. Roles are checked by the backend. Administrators manage membership and roles; creating an account never gives someone access to an existing chama.",
            },
            {
              question: "Can members pay through M-Pesa yet?",
              answer:
                "M-Pesa integration is planned. The mobile payment screen above is an illustrative preview; it does not collect money or initiate payments.",
            },
            {
              question: "How do I bring an existing chama onto the platform?",
              answer:
                "Start by creating and verifying your account, then create your chama. Members also need verified accounts. Membership management is currently available through the backend; its self-service interface is still being developed.",
            },
          ].map((item) => (
            <details key={item.question}>
              <summary>
                {item.question}
                <ChevronDown size={17} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final-cta">
        <div className="final-cta-leaf leaf-left" aria-hidden="true" />
        <div className="final-cta-leaf leaf-right" aria-hidden="true" />
        <div className="landing-container">
          <span className="cta-emblem">
            <HeartHandshake size={25} />
          </span>
          <h2>Your next chapter starts together.</h2>
          <p>Give your chama a clearer view of what you can build.</p>
          <Link href={signUp} className="landing-button button-green">
            Create your chama <ArrowRight size={16} />
          </Link>
          <span className="cta-small">
            <Check size={13} /> Start with an account. Grow with your group.
          </span>
        </div>
      </section>
      <footer className="landing-footer landing-container">
        <BrandLogo size="navigation" />
        <p>Manage Together. Grow Together.</p>
        <div>
          <a href="#about">About SmartChama</a>
          <a href="#faqs">Questions?</a>
          <Link href="/sign-in">
            Log in <ArrowUpRight size={12} />
          </Link>
        </div>
      </footer>
    </div>
  );
}
