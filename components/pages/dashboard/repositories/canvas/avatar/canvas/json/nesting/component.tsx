"use client";

import React, { useState } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

type NodesData = {
  nodes: Node[];
};

interface JsonNestingProps {
  nodesData: NodesData;
  onNest: (level: number) => void;
}

export default function JsonNestingComponent({ nodesData, onNest }: JsonNestingProps) {
  const [level, setLevel] = useState(1);

  const handleNest = () => {
    onNest(level);
  };

  // Helper function to get the level of a node
  const getNodeLevel = (nodeId: string, nodes: Node[]): number => {
    let currentNode = nodes.find(n => n.id === nodeId);
    let level = 0;

    while (currentNode && currentNode.parentId !== "") {
      level++;
      currentNode = nodes.find(n => n.id === currentNode!.parentId);
    }

    return level;
  };

  // Get all node IDs for the dropdown with their levels
  const nodeOptions = nodesData.nodes.map(node => ({
    id: node.id,
    label: node.label || `Node ${node.id}`,
    parentId: node.parentId,
    level: getNodeLevel(node.id, nodesData.nodes)
  }));

  // Get available levels (from 1 to max level in the tree)
  const maxLevel = Math.max(...nodeOptions.map(node => node.level));
  const availableLevels = Array.from({ length: maxLevel }, (_, i) => i + 1);

  return (
    <div className="flex gap-2">
      <Select value={level.toString()} onValueChange={(value) => setLevel(Number(value))}>
        <SelectTrigger className="flex-1 text-xs">
          <SelectValue placeholder="Select level" />
        </SelectTrigger>
        <SelectContent>
          {availableLevels.map(lvl => (
            <SelectItem key={lvl} value={lvl.toString()}>
              Collapse Level {lvl}+
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        onClick={handleNest}
        variant="ghost"
        size="sm"
        className="bg-[#F7F8F4] hover:bg-[#F7F8F4]/80"
        title="Collapse nodes at selected level and below"
      >
        <ArrowLeftIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
