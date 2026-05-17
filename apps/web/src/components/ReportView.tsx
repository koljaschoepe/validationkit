import type {
  AuditReport,
  ParserResult,
  SeverityBand,
  AuditFinding,
} from "@vk/core";

const SEV_RANK: Record<SeverityBand, number> = {
  Kill: 0,
  Weak: 1,
  Mid: 2,
  Strong: 3,
  Exceptional: 4,
};

export function ReportView({
  scan,
  report,
}: {
  scan: ParserResult;
  report: AuditReport;
}) {
  const sortedFindings = [...report.findings].sort(
    (a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity],
  );

  return (
    <>
      <section className="summary">
        <Stat label="Files scanned" value={String(report.fileCount)} />
        <Stat label="Findings" value={String(report.findings.length)} />
        <Stat
          label="Overall"
          value={
            <span
              className="sev-pill"
              data-sev={report.summary.overallSeverity}
            >
              {report.summary.overallSeverity}
            </span>
          }
        />
        <Stat
          label="Warnings"
          value={String(scan.warnings.length)}
        />
      </section>

      <h2>Findings</h2>
      {sortedFindings.length === 0 ? (
        <div className="callout">
          <strong>Concession:</strong> Audit passed cleanly. The rules
          fired on 0 issues. <br />
          <strong>Critique:</strong> 4-rule deterministic-set is intentionally
          narrow. Don&apos;t take a green report as proof of quality — it
          just means none of the load-bearing red flags showed up.
        </div>
      ) : (
        <div className="findings">
          {sortedFindings.map((f) => (
            <FindingCard key={f.id} f={f} />
          ))}
        </div>
      )}

      <h2>Inventory ({scan.files.length})</h2>
      <table className="inventory">
        <thead>
          <tr>
            <th>Kind</th>
            <th>Path</th>
            <th>Tokens</th>
            <th>Lines</th>
            <th>Modified</th>
          </tr>
        </thead>
        <tbody>
          {scan.files.map((f) => (
            <tr key={f.absolutePath}>
              <td className="kind">{f.kind}</td>
              <td className="path">{f.relativePath}</td>
              <td className="num">{f.tokenCount.toLocaleString()}</td>
              <td className="num">{f.lineCount}</td>
              <td className="num">
                {f.lastModified
                  ? f.lastModified.toISOString().slice(0, 10)
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {scan.warnings.length > 0 ? (
        <>
          <h2>Parser Warnings</h2>
          <div className="findings">
            {scan.warnings.map((w, i) => (
              <div key={`${w.path}-${i}`} className="finding" data-sev="Mid">
                <div className="head">
                  <span className="title">{w.path}</span>
                </div>
                <div className="detail">{w.message}</div>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </>
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

function FindingCard({ f }: { f: AuditFinding }) {
  return (
    <div className="finding" data-sev={f.severity}>
      <div className="head">
        <span className="sev-pill" data-sev={f.severity}>
          {f.severity}
        </span>
        <span className="title">{f.title}</span>
        <span className="cat">
          {f.category}
          {f.deterministic ? "" : " · LLM"}
        </span>
      </div>
      <div className="detail">{f.detail}</div>
      <div className="cites">
        {f.citations.map((c, i) => (
          <span key={`${c.path}-${i}`} className="cite">
            {c.path}
            {c.line ? `:${c.line}` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}
