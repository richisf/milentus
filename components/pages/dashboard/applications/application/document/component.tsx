"use client";

import { useState, useCallback, useEffect } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { HomeIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import CanvasRow from "@/components/pages/dashboard/applications/application/document/row/component";
import AvatarComponent from "@/components/pages/dashboard/applications/application/document/avatar/component";
import { useEnterKey } from "@/components/pages/dashboard/applications/application/document/row/keyboard/enter/hook";
import { useTabStart } from "@/components/pages/dashboard/applications/application/document/row/keyboard/tab/start/hook";
import { useTabEnd } from "@/components/pages/dashboard/applications/application/document/row/keyboard/tab/end/hook";
import { useDeleteEmpty } from "@/components/pages/dashboard/applications/application/document/row/keyboard/delete/emtpy/hook";
import { useDeleteContent } from "@/components/pages/dashboard/applications/application/document/row/keyboard/delete/content/hook";
import { useArrowUp } from "@/components/pages/dashboard/applications/application/document/row/keyboard/arrows/up/hook";
import { useArrowDown } from "@/components/pages/dashboard/applications/application/document/row/keyboard/arrows/down/hook";
import { useArrowLeft } from "@/components/pages/dashboard/applications/application/document/row/keyboard/arrows/left/hook";
import { useArrowRight } from "@/components/pages/dashboard/applications/application/document/row/keyboard/arrows/right/hook";
import { useJsonImport } from "@/components/pages/dashboard/applications/application/document/avatar/document/json/import/hook";
import { useJsonNest } from "@/components/pages/dashboard/applications/application/document/avatar/document/view/nesting/hook";
import { useJsonExpand } from "@/components/pages/dashboard/applications/application/document/avatar/document/view/expand/hook";
import { useJsonExtend } from "@/components/pages/dashboard/applications/application/document/avatar/document/json/extension/hook";
import MessageInput from "@/components/pages/dashboard/applications/application/document/conversation/component";  

type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

type NodesData = {
  nodes: Node[];
};

// Helper functions for working with flat node structure
const getChildren = (nodes: Node[], parentId: string): Node[] => {
  return nodes.filter(node => node.parentId === parentId);
};

type ConversationData = {
  _id: Id<"conversation">;
  _creationTime: number;
  documentId: Id<"document">;
  messages: Array<{
    _id: Id<"message">;
    _creationTime: number;
    conversationId: Id<"conversation">;
    role: "user" | "assistant";
    content: string;
    order: number;
  }>;
} | null;

type CanvasComponentProps = {
  documentData?: {
    _id: Id<"document">;
    _creationTime: number;
    applicationId: Id<"application">;
    nodes: Array<{
      id: string;
      parentId: string;
      label: string;
      collapsed?: boolean;
    }>;
  } | null;
  conversationId?: Id<"conversation">;
  conversationData?: ConversationData;
  onBack?: () => void;
};

export default function Document({ documentData, conversationId, conversationData, onBack }: CanvasComponentProps) {
  const [nodesData, setNodesData] = useState<NodesData>({
    nodes: [
      {
        id: "1",
        parentId: "",
        label: "",
        collapsed: false
      }
    ]
  });
  const [focusTargetId, setFocusTargetId] = useState<string | null>("1"); // Start with focus on root node

  // Load document data when it becomes available
  useEffect(() => {
    if (documentData && documentData.nodes && documentData.nodes.length > 0) {
      setNodesData({ nodes: documentData.nodes });
      setFocusTargetId(documentData.nodes[0]?.id || "1");
    } else {
      // Reset to default state if no document data
      setNodesData({
        nodes: [
          {
            id: "1",
            parentId: "",
            label: "",
            collapsed: false
          }
        ]
      });
      setFocusTargetId("1");
    }
  }, [documentData]);

  // Keyboard hooks
  const { handleEnterAtEnd } = useEnterKey(nodesData, setNodesData, setFocusTargetId);
  const { handleTabAtStart } = useTabStart(nodesData, setNodesData, setFocusTargetId);
  const { handleTabAtEnd } = useTabEnd(nodesData, setNodesData, setFocusTargetId);
  const { handleDeleteAtStartEmpty } = useDeleteEmpty(nodesData, setNodesData, setFocusTargetId);
  const { handleDeleteAtStartWithContent } = useDeleteContent(nodesData, setNodesData);
  const { handleArrowUp } = useArrowUp(nodesData, setFocusTargetId);
  const { handleArrowDown } = useArrowDown(nodesData, setFocusTargetId);
  const { handleArrowLeft } = useArrowLeft(nodesData, setNodesData, setFocusTargetId);
  const { handleArrowRight } = useArrowRight(nodesData, setNodesData, setFocusTargetId);
  const { handleJsonExpand } = useJsonExpand(setNodesData, setFocusTargetId);
  const { handleJsonNest } = useJsonNest(setNodesData, setFocusTargetId);
  const { handleJsonImport } = useJsonImport(setNodesData, setFocusTargetId, documentData?._id, documentData?.applicationId);
  const { handleJsonExtend } = useJsonExtend(setNodesData, setFocusTargetId, documentData?._id, documentData?.applicationId);

  console.log('Canvas hooks initialized:', {
    handleEnterAtEnd: !!handleEnterAtEnd,
    handleTabAtStart: !!handleTabAtStart,
    handleTabAtEnd: !!handleTabAtEnd
  });


  const updateNode = useCallback((nodeId: string, updater: (node: Node) => Node) => {
    setNodesData(prev => ({
      nodes: prev.nodes.map(node => 
        node.id === nodeId ? updater(node) : node
      )
    }));
  }, []);

  const toggle = useCallback((nodeId: string) => {
    updateNode(nodeId, node => ({ ...node, collapsed: !node.collapsed }));
  }, [updateNode]);

  const updateInput = useCallback((nodeId: string, value: string) => {
    updateNode(nodeId, node => ({ ...node, label: value }));
  }, [updateNode]);

  const renderNode = useCallback((node: Node, isRoot: boolean = false) => {
    const children = getChildren(nodesData.nodes, node.id);
    const shouldAutoFocus = focusTargetId === node.id;

    console.log('Rendering node:', node.id, 'focusTargetId:', focusTargetId, 'shouldAutoFocus:', shouldAutoFocus);

    return (
      <CanvasRow
        key={node.id}
        node={node}
        childNodes={children}
        isRoot={isRoot}
        onToggle={() => toggle(node.id)}
        onInputChange={(value) => updateInput(node.id, value)}
        onEnterAtEnd={() => handleEnterAtEnd(node.id)}
        onTabAtStart={() => handleTabAtStart(node.id)}
        onTabAtEnd={() => handleTabAtEnd(node.id)}
        onDeleteAtStartEmpty={() => handleDeleteAtStartEmpty(node.id)}
        onDeleteAtStartWithContent={() => handleDeleteAtStartWithContent(node.id)}
        onArrowUp={() => handleArrowUp(node.id)}
        onArrowDown={() => handleArrowDown(node.id)}
        onArrowLeft={() => handleArrowLeft(node.id)}
        onArrowRight={() => handleArrowRight(node.id)}
        autoFocus={shouldAutoFocus}
      >
        {children.map(child => renderNode(child, false))}
      </CanvasRow>
    );
  }, [nodesData.nodes, toggle, updateInput, handleEnterAtEnd, handleTabAtStart, handleTabAtEnd, handleDeleteAtStartEmpty, handleDeleteAtStartWithContent, handleArrowUp, handleArrowDown, handleArrowLeft, handleArrowRight, focusTargetId]);

  const rootNodes = nodesData.nodes.filter(node => node.parentId === "");

  return (
    <div className="relative h-full">
      {/* Top right controls */}
      <div className="absolute top-0 right-0 z-50 flex items-center gap-2">
        {/* Home icon */}
        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            className="w-10 h-10 rounded-full p-0 bg-[#F7F8F4] hover:bg-[#E8E9E4]"
            title="Back to applications"
          >
            <HomeIcon className="w-6 h-6" />
          </Button>
        )}

        {/* Avatar component */}
        {documentData?.applicationId && (
          <AvatarComponent
            nodesData={nodesData}
            documentId={documentData?._id}
            applicationId={documentData.applicationId}
            onImport={handleJsonImport}
            onExtend={handleJsonExtend}
            onNest={handleJsonNest}
            onExpand={handleJsonExpand}
            onDocumentCleared={() => {
              console.log("Document cleared, navigating back");
              onBack?.();
            }}
          />
        )}
      </div>

      {/* Canvas content - full height with bottom padding for inputs */}
      <div className="h-full pb-32 p-2 overflow-y-auto">
        {rootNodes.map((node, index) => renderNode(node, index === 0))}
      </div>

      {/* Files and Message inputs at bottom */}
      {documentData && (
        <div className="absolute bottom-0 left-0 right-0 z-50">

          {/* Message input */}
          <MessageInput
            applicationId={documentData.applicationId}
            documentId={documentData._id}
            conversationId={conversationId}
            conversationData={conversationData}
            onDocumentUpdated={(updatedDocumentId, nodes) => {
              if (nodes && nodes.length > 0) {
                setNodesData({ nodes });
                setFocusTargetId(nodes[0]?.id || "1");
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
