"use client";

import { useState } from "react";
import type { FormEvent } from "react";

type State = { kind: "idle" | "pending" | "success" | "error"; message: string };

export function FeedbackForms() {
  return (
    <div className="feedback-grid">
      <ReviewForm />
      <ContactForm />
    </div>
  );
}

function ReviewForm() {
  const [state, setState] = useState<State>({ kind: "idle", message: "" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ kind: "pending", message: "" });
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorName: data.get("authorName"),
          rating: Number(data.get("rating")),
          body: data.get("body")
        })
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Review could not be sent.");
      form.reset();
      setState({ kind: "success", message: result.message || "Review received." });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Review could not be sent."
      });
    }
  }
  return (
    <form className="feedback-card" onSubmit={submit}>
      <span className="eyebrow">Share your table</span>
      <h3>Leave a review</h3>
      <p>Every note is read. Reviews appear after a quick quality check.</p>
      <label className="field">
        <span>Name</span>
        <input name="authorName" required minLength={2} />
      </label>
      <label className="field">
        <span>Rating</span>
        <select name="rating" defaultValue="5">
          <option value="5">5 — exceptional</option>
          <option value="4">4 — very good</option>
          <option value="3">3 — good</option>
          <option value="2">2 — needs work</option>
          <option value="1">1 — disappointing</option>
        </select>
      </label>
      <label className="field">
        <span>Your experience</span>
        <textarea name="body" rows={4} minLength={10} required />
      </label>
      {state.message && (
        <p className={state.kind === "error" ? "form-error" : "form-success"} role="status">
          {state.message}
        </p>
      )}
      <button className="button secondary" disabled={state.kind === "pending"}>
        {state.kind === "pending" ? "Sending…" : "Submit review"}
      </button>
    </form>
  );
}

function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle", message: "" });
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setState({ kind: "pending", message: "" });
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(data))
      });
      const result = (await response.json()) as { success?: string; error?: string };
      if (!response.ok) throw new Error(result.error || "Message could not be sent.");
      form.reset();
      setState({ kind: "success", message: result.success || "Message received." });
    } catch (error) {
      setState({
        kind: "error",
        message: error instanceof Error ? error.message : "Message could not be sent."
      });
    }
  }
  return (
    <form className="feedback-card accent-card" onSubmit={submit}>
      <span className="eyebrow">Real people, real help</span>
      <h3>Talk to Food.Go</h3>
      <p>Questions about an order, ingredients or a special request? We&apos;re listening.</p>
      <div className="field-grid">
        <label className="field">
          <span>Name</span>
          <input name="name" required />
        </label>
        <label className="field">
          <span>Email</span>
          <input name="email" type="email" required />
        </label>
      </div>
      <label className="field">
        <span>Phone (optional)</span>
        <input name="phone" type="tel" />
      </label>
      <label className="field">
        <span>Subject</span>
        <input name="subject" required />
      </label>
      <label className="field">
        <span>Message</span>
        <textarea name="message" rows={4} minLength={10} required />
      </label>
      {state.message && (
        <p className={state.kind === "error" ? "form-error" : "form-success"} role="status">
          {state.message}
        </p>
      )}
      <button className="button primary" disabled={state.kind === "pending"}>
        {state.kind === "pending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
