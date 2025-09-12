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

export const useJsonExport = () => {
  const handleJsonExport = useCallback(async (nodesData: NodesData) => {
    try {
      const jsonString = JSON.stringify(nodesData, null, 2);
      await navigator.clipboard.writeText(jsonString);
      console.log("JSON copied to clipboard");
      return { success: true };
    } catch (error) {
      console.error("Failed to copy JSON to clipboard:", error);
      return { success: false, error };
    }
  }, []);

  return { handleJsonExport };
};
