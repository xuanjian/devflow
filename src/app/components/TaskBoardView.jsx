import { titleForNode } from "../labels.js";

export default function TaskBoardView({ graph, selectedNodeId, onSelectNode }) {
  const tasks = (graph.nodes || []).filter((node) => node.type === "task");
  const gates = (graph.nodes || []).filter((node) => node.type === "gate").sort(compareGateNodes);
  const edges = graph.edges || [];

  return (
    <section className="task-board-view" aria-label="任务看板">
      <div className="task-list-panel">
        <h2>Tasks</h2>
        {tasks.map((task) => (
          <button
            className={selectedNodeId === task.id ? "active" : ""}
            key={task.id}
            onClick={() => onSelectNode(task.id)}
            type="button"
          >
            <strong>{titleForNode(task)}</strong>
            <span>{task.raw?.status || task.status} · {task.raw?.currentGate || "Gate 未记录"}</span>
          </button>
        ))}
      </div>
      <div className="gate-panel">
        <h2>G1-G7</h2>
        <div className="gate-track">
          {gates.map((gate) => {
            const connected = edges.some((edge) => edge.from === tasks[0]?.id && edge.to === gate.id);
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
                <p>{gate.summary}</p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function compareGateNodes(left, right) {
  return gateNumber(left) - gateNumber(right);
}

function gateNumber(node) {
  const id = node.raw?.id || node.title || "";
  const match = String(id).match(/G(\d+)/);
  return match ? Number(match[1]) : 99;
}
