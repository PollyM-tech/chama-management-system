"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import {
  ACTIVE_CHAMA_KEY,
  groupDashboardPath,
  preferredChamaId,
} from "@/lib/chama-navigation";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const chamas = useQuery(api.chamas.listMine, isAuthenticated ? {} : "skip");
  const create = useMutation(api.chamas.create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chamas || new URLSearchParams(window.location.search).has("choose"))
      return;
    let savedId: string | null = null;
    try {
      savedId = window.localStorage.getItem(ACTIVE_CHAMA_KEY);
    } catch {
      /* Fall back to the available memberships. */
    }
    const chamaId = preferredChamaId(chamas, savedId);
    if (chamaId) router.replace(groupDashboardPath(chamaId));
  }, [chamas, router]);

  async function createChama(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      const chamaId = await create({
        name: String(data.get("name")),
        contributionAmount: Number(data.get("amount")),
        contributionCycle: "monthly",
      });
      form.reset();
      router.push(groupDashboardPath(chamaId));
    } catch {
      setError("Unable to create your chama. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-2xl font-semibold sm:text-3xl [overflow-wrap:anywhere]">
        Welcome{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-2 text-zinc-600">
        Choose a savings group to open its dashboard.
      </p>
      {chamas === undefined ? (
        <p className="mt-8" role="status">
          Loading your groups…
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {chamas.length === 0 && (
            <p>
              You aren’t a member of a chama yet. Ask your group administrator
              to add your verified email, or create a group.
            </p>
          )}
          {chamas.map((chama) => (
            <Link
              key={chama._id}
              href={groupDashboardPath(chama._id)}
              className="group min-w-0 rounded-xl border border-zinc-200 bg-white p-6 transition hover:border-emerald-500 hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700"
            >
              <span className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Users size={21} />
              </span>
              <h2 className="text-lg font-semibold [overflow-wrap:anywhere]">{chama.name}</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Your role: {chama.role}
              </p>
              <span className="mt-5 flex items-center gap-2 text-sm font-medium text-emerald-800">
                Open dashboard{" "}
                <ArrowRight
                  size={15}
                  className="transition group-hover:translate-x-1"
                />
              </span>
            </Link>
          ))}
        </div>
      )}
      <details
        open={chamas?.length === 0}
        className="mt-10 max-w-lg rounded-xl border border-zinc-200 bg-white p-6"
      >
        <summary className="cursor-pointer text-xl font-semibold">
          {chamas?.length ? "Create another chama" : "Create a chama"}
        </summary>
        <p className="mt-2 text-sm text-zinc-600">
          You’ll be the administrator of your new group.
        </p>
        <form onSubmit={createChama} className="mt-5 space-y-4">
          <label className="block text-sm font-medium">
            Group name
            <input
              name="name"
              required
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm font-medium">
            Monthly contribution (KES)
            <input
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              required
              className="mt-2 w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            disabled={busy}
            className="rounded-lg bg-emerald-800 px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {busy ? "Creating…" : "Create chama"}
          </button>
        </form>
      </details>
    </>
  );
}
