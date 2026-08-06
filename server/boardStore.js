import { JSONFilePreset } from 'lowdb/node'
import { nanoid } from 'nanoid'

const defaultColumns = [
  { id: 'col-todo', title: '待办' },
  { id: 'col-inprogress', title: '进行中' },
  { id: 'col-review', title: '质检' },
  { id: 'col-done', title: '已完成' },
]

const defaultData = { boards: {} }
const db = await JSONFilePreset('data/boards.json', defaultData)

const now = () => new Date().toISOString()

export function createDefaultBoard(id, meta = {}) {
  return {
    id,
    name: meta.name?.trim() || `未命名项目`,
    owner: meta.owner?.trim() || '',
    description: meta.description?.trim() || '',
    type: meta.type === 'small' ? 'small' : 'large',
    columns: defaultColumns.map((c) => ({ ...c })),
    tasks: [],
    logs: [
      { time: now(), message: `项目创建成功 [${id}]`, type: 'system' },
    ],
    createdAt: now(),
    updatedAt: now(),
  }
}

export async function getBoard(id) {
  await db.read()
  let board = db.data.boards[id]
  if (!board) {
    board = createDefaultBoard(id)
    db.data.boards[id] = board
    await db.write()
  }
  return board
}

export async function listBoards() {
  await db.read()
  return Object.values(db.data.boards)
    .map((b) => ({
      id: b.id,
      name: b.name,
      owner: b.owner,
      description: b.description,
      type: b.type || 'large',
      createdAt: b.createdAt,
      updatedAt: b.updatedAt,
      total: b.tasks.length,
      done: b.tasks.filter((t) => t.columnId === 'col-done').length,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
}

export async function createBoard(meta = {}) {
  const id = nanoid(12)
  const board = createDefaultBoard(id, meta)
  db.data.boards[id] = board
  await db.write()
  return board
}

async function saveBoard(board) {
  board.updatedAt = now()
  db.data.boards[board.id] = board
  await db.write()
  return board
}

function addLog(board, message, type = 'info') {
  board.logs.unshift({ time: now(), message, type })
  if (board.logs.length > 50) board.logs.pop()
}

export async function addTask(boardId, payload) {
  const board = await getBoard(boardId)
  const task = {
    id: `任务-${nanoid(6).toUpperCase()}`,
    columnId: payload.columnId || board.columns[0]?.id,
    title: (payload.title || '未命名任务').trim(),
    description: (payload.description || '').trim(),
    assignee: (payload.assignee || '').trim(),
    priority: payload.priority || 'medium',
    dueDate: payload.dueDate || '',
    createdAt: now(),
    updatedAt: now(),
  }
  board.tasks.push(task)
  addLog(board, `新建工作 ${task.id} -> ${task.title}`, 'success')
  return saveBoard(board)
}

export async function updateTask(boardId, taskId, fields) {
  const board = await getBoard(boardId)
  const task = board.tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('TASK_NOT_FOUND')

  if (fields.title !== undefined) task.title = fields.title.trim()
  if (fields.description !== undefined) task.description = fields.description.trim()
  if (fields.assignee !== undefined) task.assignee = fields.assignee.trim()
  if (fields.priority !== undefined) task.priority = fields.priority
  if (fields.dueDate !== undefined) task.dueDate = fields.dueDate

  if (fields.columnId !== undefined && fields.columnId !== task.columnId) {
    const oldTitle = board.columns.find((c) => c.id === task.columnId)?.title
    task.columnId = fields.columnId
    const newTitle = board.columns.find((c) => c.id === task.columnId)?.title
    addLog(board, `任务移动 ${task.id} ${oldTitle || '?'} -> ${newTitle || '?'}`, 'info')
  }

  task.updatedAt = now()
  addLog(board, `更新任务 ${task.id}`, 'info')
  return saveBoard(board)
}

export async function moveTask(boardId, taskId, direction) {
  const board = await getBoard(boardId)
  const task = board.tasks.find((t) => t.id === taskId)
  if (!task) throw new Error('TASK_NOT_FOUND')

  const idx = board.columns.findIndex((c) => c.id === task.columnId)
  let newIdx = idx

  if (direction === 'next') newIdx = Math.min(idx + 1, board.columns.length - 1)
  else if (direction === 'prev') newIdx = Math.max(idx - 1, 0)
  else if (typeof direction === 'number') newIdx = Math.max(0, Math.min(direction, board.columns.length - 1))
  else if (typeof direction === 'string') {
    const target = board.columns.findIndex((c) => c.id === direction)
    if (target !== -1) newIdx = target
  }

  if (newIdx !== idx && newIdx >= 0) {
    const oldTitle = board.columns[idx]?.title
    task.columnId = board.columns[newIdx].id
    task.updatedAt = now()
    const newTitle = board.columns[newIdx]?.title
    addLog(board, `任务移动 ${task.id} ${oldTitle || '?'} -> ${newTitle || '?'}`, 'info')
  }

  return saveBoard(board)
}

export async function deleteTask(boardId, taskId) {
  const board = await getBoard(boardId)
  const before = board.tasks.length
  board.tasks = board.tasks.filter((t) => t.id !== taskId)
  if (board.tasks.length < before) {
    addLog(board, `删除任务 ${taskId}`, 'danger')
  }
  return saveBoard(board)
}

export async function updateBoardMeta(boardId, fields) {
  const board = await getBoard(boardId)
  if (fields.name !== undefined) board.name = fields.name.trim() || board.name
  if (fields.owner !== undefined) board.owner = fields.owner.trim()
  if (fields.description !== undefined) board.description = fields.description.trim()
  addLog(board, '项目信息已更新', 'system')
  return saveBoard(board)
}

export async function deleteBoard(boardId) {
  await db.read()
  if (!db.data.boards[boardId]) throw new Error('BOARD_NOT_FOUND')
  delete db.data.boards[boardId]
  await db.write()
  return { ok: true }
}