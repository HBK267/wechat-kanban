const priorityMeta = {
  low: { label: '低', borderColor: 'var(--text-dim)', color: 'var(--text-dim)' },
  medium: { label: '中', borderColor: 'var(--info)', color: 'var(--info)' },
  high: { label: '高', borderColor: 'var(--warn)', color: 'var(--warn)' },
  critical: { label: '紧急', borderColor: 'var(--danger)', color: 'var(--danger)' },
}

export default function TaskCard({ task, isFirst, isLast, onEdit, onMove, onDelete }) {
  const meta = priorityMeta[task.priority] || priorityMeta.medium

  return (
    <article
      className="task-card"
      tabIndex={0}
      onClick={() => onEdit(task)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onEdit(task)
      }}
      role="button"
      aria-label={`编辑任务 ${task.title}`}
    >
      <div className="task-meta-top">
        <span className="task-id">{task.id}</span>
        <span className="badge" style={{ borderColor: meta.borderColor, color: meta.color }}>
          {meta.label}
        </span>
      </div>
      <h3 className="task-title">{task.title}</h3>
      {task.description && <p className="task-desc">{task.description}</p>}
      <div className="task-meta-bottom">
        {task.assignee && <span className="meta-item">分项负责人：{task.assignee}</span>}
        {task.dueDate && <span className="meta-item">截止 {task.dueDate}</span>}
      </div>
      <div
        className="task-actions"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <button
          className="btn-icon"
          disabled={isFirst}
          onClick={() => onMove(task.id, 'prev')}
          type="button"
          aria-label="左移"
        >
          ←
        </button>
        <button className="btn-icon" onClick={() => onEdit(task)} type="button" aria-label="编辑">
          编辑
        </button>
        <button
          className="btn-icon"
          disabled={isLast}
          onClick={() => onMove(task.id, 'next')}
          type="button"
          aria-label="右移"
        >
          →
        </button>
        <button
          className="btn-icon danger"
          onClick={() => onDelete(task.id)}
          type="button"
          aria-label="删除"
        >
          删除
        </button>
      </div>
    </article>
  )
}