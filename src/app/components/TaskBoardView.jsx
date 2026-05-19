import { titleForNode } from "../labels.js";

export default function TaskBoardView({ graph, selectedNodeId, onSelectNode }) {
  const edges = graph.edges || [];
  const tasks = (graph.nodes || []).filter((node) => node.type === "task").sort(compareTasks);
  const selectedTaskId = resolveSelectedTaskId(tasks, edges, selectedNodeId);
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) || tasks[0];
  const gates = (graph.nodes || [])
    .filter((node) => node.type === "gate")
    .filter((gate) => edges.some((edge) => edge.relation === "has-gate" && edge.from === selectedTask?.id && edge.to === gate.id))
    .sort(compareGateNodes);
  const currentGate = gates.find((gate) => gate.raw?.id === selectedTask?.raw?.currentGate);
  const progress = summarizeProgress(gates, currentGate);

  return (
    <section className="task-board-view" aria-label="任务看板">
      <div className="task-list-panel">
        <h2>Tasks</h2>
        {!tasks.length ? <p className="empty-state">还没有 runtime/tasks/*.json 任务。</p> : null}
        {tasks.map((task) => (
          <button
            className={selectedTask?.id === task.id ? "active" : ""}
            key={task.id}
            onClick={() => onSelectNode(task.id)}
            type="button"
          >
            <span className="task-title-row">
              <strong>{titleForNode(task)}</strong>
              {task.raw?.isActive ? <em>当前</em> : null}
            </span>
            <span>{task.raw?.status || task.status} · {gateLabelForTask(task, graph.nodes, edges)}</span>
          </button>
        ))}
      </div>
      <div className="gate-panel">
        <header className="task-flow-header">
          <div>
            <h2>{selectedTask ? titleForNode(selectedTask) : "G1-G7"}</h2>
            <p>{selectedTask?.summary || "选择一个任务后查看它在 superpower 流程中的位置。"}</p>
          </div>
          <div className="task-flow-summary" aria-label="当前流程">
            <span>当前流程</span>
            <strong>{currentGate ? titleForNode(currentGate) : selectedTask?.raw?.currentGate || "未记录"}</strong>
            <small>{progress.label}</small>
            <div className="task-progress-bar" aria-hidden="true">
              <i style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
        </header>
        <div className="gate-track">
          {gates.map((gate) => {
            const connected = edges.some((edge) => edge.from === selectedTask?.id && edge.to === gate.id);
            return (
              <button
                aria-label={`${gate.raw?.id || ""} ${gate.raw?.name || titleForNode(gate)}`.trim()}
                className={`gate-card status-${gate.status} ${selectedNodeId === gate.id ? "active" : ""}`}
                disabled={!connected}
                key={gate.id}
                onClick={() => onSelectNode(gate.id)}
                type="button"
              >
                <span>{gate.raw?.id || titleForNode(gate).split(" ")[0]}</span>
                <strong>{gate.raw?.name || titleForNode(gate)}</strong>
                <small>{gate.raw?.status || gate.status}</small>
                <p className="gate-summary">{gate.summary}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function compareTasks(left, right) {
  if (left.raw?.isActive !== right.raw?.isActive) {
    return left.raw?.isActive ? -1 : 1;
  }
  return String(right.raw?.id || right.id).localeCompare(String(left.raw?.id || left.id));
}

function resolveSelectedTaskId(tasks, edges, selectedNodeId) {
  if (selectedNodeId?.startsWith("task:")) {
    return selectedNodeId;
  }
  if (selectedNodeId?.startsWith("gate:")) {
    const parentEdge = edges.find((edge) => edge.relation === "has-gate" && edge.to === selectedNodeId);
    if (parentEdge) {
      return parentEdge.from;
    }
  }
  return tasks.find((task) => task.raw?.isActive)?.id || tasks[0]?.id;
}

function gateLabelForTask(task, nodes, edges) {
  const gateId = task.raw?.currentGate;
  if (!gateId) {
    return "Gate 未记录";
  }
  const gateNodeId = edges.find((edge) => edge.relation === "has-gate" && edge.from === task.id && edge.to.endsWith(`:${gateId}`))?.to;
  const gate = nodes.find((node) => node.id === gateNodeId);
  return gate ? titleForNode(gate) : gateId;
}

function summarizeProgress(gates, currentGate) {
  if (!gates.length) {
    return { label: "0/7 未记录", percent: 0 };
  }
  const doneCount = gates.filter((gate) => gate.raw?.status === "done").length;
  const currentIndex = currentGate ? gates.findIndex((gate) => gate.id === currentGate.id) + 1 : doneCount;
  const position = Math.max(doneCount, currentIndex, 0);
  const percent = Math.min(100, Math.round((position / gates.length) * 100));
  return { label: `${doneCount}/${gates.length} 已完成 · 第 ${position || 1} 步`, percent };
}

function compareGateNodes(left, right) {
  return gateNumber(left) - gateNumber(right);
}

function gateNumber(node) {
  const id = node.raw?.id || node.title || "";
  const match = String(id).match(/G(\d+)/);
  return match ? Number(match[1]) : 99;
}
