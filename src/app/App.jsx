import { useEffect, useMemo, useState } from "react";
import { fetchGraph, fetchNodeDetails, runAction } from "./api.js";
import DetailsDrawer from "./components/DetailsDrawer.jsx";
import GraphView from "./components/GraphView.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TaskBoardView from "./components/TaskBoardView.jsx";
import "./styles.css";

export default function App() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], groups: [], warnings: [] });
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [activeView, setActiveView] = useState("relations");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setError("");
    setGraph(await fetchGraph());
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!selectedNodeId) {
      setSelectedNodeDetails(null);
      return;
    }
    let cancelled = false;
    fetchNodeDetails(selectedNodeId)
      .then((details) => {
        if (!cancelled) setSelectedNodeDetails(details);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedNodeId]);

  const scopedGraph = useMemo(() => {
    const scopedTypes = typesForView(activeView);
    const nodes = graph.nodes.filter((node) => {
      const matchesView = !scopedTypes || scopedTypes.has(node.type);
      return matchesView;
    });
    const visible = new Set(nodes.map((node) => node.id));
    return {
      ...graph,
      nodes,
      edges: graph.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to))
    };
  }, [activeView, graph]);

  async function handleRunAction(actionId, body = {}) {
    await runAction(actionId, body);
    await refresh();
  }

  return (
    <main className="app-shell">
      <Sidebar
        activeView={activeView}
        onViewChange={setActiveView}
      />
      <section className="workspace">
        {loading ? <p className="state-message">正在加载上下文关系...</p> : null}
        {error ? <p className="state-message error-message" role="alert">{error}</p> : null}
        {!loading && activeView === "tasks" ? (
          <TaskBoardView graph={scopedGraph} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        ) : null}
        {!loading && activeView === "relations" ? (
          <GraphView
            graph={scopedGraph}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
        ) : null}
      </section>
      <DetailsDrawer details={selectedNodeDetails} onRunAction={handleRunAction} />
    </main>
  );
}

function typesForView(view) {
  const map = {
    relations: ["project", "scene", "skill", "rule"],
    tasks: ["task", "gate", "project", "scene"]
  };
  return map[view] ? new Set(map[view]) : null;
}
