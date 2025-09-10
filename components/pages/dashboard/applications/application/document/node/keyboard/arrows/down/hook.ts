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

export function useArrowDown(
  nodesData: NodesData,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const findNextNodeId = useCallback((targetId: string, nodes: Node[]): string | null => {
    // Get all visible nodes in order (respecting collapse state)
    const allVisibleNodes: string[] = [];

    const getVisibleNodes = (parentId: string): void => {
      const children = nodes.filter(n => n.parentId === parentId);
      for (const child of children) {
        allVisibleNodes.push(child.id);
        if (!child.collapsed) {
          getVisibleNodes(child.id);
        }
      }
    };

    // Start from root
    const rootNode = nodes.find(n => n.parentId === "");
    if (rootNode) {
      allVisibleNodes.push(rootNode.id);
      if (!rootNode.collapsed) {
        getVisibleNodes(rootNode.id);
      }
    }

    const targetIndex = allVisibleNodes.indexOf(targetId);
    return targetIndex < allVisibleNodes.length - 1 ? allVisibleNodes[targetIndex + 1] : null;
  }, []);

  const handleArrowDown = useCallback((currentId: string) => {
    const nextId = findNextNodeId(currentId, nodesData.nodes);
    if (nextId) {
      setFocusTargetId(nextId);
    }
  }, [nodesData.nodes, setFocusTargetId, findNextNodeId]);

  return {
    handleArrowDown
  };
}
