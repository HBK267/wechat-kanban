import { useRef, useState } from 'react'
import { useBoard } from '../hooks/useBoard'
import Column from './Column'
import TaskModal from './TaskModal'
import SmallBoard from './SmallBoard'
import HistoryView from './HistoryView'
import TerminalLog from './TerminalLog'
import ConfirmDialog from './ConfirmDialog'
import WorkloadPanel from './WorkloadPanel'

export default function Board({ boardId, onBack, onNewProject }) {
  const {
    board,
    loading,
    error,
    syncing,
    lastSynced,
    addTask,
    updateTask,
    moveTask,
    deleteTask,
    updateBoardMeta,
    saveWorkloads,
  } = useBoard(boardId)

  const [modalTask, setModalTask] = useState(null)
  const [copied, setCopied] = useState(false)
  const [confirmTask, setConfirmTask] = useState(null)

  // 项目名称/负责人使用非受控输入（defaultValue + ref），
  // 避免 React 在中文输入法合成过程中重置 DOM 值
  const nameRef = useRef(null)
  const ownerRef = useRef(null)

  if (loading && !board) {
    return <div className="boot">正在加载项目数据...</div>
  }

  if (error && !board) {
    return (
      <div className="boot error">
        连接失败：{error}
        <button className="btn-primary" onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    )
  }

  // 已完成的小型工作安排：进入历史视图（只读）
  const isDoneSmall =
    board.type === 'small' &&
    board.tasks.length > 0 &&
    board.tasks.every((t) => t.columnId === 'col-done')

  if (isDoneSmall) {
    return <HistoryView board={board} onBack={onBack} />
  }

  const shareUrl = `${window.location.origin}${window.location.pathname}?board=${boardId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('复制此看板链接：', shareUrl)
    }
  }

  const commitMeta = () => {
    const name = nameRef.current?.value ?? board.name
    const owner = ownerRef.current?.value ?? board.owner
    if (name !== board.name || owner !== board.owner) {
      updateBoardMeta({ name, owner })
    }
  }

  const handleSaveTask = async (taskStub, fields) => {
    if (taskStub?.id) {
      await updateTask(taskStub.id, fields)
    } else {
      await addTask({ ...fields, columnId: fields.columnId || taskStub?.columnId })
    }
    setModalTask(null)
  }

  const handleDelete = async (taskId) => {
    await deleteTask(taskId)
    setModalTask(null)
    setConfirmTask(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <button className="btn-ghost" onClick={onBack} type="button">
            ← 项目列表
          </button>
          <span className="prompt">$</span>
          <div className="title-edit">
            <input
              className="board-title-input"
              ref={nameRef}
              defaultValue={board.name}
              onBlur={commitMeta}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.target.blur()
              }}
              aria-label="项目名称"
            />
            <input
              className="board-owner-input"
              ref={ownerRef}
              defaultValue={board.owner}
              onBlur={commitMeta}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.nativeEvent.isComposing) e.target.blur()
              }}
              aria-label="项目负责人"
            />
          </div>
          <span className="cursor" aria-hidden="true" />
        </div>
        <div className="header-right">
          <span className={`sync-badge ${syncing ? 'syncing' : ''}`}>
            {syncing ? '同步中...' : lastSynced ? `已同步 ${lastSynced.toLocaleTimeString()}` : '在线'}
          </span>
          <button className="btn-ghost" onClick={handleCopy} type="button">
            {copied ? '已复制' : '复制链接'}
          </button>
          <button className="btn-ghost" onClick={onNewProject} type="button">
            新建项目
          </button>
        </div>
      </header>

      {error && (
        <div className="error-bar">
          同步警告：{error} • 自动重试中...
        </div>
      )}

      {board.type === 'small' ? (
        <SmallBoard
          board={board}
          addTask={addTask}
          updateTask={updateTask}
          deleteTask={deleteTask}
        />
      ) : (
        <div className="board-scroll">
          <WorkloadPanel board={board} saveWorkloads={saveWorkloads} />
          <div className="columns-container">
            {board.columns.map((col, index) => {
              const isFirst = index === 0
              const isLast = index === board.columns.length - 1
              return (
                <Column
                  key={col.id}
                  column={col}
                  tasks={board.tasks.filter((t) => t.columnId === col.id)}
                  isFirst={isFirst}
                  isLast={isLast}
                  onAdd={() => setModalTask({ columnId: col.id })}
                  onEdit={(task) => setModalTask({ task })}
                  onMove={(taskId, direction) => moveTask(taskId, direction)}
                  onDelete={(taskId) => setConfirmTask(taskId)}
                />
              )
            })}
          </div>
        </div>
      )}

      <TerminalLog logs={board.logs} boardId={boardId} />

      {modalTask && board.type !== 'small' && (
        <TaskModal
          task={modalTask.task}
          columnId={modalTask.columnId}
          columns={board.columns}
          onClose={() => setModalTask(null)}
          onSave={handleSaveTask}
          onDelete={modalTask.task ? () => setConfirmTask(modalTask.task.id) : null}
        />
      )}

      {confirmTask && (
        <ConfirmDialog
          open
          title="删除工作"
          message="确定删除这个工作吗？\n删除后无法恢复。"
          confirmText="确认删除"
          onCancel={() => setConfirmTask(null)}
          onConfirm={() => handleDelete(confirmTask)}
        />
      )}
    </div>
  )
}