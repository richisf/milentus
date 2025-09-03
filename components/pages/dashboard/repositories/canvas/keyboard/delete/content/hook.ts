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

export function useDeleteContent(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>
) {
  const isAtBaseLevel = useCallback((targetId: string, nodes: Node[]): boolean => {
    const node = nodes.find(n => n.id === targetId);
    if (!node) return true;

    // If parent is root or empty, it's at base level
    return node.parentId === "" || nodes.find(n => n.id === node.parentId)?.parentId === "";
  }, []);

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

  const handleDeleteAtStartWithContent = useCallback((targetId: string) => {
    const atBase = isAtBaseLevel(targetId, nodesData.nodes);

    if (atBase) {
      // At base level - can't outdent further, do nothing
      return;
    } else {
      // Not at base level - outdent the node (with all its children)
      outdentNode(targetId);
    }
  }, [isAtBaseLevel, nodesData.nodes, outdentNode]);

  return {
    handleDeleteAtStartWithContent
  };
}
