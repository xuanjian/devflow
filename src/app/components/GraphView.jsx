import { useEffect, useRef, useState } from "react";
import { labelForType, titleForNode } from "../labels.js";

export default function GraphView({ graph, selectedNodeId, onSelectNode, onRunAction }) {
  const nodes = graph.nodes || [];
  const positions = layoutNodes(nodes);
  const viewport = getGraphViewport(positions);
  const visibleEdges = selectVisibleEdges(graph.edges || [], selectedNodeId);
  const highlightedNodeIds = getHighlightedNodeIds(visibleEdges, selectedNodeId);
  const actionBar = getActionBarPlacement(nodes);
  const viewportRef = useRef(null);
  const dragRef = useRef(null);
  const hasCenteredRef = useRef(false);
  const [modalType, setModalType] = useState("");
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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
    if (event.button !== 0 || event.target.closest(".graph-node, .graph-add-actions, .graph-config-modal")) {
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

  function openModal(type) {
    setModalType(type);
    setForm(defaultForm(type));
    setSubmitError("");
  }

  function closeModal() {
    if (submitting) return;
    setModalType("");
    setSubmitError("");
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitConfig(event) {
    event.preventDefault();
    if (!onRunAction || !modalType) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await onRunAction(actionIdForModal(modalType), payloadForModal(modalType, form));
      setModalType("");
    } catch (error) {
      setSubmitError(error?.message || String(error));
    } finally {
      setSubmitting(false);
    }
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
        aria-label="DevFlow 上下文关系图"
      >
        {onRunAction ? (
          <foreignObject height="54" width="830" x={actionBar.x} y={actionBar.y}>
            <div className="graph-add-actions" xmlns="http://www.w3.org/1999/xhtml">
              {GRAPH_ACTIONS.map((action) => (
                <button key={action.type} onClick={() => openModal(action.type)} type="button">
                  <span aria-hidden="true">+</span>
                  {action.label}
                </button>
              ))}
            </div>
          </foreignObject>
        ) : null}
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
      {modalType ? (
        <div className="graph-modal-backdrop" onMouseDown={(event) => event.stopPropagation()} role="presentation">
          <form className="graph-config-modal" onSubmit={submitConfig}>
            <header>
              <div>
                <strong>{modalTitle(modalType)}</strong>
                <span>{modalHelp(modalType)}</span>
              </div>
              <button aria-label="关闭" onClick={closeModal} type="button">×</button>
            </header>
            <div className="graph-config-fields">
              {fieldsForModal(modalType).map((field) => (
                <label key={field.name}>
                  <span>{field.label}{field.required ? " *" : ""}</span>
                  {field.type === "select" ? (
                    <select
                      onChange={(event) => updateField(field.name, event.target.value)}
                      required={field.required}
                      value={form[field.name] || field.defaultValue || ""}
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  ) : field.type === "textarea" ? (
                    <textarea
                      onChange={(event) => updateField(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      rows={3}
                      value={form[field.name] || ""}
                    />
                  ) : (
                    <input
                      onChange={(event) => updateField(field.name, event.target.value)}
                      placeholder={field.placeholder}
                      required={field.required}
                      type="text"
                      value={form[field.name] || ""}
                    />
                  )}
                </label>
              ))}
            </div>
            {submitError ? <p className="graph-submit-error" role="alert">{submitError}</p> : null}
            <footer>
              <button className="secondary-button" onClick={closeModal} type="button">取消</button>
              <button className="primary-button" disabled={submitting} type="submit">
                {submitting ? "写入中..." : "生成并关联"}
              </button>
            </footer>
          </form>
        </div>
      ) : null}
    </section>
  );
}

const GRAPH_ACTIONS = [
  { type: "project", label: "新增项目" },
  { type: "scene", label: "新增场景" },
  { type: "skill", label: "新增技能" },
  { type: "rule", label: "新增规则" }
];

function fieldsForModal(type) {
  const commonProjectMount = {
    name: "projectIds",
    label: "挂载项目 ID",
    placeholder: "多个用逗号分隔，例如 api-service,demo-project"
  };
  if (type === "project") {
    return [
      { name: "projectPath", label: "项目路径", required: true, placeholder: "/path/to/project" },
      { name: "projectId", label: "项目 ID", placeholder: "不填则用目录名生成" },
      { name: "name", label: "项目名称", placeholder: "不填则用 package/name 或目录名" },
      { name: "technologyFamilyId", label: "技术族", placeholder: "frontend / bff / ios / workflow / unknown" }
    ];
  }
  if (type === "scene") {
    return [
      { name: "sceneId", label: "场景 ID", placeholder: "不填则由名称生成" },
      { name: "name", label: "场景名称", required: true, placeholder: "例如 支付排障" },
      { name: "summary", label: "场景说明", type: "textarea", placeholder: "这个场景解决什么任务" },
      commonProjectMount
    ];
  }
  if (type === "skill") {
    return [
      { name: "skillPath", label: "Skill 路径", required: true, placeholder: "/path/to/skill 或 /path/to/SKILL.md" },
      { name: "skillId", label: "Skill ID", placeholder: "不填则用目录名生成" },
      { name: "name", label: "Skill 名称", placeholder: "不填则读取 SKILL.md frontmatter" },
      commonProjectMount
    ];
  }
  return [
    { name: "ruleId", label: "Rule ID", required: true, placeholder: "例如 payment/safe-callback" },
    { name: "name", label: "Rule 名称", placeholder: "例如 支付回调规则" },
    { name: "purpose", label: "规则用途", type: "textarea", placeholder: "没有现成规则文件时，这里用于生成配套 rule 文件" },
    { name: "sourcePath", label: "现有规则文件路径", placeholder: "可选，支持 .md / .mdc" },
    commonProjectMount,
    { name: "sceneIds", label: "挂载场景 ID", placeholder: "多个用逗号分隔，例如 devflow-config,payment-debug" },
    {
      name: "applyMode",
      label: "触发方式",
      type: "select",
      defaultValue: "project-on-demand",
      options: [
        { value: "project-on-demand", label: "项目按需" },
        { value: "scene-on-demand", label: "场景按需" }
      ]
    }
  ];
}

function defaultForm(type) {
  if (type === "rule") return { applyMode: "project-on-demand" };
  return {};
}

function modalTitle(type) {
  const titles = {
    project: "新增项目",
    scene: "新增场景",
    skill: "新增技能",
    rule: "新增规则"
  };
  return titles[type] || "新增";
}

function modalHelp(type) {
  const help = {
    project: "只需要项目路径；系统会扫描 .ai-configs、入口文档、skills、rules，并写入关系 JSON。",
    scene: "场景名称必填；挂载项目后会同时写 scene JSON 和项目 scenes 关系。",
    skill: "Skill 路径必填；系统会登记来源路径并挂到指定项目。",
    rule: "Rule ID 必填；有文件就登记来源路径，没有文件则用规则用途生成模板。"
  };
  return help[type] || "";
}

function actionIdForModal(type) {
  return {
    project: "add_project_from_path",
    scene: "add_scene",
    skill: "add_skill_from_path",
    rule: "add_rule"
  }[type];
}

function payloadForModal(type, form) {
  const payload = { ...form };
  if (payload.projectIds) payload.projectIds = splitList(payload.projectIds);
  if (payload.sceneIds) payload.sceneIds = splitList(payload.sceneIds);
  if (type === "scene" && payload.summary && !payload.purpose) payload.purpose = payload.summary;
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => {
    if (Array.isArray(value)) return value.length > 0;
    return String(value || "").trim();
  }));
}

function splitList(value) {
  return String(value || "")
    .split(/[,，\s]+/)
    .map((item) => item.trim())
    .filter(Boolean);
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

function getActionBarPlacement(nodes) {
  const hasRoot = nodes.some((node) => node.type === "root");
  return { x: 70, y: hasRoot ? 288 : 158 };
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
