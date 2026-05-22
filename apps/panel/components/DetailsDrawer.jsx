import { labelForType, titleForNode } from "../labels.js";

export default function DetailsDrawer({ details, onRunAction }) {
  if (!details?.node) {
    return (
      <aside className="drawer" aria-label="详情">
        <h2>节点详情</h2>
        <p className="muted">请选择一个节点查看来源、关联和预警。</p>
      </aside>
    );
  }

  const { node, related, warnings, actions } = details;

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
      <RelationshipList title="关联场景" items={related?.scenes} />
      <RelationshipList title="关联技能" items={related?.skills} />
      <RelationshipList title="关联规则" items={related?.rules} />
      <RelationshipList title="关联步骤" items={related?.gates} />
      <RelationshipList title="关联项目" items={related?.projects} />
      <RelationshipList title="关联任务" items={related?.tasks} />
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
