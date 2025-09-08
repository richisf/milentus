"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FetchFilesProps {
  applicationId: Id<"application">;
  documentId: Id<"document">; // Required for updating existing documents
}

export function FetchFiles({ applicationId, documentId }: FetchFilesProps) {
  const updateDocumentAction = useAction(api.githubAccount.application.document.action.update.document);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchResponse, setFetchResponse] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [path, setPath] = useState<string>("");
  const [dependencyPath, setDependencyPath] = useState<string>("");

  const handleFetchFiles = async () => {
    if (!path.trim()) {
      setFetchResponse("❌ Please enter a file path");
      return;
    }

    setIsFetching(true);
    setFetchResponse(null);

    try {
      // Update existing document
      const result = await updateDocumentAction({
        documentId,
        applicationId,
        path: path.trim(),
        dependencyPath: dependencyPath.trim() || "",
      });

      if (result.success) {
        setFetchResponse(`✅ Successfully updated document with files!`);
        setShowForm(false); // Hide form after success
        setPath(""); // Reset inputs
        setDependencyPath("");
      } else {
        setFetchResponse(`❌ Failed to update document: ${result.error}`);
      }
    } catch (error) {
      setFetchResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setPath("");
    setDependencyPath("");
    setFetchResponse(null);
  };

  return (
    <div className="flex flex-col gap-1">
      {!showForm ? (
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering repository card click
            setShowForm(true);
          }}
          disabled={isFetching}
          variant="ghost"
          size="sm"
          className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-[#F7F8F4] hover:bg-[#E8E9E4]"
        >
          {isFetching ? "Processing..." : "Update with Files"}
        </Button>
      ) : (
        <div
          className="flex flex-col gap-3 p-3 rounded border border-blue-200 bg-blue-50"
          onClick={(e) => e.stopPropagation()} // Prevent triggering repository card click
        >
          <div className="text-xs text-blue-700 font-medium">
            Update document with AI analysis:
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="file-path" className="text-xs text-blue-700">
              File Path Pattern *
            </Label>
            <Input
              id="file-path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="e.g., src/, *.ts, components/..."
              className="text-xs h-8 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
              disabled={isFetching}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="dependency-path" className="text-xs text-blue-700">
              Dependency Path Pattern (Optional)
            </Label>
            <Input
              id="dependency-path"
              value={dependencyPath}
              onChange={(e) => setDependencyPath(e.target.value)}
              placeholder="e.g., node_modules/, package.json"
              className="text-xs h-8 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
              disabled={isFetching}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering repository card click
                handleFetchFiles();
              }}
              disabled={isFetching}
              size="sm"
              variant="default"
              className="text-xs h-7 px-2 bg-blue-600 hover:bg-blue-700"
            >
              {isFetching ? "Processing..." : "Update Document"}
            </Button>
            <Button
              onClick={(e) => {
                e.stopPropagation(); // Prevent triggering repository card click
                handleCancel();
              }}
              disabled={isFetching}
              size="sm"
              variant="outline"
              className="text-xs h-7 px-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {fetchResponse && (
        <div className="text-xs px-3 py-2 rounded text-gray-600" style={{ backgroundColor: '#F7F8F4' }}>
          {fetchResponse}
        </div>
      )}
    </div>
  );
}
