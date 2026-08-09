import type { TraceLink } from "@architecture-ai/domain";
export function TraceabilityTable({ links }: { links: TraceLink[] }) { return <table><thead><tr><th>From</th><th>Relationship</th><th>To</th></tr></thead><tbody>{links.map((link) => <tr key={link.id}><td>{link.fromId}</td><td>{link.kind}</td><td>{link.toId}</td></tr>)}</tbody></table>; }
