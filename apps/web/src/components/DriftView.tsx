import type { DriftItem, DriftReport, SeverityBand } from "@vk/core";

const SEV_RANK: Record<SeverityBand, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

export function DriftView({ drift }: { drift: DriftReport }) {
  const sorted = [...drift.items].sort(
    (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
  );
  return (
    <>
      <section className="summary">
        <Stat label="Files A" value={String(drift.filesA)} />
        <Stat label="Files B" value={String(drift.filesB)} />
        <Stat label="Drift items" value={String(drift.items.length)} />
        <Stat
          label="Overall"
          value={
            <span
              className="sev-pill"
              data-sev={drift.summary.overallSeverity}
            >
              {drift.summary.overallSeverity}
            </span>
          }
        />
      </section>

      <h2>Drift</h2>
      {sorted.length === 0 ? (
        <div className="callout">
          <strong>Concession:</strong> the two repos are in sync against this
          deterministic rule set. <br />
          <strong>Critique:</strong> presence + frontmatter + body-similarity +
          token-count is a narrow definition of &quot;in sync&quot;. Semantic
          drift (same words, opposite intent) still slips through — that lives
          in the LLM-augmented audit, not here.
        </div>
      ) : (
        <div className="findings">
          {sorted.map((item) => (
            <DriftCard key={item.id} item={item} />
          ))}
        </div>
      )}

      <h2>Summary by kind</h2>
      <table className="inventory">
        <thead>
          <tr>
            <th>Kind</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(drift.summary.byKind).map(([kind, n]) =>
            n > 0 ? (
              <tr key={kind}>
                <td className="kind">{kind}</td>
                <td className="num">{n}</td>
              </tr>
            ) : null,
          )}
        </tbody>
      </table>
    </>
  );
}

function DriftCard({ item }: { item: DriftItem }) {
  return (
    <div className="finding" data-sev={item.severity}>
      <div className="head">
        <span className="sev-pill" data-sev={item.severity}>
          {item.severity}
        </span>
        <span className="title">{item.title}</span>
        <span className="cat">{item.kind}</span>
      </div>
      <div className="detail">{item.detail}</div>
      <div className="cites">
        <span className="cite">{item.relativePath}</span>
        {item.fieldsChanged && item.fieldsChanged.length > 0 ? (
          <span className="cite">fields: {item.fieldsChanged.join(", ")}</span>
        ) : null}
        {typeof item.similarity === "number" ? (
          <span className="cite">
            similarity {(item.similarity * 100).toFixed(0)}%
          </span>
        ) : null}
        {typeof item.tokensA === "number" &&
        typeof item.tokensB === "number" ? (
          <span className="cite">
            tokens A={item.tokensA} · B={item.tokensB}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}
