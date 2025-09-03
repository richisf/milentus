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

export function useArrowUp(
  nodesData: NodesData,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const findPreviousNodeId = useCallback((targetId: string, nodes: Node[]): string | null => {
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
    return targetIndex > 0 ? allVisibleNodes[targetIndex - 1] : null;
  }, []);

  const handleArrowUp = useCallback((currentId: string) => {
    const previousId = findPreviousNodeId(currentId, nodesData.nodes);
    if (previousId) {
      setFocusTargetId(previousId);
    }
  }, [nodesData.nodes, setFocusTargetId, findPreviousNodeId]);

  return {
    handleArrowUp
  };
}
