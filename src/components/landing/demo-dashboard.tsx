"use client";

import { useEffect, useState } from "react";
import { PhotoAvatar } from "./photo-avatar";
import {
  Activity,
  ArrowUpRight,
  Bell,
  ChevronDown,
  CircleHelp,
  FileChartColumn,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";

export const DEMO_REFRESH_MS = 30_000;

const snapshots = [
  {
    balance: 428500,
    collected: 86000,
    members: 32,
    paid: 28,
    loans: 12,
    growth: 12.8,
    target: 78,
    repayment: 64,
    attendance: 92,
    payments: [4500, 3000, 6500],
    path: "M0 76 C12 76 13 57 25 61 S42 86 53 61 S68 32 78 43 S91 65 103 38 S119 51 130 20 S145 16 154 5",
  },
  {
    balance: 439000,
    collected: 96500,
    members: 33,
    paid: 30,
    loans: 11,
    growth: 14.2,
    target: 84,
    repayment: 71,
    attendance: 94,
    payments: [5000, 2500, 3000],
    path: "M0 79 C12 79 15 66 26 69 S43 59 53 64 S70 26 80 35 S95 39 106 22 S130 33 139 11 S149 15 154 2",
  },
  {
    balance: 452500,
    collected: 110000,
    members: 34,
    paid: 32,
    loans: 10,
    growth: 16.4,
    target: 91,
    repayment: 79,
    attendance: 96,
    payments: [6500, 4500, 2500],
    path: "M0 78 C10 78 15 59 26 64 S40 73 51 50 S70 58 80 31 S98 39 109 19 S125 26 137 9 S148 13 154 1",
  },
  {
    balance: 467000,
    collected: 124500,
    members: 35,
    paid: 34,
    loans: 9,
    growth: 18.1,
    target: 97,
    repayment: 86,
    attendance: 98,
    payments: [7500, 4000, 3000],
    path: "M0 78 C11 78 14 65 26 64 S42 58 52 53 S65 63 77 38 S91 48 103 23 S120 34 131 13 S146 17 154 0",
  },
];

const currency = (value: number) =>
  new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(value);

export function DemoDashboard() {
  const [frame, setFrame] = useState(0);
  const [view, setView] = useState("Dashboard");
  const data = snapshots[frame];

  useEffect(() => {
    const timer = window.setInterval(
      () => setFrame((current) => (current + 1) % snapshots.length),
      DEMO_REFRESH_MS,
    );
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="demo-stage">
      <div className="demo-window">
        <aside className="demo-sidebar" aria-label="Demo dashboard navigation">
          <div className="demo-wordmark">
            <Users size={15} fill="currentColor" /> SmartChama
          </div>
          <div className="demo-sidebar-links">
            {[
              { label: "Dashboard", icon: LayoutDashboard },
              { label: "Members", icon: Users },
              { label: "Contributions", icon: Wallet },
              { label: "Loans", icon: ArrowUpRight },
              { label: "Reports", icon: FileChartColumn },
              { label: "Activities", icon: Activity },
              { label: "Settings", icon: Settings },
            ].map(({ label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                className={view === label ? "active" : ""}
                onClick={() => setView(label)}
                aria-pressed={view === label}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            ))}
          </div>
          <div className="demo-sidebar-bottom">
            <CircleHelp size={12} /> Help & support
          </div>
          <div className="demo-profile">
            <PhotoAvatar person={3} className="demo-avatar" />
            <span>
              Amani M.<small>Demo chairperson</small>
            </span>
          </div>
        </aside>
        <div className="demo-main">
          <div className="demo-topbar">
            <h2>{view}</h2>
            <span>
              This month <ChevronDown size={10} />
            </span>
          </div>
          <div className="demo-balance">
            <div>
              <span>Total chama balance</span>
              <strong key={data.balance}>KES {currency(data.balance)}</strong>
              <small>
                <ArrowUpRight size={10} /> {data.growth}% growth this month
              </small>
            </div>
            <svg
              viewBox="0 0 155 90"
              role="img"
              aria-label="Illustrative savings growth chart"
            >
              <defs>
                <linearGradient
                  id="demo-chart-fill"
                  x1="0"
                  x2="0"
                  y1="0"
                  y2="1"
                >
                  <stop stopColor="#c0efb2" stopOpacity=".4" />
                  <stop offset="1" stopColor="#c0efb2" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={`${data.path} L154 90 L0 90Z`}
                fill="url(#demo-chart-fill)"
              />
              <path
                d={data.path}
                fill="none"
                stroke="#b6eca0"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <div className="demo-metrics">
            <div>
              <span>Total contributions</span>
              <strong>KES {currency(data.collected)}</strong>
              <small>
                <span className="demo-dot" /> This month
              </small>
            </div>
            <div>
              <span>Active members</span>
              <strong>{data.members} Members</strong>
              <small>{data.paid} contributions received</small>
            </div>
          </div>
          {view === "Dashboard" ? (
            <div className="demo-bottom-grid">
              <div className="demo-panel">
                <h3>Recent contributions</h3>
                {["Mary Wanjiku", "James Kariuki", "Amina Hassan"].map(
                  (name, i) => (
                    <div className="demo-payment" key={name}>
                      <PhotoAvatar person={i} className="demo-mini-avatar" />
                      <span>
                        {name}
                        <small>{i + 2} minutes ago</small>
                      </span>
                      <strong>+{currency(data.payments[i])}</strong>
                    </div>
                  ),
                )}
                <a href="#how-it-works">
                  See how it works <ArrowUpRight size={10} />
                </a>
              </div>
              <div className="demo-panel">
                <h3>Group progress</h3>
                {[
                  { label: "Savings target", value: data.target },
                  { label: "Loan repayment", value: data.repayment },
                  { label: "Attendance", value: data.attendance },
                ].map((item) => (
                  <div className="demo-progress" key={item.label}>
                    <div>
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="demo-progress-track">
                      <span style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
                <a href="#features">
                  Explore features <ArrowUpRight size={10} />
                </a>
              </div>
            </div>
          ) : (
            <div className="demo-detail-panel">
              <span className="demo-detail-eyebrow">
                SAMPLE {view.toUpperCase()} VIEW
              </span>
              <h3>
                {view === "Members"
                  ? `${data.members} people. One shared goal.`
                  : view === "Contributions"
                    ? `KES ${currency(data.collected)} contributed together.`
                    : view === "Loans"
                      ? `${data.loans} active member loans.`
                      : view === "Reports"
                        ? `${data.target}% of the savings target reached.`
                        : view === "Activities"
                          ? `${data.paid} contributions recorded this month.`
                          : "A space for your group's preferences."}
              </h3>
              <p>
                Explore the preview. These figures are illustrative and refresh
                automatically.
              </p>
              <button type="button" onClick={() => setView("Dashboard")}>
                Back to dashboard <ArrowUpRight size={12} />
              </button>
            </div>
          )}
          <div className="demo-footer">
            <ShieldCheck size={10} /> Illustrative demo · No real financial data{" "}
            <Bell size={10} />
          </div>
        </div>
      </div>
    </div>
  );
}
