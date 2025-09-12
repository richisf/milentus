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

export function useEnterKey(
  nodesData: NodesData,
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) {
  const addSiblingAfter = useCallback((targetId: string) => {
    console.log('Enter pressed on node:', targetId);
    const targetNode = nodesData.nodes.find(n => n.id === targetId);
    if (!targetNode) {
      console.log('Target node not found:', targetId);
      return;
    }

    console.log('Target node:', targetNode);

    // Generate a new ID
    const existingIds = nodesData.nodes.map(n => parseInt(n.id) || 0).filter(id => !isNaN(id));
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = (maxId + 1).toString();
    console.log('New ID will be:', newId);

    let newNode: Node;
    let insertIndex: number;
    const newNodes = [...nodesData.nodes];

    // Special case: if target is a root node, create a child instead of sibling
    if (targetNode.parentId === "") {
      console.log('Target is root node, creating child instead of sibling');
      newNode = {
        id: newId,
        parentId: targetNode.id, // Child of the root node
        label: "",
        collapsed: false
      };

      // Insert as first child of the root node
      const rootChildren = nodesData.nodes.filter(n => n.parentId === targetNode.id);
      if (rootChildren.length > 0) {
        // Insert before first child
        insertIndex = newNodes.findIndex(n => n.id === rootChildren[0].id);
      } else {
        // Insert after root node
        insertIndex = newNodes.findIndex(n => n.id === targetNode.id) + 1;
      }
      newNodes.splice(insertIndex, 0, newNode);
    } else {
      // Normal case: create sibling
      console.log('Creating sibling node');

      // Find all siblings (nodes with same parent)
      const siblings = nodesData.nodes.filter(n => n.parentId === targetNode.parentId);
      console.log('Siblings:', siblings);

      // Create new sibling node
      newNode = {
        id: newId,
        parentId: targetNode.parentId,
        label: "",
        collapsed: false
      };

      // Insert the new node after the target node
      insertIndex = newNodes.findIndex(n => n.id === targetId) + 1;
      newNodes.splice(insertIndex, 0, newNode);
    }

    console.log('New nodes array:', newNodes);
    console.log('Setting focus to newId:', newId);
    setNodesData({ nodes: newNodes });
    setFocusTargetId(newId);
  }, [nodesData.nodes, setNodesData, setFocusTargetId]);

  return {
    handleEnterAtEnd: addSiblingAfter
  };
}
