"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import {
  Activity,
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { ACTIVE_CHAMA_KEY } from "@/lib/chama-navigation";

const money = (amount: number) =>
  new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    maximumFractionDigits: 2,
  }).format(amount);

export function GroupDashboard({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.chamas.dashboard>;
}) {
  const data = usePreloadedQuery(preloaded);
  const { chama } = data;
  useEffect(() => {
    try {
      window.localStorage.setItem(ACTIVE_CHAMA_KEY, chama._id);
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
  }, [chama._id]);

  return (
    <div className="grid gap-7 lg:grid-cols-[210px_1fr]">
      <aside className="h-fit rounded-2xl bg-emerald-950 p-5 text-white lg:sticky lg:top-6">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">
          Your workspace
        </span>
        <h2 className="mt-2 break-words text-lg font-semibold">{chama.name}</h2>
        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs capitalize">
          <ShieldCheck size={12} />
          {data.role}
        </span>
        <nav
          aria-label="Group dashboard navigation"
          className="mt-6 flex flex-wrap gap-2 lg:flex-col"
        >
          {[
            { icon: LayoutDashboard, label: "Dashboard", href: "#overview" },
            { icon: Wallet, label: "Finances", href: "#financial-overview" },
            { icon: Activity, label: "Activity", href: "#activity" },
            { icon: Settings, label: "Group details", href: "#group-details" },
          ].map(({ icon: Icon, label, href }, index) => (
            <a
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${index === 0 ? "bg-emerald-800 text-white" : "text-emerald-100 hover:bg-white/10"}`}
            >
              <Icon size={16} />
              {label}
            </a>
          ))}
        </nav>
        <Link
          href="/dashboard?choose=1"
          className="mt-7 flex items-center gap-2 border-t border-white/15 pt-5 text-sm text-emerald-100 hover:text-white"
        >
          <ArrowLeftRight size={15} /> Switch savings group
        </Link>
      </aside>
      <div id="overview" className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-zinc-500">
              Welcome back, {data.memberName.split(" ")[0]}
            </p>
            <h1 className="mt-1 break-words text-3xl font-semibold tracking-tight">
              {chama.name}
            </h1>
            <p className="mt-2 text-sm text-zinc-500">
              Your savings group dashboard
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" /> Live
            group data
          </span>
        </div>
        <section
          aria-label="Group balance"
          className="relative mt-7 overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-700 p-7 text-white"
        >
          <ChartNoAxesCombined
            className="absolute -right-5 -bottom-6 h-44 w-44 text-white/10"
            strokeWidth={1}
          />
          <p className="text-sm text-emerald-100">Total chama balance</p>
          <strong className="relative mt-3 block text-4xl font-semibold tracking-tight">
            {money(chama.totalPool)}
          </strong>
          <p className="mt-4 flex items-center gap-2 text-xs text-emerald-100">
            <ShieldCheck size={14} /> Recorded balance for {chama.name}
          </p>
        </section>
        <section
          id="financial-overview"
          aria-label="Financial overview"
          className="mt-5 grid gap-4 sm:grid-cols-3"
        >
          {[
            {
              label: "Recorded contributions",
              value: money(data.contributionsTotal),
              icon: CircleDollarSign,
              note: "All paid contributions",
            },
            {
              label: "Active members",
              value: String(data.memberCount),
              icon: Users,
              note: "Verified group memberships",
            },
            {
              label: "Outstanding loans",
              value: String(data.activeLoans),
              icon: Wallet,
              note: "Disbursed, active, or overdue",
            },
          ].map(({ label, value, icon: Icon, note }) => (
            <article
              className="rounded-xl border border-zinc-200 bg-white p-5"
              key={label}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">{label}</p>
                <Icon className="shrink-0 text-emerald-600" size={18} />
              </div>
              <strong className="mt-3 block break-words text-2xl font-semibold text-emerald-900">
                {value}
              </strong>
              <p className="mt-2 text-xs text-zinc-400">{note}</p>
            </article>
          ))}
        </section>
        <div className="mt-6 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
          <section
            id="activity"
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <h2 className="text-base font-semibold">Recent activity</h2>
            {data.recentActivity.length ? (
              <ul className="mt-4 divide-y divide-zinc-100">
                {data.recentActivity.map((item) => (
                  <li key={item._id} className="flex items-center gap-3 py-4">
                    <span className="rounded-full bg-emerald-50 p-2 text-emerald-700">
                      {item.direction === "credit" ? (
                        <ArrowDownLeft size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">{item.description}</p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {new Intl.DateTimeFormat("en-KE", {
                          dateStyle: "medium",
                          timeZone: "Africa/Nairobi",
                        }).format(item.createdAt)}
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {item.direction === "credit" ? "+" : "−"}
                      {money(item.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="py-9 text-center">
                <Activity size={28} className="mx-auto text-emerald-700/40" />
                <p className="mt-3 text-sm font-medium text-zinc-600">
                  Your group’s activity will appear here
                </p>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  There are no recorded transactions yet.
                </p>
              </div>
            )}
          </section>
          <section
            id="group-details"
            className="rounded-xl border border-zinc-200 bg-white p-6"
          >
            <h2 className="text-base font-semibold">Group details</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Contribution</dt>
                <dd className="font-medium">
                  {money(chama.contributionAmount)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Cycle</dt>
                <dd className="capitalize">{chama.contributionCycle}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-500">Your role</dt>
                <dd className="capitalize">{data.role}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="flex items-center gap-1 text-zinc-500">
                  <CalendarDays size={13} /> Established
                </dt>
                <dd>
                  {new Intl.DateTimeFormat("en-KE", {
                    dateStyle: "medium",
                    timeZone: "Africa/Nairobi",
                  }).format(chama.createdAt)}
                </dd>
              </div>
            </dl>
            <p className="mt-6 rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-500">
              Contribution recording, loan management, and reports are still
              being developed. This dashboard shows the records currently stored
              for your group.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
