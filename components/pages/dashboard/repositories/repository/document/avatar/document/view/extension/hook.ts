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

export const useJsonExtend = (
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>
) => {
  const handleJsonExtend = useCallback((extendedNodesData: NodesData) => {
    setNodesData(extendedNodesData);
    setFocusTargetId(null);
  }, [setNodesData, setFocusTargetId]);

  return { handleJsonExtend };
};
