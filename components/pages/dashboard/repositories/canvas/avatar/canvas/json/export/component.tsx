"use client";

import React from "react";
import { useJsonExport } from "@/components/pages/dashboard/repositories/canvas/avatar/canvas/json/export/hook";
import { Button } from "@/components/ui/button";  

type Node = {
  id: string;
  parentId: string;
  label: string;
};

type NodesData = {
  nodes: Node[];
};

interface JsonExportProps {
  nodesData: NodesData;
}

export default function JsonExportComponent({ nodesData }: JsonExportProps) {
  const { handleJsonExport } = useJsonExport();

  const handleExport = async () => {
    await handleJsonExport(nodesData);
  };

  return (
    <Button
      onClick={handleExport}
      variant="ghost"
      size="sm"
      className="w-full justify-start text-xs bg-white hover:bg-gray-50"
      title="Export nodes as JSON"
    >
      Export
    </Button>
  );
}
