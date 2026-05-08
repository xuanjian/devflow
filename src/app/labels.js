export const VIEW_LABELS = [
  { key: "overview", label: "总览" },
  { key: "projects", label: "项目" },
  { key: "scenes", label: "场景" },
  { key: "skills", label: "技能" },
  { key: "rules", label: "规则" },
  { key: "persona", label: "画像" },
  { key: "checks", label: "检查" }
];

export const TYPE_LABELS = {
  all: "全部类型",
  root: "根节点",
  group: "分组",
  project: "项目",
  scene: "场景",
  skill: "技能",
  rule: "规则",
  profile: "画像",
  task: "任务"
};

export const STATUS_LABELS = {
  all: "全部状态",
  ok: "正常",
  pass: "通过",
  warning: "预警",
  fail: "失败",
  missing: "缺失",
  unknown: "未知"
};

export const AREA_LABELS = {
  profile: "画像",
  config: "配置",
  projects: "项目",
  scenes: "场景",
  skills: "技能",
  rules: "规则",
  task: "任务",
  runtime: "运行时",
  scripts: "脚本",
  entries: "入口"
};

export const GROUP_TITLE_LABELS = {
  "group:projects": "项目",
  "group:scenes": "场景",
  "group:skills": "技能",
  "group:rules": "规则",
  "group:persona": "协作画像",
  "group:current-work": "当前工作"
};

export function labelForType(type) {
  return TYPE_LABELS[type] || type || "未知";
}

export function labelForStatus(status) {
  return STATUS_LABELS[status] || status || "未知";
}

export function labelForArea(area) {
  return AREA_LABELS[area] || area || "其他";
}

export function titleForNode(node) {
  return GROUP_TITLE_LABELS[node?.id] || node?.title || node?.id || "未命名";
}
