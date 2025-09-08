"use client";

import React from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import JsonExportComponent from "@/components/pages/dashboard/applications/application/document/avatar/document/json/export/component";
import JsonImportComponent from "@/components/pages/dashboard/applications/application/document/avatar/document/json/import/component";
import JsonExtensionComponent from "@/components/pages/dashboard/applications/application/document/avatar/document/json/extension/component";
import JsonNestingComponent from "@/components/pages/dashboard/applications/application/document/avatar/document/view/nesting/component";
import JsonExpandComponent from "@/components/pages/dashboard/applications/application/document/avatar/document/view/expand/component";
import { FetchFiles } from "@/components/pages/dashboard/applications/application/document/avatar/document/files/component";
import RemoveComponent from "@/components/pages/dashboard/applications/application/document/avatar/document/remove";

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

export default function AvatarComponent({ nodesData, documentId, applicationId, onImport, onExtend, onNest, onExpand, onDocumentCleared }: AvatarProps) {
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
          <JsonExportComponent nodesData={nodesData} />
          <JsonImportComponent onImport={onImport} />
          <JsonExtensionComponent
            currentNodesData={nodesData}
            onExtend={onExtend}
          />
          <JsonNestingComponent
            nodesData={nodesData}
            onNest={onNest}
          />
          <JsonExpandComponent
            nodesData={nodesData}
            onExpand={onExpand}
          />
          {documentId && (
            <FetchFiles
              applicationId={applicationId}
              documentId={documentId}
            />
          )}
          {documentId && (
            <RemoveComponent
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
