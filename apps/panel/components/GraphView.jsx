import { useEffect, useMemo, useRef, useState } from "react";
import { labelForType, titleForNode } from "../labels.js";

const GRAPH_TOP_SAFE_SPACE = 86;
const NODE_BOX_HALF_HEIGHT = 42;

export default function GraphView({ graph, selectedNodeId, onSelectNode }) {
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [pinnedPositions, setPinnedPositions] = useState({});
  const allNodes = graph.nodes || [];
  const projectNodes = useMemo(() => allNodes.filter((node) => node.type === "project").sort(compareNodesByTitle), [allNodes]);
  const projectGraph = useMemo(() => buildProjectGraph(graph, selectedProjectId), [graph, selectedProjectId]);
  const nodes = projectGraph.nodes;
  const positions = useMemo(() => mergePinnedPositions(layoutNodes(nodes), pinnedPositions), [nodes, pinnedPositions]);
  const viewport = getGraphViewport(positions);
  const visibleEdges = projectGraph.edges;
  const activeFocusId = selectedProjectId || selectedNodeId;
  const highlightedNodeIds = getHighlightedNodeIds(visibleEdges, activeFocusId);
  const viewportRef = useRef(null);
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const nodeDragRef = useRef(null);
  const suppressClickRef = useRef("");
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (selectedProjectId && !projectNodes.some((node) => node.id === selectedProjectId)) {
      setSelectedProjectId("");
    }
  }, [projectNodes, selectedProjectId]);

  useEffect(() => {
    hasCenteredRef.current = false;
  }, [selectedProjectId]);

  useEffect(() => {
    const visibleIds = new Set(nodes.map((node) => node.id));
    setPinnedPositions((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([id]) => visibleIds.has(id)));
      return Object.keys(next).length === Object.keys(current).length ? current : next;
    });
  }, [nodes]);

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
      element.scrollLeft = Math.max(0, viewport.width / 2 - element.clientWidth / 2 - 80);
      element.scrollTop = 0;
    });
  }, [selectedProjectId, viewport.height, viewport.width]);

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
    const nodeDrag = nodeDragRef.current;
    if (nodeDrag) {
      const point = eventPointInSvg(event, svgRef.current, viewport);
      if (!point) {
        return;
      }
      const x = clamp(point.x - nodeDrag.offsetX, 80, viewport.width - 80);
      const y = clamp(point.y - nodeDrag.offsetY, GRAPH_TOP_SAFE_SPACE + NODE_BOX_HALF_HEIGHT, viewport.height - 80);
      nodeDrag.moved = nodeDrag.moved || Math.hypot(x - nodeDrag.startX, y - nodeDrag.startY) > 3;
      setPinnedPositions((current) => ({
        ...current,
        [nodeDrag.nodeId]: { x: Math.round(x), y: Math.round(y) }
      }));
      return;
    }

    const drag = dragRef.current;
    const element = viewportRef.current;
    if (!drag || !element) {
      return;
    }
    element.scrollLeft = drag.scrollLeft - (event.clientX - drag.x);
    element.scrollTop = drag.scrollTop - (event.clientY - drag.y);
  }

  function stopDrag() {
    if (nodeDragRef.current?.moved) {
      suppressClickRef.current = nodeDragRef.current.nodeId;
      setTimeout(() => {
        suppressClickRef.current = "";
      }, 0);
    }
    nodeDragRef.current = null;
    dragRef.current = null;
    viewportRef.current?.classList.remove("is-dragging");
  }

  function startNodeDrag(event, nodeId) {
    if (event.button !== 0) {
      return;
    }
    const point = positions.get(nodeId);
    const eventPoint = eventPointInSvg(event, svgRef.current, viewport);
    if (!point || !eventPoint) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    nodeDragRef.current = {
      nodeId,
      offsetX: eventPoint.x - point.x,
      offsetY: eventPoint.y - point.y,
      startX: point.x,
      startY: point.y,
      moved: false
    };
  }

  function selectNode(nodeId) {
    if (suppressClickRef.current === nodeId) {
      return;
    }
    onSelectNode(nodeId);
  }

  function selectProject(projectId) {
    setSelectedProjectId(projectId);
    onSelectNode(projectId);
  }

  return (
    <section className="graph-view" aria-label="上下文关系图">
      <aside className="graph-project-rail" aria-label="项目列表">
        <div className="project-rail-header">
          <strong>项目列表</strong>
          <span>{projectNodes.length} 个</span>
        </div>
        <button
          className={!selectedProjectId ? "active" : ""}
          onClick={() => selectProject("")}
          type="button"
        >
          全部项目
        </button>
        <div className="project-rail-list">
          {projectNodes.map((project) => (
            <button
              aria-label={`筛选项目 ${titleForNode(project)}`}
              className={selectedProjectId === project.id ? "active" : ""}
              key={project.id}
              onClick={() => selectProject(project.id)}
              type="button"
            >
              <span className="project-rail-dot" aria-hidden="true" />
              <span>{titleForNode(project)}</span>
            </button>
          ))}
        </div>
      </aside>
      <div
        className="graph-canvas"
        onMouseDown={handleMouseDown}
        onMouseLeave={stopDrag}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDrag}
        ref={viewportRef}
      >
        <div className="graph-toolbar">
          <strong>{selectedProjectId ? "项目关系" : selectedNodeId ? "聚焦关系" : "全局关系"}</strong>
          <span>{selectedProjectId ? "只显示当前项目的直接业务关联" : selectedNodeId ? "已突出当前节点的直接业务关联" : "拖拽画布查看全局关系；选择节点后聚焦相邻关系"}</span>
        </div>
        <svg
          height={viewport.height}
          viewBox={`0 0 ${viewport.width} ${viewport.height}`}
          width={viewport.width}
          role="img"
          aria-label="DevFlow 上下文关系图"
          ref={svgRef}
        >
          {visibleEdges.map((edge) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;
            const fromAnchor = edgeAnchorPoint(from);
            const toAnchor = edgeAnchorPoint(to);
            return (
              <line
                className={`graph-edge ${edgeClassName(edge, selectedProjectId || selectedNodeId)}`}
                data-testid={`edge-${edge.from}-${edge.to}-${edge.relation}`}
                key={`${edge.from}-${edge.to}-${edge.relation}`}
                x1={fromAnchor.x}
                y1={fromAnchor.y}
                x2={toAnchor.x}
                y2={toAnchor.y}
              />
            );
          })}
          {nodes.map((node) => {
            const point = positions.get(node.id);
            return (
              <foreignObject className="graph-node-shell" height="82" key={node.id} width="190" x={point.x - 95} y={point.y - 42}>
                <button
                  aria-label={`${titleForNode(node)} ${labelForType(node.type)}`}
                  className={`graph-node node-${node.type} status-${node.status} ${activeFocusId === node.id ? "selected" : ""} ${highlightedNodeIds.has(node.id) ? "highlighted" : ""} ${activeFocusId && !highlightedNodeIds.has(node.id) ? "dimmed" : ""}`}
                  data-testid={`graph-node-${node.id}`}
                  onClick={() => selectNode(node.id)}
                  onMouseDown={(event) => startNodeDrag(event, node.id)}
                  type="button"
                >
                  <span className="node-dot" aria-hidden="true" />
                  <span className="node-copy">{titleForNode(node)}</span>
                </button>
              </foreignObject>
            );
          })}
        </svg>
      </div>
    </section>
  );
}

