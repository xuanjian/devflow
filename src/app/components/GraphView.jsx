import { useEffect, useRef } from "react";
import { labelForType, titleForNode } from "../labels.js";

export default function GraphView({ graph, selectedNodeId, onSelectNode }) {
  const nodes = graph.nodes || [];
  const positions = layoutNodes(nodes);
  const viewport = getGraphViewport(positions);
  const visibleEdges = selectVisibleEdges(graph.edges || [], selectedNodeId);
  const highlightedNodeIds = getHighlightedNodeIds(visibleEdges, selectedNodeId);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (hasCenteredRef.current) {
      return;
    }
    const element = viewportRef.current;
    if (!element) {
      return;
    }
    hasCenteredRef.current = true;
    requestAnimationFrame(() => {
      element.scrollLeft = element.clientWidth < 500 ? 250 : 40;
    });
  }, [viewport.width]);

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
      aria-label="上下文关系图"
      onMouseDown={handleMouseDown}
      onMouseLeave={stopDrag}
      onMouseMove={handleMouseMove}
      onMouseUp={stopDrag}
      ref={viewportRef}
    >
      <div className="graph-toolbar">
        <strong>{selectedNodeId ? "聚焦关系" : "全局关系"}</strong>
        <span>{selectedNodeId ? "正在显示当前节点的直接业务关联" : "选择一个节点后显示业务关联线；分组归属线已隐藏"}</span>
      </div>
      <svg
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        width={viewport.width}
        role="img"
        aria-label="ai-context 上下文关系图"
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
            <foreignObject height="76" key={node.id} width="190" x={point.x - 95} y={point.y - 38}>
              <button
                className={`graph-node node-${node.type} status-${node.status} ${selectedNodeId === node.id ? "selected" : ""} ${highlightedNodeIds.has(node.id) ? "highlighted" : ""}`}
                onClick={() => onSelectNode(node.id)}
                type="button"
              >
                <span className="node-type-mark" aria-hidden="true">{shortTypeLabel(node.type)}</span>
                <span className="node-copy">
                  <strong>{titleForNode(node)}</strong>
                  <span>{labelForType(node.type)}</span>
                </span>
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
      return false;
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
  const maxX = Math.max(1280, ...points.map((point) => point.x + 160));
  const maxY = Math.max(760, ...points.map((point) => point.y + 140));
  return {
    width: maxX,
    height: maxY
  };
}

function layoutNodes(nodes) {
  const positions = new Map();
  const groups = nodes.filter((node) => node.type === "group");
  const root = nodes.find((node) => node.type === "root");
  if (root) positions.set(root.id, { x: 620, y: 110 });

  const groupY = root ? 250 : 120;
  const itemY = root ? 380 : 245;
  groups.forEach((node, index) => {
    positions.set(node.id, { x: 170 + index * 215, y: groupY });
  });

  const byType = new Map();
  nodes.filter((node) => node.type !== "root" && node.type !== "group").forEach((node) => {
    const list = byType.get(node.type) || [];
    list.push(node);
    byType.set(node.type, list);
  });
  const typeOrder = ["project", "scene", "skill", "rule", "profile", "task", "gate"];
  typeOrder.forEach((type, typeIndex) => {
    const list = byType.get(type) || [];
    list.forEach((node, index) => {
      positions.set(node.id, { x: 160 + typeIndex * 220, y: itemY + index * 104 });
    });
  });
  return positions;
}

function shortTypeLabel(type) {
  const labels = {
    root: "根",
    group: "组",
    project: "项",
    scene: "景",
    skill: "技",
    rule: "规",
    profile: "像",
    task: "任",
    gate: "步"
  };
  return labels[type] || "点";
}
