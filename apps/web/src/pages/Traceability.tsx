import type { TraceLink } from "@architecture-ai/domain";
import { TraceabilityTable } from "../components/TraceabilityTable.js";
export function Traceability({ links }: { links: TraceLink[] }) { return <section><h2>Traceability</h2><TraceabilityTable links={links} /></section>; }
