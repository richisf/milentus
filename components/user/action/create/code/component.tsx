"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";

interface CodeInputProps {
  onCodeValidated: () => void;
}

export function CodeInput({ onCodeValidated }: CodeInputProps) {
  const [buttonError, setButtonError] = useState<string | null>(null);
  const [code, setCode] = useState("");

  const codeEntry = useQuery(api.wnAdmin.query.by_code.byCode, code ? { code } : "skip");
  const markCodeUsed = useMutation(api.wnAdmin.mutation.use.markUsed);

  const handleCodeValidation = async (e: React.FormEvent) => {
    e.preventDefault();
    setButtonError(null);

    if (!codeEntry) {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
      return;
    }

    if (codeEntry.used) {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
      return;
    }

    try {
      await markCodeUsed({ code });
      onCodeValidated();
    } catch {
      setButtonError("Not found");
      setTimeout(() => setButtonError(null), 3000);
    }
  };

  return (
    <form
      className="flex flex-col justify-between h-full w-full"
      onSubmit={handleCodeValidation}
    >
      <div className="flex flex-col justify-between flex-1">
        <Label htmlFor="code" className="text-base font-medium">Referral Code</Label>
        <Input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Enter referral code"
          id="code"
          className="text-base w-full"
          required
        />
        <Button
          type="submit"
          className="w-full text-base font-medium"
          disabled={!code}
        >
          {buttonError || "Validate Code"}
        </Button>
      </div>
    </form>
  );
}
