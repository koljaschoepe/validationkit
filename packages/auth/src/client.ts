"use client";

import { createAuthClient } from "better-auth/react";
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.AUTH_BASE_URL ?? "http://localhost:3000",
  plugins: [magicLinkClient()],
});

export const { signIn, signOut, useSession } = authClient;
