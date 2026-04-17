import { FormEvent, useEffect, useState } from 'react';

type Task = {
  id: number;
  title: string;
  status: 'todo' | 'doing' | 'done';
  createdAt: string;
};

const apiBaseUrl = 'http://localhost:3000';

export default function App() {
  const [items, setItems] = useState<Task[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadTasks() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks`);
      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = (await response.json()) as { items: Task[] };
      setItems(data.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTasks();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError('タスク名を入力してください。');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      setTitle('');
      await loadTasks();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <p className="eyebrow">Shared Contract First</p>
        <h1>React Web client on top of a Swagger-documented Express API.</h1>
        <p className="lead">
          Web and Unity can diverge at the UI layer while sharing one backend contract, one
          database, and one source of truth.
        </p>
        <div className="hero-links">
          <a href="http://localhost:3000/api-docs" target="_blank" rel="noreferrer">
            Open Swagger UI
          </a>
          <a href="http://localhost:3000/health" target="_blank" rel="noreferrer">
            Check Health API
          </a>
        </div>
      </section>

      <section className="content-grid">
        <article className="glass-card">
          <h2>Task Feed</h2>
          <p>Current records come from the shared API layer and local SQLite storage.</p>

          {loading ? <p className="muted">Loading tasks...</p> : null}
          {error ? <p className="error-banner">{error}</p> : null}

          <ul className="task-list">
            {items.map((item) => (
              <li key={item.id} className="task-item">
                <span className={`status-pill status-${item.status}`}>{item.status}</span>
                <div>
                  <strong>{item.title}</strong>
                  <p>{new Date(item.createdAt).toLocaleString('ja-JP')}</p>
                </div>
              </li>
            ))}
          </ul>
        </article>

        <article className="glass-card accent-card">
          <h2>Create Task</h2>
          <p>Use this form to hit the same POST endpoint that Swagger exposes.</p>
          <form onSubmit={handleSubmit} className="task-form">
            <label htmlFor="title">Task title</label>
            <input
              id="title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Add auth for both clients"
            />
            <button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Create task'}
            </button>
          </form>
        </article>
      </section>
    </main>
  );
}