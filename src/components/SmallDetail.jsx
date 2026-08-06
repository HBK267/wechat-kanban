import { useState } from 'react'

export const PRIORITY_LABEL = { low: '低', medium: '中', high: '高', critical: '紧急' }

export const SMALL_STATUS = [
  { id: 'col-todo', label: '待办' },
  { id: 'col-inprogress', label: '进行中' },
  { id: 'col-done', label: '已完成' },
]

export const statusLabel = (id) =>
  SMALL_STATUS.find((s) => s.id === id)?.label || '待办'

export default function SmallDetail({ task, onClose, onSave, onEdit, onDelete }) {
  const [status, setStatus] = useState(task.columnId || 'col-todo')

  const changeStatus = (e) => {
    const next = e.target.value
    setStatus(next)
    onSave({ columnId: next })
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>工作明细</h2>
          <button className="btn-icon close" onClick={onClose} type="button" aria-label="关闭">
            ×
          </button>
        </div>

        <div className="modal-body detail-body">
          <div className="detail-title">{task.title}</div>

          <div className="detail-row">
            <span className="detail-label">状态</span>
            <select className="status-select" value={status} onChange={changeStatus}>
              {SMALL_STATUS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="detail-row">
            <span className="detail-label">优先级</span>
            <span className={`priority-badge ${task.priority || 'medium'}`}>
              {PRIORITY_LABEL[task.priority] || task.priority || '中'}
            </span>
          </div>

          {task.assignee && (
            <div className="detail-row">
              <span className="detail-label">分项负责人</span>
              <span className="detail-value">{task.assignee}</span>
            </div>
          )}

          {task.dueDate && (
            <div className="detail-row">
              <span className="detail-label">截止日期</span>
              <span className="detail-value">{task.dueDate}</span>
            </div>
          )}

          {task.description && (
            <div className="detail-block">
              <span className="detail-label">内容</span>
              <div className="detail-desc">{task.description}</div>
            </div>
          )}

          <div className="detail-row muted">
            <span className="detail-label">编号</span>
            <span className="detail-value">{task.id}</span>
          </div>
        </div>

        <div className="modal-footer">
          {onDelete && (
            <button type="button" className="btn-ghost danger" onClick={onDelete}>
              删除
            </button>
          )}
          <button type="button" className="btn-ghost" onClick={onClose}>
            关闭
          </button>
          {onEdit && (
            <button type="button" className="btn-primary" onClick={onEdit}>
              编辑
            </button>
          )}
        </div>
      </div>
    </div>
  )
}