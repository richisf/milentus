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

export function useTabStart(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const indentNode = useCallback((targetId: string) => {
    const targetNode = nodesData.nodes.find(n => n.id === targetId);
    if (!targetNode) return;

    // Find all siblings (nodes with same parent)
    const siblings = nodesData.nodes.filter(n => n.parentId === targetNode.parentId);

    // Find the index of target node among its siblings
    const targetIndex = siblings.findIndex(n => n.id === targetId);

    // Need at least one previous sibling to indent
    if (targetIndex <= 0) return;

    // Get the previous sibling
    const prevSibling = siblings[targetIndex - 1];

    // Change target node's parentId to previous sibling's id
    setNodesData(prev => ({
      nodes: prev.nodes.map(node =>
        node.id === targetId
          ? { ...node, parentId: prevSibling.id }
          : node
      )
    }));

    // Focus on the moved node after indentation
    setFocusTargetId(targetId);
  }, [nodesData.nodes, setNodesData, setFocusTargetId]);

  return {
    handleTabAtStart: indentNode
  };
}
