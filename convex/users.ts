import { v, ConvexError } from "convex/values";
import { api, internal } from "./_generated/api";
import { query, action, mutation, internalMutation } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const photo = await ctx.db.query("profilePhotos").withIndex("by_user", q => q.eq("userId", user._id)).unique();
    return { _id: user._id, name: user.name, email: user.email, photoUrl: photo ? await ctx.storage.getUrl(photo.storageId) : null };
  },
});


export const savePhoto = internalMutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, { storageId }) => {
    const user = await requireUser(ctx);
    const existing = await ctx.db.query("profilePhotos").withIndex("by_user", q => q.eq("userId", user._id)).unique();
    if (existing) {
      await ctx.storage.delete(existing.storageId);
      await ctx.db.patch(existing._id, { storageId });
    } else await ctx.db.insert("profilePhotos", { userId: user._id, storageId });
    return null;
  },
});

export const uploadPhoto = action({
  args: { bytes: v.bytes() },
  handler: async (ctx, { bytes }): Promise<null> => {
    await ctx.runQuery(api.users.current, {});
    const data = new Uint8Array(bytes);
    if (data.length < 4 || data.length > 500_000 || data[0] !== 255 || data[1] !== 216 || data[2] !== 255 || data[data.length - 2] !== 255 || data[data.length - 1] !== 217)
      throw new ConvexError("INVALID_PROFILE_PHOTO");
    const storageId = await ctx.storage.store(new Blob([bytes], { type: "image/jpeg" }));
    try { await ctx.runMutation(internal.users.savePhoto, { storageId }); }
    catch (error) { await ctx.storage.delete(storageId); throw error; }
    return null;
  },
});

export const removePhoto = mutation({
  args: {},
  handler: async ctx => {
    const user = await requireUser(ctx);
    const photo = await ctx.db.query("profilePhotos").withIndex("by_user", q => q.eq("userId", user._id)).unique();
    if (photo) { await ctx.storage.delete(photo.storageId); await ctx.db.delete(photo._id); }
  },
});
