"use client";

import { ReactNode, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

type NodeProps = {
  node: Node;
  childNodes: Node[];
  isRoot?: boolean;
  onToggle: () => void;
  onInputChange: (value: string) => void;
  onEnterAtEnd?: () => void;
  onTabAtStart?: () => void;
  onTabAtEnd?: () => void;
  onDeleteAtStartEmpty?: () => void;
  onDeleteAtStartWithContent?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  autoFocus?: boolean;
  children?: ReactNode;
};

export default function Node({
  node,
  childNodes,
  isRoot = false,
  onToggle,
  onInputChange,
  onEnterAtEnd,
  onTabAtStart,
  onTabAtEnd,
  onDeleteAtStartEmpty,
  onDeleteAtStartWithContent,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  autoFocus,
  children,
}: NodeProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('Row component effect - node:', node.id, 'autoFocus:', autoFocus, 'inputRef.current:', !!inputRef.current);
    if (autoFocus && inputRef.current) {
      console.log('Setting focus on node:', node.id);
      // Add a small delay to ensure the DOM is updated
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          console.log('Focus set successfully on node:', node.id);
        }
      }, 0);
    }
  }, [autoFocus, node.id]);

  return (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        {childNodes.length > 0 && !isRoot ? (
          <Button
            type="button"
            onClick={onToggle}
            variant="ghost"
            size="sm"
            className="w-5 h-5 p-0 text-muted-foreground hover:text-foreground text-xs"
            aria-label={node.collapsed ? "Expand" : "Collapse"}
          >
            {node.collapsed ? "▶" : "▼"}
          </Button>
        ) : (
          <div className="w-4" />
        )}
        <Input
          ref={inputRef}
          type="text"
          value={node.label}
          onChange={(e) => onInputChange(e.target.value)}
          className="flex-1 border-none shadow-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-0 font-normal text-lg"

          onKeyDown={(e) => {
            const target = e.target as HTMLInputElement;
            const isCtrlOrCmd = e.ctrlKey || e.metaKey;

            console.log('Key pressed:', e.key, 'node:', node.id, 'target focused:', document.activeElement === target);

            // Allow common keyboard shortcuts to pass through
            if (isCtrlOrCmd && ['c', 'v', 'a', 'x', 'z', 'y'].includes(e.key.toLowerCase())) {
              return; // Let browser handle copy, paste, select all, cut, undo, redo
            }

            if (e.key === 'Enter') {
              console.log('Enter key pressed in row component, node:', node.id, 'value:', target.value, 'selectionStart:', target.selectionStart, 'value.length:', target.value.length);
              e.preventDefault();
              e.stopPropagation();
              if (e.shiftKey || target.selectionStart === target.value.length || target.value === '') {
                console.log('Calling onEnterAtEnd for node:', node.id);
                onEnterAtEnd?.();
              }
            } else if (e.key === 'Tab') {
              console.log('Tab key pressed in row component, node:', node.id, 'value:', target.value, 'selectionStart:', target.selectionStart);
              e.preventDefault();
              e.stopPropagation();
              if (target.value === '') {
                onTabAtStart?.();
              } else if (target.selectionStart === 0) {
                onTabAtStart?.();
              } else {
                onTabAtEnd?.();
              }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
              // If text is selected, let browser handle deletion normally
              if (target.selectionStart !== target.selectionEnd) {
                return; // Allow browser to delete selected text
              }

              if (target.selectionStart === 0 && target.value === '') {
                e.preventDefault();
                onDeleteAtStartEmpty?.();
              } else if (target.selectionStart === 0 && target.value !== '') {
                e.preventDefault();
                onDeleteAtStartWithContent?.();
              }
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              onArrowUp?.();
            } else if (e.key === 'ArrowDown') {
              e.preventDefault();
              onArrowDown?.();
            } else if (e.key === 'ArrowLeft') {
              if (target.selectionStart === 0) {
                e.preventDefault();
                onArrowLeft?.();
              }
              // If not at start, let browser handle text cursor movement
            } else if (e.key === 'ArrowRight') {
              if (target.selectionStart === target.value.length) {
                e.preventDefault();
                onArrowRight?.();
              }
              // If not at end, let browser handle text cursor movement
            }
          }}
        />
      </div>
      {(!node.collapsed || isRoot) && children && (
        <div className="ml-5 mt-3">
          {children}
        </div>
      )}
    </div>
  );
}
