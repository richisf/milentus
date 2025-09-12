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

export const useJsonNest = (
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const handleJsonNest = useCallback((level: number) => {
    // Helper function to get the level of a node
    const getNodeLevel = (nodeId: string, allNodes: Node[]): number => {
      let currentNode = allNodes.find(n => n.id === nodeId);
      let nodeLevel = 0;

      while (currentNode && currentNode.parentId !== "") {
        nodeLevel++;
        currentNode = allNodes.find(n => n.id === currentNode!.parentId);
      }

      return nodeLevel;
    };

    // Apply nesting logic to get updated nodes
    const applyNesting = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        const nodeLevel = getNodeLevel(node.id, nodes);

        // If this node is at the selected level or higher, collapse it
        if (nodeLevel >= level) {
          return { ...node, collapsed: true };
        }

        return node;
      });
    };

    // Update local state for visual feedback (no database persistence needed)
    setNodesData(prev => ({ nodes: applyNesting(prev.nodes) }));
    setFocusTargetId(null);

    console.log(`📏 Nesting view to level ${level} (visual only)`);
  }, [setNodesData, setFocusTargetId]);

  return { handleJsonNest };
};
