"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function LoginForm({
  nextPath,
  loginError,
}: {
  nextPath: string;
  loginError: string | null;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      setStatus("error");
      setMessage("Enter your work email to receive a magic link.");
      return;
    }

    try {
      setStatus("submitting");
      setMessage(null);

      const supabase = createClient();
      const redirectUrl = new URL("/auth/callback", window.location.origin);
      redirectUrl.searchParams.set("next", nextPath);

      const { error } = await supabase.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          emailRedirectTo: redirectUrl.toString(),
        },
      });

      if (error) {
        throw error;
      }

      setStatus("success");
      setMessage("Magic link sent. Open the email on this device to continue.");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Could not send magic link.");
    }
  }

  return (
    <section className="panel w-full max-w-md p-6">
      <p className="eyebrow">Login</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to AI Magazine OS</h1>
      <p className="mt-3 text-sm leading-7 text-ink-soft">
        Use a Supabase magic link so we can keep ownership, review flow, and issue data tied to the current editor.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-ink">Work email</span>
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="editor@yourmagazine.com"
            className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-sm outline-none transition focus:border-ink-soft"
            autoComplete="email"
            required
          />
        </label>

        <button
          type="submit"
          disabled={status === "submitting"}
          className="w-full rounded-2xl bg-ink px-4 py-3 text-sm font-medium text-paper transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "submitting" ? "Sending magic link..." : "Send magic link"}
        </button>
      </form>

      {loginError ? (
        <div className="mt-4 rounded-2xl border border-[#d4a491] bg-[#fff4ef] px-4 py-3 text-sm text-[#8a3b1d]">
          {loginError}
        </div>
      ) : null}

      {message ? (
        <div
          className={`mt-4 rounded-2xl border px-4 py-3 text-sm ${
            status === "success"
              ? "border-[#c9d8c0] bg-[#f4fbef] text-[#36522a]"
              : "border-[#d4a491] bg-[#fff4ef] text-[#8a3b1d]"
          }`}
        >
          {message}
        </div>
      ) : null}

      <div className="mt-6 rounded-2xl border border-line bg-surface px-4 py-3 text-sm text-ink-soft">
        Future-ready: OAuth providers and invite flows can plug into this screen without changing the app shell.
      </div>
    </section>
  );
}
