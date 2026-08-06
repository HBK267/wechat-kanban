import { useState } from 'react'
import TaskModal from './TaskModal'
import SmallDetail, { PRIORITY_LABEL, statusLabel } from './SmallDetail'

export default function SmallBoard({ board, addTask, updateTask, deleteTask }) {
  const [modalStub, setModalStub] = useState(null)
  const [detailTask, setDetailTask] = useState(null)

  const handleSave = async (stub, fields) => {
    if (stub?.id) {
      await updateTask(stub.id, fields)
    } else {
      await addTask({ ...fields, columnId: 'col-todo' })
    }
    setModalStub(null)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('确定删除这个工作吗？')) return
    await deleteTask(id)
    setModalStub(null)
    setDetailTask(null)
  }

  const handleStatusSave = async (fields) => {
    if (!detailTask) return
    await updateTask(detailTask.id, fields)
  }

  const openDetail = (task) => {
    setDetailTask({ ...task })
  }

  const doneCount = board.tasks.filter((t) => t.columnId === 'col-done').length

  return (
    <div className="small-board">
      <div className="small-info">
        <div className="small-counts">
          共 {board.tasks.length} 项 · 已完成 {doneCount} 项
        </div>
      </div>

      <div className="small-toolbar">
        <button className="btn-primary" type="button" onClick={() => setModalStub({})}>
          + 新建工作
        </button>
      </div>

      <div className="small-list">
        {board.tasks.map((task) => {
          const done = task.columnId === 'col-done'
          return (
            <div key={task.id} className={`small-card ${done ? 'done' : ''}`}>
              <div className="small-card-body" onClick={() => openDetail(task)}>
                <div className="small-card-head">
                  <span className="small-card-title">{task.title}</span>
                  <span className={`status-badge ${task.columnId || 'col-todo'}`}>
                    {statusLabel(task.columnId)}
                  </span>
                </div>
                <div className="small-card-meta">
                  <span className={`priority-badge ${task.priority || 'medium'}`}>
                    {PRIORITY_LABEL[task.priority] || task.priority || '中'}
                  </span>
                  {task.assignee && <span>{task.assignee}</span>}
                  {task.dueDate && <span>截止 {task.dueDate}</span>}
                </div>
                {task.description && (
                  <div className="small-card-desc">{task.description}</div>
                )}
              </div>
              <div className="small-card-actions">
                <button
                  className={`btn-ghost ${done ? 'done' : ''}`}
                  type="button"
                  onClick={() => updateTask(task.id, { columnId: done ? 'col-todo' : 'col-done' })}
                >
                  {done ? '取消完成' : '完成'}
                </button>
                <button
                  className="btn-icon danger"
                  type="button"
                  onClick={() => handleDelete(task.id)}
                >
                  删除
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {modalStub && (
        <TaskModal
          task={modalStub.task}
          columns={board.columns}
          simple
          onClose={() => setModalStub(null)}
          onSave={handleSave}
          onDelete={modalStub.task ? () => handleDelete(modalStub.task.id) : null}
        />
      )}

      {detailTask && (
        <SmallDetail
          task={detailTask}
          onClose={() => setDetailTask(null)}
          onSave={handleStatusSave}
          onEdit={() => {
            setModalStub({ task: detailTask })
            setDetailTask(null)
          }}
          onDelete={() => handleDelete(detailTask.id)}
        />
      )}
    </div>
  )
}