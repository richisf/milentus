import { useCallback } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

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
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>,
  documentId?: Id<"document">,
  applicationId?: Id<"application">
) => {
  const updateDocument = useAction(api.application.document.action.update.document);

  const handleJsonExtend = useCallback(async (extendedNodesData: NodesData) => {
    // Update local state immediately for UI feedback
    setNodesData(extendedNodesData);
    setFocusTargetId(null);

    // If we have document and application IDs, persist to database
    if (documentId && applicationId) {
      try {
        console.log("➕ Extending document with nodes:", documentId);

        const result = await updateDocument({
          documentId,
          applicationId,
          nodes: extendedNodesData.nodes,
          replace: false // Add to existing nodes, don't replace
        });

        if (result.success && result.nodes) {
          // Update with the persisted nodes from the database
          setNodesData({ nodes: result.nodes });
          console.log("✅ Document extension successful");
        } else {
          console.error("❌ Document extension failed:", result.error);
        }
      } catch (error) {
        console.error("❌ Error extending document:", error);
      }
    }
  }, [setNodesData, setFocusTargetId, documentId, applicationId, updateDocument]);

  return { handleJsonExtend };
};
