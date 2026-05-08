export default function DetailsDrawer({ details, onRunAction }) {
  if (!details?.node) {
    return (
      <aside className="drawer" aria-label="Details">
        <h2>Details</h2>
        <p>Select a node</p>
      </aside>
    );
  }

  const { node, related, warnings, actions } = details;

  return (
    <aside className="drawer" aria-label="Details">
      <div className="drawer-heading">
        <h2>{node.title}</h2>
        <span className={`badge status-${node.status}`}>{node.type}</span>
      </div>
      <p>{node.summary}</p>
      {details.documentationSummary ? <p className="doc-summary">{details.documentationSummary}</p> : null}
      <dl className="meta-list">
        <dt>Source</dt>
        <dd>{node.sourcePath || "None"}</dd>
        <dt>Document</dt>
        <dd>{node.docPath || "None"}</dd>
      </dl>
      <RelationshipList title="Scenes" items={related?.scenes} />
      <RelationshipList title="Skills" items={related?.skills} />
      <RelationshipList title="Rules" items={related?.rules} />
      {warnings?.length ? (
        <section>
          <h3>Warnings</h3>
          {warnings.map((warning) => <p className="warning" key={`${warning.code}-${warning.message}`}>{warning.message}</p>)}
        </section>
      ) : null}
      {actions?.length ? (
        <section>
          <h3>Actions</h3>
          {actions.map((action) => (
            <button key={action.actionId} onClick={() => onRunAction(action.actionId, action.body || {})} type="button">
              {action.label}
            </button>
          ))}
        </section>
      ) : null}
      <details>
        <summary>Raw JSON</summary>
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
