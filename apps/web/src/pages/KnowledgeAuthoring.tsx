import { useEffect, useState } from "react";
import type { KnowledgeItem } from "@architecture-ai/domain";
import type { ApiClient } from "../api/client.js";
import { badgeClassName } from "../status.js";

interface Props {
  client: ApiClient;
  onBack: () => void;
}

function categoryOf(item: KnowledgeItem): string {
  const segments = item.sourcePath.split("/");
  return segments.length > 1 ? segments[1] : "uncategorized";
}

export function KnowledgeAuthoring({ client, onBack }: Props) {
  const [screen, setScreen] = useState<"entries" | "list" | "new" | "detail">("entries");
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [requests, setRequests] = useState<any[]>([]);
  const [request, setRequest] = useState<any>();
  const [error, setError] = useState<string>();

  const [key, setKey] = useState("");
  const [category, setCategory] = useState("standards");
  const [targetPath, setTargetPath] = useState("knowledge/standards/");
  const [auditEvents, setAuditEvents] = useState<any[]>([]);

  useEffect(() => {
    setTargetPath(`knowledge/${category}/${key || "document"}.md`);
  }, [key, category]);

  async function loadEntries() {
    try {
      setError(undefined);
      const res = await client.listKnowledgeItems();
      setItems(res.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadList() {
    try {
      setError(undefined);
      const res = await client.listKcrs();
      setRequests(Array.isArray(res) ? res : (res as any).requests ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function loadDetail(id: string) {
    try {
      setError(undefined);
      const res = await client.getKcr(id);
      setRequest(res);
      setScreen("detail");
      const auditRes = await client.getKcrAudit(id);
      setAuditEvents(auditRes.events || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => {
    void loadEntries();
  }, []);

  if (screen === "entries") {
    const categories = Array.from(new Set(items.map(categoryOf))).sort();
    const filtered = categoryFilter === "all" ? items : items.filter((item) => categoryOf(item) === categoryFilter);
    return (
      <main>
        <header className="view-header">
          <div>
            <h1 className="view-title">Knowledge Authoring</h1>
            <p className="view-subtitle">Knowledge base repository</p>
          </div>
          <div className="view-actions">
            <button type="button" className="btn btn-primary" onClick={() => setScreen("new")}>New knowledge proposal</button>
            <button type="button" className="btn btn-ghost" onClick={() => { setScreen("list"); void loadList(); }}>Change requests</button>
          </div>
        </header>
        {error && <p role="alert" className="alert">{error}</p>}
        <section className="card">
          <div className="view-header" style={{ marginBottom: 22, alignItems: "center" }}>
            <h2 className="card-title" style={{ marginBottom: 0 }}>Knowledge entries</h2>
            <select className="field-control mono" style={{ width: "auto", marginTop: 0 }} value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">all</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {filtered.length > 0 ? (
            <table className="data-table">
              <thead><tr><th>Key</th><th>Title</th><th>Category</th><th>Status</th><th>Revision</th></tr></thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id}>
                    <td className="id-cell">{item.key}</td>
                    <td>{item.title}</td>
                    <td className="muted-cell">{categoryOf(item)}</td>
                    <td><span className={badgeClassName(item.status)}>{item.status}</span></td>
                    <td className="mono muted-cell">{item.revision.slice(0, 7)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : <p className="empty-state">No entries in this category.</p>}
        </section>
      </main>
    );
  }

  if (screen === "new") {
    return (
      <main>
        <button type="button" className="link-back" onClick={() => setScreen("entries")}>&larr; Knowledge Authoring</button>
        <h1 className="view-title" style={{ fontSize: 30, marginBottom: 28 }}>New Knowledge Proposal</h1>
        {error && <p role="alert" className="alert">{error}</p>}
        <form
          className="card form-card"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const input = {
              category: fd.get("category"),
              author: fd.get("author"),
              baseRevision: fd.get("baseRevision"),
              targetPath: targetPath,
              document: {
                key: fd.get("key"),
                title: fd.get("title"),
                summary: fd.get("summary"),
                type: fd.get("classification"),
                content: fd.get("content"),
                tags: String(fd.get("tags")).split(",").map(t => t.trim()).filter(Boolean)
              }
            };
            void (async () => {
              try {
                setError(undefined);
                const res = await client.createKcr(input);
                await loadDetail(res.id);
              } catch (err) {
                setError(err instanceof Error ? err.message : String(err));
              }
            })();
          }}
        >
          <label className="field">Category <input className="field-control mono" name="category" value={category} onChange={e => setCategory(e.target.value)} /></label>
          <label className="field">Key <input className="field-control mono" name="key" value={key} onChange={e => setKey(e.target.value)} /></label>
          <label className="field">Target Path <input className="field-control mono" name="targetPath" value={targetPath} readOnly /></label>
          <label className="field">Title <input className="field-control" name="title" /></label>
          <label className="field">Summary <input className="field-control" name="summary" /></label>
          <div className="form-grid-2">
            <label className="field">Classification <input className="field-control mono" name="classification" defaultValue="STANDARD" /></label>
            <label className="field">Author <input className="field-control" name="author" defaultValue="web-user" /></label>
          </div>
          <label className="field">Base Revision <input className="field-control mono" name="baseRevision" defaultValue="abc" /></label>
          <label className="field">Tags (comma separated) <input className="field-control mono" name="tags" /></label>
          <label className="field">Markdown Body <textarea className="field-control mono" name="content" rows={8} /></label>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">Create draft</button>
            <button type="button" className="btn btn-ghost" onClick={() => setScreen("entries")}>Cancel</button>
          </div>
        </form>
      </main>
    );
  }

  if (screen === "detail" && request) {
    const review = async (id: string, reviewer: string, comment?: string) => {
      try {
        setError(undefined);
        await client.reviewKcr(id, reviewer, comment);
        await loadDetail(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    const approve = async (id: string, reviewer: string, comment?: string) => {
      try {
        setError(undefined);
        await client.approveKcr(id, reviewer, comment);
        await loadDetail(id);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };
    const publish = async (id: string) => {
      try {
        setError(undefined);
        const res = await client.publishKcr(id);
        setError(`KCR published on ${res.branch}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    };

    return (
      <main>
        <button type="button" className="link-back" onClick={() => { setScreen("list"); void loadList(); }}>&larr; Knowledge Change Requests</button>
        <div className="kcr-grid">
          <div className="card">
            <h2 className="card-title">Knowledge Change Request: {request.id}</h2>
            {error && <p role="alert" className="alert">{error}</p>}
            <p>Status: <span className={badgeClassName(request.status)}>{request.status}</span></p>
            <p>Title: {request.document?.title}</p>

            {(request.status === "DRAFT" || request.status === "REVIEWED") && (
              <form className="review-form" onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const action = fd.get("action") as string;
                const reviewer = fd.get("reviewer") as string;
                const comment = fd.get("comment") as string;
                if (action === "COMMENT") void review(request.id, reviewer, comment);
                else if (action === "APPROVE") void approve(request.id, reviewer, comment);
              }}>
                <label className="field">Reviewer Name <input className="field-control" name="reviewer" required /></label>
                <label className="field">Action
                  <select className="field-control mono" name="action">
                    <option value="COMMENT">COMMENT</option>
                    <option value="APPROVE">APPROVE</option>
                  </select>
                </label>
                <label className="field">Comment <textarea className="field-control" name="comment" /></label>
                <button type="submit" className="btn btn-primary btn-sm">Submit Review</button>
              </form>
            )}
            {request.status === "APPROVED" && <button type="button" className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={() => void publish(request.id)}>Publish</button>}

            <div className="timeline">
              <h3 className="card-title" style={{ fontSize: 15, marginBottom: 12 }}>Audit Timeline</h3>
              {auditEvents.map((evt, idx) => (
                <div key={idx} className="timeline-item">
                  <strong>{evt.action}</strong> by {evt.actor} at {new Date(evt.timestamp).toLocaleString()}
                </div>
              ))}
            </div>
          </div>
          <div className="card markdown-reader">
            <h3 className="card-title" style={{ fontSize: 15 }}>Document Preview</h3>
            <pre>{request.document?.content || "No content"}</pre>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="view-header">
        <div>
          <h1 className="view-title">Knowledge Change Requests</h1>
          <p className="view-subtitle">Proposals into the knowledge repository</p>
        </div>
        <div className="view-actions">
          <button type="button" className="btn btn-primary" onClick={() => setScreen("new")}>New knowledge proposal</button>
          <button type="button" className="btn btn-ghost" onClick={() => setScreen("entries")}>Back</button>
        </div>
      </header>
      {error && <p role="alert" className="alert">{error}</p>}
      <section className="card">
        {requests.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr><th>Key</th><th>Title</th><th>Category</th><th>Status</th><th>Author</th><th>Action</th></tr>
            </thead>
            <tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td className="id-cell">{r.id}</td>
                  <td>{r.document?.title}</td>
                  <td className="muted-cell">{r.category}</td>
                  <td><span className={badgeClassName(r.status)}>{r.status}</span></td>
                  <td className="muted-cell">{r.author}</td>
                  <td><button type="button" className="action-link" onClick={() => void loadDetail(r.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="empty-state">No requests yet.</p>}
      </section>
    </main>
  );
}
