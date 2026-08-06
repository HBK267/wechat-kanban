import { useRef, useState } from 'react'

export default function TaskModal({ task, columnId, columns, simple, onClose, onSave, onDelete }) {
  const isEdit = !!task
  const [fields, setFields] = useState({
    title: task?.title || '',
    description: task?.description || '',
    assignee: task?.assignee || '',
    priority: task?.priority || 'medium',
    dueDate: task?.dueDate || '',
    // 新建时优先使用点击的列（columnId prop），避免总是落到第一列（待办）
    columnId: task?.columnId || columnId || columns[0]?.id,
  })

  // 使用非受控输入（defaultValue + ref），避免 React 在
  // 中文输入法合成过程中重置 DOM 值，从而打断候选词上屏
  const titleRef = useRef(null)
  const descRef = useRef(null)
  const assigneeRef = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()
    const f = {
      ...fields,
      title: titleRef.current?.value ?? fields.title,
      description: descRef.current?.value ?? fields.description,
      assignee: assigneeRef.current?.value ?? fields.assignee,
    }
    onSave(task || { columnId }, f)
  }

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEdit ? `编辑工作 ${task.id || ''}` : '新建工作'}</h2>
          <button className="btn-icon close" onClick={onClose} type="button" aria-label="关闭">
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <label htmlFor="task-title">任务标题 *</label>
              <input
                id="task-title"
                ref={titleRef}
                required
                defaultValue={fields.title}
                onChange={(e) => setFields((f) => ({ ...f, title: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    const form = e.target.closest('form')
                    if (form) form.requestSubmit()
                  }
                }}
              />
            </div>
            <div className="form-row">
              <label htmlFor="task-desc">任务描述</label>
              <textarea
                id="task-desc"
                ref={descRef}
                defaultValue={fields.description}
                onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-row form-row-2">
              <div>
                <label htmlFor="task-assignee">分项负责人</label>
                <input
                  id="task-assignee"
                  ref={assigneeRef}
                  defaultValue={fields.assignee}
                  onChange={(e) => setFields((f) => ({ ...f, assignee: e.target.value }))}
                />
              </div>
              <div>
                <label htmlFor="task-priority">优先级</label>
                <select
                  id="task-priority"
                  value={fields.priority}
                  onChange={(e) => setFields((f) => ({ ...f, priority: e.target.value }))}
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="critical">紧急</option>
                </select>
              </div>
            </div>
            <div className="form-row form-row-2">
              <div>
                <label htmlFor="task-due">截止日期</label>
                <input
                  id="task-due"
                  type="date"
                  value={fields.dueDate}
                  onChange={(e) => setFields((f) => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
              {!simple && (
                <div>
                  <label htmlFor="task-status">所处阶段</label>
                  <select
                    id="task-status"
                    value={fields.columnId}
                    onChange={(e) => setFields((f) => ({ ...f, columnId: e.target.value }))}
                  >
                    {columns.map((col) => (
                      <option key={col.id} value={col.id}>
                        {col.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            {isEdit && (
              <button type="button" className="btn-ghost danger" onClick={onDelete}>
                删除
              </button>
            )}
            <button type="button" className="btn-ghost" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary">
              {isEdit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}