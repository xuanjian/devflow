import { useEffect, useMemo, useState } from "react";
import { fetchChecks, fetchGraph, fetchNodeDetails, fetchProfileDocument, runAction } from "./api.js";
import ChecksView from "./components/ChecksView.jsx";
import DetailsDrawer from "./components/DetailsDrawer.jsx";
import GraphView from "./components/GraphView.jsx";
import OverviewView from "./components/OverviewView.jsx";
import PersonaView from "./components/PersonaView.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TaskBoardView from "./components/TaskBoardView.jsx";
import "./styles.css";

export default function App() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], groups: [], warnings: [] });
  const [checks, setChecks] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState("");
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showWarningsOnly, setShowWarningsOnly] = useState(false);
  const [activeView, setActiveView] = useState("overview");
  const [profileDocument, setProfileDocument] = useState(null);
  const [profileDocumentLoading, setProfileDocumentLoading] = useState(false);
  const [profileDocumentError, setProfileDocumentError] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setError("");
    const [graphPayload, checksPayload] = await Promise.all([fetchGraph(), fetchChecks()]);
    setGraph(graphPayload);
    setChecks(checksPayload.checks || []);
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

  useEffect(() => {
    if (activeView !== "persona" || profileDocument) return;
    let cancelled = false;
    setProfileDocumentLoading(true);
    setProfileDocumentError("");
    fetchProfileDocument()
      .then((document) => {
        if (cancelled) return;
        setProfileDocument(document);
        if (document.error) setProfileDocumentError(document.error.message);
      })
      .catch((err) => {
        if (!cancelled) setProfileDocumentError(err.message);
      })
      .finally(() => {
        if (!cancelled) setProfileDocumentLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeView, profileDocument]);

  const scopedGraph = useMemo(() => {
    const loweredQuery = query.trim().toLowerCase();
    const scopedTypes = typesForView(activeView);
    const nodes = graph.nodes.filter((node) => {
      const matchesQuery = !loweredQuery || [node.id, node.title, node.summary, node.sourcePath]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(loweredQuery));
      const matchesView = !scopedTypes || scopedTypes.has(node.type) || isStructureNodeForView(node, activeView);
      const matchesType = typeFilter === "all" || node.type === typeFilter;
      const matchesStatus = statusFilter === "all" || node.status === statusFilter;
      const matchesWarning = !showWarningsOnly || node.status === "warning" || node.status === "missing";
      return matchesView && matchesQuery && matchesType && matchesStatus && matchesWarning;
    });
    const visible = new Set(nodes.map((node) => node.id));
    return {
      ...graph,
      nodes,
      edges: graph.edges.filter((edge) => visible.has(edge.from) && visible.has(edge.to))
    };
  }, [activeView, graph, query, showWarningsOnly, statusFilter, typeFilter]);

  async function handleRunAction(actionId, body = {}) {
    await runAction(actionId, body);
    await refresh();
  }

  function handleFiltersChange(nextFilters) {
    if (Object.hasOwn(nextFilters, "query")) setQuery(nextFilters.query);
    if (Object.hasOwn(nextFilters, "typeFilter")) setTypeFilter(nextFilters.typeFilter);
    if (Object.hasOwn(nextFilters, "statusFilter")) setStatusFilter(nextFilters.statusFilter);
    if (Object.hasOwn(nextFilters, "showWarningsOnly")) setShowWarningsOnly(nextFilters.showWarningsOnly);
  }

  return (
    <main className="app-shell">
      <Sidebar
        activeView={activeView}
        filters={{ query, typeFilter, statusFilter, showWarningsOnly }}
        onFiltersChange={handleFiltersChange}
        onViewChange={setActiveView}
      />
      <section className="workspace">
        {loading ? <p className="state-message">正在加载上下文关系...</p> : null}
        {error ? <p className="state-message error-message" role="alert">{error}</p> : null}
        {!loading && activeView === "overview" ? (
          <OverviewView graph={graph} checks={checks} onSelectNode={setSelectedNodeId} onViewChange={setActiveView} />
        ) : null}
        {!loading && activeView === "tasks" ? (
          <TaskBoardView graph={scopedGraph} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
        ) : null}
        {!loading && activeView === "persona" ? (
          <PersonaView
            document={profileDocument}
            error={profileDocumentError}
            loading={profileDocumentLoading}
          />
        ) : null}
        {!loading && activeView === "checks" ? (
          <ChecksView checks={checks} onRunAction={handleRunAction} />
        ) : null}
        {!loading && !["overview", "tasks", "persona", "checks"].includes(activeView) ? (
          <GraphView graph={scopedGraph} selectedNodeId={selectedNodeId} onSelectNode={setSelectedNodeId} />
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

function isStructureNodeForView(node, view) {
  if (view !== "relations") return false;
  return ["group:projects", "group:scenes", "group:skills", "group:rules"].includes(node.id);
}
