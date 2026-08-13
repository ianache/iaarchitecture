import { useEffect, useState } from "react";
import type { ApiClient } from "../api/client.js";

interface Props {
  client: ApiClient;
  onBack: () => void;
}

export function KnowledgeChangeRequests({ client, onBack }: Props) {
  const [screen, setScreen] = useState<"list" | "new" | "detail">("list");
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
    void loadList();
  }, []);

  if (screen === "new") {
    return (
      <div>
        <h2>New Knowledge Proposal</h2>
        {error && <p role="alert">{error}</p>}
        <form
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
          <label>Category <input name="category" value={category} onChange={e => setCategory(e.target.value)} /></label>
          <label>Key <input name="key" value={key} onChange={e => setKey(e.target.value)} /></label>
          <label>Target Path <input name="targetPath" value={targetPath} readOnly /></label>
          <label>Title <input name="title" /></label>
          <label>Summary <input name="summary" /></label>
          <label>Classification <input name="classification" defaultValue="STANDARD" /></label>
          <label>Author <input name="author" defaultValue="web-user" /></label>
          <label>Base Revision <input name="baseRevision" defaultValue="abc" /></label>
          <label>Tags (comma separated) <input name="tags" /></label>
          <label>Markdown Body <textarea name="content" /></label>
          
          <button type="submit">Create draft</button>
          <button type="button" onClick={() => setScreen("list")}>Cancel</button>
        </form>
      </div>
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
      <div className="kcr-grid">
        <div>
          <h2>Knowledge Change Request: {request.id}</h2>
          {error && <p role="alert">{error}</p>}
          <p>Status: <span className={`badge badge-${request.status.toLowerCase()}`}>{request.status}</span></p>
          <p>Title: {request.document?.title}</p>
          
          {(request.status === "DRAFT" || request.status === "REVIEWED") && (
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const action = fd.get("action") as string;
              const reviewer = fd.get("reviewer") as string;
              const comment = fd.get("comment") as string;
              if (action === "COMMENT") void review(request.id, reviewer, comment);
              else if (action === "APPROVE") void approve(request.id, reviewer, comment);
            }}>
              <label>Reviewer Name <input name="reviewer" required /></label>
              <label>Action 
                <select name="action">
                  <option value="COMMENT">COMMENT</option>
                  <option value="APPROVE">APPROVE</option>
                </select>
              </label>
              <label>Comment <textarea name="comment" /></label>
              <button type="submit">Submit Review</button>
            </form>
          )}
          {request.status === "APPROVED" && <button onClick={() => void publish(request.id)}>Publish</button>}
          
          <button onClick={() => { setScreen("list"); void loadList(); }}>Back to List</button>
          
          <div className="timeline">
            <h3>Audit Timeline</h3>
            {auditEvents.map((evt, idx) => (
              <div key={idx} className="timeline-item">
                <strong>{evt.action}</strong> by {evt.actor} at {new Date(evt.timestamp).toLocaleString()}
              </div>
            ))}
          </div>
        </div>
        <div className="markdown-reader">
          <h3>Document Preview</h3>
          <pre>{request.document?.content || "No content"}</pre>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2>Knowledge Change Requests</h2>
      {error && <p role="alert">{error}</p>}
      <button onClick={() => setScreen("new")}>New knowledge proposal</button>
      <button onClick={onBack}>Back</button>
      <ul>
        {requests.map(r => (
          <li key={r.id}>
            {r.id} - {r.status} - {r.document?.title}
            <button onClick={() => void loadDetail(r.id)}>View</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
