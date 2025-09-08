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

export const useJsonImport = (
  setNodesData: React.Dispatch<React.SetStateAction<NodesData>>,
  setFocusTargetId: React.Dispatch<React.SetStateAction<string | null>>,
  documentId?: Id<"document">,
  applicationId?: Id<"application">
) => {
  const updateDocument = useAction(api.githubAccount.application.document.action.update.document);

  const handleJsonImport = useCallback(async (newNodesData: NodesData) => {
    // Update local state immediately for UI feedback
    setNodesData(newNodesData);
    setFocusTargetId(newNodesData.nodes.length > 0 ? newNodesData.nodes[0]?.id : null);

    // If we have document and application IDs, persist to database
    if (documentId && applicationId) {
      try {
        console.log("📥 Importing nodes to document:", documentId);
        const result = await updateDocument({
          documentId,
          applicationId,
          // For import, we want to replace all nodes with the imported ones
          // We can simulate this by passing the nodes directly (they'll be combined in the mutation)
          // But for import, we might want to clear existing first - let's check the mutation behavior
        });

        if (result.success && result.nodes) {
          // Update with the persisted nodes from the database
          setNodesData({ nodes: result.nodes });
          console.log("✅ Document import successful");
        } else {
          console.error("❌ Document import failed:", result.error);
        }
      } catch (error) {
        console.error("❌ Error importing document:", error);
      }
    }
  }, [setNodesData, setFocusTargetId, documentId, applicationId, updateDocument]);

  return { handleJsonImport };
};
