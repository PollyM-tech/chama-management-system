"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../../../convex/_generated/api";

export default function DashboardPage() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const chamas = useQuery(api.chamas.listMine, isAuthenticated ? {} : "skip");
  const create = useMutation(api.chamas.create);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function createChama(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    setError("");
    try {
      await create({
        name: String(data.get("name")),
        contributionAmount: Number(data.get("amount")),
        contributionCycle: "monthly",
      });
      form.reset();
    } catch {
      setError("Unable to create your chama. Check the details and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h1 className="text-3xl font-semibold">
        Welcome{user?.name ? `, ${user.name}` : ""}
      </h1>
      <p className="mt-2 text-zinc-600">Your chama memberships</p>
      {chamas === undefined ? (
        <p className="mt-8" role="status">
          Loading your groups…
        </p>
      ) : (
        <div className="mt-8 space-y-4">
          {chamas.length === 0 && (
            <p>
              You aren’t a member of a chama yet. Ask your group administrator
              to add your verified email, or create a group.
            </p>
          )}
          {chamas.map((chama) => (
            <article
              key={chama._id}
              className="rounded-xl border border-zinc-200 bg-white p-6"
            >
              <h2 className="text-lg font-semibold">{chama.name}</h2>
              <p className="mt-2 text-sm text-zinc-600">
                Your role: {chama.role}
              </p>
            </article>
          ))}
        </div>
      )}
      <section className="mt-10 max-w-lg rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-semibold">Create a chama</h2>
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
      </section>
    </>
  );
}
