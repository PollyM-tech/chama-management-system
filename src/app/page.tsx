import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BookOpenCheck,
  ChartNoAxesCombined,
  Check,
  ChevronDown,
  ClipboardList,
  FileChartColumn,
  HandCoins,
  Menu,
  MessageCircle,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { DemoDashboard } from "@/components/landing/demo-dashboard";
import { MobileShowcase } from "@/components/landing/mobile-showcase";
import { PhotoAvatar } from "@/components/landing/photo-avatar";
import { LANDING_IMAGES } from "@/lib/landing-images";
import "./landing.css";
import "./landing-photo.css";

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
  { label: "Testimonials", href: "#testimonials" },
  { label: "FAQs", href: "#faqs" },
];

export default function Home() {
  return (
    <div id="top" className="landing-page landing-page-photo landing-first-look">
      <a className="landing-skip-link" href="#main-content">
        Skip to content
      </a>
      <div className="landing-top">
        <div className="hero-photograph" aria-hidden="true">
          <Image
            src={LANDING_IMAGES.hero}
            alt=""
            fill
            sizes="(max-width: 650px) 100vw, 70vw"
            preload
          />
        </div>
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
                Chama management for Kenyan savings groups
                <span role="img" aria-label="Kenya">🇰🇪</span>
              </span>
              <h1 id="hero-heading">
                Know who has paid.<br />
                <span>Keep your chama on track.</span>
              </h1>
              <p>
                Track contributions, manage loans, and share clear reports in
                one place. Spend less time chasing payments and searching
                through notebooks and WhatsApp messages.
              </p>
              <ul className="hero-outcomes" aria-label="What SmartChama helps you do">
                <li><Check size={17} aria-hidden="true" /><span>See paid contributions and unpaid balances.</span></li>
                <li><Check size={17} aria-hidden="true" /><span>Follow loan approvals and repayments.</span></li>
                <li><Check size={17} aria-hidden="true" /><span>Give members a clear view of their records.</span></li>
              </ul>
              <div className="hero-actions">
                <Link href={signUp} className="landing-button button-green">
                  Create your chama <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="#dashboard-preview" className="landing-button button-outline">
                  Try the dashboard <ArrowUpRight size={15} aria-hidden="true" />
                </a>
              </div>
              <div className="hero-start-guide">
                <span>How to get started</span>
                <ol>
                  <li><b>1</b> Create your group</li>
                  <li><b>2</b> Invite members</li>
                  <li><b>3</b> Track together</li>
                </ol>
              </div>
            </div>
            <div id="dashboard-preview" className="hero-preview" tabIndex={-1}
              role="region" aria-label="Try a sample SmartChama dashboard">
              <DemoDashboard />
            </div>
          </section>
          <div id="features" className="feature-ribbon landing-container">
            {[
              {
                icon: ShieldCheck,
                title: "Know what came in",
                text: "Contribution records",
              },
              {
                icon: HandCoins,
                title: "Follow every loan",
                text: "Repayment tracking",
              },
              { icon: BookOpenCheck, title: "Keep members informed", text: "Individual records" },
              {
                icon: FileChartColumn,
                title: "See the bigger picture",
                text: "Financial reports",
              },
            ].map(({ icon: Icon, title, text }) => (
              <a href="#dashboard-preview" key={title}>
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
          <span className="section-kicker">SIMPLE PROCESS</span>
          <h2 id="how-heading">
            From Chama Setup to Daily Management in Minutes
          </h2>
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
              title: "Invite your members",
              text: "Your administrator adds verified members and assigns the right roles for the group.",
            },
            {
              number: "03",
              icon: ChartNoAxesCombined,
              title: "Manage everything",
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
          <span className="section-kicker">STOP MANAGING MONEY BLINDLY</span>
          <h2>
            Give Your Chama a Dashboard
            <br />
            Everyone Can Trust.
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
            <h3>Today’s Summary</h3>
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
        id="testimonials"
        className="landing-voices landing-container"
        aria-labelledby="voices-heading"
      >
        <div className="section-heading">
          <span className="section-kicker">TESTIMONIALS</span>
          <h2 id="voices-heading">A clearer view. A stronger chama.</h2>
          <p className="testimonials-intro">From keeping the books to planning the next meeting, every role deserves a simpler day.</p>
          <p className="testimonials-disclosure">Illustrative testimonials for this preview. These are sample perspectives, not verified customer reviews.</p>
        </div>
        <div className="voices-grid">
          {[
            {
              quote:
                "I want every contribution in one place, so I can explain the numbers clearly and spend less time chasing records.",
              initials: "TR",
              role: "For the treasurer",
              need: "Clarity in every record",
              className: "voice-treasurer",
            },
            {
              quote:
                "A shared view of our finances would help us spend our meetings planning our next step together.",
              initials: "CH",
              role: "For the chairperson",
              need: "Confidence in every decision",
              className: "voice-chair",
            },
            {
              quote:
                "I want to see what I have contributed and what I still owe, without waiting for the next group meeting.",
              initials: "ME",
              role: "For every member",
              need: "A place in the bigger picture",
              className: "voice-member",
            },
          ].map((voice, index) => (
            <article className="voice-card" key={voice.role}>
              <MessageCircle size={24} fill="currentColor" strokeWidth={0} />
              <p><q>{voice.quote}</q></p>
              <div>
                <PhotoAvatar person={index} className="voice-avatar" />
                <span>
                  <strong>{voice.role}</strong>
                  <small>{voice.need}</small>
                </span>
              </div>
            </article>
          ))}
        </div>
        <div className="testimonials-footer">
          <span>Build your group’s next chapter together.</span>
          <Link href={signUp} className="landing-button button-green">Create your chama <ArrowRight size={16} /></Link>
        </div>
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
                "No. The dashboard is an interactive demonstration with sample Kenyan shilling amounts. It cycles through four snapshots automatically every 30 seconds.",
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
        <Image
          src={LANDING_IMAGES.community}
          alt="A savings group sharing ideas around a laptop outdoors"
          fill
          sizes="100vw"
          className="final-cta-photo"
        />
        <svg
          className="final-cta-wave"
          viewBox="0 0 1440 76"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 26 C220 -32 380 75 620 46 S1040 90 1210 27 S1370 3 1440 10 L1440 0 L0 0Z"
            fill="white"
          />
          <path
            d="M0 26 C110 -5 220 1 326 24"
            fill="none"
            stroke="#c8e1c7"
            strokeWidth="13"
          />
        </svg>
        <div className="landing-container">
          <div className="final-cta-copy">
            <h2>Ready to Transform Your Chama Management?</h2>
            <p>
              Bring your people together. Build your next chapter with
              SmartChama.
            </p>
            <Link href={signUp} className="landing-button button-white">
              Create Your Chama <ArrowRight size={18} />
            </Link>
            <span className="cta-small">
              <Check size={13} /> Start with an account. Grow with your group.
            </span>
          </div>
        </div>
      </section>
      <footer className="site-footer" aria-label="SmartChama footer">
        <div className="landing-container">
          <div className="site-footer-main">
            <div className="site-footer-brand">
              <BrandLogo size="navigation" />
              <p className="site-footer-tagline">Manage Together. Grow Together.</p>
              <p>
                Bring your chama’s members, savings, and financial activities
                together. Built for Kenyan groups moving forward together.
              </p>
              <span className="site-footer-community">
                <Users size={16} aria-hidden="true" /> Your people. Your progress.
              </span>
            </div>
            <nav aria-label="Explore SmartChama" className="site-footer-links">
              <h2>Explore</h2>
              <a href="#features">Features</a>
              <a href="#how-it-works">How it works</a>
              <a href="#pricing">Pricing</a>
            </nav>
            <nav aria-label="Learn about SmartChama" className="site-footer-links">
              <h2>Learn more</h2>
              <a href="#about">About SmartChama</a>
              <a href="#testimonials">Testimonials</a>
              <a href="#faqs">Frequently asked questions</a>
            </nav>
            <nav aria-label="SmartChama account" className="site-footer-links site-footer-account">
              <h2>Your chama starts here</h2>
              <p>A shared view of your group’s next chapter.</p>
              <Link href={signUp} className="site-footer-create">
                Create your chama <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/sign-in">Already a member? Log in</Link>
            </nav>
          </div>
          <div className="site-footer-bottom">
            <p>© {new Date().getUTCFullYear()} SmartChama. All rights reserved.</p>
            <a href="#top">Back to top <ArrowUp size={15} aria-hidden="true" /></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
