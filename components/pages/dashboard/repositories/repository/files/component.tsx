"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FetchFilesProps {
  repositoryId: Id<"repository">;
  repositoryName: string;
}

export function FetchFiles({ repositoryId, repositoryName }: FetchFilesProps) {
  const fetchFilesAction = useAction(api.githubAccount.repository.files.action.create.files);

  const [isFetching, setIsFetching] = useState(false);
  const [fetchResponse, setFetchResponse] = useState<string | null>(null);
  const [showFilterInput, setShowFilterInput] = useState(false);
  const [filterPattern, setFilterPattern] = useState<string>("");

  const handleFetchFiles = async () => {
    setIsFetching(true);
    setFetchResponse(null);

    try {
      const result = await fetchFilesAction({
        repositoryId: repositoryId,
        filterCode: filterPattern || undefined,
      });

      if (result.success) {
        setFetchResponse(`✅ Successfully fetched and stored ${result.fileCount || 0} files!`);
        setShowFilterInput(false); // Hide input after success
        setFilterPattern(""); // Reset filter
      } else {
        setFetchResponse(`❌ Failed to fetch files: ${result.error}`);
      }
    } catch (error) {
      setFetchResponse(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCancel = () => {
    setShowFilterInput(false);
    setFilterPattern("");
    setFetchResponse(null);
  };

  return (
    <div className="flex flex-col gap-1">
      {!showFilterInput ? (
        <Button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering repository card click
            setShowFilterInput(true);
          }}
          disabled={isFetching}
          variant="ghost"
          size="sm"
          className="text-xs px-3 py-2 h-8 flex items-center w-full justify-start bg-[#F7F8F4] hover:bg-[#E8E9E4]"
        >
          {isFetching ? "Fetching..." : "Fetch Repository Files"}
        </Button>
      ) : (
        <div
          className="flex flex-col gap-2 p-3 rounded border border-blue-200 bg-blue-50"
          onClick={(e) => e.stopPropagation()} // Prevent triggering repository card click
        >
          <div className="text-xs text-blue-700 font-medium">
            Fetch files from repository:
          </div>
          <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded font-mono">
            {repositoryName}
          </div>
          <div className="text-xs text-blue-600">
            Optional: Filter files containing text in path
          </div>
          <Input
            value={filterPattern}
            onChange={(e) => setFilterPattern(e.target.value)}
            placeholder="e.g., /action/, create, convex..."
            className="text-xs h-8 bg-white border-gray-300 focus-visible:ring-0 focus-visible:border-gray-300"
            disabled={isFetching}
          />
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
              {isFetching ? "Fetching..." : "Fetch Files"}
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
