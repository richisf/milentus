"use client";

import React, { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { TrashIcon } from "@heroicons/react/24/outline";

interface RemoveComponentProps {
  documentId: Id<"document">;
  onDocumentDeleted?: (documentId: Id<"document">) => void;
}

export default function RemoveComponent({ documentId, onDocumentDeleted }: RemoveComponentProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteDocument = useAction(api.githubAccount.repository.document.action.delete.document);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteDocument({ documentId });

      if (result.success) {
        console.log("✅ Document deleted:", result.documentId);
        onDocumentDeleted?.(documentId);
      } else {
        console.error("❌ Failed to delete document:", result.error);
        alert(`Failed to delete document: ${result.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("❌ Error deleting document:", error);
      alert("Failed to delete document. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-full justify-start text-xs bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
      onClick={handleDelete}
      disabled={isDeleting}
      title="Delete this document"
    >
      {isDeleting ? (
        <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" />
      ) : (
        <TrashIcon className="w-4 h-4 mr-2" />
      )}
      Delete Document
    </Button>
  );
}
