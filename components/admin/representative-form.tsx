"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function RepresentativeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [representativeType, setRepresentativeType] = useState<"MLA" | "MP">("MLA");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createRepresentative() {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/representatives", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          representativeType,
          name,
          partyName,
          isStateRulingParty: representativeType === "MLA",
          isCentralRulingParty: representativeType === "MP",
          active: true,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create representative.");
      }

      setName("");
      setPartyName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create representative.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-3 rounded-[1.5rem] border border-slateblue-100 bg-slateblue-50/70 p-4 md:grid-cols-4">
      <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Representative name" />
      <Input value={partyName} onChange={(event) => setPartyName(event.target.value)} placeholder="Party name" />
      <Select value={representativeType} onChange={(event) => setRepresentativeType(event.target.value as "MLA" | "MP")}>
        <option value="MLA">MLA</option>
        <option value="MP">MP</option>
      </Select>
      <Button onClick={() => void createRepresentative()} disabled={submitting}>
        Add record
      </Button>
      {error ? <p className="text-sm text-rose-600 md:col-span-4">{error}</p> : null}
    </div>
  );
}
