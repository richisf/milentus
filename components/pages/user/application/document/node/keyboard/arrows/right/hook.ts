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

export function useArrowRight(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const handleArrowRight = useCallback((currentId: string) => {
    const currentNode = nodesData.nodes.find(n => n.id === currentId);
    if (!currentNode) return;

    // Find all siblings (nodes with same parent)
    const siblings = nodesData.nodes.filter(n => n.parentId === currentNode.parentId);

    // Find the index of current node among its siblings
    const currentIndex = siblings.findIndex(n => n.id === currentId);

    // If we have siblings and we're not at the last position, move to next sibling
    if (siblings.length > 0 && currentIndex < siblings.length - 1) {
      const nextSiblingId = siblings[currentIndex + 1].id;
      setFocusTargetId(nextSiblingId);
      return;
    }

    // If we're at the last position, handle expansion/movement with granularity
    const hasChildren = nodesData.nodes.some(n => n.parentId === currentId);

    if (currentNode.collapsed && hasChildren) {
      // Node is collapsed but has children, expand it first (stay focused)
      setNodesData(prev => ({
        nodes: prev.nodes.map(node =>
          node.id === currentId
            ? { ...node, collapsed: false }
            : node
        )
      }));
      return;
    }

    if (!currentNode.collapsed && hasChildren) {
      // Node is expanded and has children, move to first child
      const firstChild = nodesData.nodes.find(n => n.parentId === currentId);
      if (firstChild) {
        setFocusTargetId(firstChild.id);
      }
      return;
    }

    // If node has no children and we're at last position, try to find next sibling at parent level
    const findNextSiblingAtHigherLevel = (nodeId: string, nodes: Node[]): string | null => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node || node.parentId === "") return null;

      // Find siblings at parent level
      const siblingsAtParent = nodes.filter(n => n.parentId === node.parentId);
      const nodeIndex = siblingsAtParent.findIndex(n => n.id === nodeId);

      // If there's a next sibling at this level
      if (nodeIndex < siblingsAtParent.length - 1) {
        return siblingsAtParent[nodeIndex + 1].id;
      }

      // Otherwise, try the parent's level (recursive)
      return findNextSiblingAtHigherLevel(node.parentId, nodes);
    };

    const nextHigherSiblingId = findNextSiblingAtHigherLevel(currentId, nodesData.nodes);
    if (nextHigherSiblingId) {
      setFocusTargetId(nextHigherSiblingId);
    }
  }, [nodesData.nodes, setNodesData, setFocusTargetId]);

  return {
    handleArrowRight
  };
}
