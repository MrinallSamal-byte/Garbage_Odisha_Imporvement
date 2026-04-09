"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@safaodisha.local");
  const [password, setPassword] = useState("ChangeThis123!");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Login failed.");
      }

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-ink">Admin login</h1>
        <p className="mt-2 text-sm text-slateblue-600">
          Use the seeded credentials or update `ADMIN_EMAIL` and `ADMIN_PASSWORD`.
        </p>
      </div>
      <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
      <Input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Password"
      />
      <Button className="w-full" onClick={() => void handleSubmit()} disabled={submitting}>
        Sign in
      </Button>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </Card>
  );
}
