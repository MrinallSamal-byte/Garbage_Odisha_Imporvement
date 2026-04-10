"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { readApiResponse } from "@/lib/utils/api-client";

export function RepresentativeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [representativeType, setRepresentativeType] = useState<"MLA" | "MP">("MLA");
  // Ruling-party flags must be explicitly set — they cannot be inferred from
  // representative type alone (an MLA may be in the opposition, and an MP may
  // be from the state or national ruling party independently).
  const [isStateRulingParty, setIsStateRulingParty] = useState(false);
  const [isCentralRulingParty, setIsCentralRulingParty] = useState(false);
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
          isStateRulingParty,
          isCentralRulingParty,
          active: true,
        }),
      });
      const payload = await readApiResponse<{ error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not create representative.");
      }

      setName("");
      setPartyName("");
      setIsStateRulingParty(false);
      setIsCentralRulingParty(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create representative.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-3 rounded-[1.5rem] border border-slateblue-100 bg-slateblue-50/70 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Representative name" />
        <Input value={partyName} onChange={(event) => setPartyName(event.target.value)} placeholder="Party name" />
        <Select value={representativeType} onChange={(event) => setRepresentativeType(event.target.value as "MLA" | "MP")}>
          <option value="MLA">MLA</option>
          <option value="MP">MP</option>
        </Select>
        <Button onClick={() => void createRepresentative()} disabled={submitting}>
          Add record
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slateblue-700">
          <input
            type="checkbox"
            checked={isStateRulingParty}
            onChange={(e) => setIsStateRulingParty(e.target.checked)}
            className="h-4 w-4 rounded border-slateblue-300 accent-civic-600"
          />
          State ruling party
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slateblue-700">
          <input
            type="checkbox"
            checked={isCentralRulingParty}
            onChange={(e) => setIsCentralRulingParty(e.target.checked)}
            className="h-4 w-4 rounded border-slateblue-300 accent-civic-600"
          />
          Central ruling party
        </label>
      </div>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
    </div>
  );
}
