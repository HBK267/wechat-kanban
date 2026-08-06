const PREFIX = '/api'

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export function fetchBoard(id) {
  return request(`${PREFIX}/board/${id}`)
}

export function fetchBoards() {
  return request(`${PREFIX}/boards`)
}

export function createBoard(meta) {
  return request(`${PREFIX}/board`, {
    method: 'POST',
    body: JSON.stringify(meta || {}),
  })
}

export function deleteBoard(id) {
  return request(`${PREFIX}/board/${id}`, { method: 'DELETE' })
}

export function postAction(id, type, payload) {
  return request(`${PREFIX}/board/${id}/action`, {
    method: 'POST',
    body: JSON.stringify({ type, payload }),
  })
}

// 工作日志
export function fetchLogs(date) {
  return request(`${PREFIX}/logs/${date}`)
}

export function addLog(date, row) {
  return request(`${PREFIX}/logs/${date}`, {
    method: 'POST',
    body: JSON.stringify(row || {}),
  })
}

export function saveLogs(date, rows) {
  return request(`${PREFIX}/logs/${date}`, {
    method: 'PUT',
    body: JSON.stringify(rows || []),
  })
}

export function deleteLog(date, id) {
  return request(`${PREFIX}/logs/${date}/${id}`, { method: 'DELETE' })
}

export function fetchLogDates() {
  return request(`${PREFIX}/logs`)
}