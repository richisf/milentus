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

export const useJsonImport = (
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const handleJsonImport = useCallback((newNodesData: NodesData) => {
    setNodesData(newNodesData);
    setFocusTargetId(null);
  }, [setNodesData, setFocusTargetId]);

  return { handleJsonImport };
};
