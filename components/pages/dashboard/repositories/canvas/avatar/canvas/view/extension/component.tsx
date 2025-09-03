"use client";

import React, { useState } from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Node = {
  id: string;
  parentId: string;
  label: string;
};

type NodesData = {
  nodes: Node[];
};

interface JsonExtensionProps {
  currentNodesData: NodesData;
  onExtend: (extendedNodesData: NodesData) => void;
}

export default function JsonExtensionComponent({ currentNodesData, onExtend }: JsonExtensionProps) {
  const [jsonInput, setJsonInput] = useState("");
  const [error, setError] = useState("");

  const validateNode = (obj: unknown): obj is Node => {
    if (typeof obj !== "object" || obj === null) return false;
    const node = obj as Record<string, unknown>;

    if (typeof node.id !== "string") return false;
    if (typeof node.parentId !== "string") return false;
    if (typeof node.label !== "string") return false;

    return true;
  };

  const validateNodesData = (obj: unknown): obj is NodesData => {
    if (typeof obj !== "object" || obj === null) return false;
    const data = obj as Record<string, unknown>;

    if (!Array.isArray(data.nodes)) return false;

    // Validate each node
    for (const node of data.nodes) {
      if (!validateNode(node)) return false;
    }

    return true;
  };

  const generateUniqueId = (baseId: string, existingIds: Set<string>): string => {
    if (!existingIds.has(baseId)) return baseId;
    
    let counter = 1;
    let newId = `${baseId}_${counter}`;
    while (existingIds.has(newId)) {
      counter++;
      newId = `${baseId}_${counter}`;
    }
    return newId;
  };

  const handleExtend = () => {
    try {
      const parsed = JSON.parse(jsonInput);

      // Validate the parsed data
      if (!validateNodesData(parsed)) {
        setError("Invalid nodes structure. Please check the JSON format matches the schema.");
        return;
      }

      // Get existing node IDs to avoid duplicates
      const existingIds = new Set(currentNodesData.nodes.map(node => node.id));
      
      // Process new nodes to ensure unique IDs
      const newNodes = parsed.nodes.map(node => ({
        ...node,
        id: generateUniqueId(node.id, existingIds)
      }));

      // Add new unique IDs to the set for subsequent nodes
      newNodes.forEach(node => existingIds.add(node.id));

      // Combine current nodes with new nodes
      const extendedNodesData: NodesData = {
        nodes: [...currentNodesData.nodes, ...newNodes]
      };

      onExtend(extendedNodesData);
      setJsonInput("");
      setError("");
    } catch {
      setError("Invalid JSON. Please check your syntax.");
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        <Textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Extend"
          className="flex-1 text-xs min-h-8 resize-none"
        />
        <Button
          onClick={handleExtend}
          variant="ghost"
          size="sm"
          disabled={!jsonInput.trim()}
          className="bg-[#F7F8F4] hover:bg-[#F7F8F4]/80"
          title="Extend with JSON nodes"
        >
          <PlusIcon className="w-4 h-4" />
        </Button>
      </div>
      {error && (
        <Alert variant="destructive" className="mt-2">
          <AlertDescription className="text-xs">
            {error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
