import { query } from "./_generated/server";
import { requireUser } from "./lib/auth";

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    return { _id: user._id, name: user.name, email: user.email };
  },
});
