"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { FormEvent } from "react";

export function AdminLogin() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form))
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Sign-in failed.");
      router.replace("/admin");
      router.refresh();
    } catch (exception) {
      setError(exception instanceof Error ? exception.message : "Sign-in failed.");
    } finally {
      setPending(false);
    }
  }
  return (
    <main className="admin-login-page">
      <form className="admin-login-card" onSubmit={submit}>
        <Link className="logo" href="/">
          Food<span>.</span>Go
        </Link>
        <span className="eyebrow">Operations</span>
        <h1>Kitchen access.</h1>
        <p>Use your individual staff credentials. Activity is recorded for accountability.</p>
        <label className="field">
          <span>Work email</span>
          <input name="email" type="email" autoComplete="username" required />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            minLength={8}
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in securely"}
        </button>
      </form>
    </main>
  );
}
