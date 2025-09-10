"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Export from "@/components/pages/dashboard/applications/application/document/avatar/document/json/export/component";
import Import from "@/components/pages/dashboard/applications/application/document/avatar/document/json/import/component";
import Extension from "@/components/pages/dashboard/applications/application/document/avatar/document/json/extension/component";
import Nesting from "@/components/pages/dashboard/applications/application/document/avatar/document/view/nesting/component";
import Expand from "@/components/pages/dashboard/applications/application/document/avatar/document/view/expand/component";
import { Files } from "@/components/pages/dashboard/applications/application/document/avatar/document/files/component";
import { Claude } from "@/components/pages/dashboard/applications/application/document/avatar/document/claude/component";
import { Pull } from "@/components/pages/dashboard/applications/application/document/avatar/document/pull/component";
import Remove from "@/components/pages/dashboard/applications/application/document/avatar/document/remove";

type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

type NodesData = {
  nodes: Node[];
};

interface AvatarProps {
  nodesData: NodesData;
  documentId?: Id<"document">;
  applicationId: Id<"application">;
  onImport: (nodesData: NodesData) => void;
  onExtend: (nodesData: NodesData) => void;
  onNest: (level: number) => void;
  onExpand: (level: number) => void;
  onDocumentCleared?: (documentId: Id<"document">) => void;
}

export default function Avatar({ nodesData, documentId, applicationId, onImport, onExtend, onNest, onExpand, onDocumentCleared }: AvatarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-10 h-10 rounded-full p-0 bg-[#F7F8F4] hover:bg-[#E8E9E4]"
          title="Canvas Menu"
        >
          <Cog6ToothIcon className="w-6 h-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56 bg-[#F7F8F4]">
        <div className="flex flex-col gap-1">
          <Export nodesData={nodesData} />
          <Import onImport={onImport} />
          <Extension
            currentNodesData={nodesData}
            onExtend={onExtend}
          />
          <Nesting
            nodesData={nodesData}
            onNest={onNest}
          />
          <Expand
            nodesData={nodesData}
            onExpand={onExpand}
          />
          {documentId && (
            <Files
              applicationId={applicationId}
              documentId={documentId}
            />
          )}
          <Claude
            applicationId={applicationId}
            documentId={documentId}
            nodesData={nodesData}
          />
          <Pull
            applicationId={applicationId}
            documentId={documentId}
          />
          {documentId && (
            <Remove
              applicationId={applicationId}
              documentId={documentId}
              onDocumentCleared={onDocumentCleared}
            />
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
