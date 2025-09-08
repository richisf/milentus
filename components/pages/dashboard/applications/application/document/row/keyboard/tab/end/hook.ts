import { useCallback } from "react";

type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

type NodesData = {
  nodes: Node[];
};

export function useTabEnd(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const addChildWithFocus = useCallback((nodeId: string) => {
    // Generate a new ID
    const existingIds = nodesData.nodes.map(n => parseInt(n.id) || 0).filter(id => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = (maxId + 1).toString();

    // Create new child node
    const newNode: Node = {
      id: newId,
      parentId: nodeId,
      label: "",
      collapsed: false
    };

    // Add the new node to the array
    setNodesData(prev => ({
      nodes: [...prev.nodes, newNode]
    }));

    // Focus on the new node
    setFocusTargetId(newId);
  }, [nodesData.nodes, setNodesData, setFocusTargetId]);

  return {
    handleTabAtEnd: addChildWithFocus
  };
}
