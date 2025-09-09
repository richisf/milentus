export type Node = {
  id: string;
  parentId: string;
  label: string;
  collapsed?: boolean;
};

// Helper function to build numbered hierarchical structure
export const buildNumberedStructure = (nodes: Node[]): string => {
  const lines: string[] = [];
  const processedNodes = new Set<string>();

  // Find root nodes (nodes with empty parentId)
  const rootNodes = nodes.filter(node => node.parentId === "");

  const processNode = (node: Node, prefix: string = ""): void => {
    if (processedNodes.has(node.id)) return;
    processedNodes.add(node.id);

    lines.push(`${prefix}${node.label}`);

    // Find children of this node
    const children = nodes.filter(n => n.parentId === node.id);

    // Sort children by their creation order (assuming we want consistent ordering)
    children.forEach((child, index) => {
      // Extract the base number from current prefix (e.g., "1.2." -> "1.2")
      const baseNumber = prefix.replace(/^\s*/, '').replace(/\.\s*$/, '');
      const newNumber = baseNumber ? `${baseNumber}.${index + 1}` : `${index + 1}`;
      processNode(child, `${newNumber}. `);
    });
  };

  rootNodes.forEach((rootNode, index) => {
    processNode(rootNode, `${index + 1}. `);
  });

  return lines.join('\n');
};
