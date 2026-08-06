import { JSONFilePreset } from 'lowdb/node'
import { nanoid } from 'nanoid'

const defaultData = { worklog: {} }
const db = await JSONFilePreset('data/boards.json', defaultData)

const now = () => new Date().toISOString()

// 确保 worklog 键存在（旧数据文件可能没有该字段）
async function ensure() {
  await db.read()
  if (!db.data.worklog) {
    db.data.worklog = {}
    await db.write()
  }
  return db.data.worklog
}

// 返回某日期的所有工作日志（不存在则返回空数组）
export async function getLogs(date) {
  const worklog = await ensure()
  return worklog[date] || []
}

// 保存一整天的日志（整体替换，用于批量编辑）
export async function saveLogs(date, rows) {
  const worklog = await ensure()
  const cleaned = (Array.isArray(rows) ? rows : [])
    .map((r) => ({
      id: r.id || `log-${nanoid(6).toUpperCase()}`,
      person: (r.person || '').trim(),
      content: (r.content || '').trim(),
      project: (r.project || '').trim(),
      note: (r.note || '').trim(),
      updatedAt: now(),
    }))
    .filter((r) => r.person || r.content)
  if (cleaned.length === 0) {
    delete worklog[date]
  } else {
    worklog[date] = cleaned
  }
  await db.write()
  return cleaned
}

// 追加一条日志
export async function addLog(date, row) {
  const worklog = await ensure()
  const logs = worklog[date] || []
  const entry = {
    id: `log-${nanoid(6).toUpperCase()}`,
    person: (row.person || '').trim(),
    content: (row.content || '').trim(),
    project: (row.project || '').trim(),
    note: (row.note || '').trim(),
    updatedAt: now(),
  }
  logs.push(entry)
  worklog[date] = logs
  await db.write()
  return entry
}

// 删除一条日志
export async function removeLog(date, id) {
  const worklog = await ensure()
  const logs = worklog[date] || []
  const next = logs.filter((r) => r.id !== id)
  if (next.length === 0) {
    delete worklog[date]
  } else {
    worklog[date] = next
  }
  await db.write()
  return next
}

export async function listDates() {
  const worklog = await ensure()
  return Object.keys(worklog).sort().reverse()
}