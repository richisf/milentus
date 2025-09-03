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
    setNodesData(prev => {
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

      // Find nodes at the specified level and expand them (show their children)
      const updatedNodes = prev.nodes.map(node => {
        const nodeLevel = getNodeLevel(node.id, prev.nodes);

        // If this node is at the selected level or higher, expand it
        if (nodeLevel >= level) {
          return { ...node, collapsed: false };
        }

        return node;
      });

      return { nodes: updatedNodes };
    });
    setFocusTargetId(null);
  }, [setNodesData, setFocusTargetId]);

  return { handleJsonExpand };
};
