import { useState } from 'react';

const KEY = 'pomo-tasks-v1';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function TaskList({ onToast }) {
  const [tasks, setTasks] = useState(load);
  const [title, setTitle] = useState('');
  const [est, setEst] = useState(2);

  const save = (next) => {
    setTasks(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const add = () => {
    const t = title.trim();
    if (!t) return;
    save([...tasks, { id: Date.now(), title: t.slice(0, 80), est: Math.max(1, Math.min(12, est || 1)), pomos: 0, done: false }]);
    setTitle('');
  };

  const toggle = (id) => save(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const bump = (id) => save(tasks.map((t) => (t.id === id ? { ...t, pomos: t.pomos + 1 } : t)));
  const remove = (id) => save(tasks.filter((t) => t.id !== id));
  const open = tasks.filter((t) => !t.done);
  const doneCount = tasks.length - open.length;

  return (
    <div className="prod-box">
      <div className="rew-head">
        <h2>📝 Today&apos;s tasks</h2>
        <small className="muted">{doneCount}/{tasks.length} done</small>
      </div>
      <div className="task-add">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Write report" maxLength={80} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input type="number" min={1} max={12} value={est} onChange={(e) => setEst(parseInt(e.target.value, 10) || 1)} title="Estimated pomodoros" />
        <button onClick={add}>Add</button>
      </div>
      <ul className="task-list">
        {tasks.map((t) => (
          <li key={t.id} className={t.done ? 'done' : ''}>
            <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} />
            <span className="tt">{t.title}</span>
            <span className="est" title="Pomos done / estimate">🍅{t.pomos}/{t.est}</span>
            <button onClick={() => bump(t.id)} title="Log 1 pomodoro">+1</button>
            <button onClick={() => { remove(t.id); onToast?.('Task removed'); }} title="Delete">✕</button>
          </li>
        ))}
      </ul>
      {tasks.length === 0 && <small className="muted">Add your first task — estimate in pomodoros.</small>}
    </div>
  );
}
