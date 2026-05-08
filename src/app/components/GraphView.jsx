import { useRef } from "react";

export default function GraphView({ graph, selectedNodeId, onSelectNode }) {
  const nodes = graph.nodes || [];
  const positions = layoutNodes(nodes);
  const viewport = getGraphViewport(positions);
  const visibleEdges = selectVisibleEdges(graph.edges || [], selectedNodeId);
  const highlightedNodeIds = getHighlightedNodeIds(visibleEdges, selectedNodeId);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);

  function handleMouseDown(event) {
    if (event.button !== 0 || event.target.closest(".graph-node")) {
      return;
    }
    const element = viewportRef.current;
    if (!element) {
      return;
    }
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
    element.classList.add("is-dragging");
  }

  function handleMouseMove(event) {
    const drag = dragRef.current;
    const element = viewportRef.current;
    if (!drag || !element) {
      return;
    }
    element.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    element.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  }

  function stopDrag() {
    dragRef.current = null;
    viewportRef.current?.classList.remove("is-dragging");
  }

  return (
    <section
      className="graph-view"
      aria-label="Relationship graph"
      onMouseDown={handleMouseDown}
      onMouseLeave={stopDrag}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      ref={viewportRef}
    >
      <div className="graph-toolbar">
        <strong>{selectedNodeId ? "Focused relationships" : "Overview relationships"}</strong>
        <span>{selectedNodeId ? "Showing selected-node links" : "Showing only main structure lines. Drag the canvas to pan."}</span>
      </div>
      <svg
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        width={viewport.width}
        role="img"
        aria-label="ai-context relationship map"
      >
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

function getGraphViewport(positions) {
  const points = [...positions.values()];
  const maxX = Math.max(1100, ...points.map((point) => point.x + 120));
  const maxY = Math.max(720, ...points.map((point) => point.y + 120));
  return {
    width: maxX,
    height: maxY
  };
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
