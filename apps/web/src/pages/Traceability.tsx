import type { TraceLink } from "@architecture-ai/domain";
import { TraceabilityTable } from "../components/TraceabilityTable.js";

export function Traceability({ links }: { links: TraceLink[] }) {
  return (
    <section className="card">
      <h2 className="card-title">Traceability</h2>
      <TraceabilityTable links={links} />
    </section>
  );
}
