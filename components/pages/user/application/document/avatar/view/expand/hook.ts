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

export const useJsonExpand = (
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const handleJsonExpand = useCallback((level: number) => {
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

    // Apply expand logic to get updated nodes
    const applyExpansion = (nodes: Node[]): Node[] => {
      return nodes.map(node => {
        const nodeLevel = getNodeLevel(node.id, nodes);

        // If this node is at the selected level or higher, expand it
        if (nodeLevel >= level) {
          return { ...node, collapsed: false };
        }

        return node;
      });
    };

    // Update local state for visual feedback (no database persistence needed)
    setNodesData(prev => ({ nodes: applyExpansion(prev.nodes) }));
    setFocusTargetId(null);

    console.log(`📈 Expanding view to level ${level} (visual only)`);
  }, [setNodesData, setFocusTargetId]);

  return { handleJsonExpand };
};
