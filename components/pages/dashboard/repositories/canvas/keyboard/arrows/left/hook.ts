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

export function useArrowLeft(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const handleArrowLeft = useCallback((currentId: string) => {
    const currentNode = nodesData.nodes.find(n => n.id === currentId);
    if (!currentNode) return;

    // Find all siblings (nodes with same parent)
    const siblings = nodesData.nodes.filter(n => n.parentId === currentNode.parentId);

    // Find the index of current node among its siblings
    const currentIndex = siblings.findIndex(n => n.id === currentId);

    // If we have siblings and we're not at the first position, move to previous sibling
    if (siblings.length > 0 && currentIndex > 0) {
      const previousSiblingId = siblings[currentIndex - 1].id;
      setFocusTargetId(previousSiblingId);
      return;
    }

    // If we're at the first position, check if we can collapse first
    if (currentNode && !currentNode.collapsed) {
      // Check if node has children
      const hasChildren = nodesData.nodes.some(n => n.parentId === currentId);
      if (hasChildren) {
        // Node is expanded and has children, collapse it first
        setNodesData(prev => ({
          nodes: prev.nodes.map(node =>
            node.id === currentId
              ? { ...node, collapsed: true }
              : node
          )
        }));
        return;
      }
    }

    // If node is already collapsed or has no children, move to parent
    if (currentNode.parentId && currentNode.parentId !== "") {
      setFocusTargetId(currentNode.parentId);
    }
  }, [nodesData.nodes, setNodesData, setFocusTargetId]);

  return {
    handleArrowLeft
  };
}
