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

export function useDeleteEmpty(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
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

  const isAtBaseLevel = useCallback((targetId: string, nodes: Node[]): boolean => {
    const node = nodes.find(n => n.id === targetId);
    if (!node) return true;

    // If parent is root or empty, it's at base level
    return node.parentId === "" || nodes.find(n => n.id === node.parentId)?.parentId === "";
  }, []);

  const deleteNode = useCallback((targetId: string) => {
    setNodesData(prev => ({
      nodes: prev.nodes.filter(node => node.id !== targetId)
    }));
  }, [setNodesData]);

  const outdentNode = useCallback((targetId: string) => {
    const targetNode = nodesData.nodes.find(n => n.id === targetId);
    if (!targetNode) return;

    const parentNode = nodesData.nodes.find(n => n.id === targetNode.parentId);
    if (!parentNode) return;

    // Move node to be a sibling of its parent
    setNodesData(prev => ({
      nodes: prev.nodes.map(node =>
        node.id === targetId
          ? { ...node, parentId: parentNode.parentId }
          : node
      )
    }));
  }, [nodesData.nodes, setNodesData]);

  const handleDeleteAtStartEmpty = useCallback((targetId: string) => {
    const atBase = isAtBaseLevel(targetId, nodesData.nodes);

    if (atBase) {
      // At base level - move cursor to previous row and delete current row
      const previousNodeId = findPreviousNodeId(targetId, nodesData.nodes);
      if (previousNodeId) {
        setFocusTargetId(previousNodeId);
      }
      deleteNode(targetId);
    } else {
      // Not at base level - outdent the node
      outdentNode(targetId);
    }
  }, [isAtBaseLevel, findPreviousNodeId, nodesData.nodes, outdentNode, deleteNode, setFocusTargetId]);

  return {
    handleDeleteAtStartEmpty
  };
}
