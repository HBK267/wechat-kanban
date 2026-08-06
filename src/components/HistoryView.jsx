import { PRIORITY_LABEL, SMALL_STATUS, statusLabel } from './SmallDetail'

export default function HistoryView({ board, onBack }) {
  const done = board.tasks.filter((t) => t.columnId === 'col-done').length

  return (
    <div className="history-view">
      <div className="history-head">
        <button className="btn-ghost" type="button" onClick={onBack}>
          ← 返回
        </button>
        <div className="history-title">
          <span className="history-name">{board.name}</span>
          <span className="history-badge">历史已完成</span>
        </div>
        <div className="history-meta">
          {board.owner && <span>负责人：{board.owner}</span>}
          <span>
            共 {board.tasks.length} 项 · 已完成 {done}
          </span>
          {board.updatedAt && (
            <span>
              完成于 {new Date(board.updatedAt).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="small-list">
        {board.tasks.map((task) => (
          <div key={task.id} className="small-card done">
            <div className="small-card-body">
              <div className="small-card-head">
                <span className="small-card-title">{task.title}</span>
                <span className={`status-badge ${task.columnId || 'col-done'}`}>
                  {statusLabel(task.columnId)}
                </span>
              </div>
              <div className="small-card-meta">
                <span className={`priority-badge ${task.priority || 'medium'}`}>
                  {PRIORITY_LABEL[task.priority] || task.priority || '中'}
                </span>
                {task.assignee && <span>负责人：{task.assignee}</span>}
                {task.dueDate && <span>截止 {task.dueDate}</span>}
              </div>
              {task.description && (
                <div className="small-card-desc">{task.description}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}