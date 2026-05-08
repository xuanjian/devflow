export default function GraphView({ graph, selectedNodeId, onSelectNode }) {
  const nodes = graph.nodes || [];
  const positions = layoutNodes(nodes);
  const visibleEdges = selectVisibleEdges(graph.edges || [], selectedNodeId);
  const highlightedNodeIds = getHighlightedNodeIds(visibleEdges, selectedNodeId);

  return (
    <section className="graph-view" aria-label="Relationship graph">
      <div className="graph-toolbar">
        <strong>{selectedNodeId ? "Focused relationships" : "Overview relationships"}</strong>
        <span>{selectedNodeId ? "Showing selected-node links" : "Showing only main structure lines"}</span>
      </div>
      <svg viewBox="0 0 1100 720" role="img" aria-label="ai-context relationship map">
        {visibleEdges.map((edge) => {
          const from = positions.get(edge.from);
          const to = positions.get(edge.to);
          if (!from || !to) return null;
          return (
            <line
              className={`graph-edge ${edge.relation === "contains" ? "main-edge" : "focused-edge"}`}
              data-testid={`edge-${edge.from}-${edge.to}-${edge.relation}`}
              key={`${edge.from}-${edge.to}-${edge.relation}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
            />
          );
        })}
        {nodes.map((node) => {
          const point = positions.get(node.id);
          return (
            <foreignObject height="58" key={node.id} width="150" x={point.x - 75} y={point.y - 29}>
              <button
                className={`graph-node node-${node.type} status-${node.status} ${selectedNodeId === node.id ? "selected" : ""} ${highlightedNodeIds.has(node.id) ? "highlighted" : ""}`}
                onClick={() => onSelectNode(node.id)}
                type="button"
              >
                <strong>{node.title}</strong>
                <span>{node.type}</span>
              </button>
            </foreignObject>
          );
        })}
      </svg>
    </section>
  );
}

function selectVisibleEdges(edges, selectedNodeId) {
  return edges.filter((edge) => {
    if (edge.relation === "contains") {
      return true;
    }
    return selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId);
  });
}

function getHighlightedNodeIds(edges, selectedNodeId) {
  const ids = new Set();
  if (selectedNodeId) ids.add(selectedNodeId);
  for (const edge of edges) {
    if (selectedNodeId && (edge.from === selectedNodeId || edge.to === selectedNodeId)) {
      ids.add(edge.from);
      ids.add(edge.to);
    }
  }
  return ids;
}

function layoutNodes(nodes) {
  const positions = new Map();
  const groups = nodes.filter((node) => node.type === "group");
  const root = nodes.find((node) => node.type === "root");
  if (root) positions.set(root.id, { x: 550, y: 96 });

  groups.forEach((node, index) => {
    positions.set(node.id, { x: 140 + index * 165, y: 220 });
  });

  const byType = new Map();
  nodes.filter((node) => node.type !== "root" && node.type !== "group").forEach((node) => {
    const list = byType.get(node.type) || [];
    list.push(node);
    byType.set(node.type, list);
  });
  const typeOrder = ["project", "scene", "skill", "rule", "profile", "task"];
  typeOrder.forEach((type, typeIndex) => {
    const list = byType.get(type) || [];
    list.forEach((node, index) => {
      positions.set(node.id, { x: 120 + typeIndex * 175, y: 340 + index * 86 });
    });
  });
  return positions;
}
