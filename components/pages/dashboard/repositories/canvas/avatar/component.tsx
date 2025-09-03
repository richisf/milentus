"use client";

import React from "react";
import { Cog6ToothIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import JsonExportComponent from "@/components/pages/dashboard/repositories/canvas/avatar/canvas/json/export/component";
import JsonImportComponent from "@/components/pages/dashboard/repositories/canvas/avatar/canvas/json/import/component";
import JsonExtensionComponent from "@/components/pages/dashboard/repositories/canvas/avatar/canvas/view/extension/component";
import JsonNestingComponent from "@/components/pages/dashboard/repositories/canvas/avatar/canvas/json/nesting/component";
import JsonExpandComponent from "@/components/pages/dashboard/repositories/canvas/avatar/canvas/view/expand/component";

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
  onImport: (nodesData: NodesData) => void;
  onExtend: (nodesData: NodesData) => void;
  onNest: (level: number) => void;
  onExpand: (level: number) => void;
}

export default function AvatarComponent({ nodesData, onImport, onExtend, onNest, onExpand }: AvatarProps) {
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
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
