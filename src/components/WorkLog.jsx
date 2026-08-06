import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteLog, fetchLogDates, fetchLogs, saveLogs } from '../api'

const WEEK = ['日', '一', '二', '三', '四', '五', '六']

function pad(n) {
  return String(n).padStart(2, '0')
}

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function addDays(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function formatDisplay(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`)
  return `${d.getMonth() + 1}月${d.getDate()}日 星期${WEEK[d.getDay()]}`
}

function uid() {
  return `r-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export default function WorkLog() {
  const [date, setDate] = useState(todayStr)
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [msg, setMsg] = useState(null)
  const [dates, setDates] = useState([])
  const formRef = useRef(null)
  const saveTimer = useRef(null)
  // 记录最近一次有数据日期的人员列表，用于后一天自动预填
  const peersRef = useRef([])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchLogs(date)
      if (data && data.length > 0) {
        // 有记录：更新人员缓存并展示
        peersRef.current = data.map((r) => r.person).filter(Boolean)
        setRows(data)
      } else {
        // 无记录（如后一天)：主动拉取前一天的日志，预填人员
        let prevPeers = []
        try {
          const prevData = await fetchLogs(addDays(date, -1))
          prevPeers = (prevData || []).map((r) => r.person).filter(Boolean)
          if (prevPeers.length > 0) peersRef.current = prevPeers
        } catch {
          prevPeers = []
        }
        if (prevPeers.length === 0) prevPeers = peersRef.current
        setRows(prevPeers.length > 0 ? prevPeers.map((p) => ({ id: uid(), person: p })) : [])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    fetchLogDates()
      .then(setDates)
      .catch(() => {})
  }, [date])

  const collectRows = () => {
    if (!formRef.current) return []
    const fd = new FormData(formRef.current)
    const map = {}
    for (const [key, val] of fd.entries()) {
      if (!key.startsWith('r.')) continue
      const parts = key.split('.')
      const id = parts[1]
      const field = parts[2]
      if (!id) continue
      if (!map[id]) map[id] = { id }
      map[id][field] = typeof val === 'string' ? val.trim() : val
    }
    return Object.values(map).filter((r) => r.person || r.content)
  }

  const handleSave = async () => {
    const collected = collectRows()
    setError(null)
    try {
      const saved = await saveLogs(date, collected)
      setRows(saved)
      setMsg('已保存')
      setTimeout(() => setMsg(null), 1200)
    } catch (err) {
      setError(err.message)
    }
  }

  // 输入即自动保存（防抖，停顿后写入）
  const scheduleSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(handleSave, 500)
  }

  // 日期变化时清理未落盘的定时器
  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  }, [date])

  const handleAddRow = () => {
    const cur = collectRows()
    setRows([...cur, { id: uid() }])
  }

  const handleRemoveRow = async (id) => {
    setRows((prev) => prev.filter((r) => r.id !== id))
    scheduleSave()
    try {
      await deleteLog(date, id)
    } catch (err) {
      setError(err.message)
    }
  }

  const renderRowInput = (row, field) => (
    <input
      name={`r.${row.id}.${field}`}
      defaultValue={row[field] || ''}
      onChange={scheduleSave}
      className="worklog-cell-input"
    />
  )

  return (
    <div className="worklog">
      <div className="worklog-toolbar">
        <div className="worklog-date-nav">
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setDate((d) => addDays(d, -1))}
            aria-label="前一天"
          >
            ‹ 前一天
          </button>
          <div className="worklog-date-core">
            <input
              type="date"
              value={date}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="worklog-date-input"
            />
            <div className="worklog-date-label">
              {formatDisplay(date)}
              {date === todayStr() && <span className="worklog-today-tag">今天</span>}
            </div>
          </div>
          <button
            className="btn-ghost"
            type="button"
            onClick={() => setDate((d) => addDays(d, 1))}
            aria-label="后一天"
          >
            后一天 ›
          </button>
        </div>

        <div className="worklog-actions">
          <span className="worklog-autosave">自动保存</span>
          <button className="btn-ghost" type="button" onClick={handleAddRow}>
            + 添加一行
          </button>
        </div>
      </div>

      {error && <div className="error-bar">操作失败：{error}</div>}
      {msg && <div className="worklog-toast">{msg}</div>}

      <div className="worklog-dates-strip">
        {dates.length > 0 && (
          <>
            <span className="worklog-dates-title">已有记录</span>
            {dates.map((d) => (
              <button
                key={d}
                type="button"
                className={`worklog-date-chip ${d === date ? 'active' : ''}`}
                onClick={() => setDate(d)}
              >
                {d.slice(5).replace('-', '/')}
              </button>
            ))}
          </>
        )}
        {dates.length === 0 && !loading && (
          <span className="worklog-dates-title worklog-dates-empty">暂无历史记录</span>
        )}
      </div>

      {loading ? (
        <div className="boot">正在加载工作日志...</div>
      ) : (
        <form ref={formRef} key={date} className="worklog-table-wrap" onSubmit={(e) => e.preventDefault()}>
          <table className="worklog-table">
            <thead>
              <tr>
                <th className="w-idx">序号</th>
                <th className="w-person">人员</th>
                <th className="w-content">工作内容</th>
                <th className="w-project">项目</th>
                <th className="w-note">备注</th>
                <th className="w-op">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr className="worklog-empty-row">
                  <td colSpan={6}>
                    <button type="button" className="worklog-add-first" onClick={handleAddRow}>
                      添加第一行记录
                    </button>
                  </td>
                </tr>
              )}
              {rows.map((row, i) => (
                <tr key={row.id}>
                  <td className="w-idx">{i + 1}</td>
                  <td className="w-person">{renderRowInput(row, 'person')}</td>
                  <td className="w-content">{renderRowInput(row, 'content')}</td>
                  <td className="w-project">{renderRowInput(row, 'project')}</td>
                  <td className="w-note">{renderRowInput(row, 'note')}</td>
                  <td className="w-op">
                    <button
                      type="button"
                      className="btn-icon danger"
                      onClick={() => handleRemoveRow(row.id)}
                      aria-label="删除此行"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 0 && (
            <div className="worklog-add-row">
              <button className="btn-add" type="button" onClick={handleAddRow}>
                + 添加一行
              </button>
            </div>
          )}
        </form>
      )}
    </div>
  )
}