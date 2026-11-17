"use client";
import Image from "next/image";
import { useRef, useState, type ChangeEvent } from "react";
import { useAction, useMutation, useQuery, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function Avatar({ name, url, size = 40 }: { name: string; url?: string | null; size?: number }) {
  return url ? <Image src={url} alt={`${name}'s profile picture`} width={size} height={size} unoptimized style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
    : <span aria-label={`${name}'s initials`} style={{ width: size, height: size, borderRadius: "50%", background: "#e5efdf", color: "#355c38", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontWeight: 600 }}>{name.trim().split(/\s+/).slice(0, 2).map(n => n[0]).join("").toUpperCase() || "?"}</span>;
}

async function preparePhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new Error("Choose a JPG, PNG, or WebP image.");
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = url;
    await image.decode();
    const ratio = Math.min(1, 768 / Math.max(image.width, image.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.width * ratio));
    canvas.height = Math.max(1, Math.round(image.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Unable to prepare this image.");
    context.fillStyle = "white"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/jpeg", 0.8));
    if (!blob || blob.size > 500_000) throw new Error("This image is too large after resizing. Choose a smaller image.");
    return blob.arrayBuffer();
  } finally { URL.revokeObjectURL(url); }
}

export function ProfilePhoto() {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(api.users.current, isAuthenticated ? {} : "skip");
  const upload = useAction(api.users.uploadPhoto);
  const remove = useMutation(api.users.removePhoto);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  async function change(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy(true); setError(""); setStatus("");
    try { const bytes = await preparePhoto(file); await upload({ bytes }); setStatus("Profile picture updated."); }
    catch (e) { setError(e instanceof Error && !e.message.includes("[CONVEX") ? e.message : "Unable to upload your picture. Please try again."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  return <section className="rounded-xl border border-zinc-200 bg-white p-6">
    <h2 className="text-xl font-semibold">Profile picture <span className="text-sm font-normal text-zinc-500">(optional)</span></h2>
    <p className="mt-2 text-sm text-zinc-600">Add a picture now or anytime later. It appears in the member directory of your chamas.</p>
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <Avatar name={user?.name ?? "Member"} url={user?.photoUrl} size={80} />
      <input ref={input} id="profile-photo" aria-label="Choose an optional profile picture" type="file" accept="image/jpeg,image/png,image/webp" onChange={change} disabled={busy || !user} className="sr-only" />
      <button type="button" disabled={busy || !user} onClick={() => input.current?.click()} className="rounded-lg bg-emerald-800 px-4 py-2 text-white disabled:opacity-50">{busy ? "Saving…" : user?.photoUrl ? "Change picture" : "Add picture"}</button>
      {user?.photoUrl && <button type="button" disabled={busy} className="rounded-lg border border-zinc-300 px-4 py-2 disabled:opacity-50" onClick={async () => {
        setBusy(true); setError(""); setStatus("");
        try { await remove({}); setStatus("Profile picture removed."); } catch { setError("Unable to remove your picture. Please try again."); } finally { setBusy(false); }
      }}>Remove picture</button>}
    </div>
    <p className="mt-3 text-xs text-zinc-500">JPG, PNG, or WebP, up to 10 MB. Images are resized before upload.</p>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {status && <p role="status" className="mt-3 text-sm text-emerald-700">{status}</p>}
  </section>;
}
