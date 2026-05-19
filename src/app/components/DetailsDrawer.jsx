import { useEffect, useState } from "react";
import { labelForType, titleForNode } from "../labels.js";

const EDITOR_STORAGE_KEY = "devflow-document-editor";
const EDITORS = [
  { value: "default", label: "系统默认" },
  { value: "zed", label: "Zed" },
  { value: "code", label: "VS Code" },
  { value: "cursor", label: "Cursor" }
];

export default function DetailsDrawer({ details, onRunAction }) {
  const [editor, setEditor] = useState(() => readStoredEditor());

  useEffect(() => {
    try {
      window.localStorage?.setItem(EDITOR_STORAGE_KEY, editor);
    } catch {
      // Ignore storage failures; opening still works for the current click.
    }
  }, [editor]);

  if (!details?.node) {
    return (
      <aside className="drawer" aria-label="详情">
        <h2>节点详情</h2>
        <p className="muted">请选择一个节点查看来源、关联和预警。</p>
      </aside>
    );
  }

  const { node, related, warnings, actions } = details;
  const artifactSections = getArtifactSections(node);

  return (
    <aside className="drawer" aria-label="详情">
      <div className="drawer-heading">
        <h2>{titleForNode(node)}</h2>
        <span className={`badge status-${node.status}`}>{labelForType(node.type)}</span>
      </div>
      <p>{node.summary}</p>
      {details.documentationSummary ? <p className="doc-summary">{details.documentationSummary}</p> : null}
      <dl className="meta-list">
        <dt>来源</dt>
        <dd>{node.sourcePath || "无"}</dd>
        <dt>文档</dt>
        <dd>{node.docPath || "无"}</dd>
      </dl>
      <DocumentPreview
        documentPreview={details.documentPreview}
        editor={editor}
        onEditorChange={setEditor}
        onOpen={(sourcePath) => onRunAction("open_document", { sourcePath, editor })}
      />
      <RelationshipList title="关联场景" items={related?.scenes} />
      <RelationshipList title="关联技能" items={related?.skills} />
      <RelationshipList title="关联规则" items={related?.rules} />
      <RelationshipList title="关联步骤" items={related?.gates} />
      <RelationshipList title="关联项目" items={related?.projects} />
      <RelationshipList title="关联任务" items={related?.tasks} />
      {artifactSections.map((section) => (
        <ArtifactList
          editor={editor}
          key={section.title}
          title={section.title}
          items={section.items}
          onOpen={(sourcePath) => onRunAction("open_document", { sourcePath, editor })}
        />
      ))}
      {warnings?.length ? (
        <section>
          <h3>预警</h3>
          {warnings.map((warning) => <p className="warning" key={`${warning.code}-${warning.message}`}>{warning.message}</p>)}
        </section>
      ) : null}
      {actions?.length ? (
        <section>
          <h3>可执行操作</h3>
          {actions.map((action) => (
            <button key={action.actionId} onClick={() => onRunAction(action.actionId, action.body || {})} type="button">
              {action.label}
            </button>
          ))}
        </section>
      ) : null}
      <details>
        <summary>原始 JSON</summary>
        <pre>{JSON.stringify(node.raw || {}, null, 2)}</pre>
      </details>
    </aside>
  );
}

function readStoredEditor() {
  try {
    const value = window.localStorage?.getItem(EDITOR_STORAGE_KEY);
    return EDITORS.some((editor) => editor.value === value) ? value : "default";
  } catch {
    return "default";
  }
}

function DocumentPreview({ documentPreview, editor, onEditorChange, onOpen }) {
  if (!documentPreview?.sourcePath) return null;
  return (
    <section className="document-preview">
      <div className="document-preview-header">
        <div>
          <h3>{documentPreview.title || "文档"}</h3>
          <code>{documentPreview.sourcePath}</code>
        </div>
        <label>
          编辑器
          <select value={editor} onChange={(event) => onEditorChange(event.target.value)}>
            {EDITORS.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
      </div>
      {documentPreview.error ? (
        <p className="warning">{documentPreview.error.message}</p>
      ) : (
        <pre className="document-preview-body">{documentPreview.markdown || "文档为空。"}</pre>
      )}
      {documentPreview.truncated ? <p className="muted">这里只显示前半部分，完整内容请打开文档查看。</p> : null}
      <button onClick={() => onOpen(documentPreview.sourcePath)} type="button">打开文档</button>
    </section>
  );
}

function getArtifactSections(node) {
  if (node.type === "task") {
    const taskArtifacts = normalizeArtifacts(node.raw?.artifacts);
    return taskArtifacts.length ? [{ title: "任务级产物", items: taskArtifacts }] : [];
  }

  const artifacts = normalizeArtifacts(node.raw?.artifacts);
  return artifacts.length ? [{ title: "产物", items: artifacts }] : [];
}

function normalizeArtifacts(artifacts) {
  return (artifacts || [])
    .map((artifact) => {
      if (typeof artifact === "string") {
        return { label: artifact };
      }
      const label = artifact.value || artifact.path || artifact.title || artifact.url || artifact.id || "";
      if (!label) {
        return null;
      }
      return {
        label,
        sourcePath: artifact.sourcePath || artifact.file || artifact.path || artifact.value || "",
        at: artifact.at,
        note: artifact.note || artifact.summary || artifact.description || ""
      };
    })
    .filter(Boolean);
}

function ArtifactList({ title, items = [], editor, onOpen }) {
  if (!items.length) return null;
  return (
    <section>
      <h3>{title}</h3>
      <ul className="artifact-list">
        {items.map((item, index) => {
          const sourcePath = openableArtifactPath(item);
          return (
            <li key={`${item.label}-${item.at || index}`}>
              {sourcePath ? (
                <button
                  aria-label={`用 ${editorLabel(editor)} 打开 ${item.label}`}
                  className="artifact-open-button"
                  onClick={() => onOpen(sourcePath)}
                  type="button"
                >
                  <code>{item.label}</code>
                </button>
              ) : (
                <code>{item.label}</code>
              )}
              {item.note ? <span>{item.note}</span> : null}
              {item.at ? <small>{item.at}</small> : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function openableArtifactPath(item) {
  const sourcePath = String(item.sourcePath || "").trim();
  if (sourcePath && looksLikeFilePath(sourcePath)) {
    return sourcePath;
  }
  const label = String(item.label || "").trim();
  return looksLikeFilePath(label) ? label : "";
}

function looksLikeFilePath(value) {
  if (value.startsWith("/")) return true;
  if (/\s/.test(value)) return false;
  return Boolean(
    value
    && !value.includes("\n")
    && !value.includes(": ")
    && (
      value.startsWith("./")
      || value.startsWith("../")
      || value.includes("/")
      || /\.[a-z0-9]{1,12}$/i.test(value)
    )
  );
}

function editorLabel(value) {
  return EDITORS.find((editor) => editor.value === value)?.label || "编辑器";
}

function RelationshipList({ title, items = [] }) {
  if (!items.length) return null;
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => <li key={item.id}>{item.title}</li>)}
      </ul>
    </section>
  );
}
