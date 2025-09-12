"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { Input } from "@/components/ui/input";
import { TableRow, TableCell } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";

export function CreateCodeForm() {
  const createCode = useAction(api.wnAdmin.action.create.code);

  const [newCode, setNewCode] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleAddCode = async () => {
    setIsCreating(true);
    try {
      const codeToUse = newCode.trim() || generateRandomCode();
      await createCode({ code: codeToUse });
      setNewCode("");
    } catch (error) {
      console.error("Failed to create code:", error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <TableRow className="h-8">
      <TableCell className=" h-8 p-0 pl-4">
        <Input
          value={newCode}
          onChange={(e) => setNewCode(e.target.value)}
          placeholder="Enter new code"
          className="border-none shadow-none focus:ring-0 focus:ring-transparent focus:border-none focus:shadow-none focus:outline-none focus:outline-transparent focus:bg-transparent active:border-none active:shadow-none active:bg-transparent p-0 h-8 bg-transparent hover:border-none hover:shadow-none hover:bg-transparent focus-visible:ring-0 focus-visible:ring-transparent focus-visible:outline-none focus-visible:border-none"
        />
      </TableCell>
      <TableCell className=" h-8 p-0">
        <button
          onClick={handleAddCode}
          disabled={isCreating}
          className="text-left hover:bg-transparent bg-transparent border-none p-0 h-8 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? "Adding..." : "Add"}
        </button>
      </TableCell>
    </TableRow>
  );
}