function buildProjectGraph(graph, selectedProjectId) {
  const nodes = graph.nodes || [];
  const edges = (graph.edges || []).filter((edge) => edge.relation !== "contains");
  if (!selectedProjectId) {
    return { nodes, edges };
  }

  const visibleIds = new Set([selectedProjectId]);
  const projectEdges = edges.filter((edge) => {
    const connected = edge.from === selectedProjectId || edge.to === selectedProjectId;
    if (connected) {
      visibleIds.add(edge.from);
      visibleIds.add(edge.to);
    }
    return connected;
  });

  return {
    nodes: nodes.filter((node) => visibleIds.has(node.id)),
    edges: projectEdges
  };
}

function edgeClassName(edge, selectedNodeId) {
  if (!selectedNodeId) return "ambient-edge";
  return edge.from === selectedNodeId || edge.to === selectedNodeId ? "focused-edge" : "muted-edge";
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

function compareNodesByTitle(left, right) {
  return titleForNode(left).localeCompare(titleForNode(right));
}

function mergePinnedPositions(basePositions, pinnedPositions) {
  const positions = new Map(basePositions);
  for (const [nodeId, point] of Object.entries(pinnedPositions)) {
    if (positions.has(nodeId)) {
      positions.set(nodeId, point);
    }
  }
  return positions;
}

function eventPointInSvg(event, svgElement, viewport) {
  if (!svgElement) {
    return null;
  }
  const rect = svgElement.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return null;
  }
  return {
    x: ((event.clientX - rect.left) / rect.width) * viewport.width,
    y: ((event.clientY - rect.top) / rect.height) * viewport.height
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function edgeAnchorPoint(point) {
  return {
    x: point.x,
    y: point.y - 27
  };
}

function getGraphViewport(positions) {
  const points = [...positions.values()];
  const maxX = Math.max(1280, ...points.map((point) => point.x + 160));
  const maxY = Math.max(980 + GRAPH_TOP_SAFE_SPACE, ...points.map((point) => point.y + 180));
  return {
    width: maxX,
    height: maxY
  };
}

function layoutNodes(nodes) {
  const positions = new Map();
  const groups = nodes.filter((node) => node.type === "group");
  const root = nodes.find((node) => node.type === "root");
  const center = { x: 640, y: 360 + GRAPH_TOP_SAFE_SPACE };
  if (root) positions.set(root.id, center);

  groups.forEach((node, index) => {
    positions.set(node.id, { x: 310, y: 170 + GRAPH_TOP_SAFE_SPACE + index * 112 });
  });

  const graphNodes = nodes.filter((node) => node.type !== "root" && node.type !== "group");
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  graphNodes.forEach((node, index) => {
    const radius = 115 + (index % 4) * 48 + Math.floor(index / 8) * 54;
    const angle = index * goldenAngle - Math.PI / 2;
    const typeOffset = typeOffsetForNode(node.type);
    positions.set(node.id, {
      x: Math.round(center.x + Math.cos(angle) * radius + typeOffset.x),
      y: Math.round(center.y + Math.sin(angle) * radius + typeOffset.y)
    });
  });
  return normalizeTopSafeSpace(positions);
}

function normalizeTopSafeSpace(positions) {
  const minY = Math.min(...[...positions.values()].map((point) => point.y - NODE_BOX_HALF_HEIGHT));
  const topLimit = GRAPH_TOP_SAFE_SPACE;
  if (!Number.isFinite(minY) || minY >= topLimit) {
    return positions;
  }
  const offsetY = topLimit - minY;
  const normalized = new Map();
  for (const [id, point] of positions) {
    normalized.set(id, { x: point.x, y: point.y + offsetY });
  }
  return normalized;
}

function typeOffsetForNode(type) {
  const offsets = {
    project: { x: -80, y: -10 },
    sceneTemplate: { x: 54, y: -26 },
    skill: { x: -36, y: 62 },
    rule: { x: 74, y: 58 },
    workset: { x: 124, y: -28 },
    profile: { x: -110, y: -76 },
    task: { x: 116, y: -70 },
    gate: { x: 138, y: 88 }
  };
  return offsets[type] || { x: 0, y: 0 };
}
