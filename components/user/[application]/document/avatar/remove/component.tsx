"use client";

import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";

interface RemoveProps {
  applicationId: Id<"application">;
  documentId: Id<"document">;
  onDocumentCleared?: (documentId: Id<"document">) => void;
}

export default function Remove({ applicationId, documentId, onDocumentCleared }: RemoveProps) {
    const [isClearing, setIsClearing] = useState(false);

  const clearDocument = useAction(api.application.document.action.update.document);

  const handleDelete = async () => {
    setIsClearing(true);
    try {
      const result = await clearDocument({
        documentId,
        applicationId,
        delete: true
      });

      if (result.success) {
        console.log("✅ Document content cleared:", result.documentId);
        onDocumentCleared?.(documentId);
      } else {
        console.error("❌ Failed to clear document:", result.error);
        alert(`Failed to clear document: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error clearing document:", error);
      alert("Failed to clear document. Please try again.");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-xs bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isClearing}
      title="Clear this document"
    >
      {isClearing ? (
        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <TrashIcon className="w-4 h-4 mr-2" />
      )}
      Clear Document
    </Button>
  );
}
