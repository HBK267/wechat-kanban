import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createBoard, deleteBoard, fetchBoards, postAction } from '../api'
import ConfirmDialog from './ConfirmDialog'

const DEFAULT_FIELDS = {
  name: '',
  owner: '',
  description: '',
  type: 'large',
  taskTitle: '',
  taskDesc: '',
  taskAssignee: '',
  taskPriority: 'medium',
  taskDueDate: '',
}

// 人员专属配色：每位负责人分配专属颜色，与项目列表顺序无关，
// 保证同一负责人永远显示同一种颜色
const OWNER_PALETTE = [
  { main: '#2563eb', soft: 'rgba(37,99,235,0.12)' }, // 蓝
  { main: '#0d9488', soft: 'rgba(13,148,136,0.12)' }, // 青
  { main: '#ea580c', soft: 'rgba(234,88,12,0.12)' }, // 橙
  { main: '#7c3aed', soft: 'rgba(124,58,237,0.12)' }, // 紫
  { main: '#db2777', soft: 'rgba(219,39,119,0.12)' }, // 玫红
  { main: '#16a34a', soft: 'rgba(22,163,74,0.12)' }, // 绿
  { main: '#4f46e5', soft: 'rgba(79,70,229,0.12)' }, // 靛蓝
  { main: '#ca8a04', soft: 'rgba(202,138,4,0.12)' }, // 琥珀
  { main: '#0891b2', soft: 'rgba(8,145,178,0.12)' }, // 天青
  { main: '#e11d48', soft: 'rgba(225,29,72,0.12)' }, // 红
  { main: '#65a30d', soft: 'rgba(101,163,13,0.12)' }, // 橄榄
  { main: '#9333ea', soft: 'rgba(147,51,234,0.12)' }, // 深紫
]

// 核心人员的固定配色：手动指定，保证好看且互不冲突，
// 即使项目列表顺序变化，这些人的颜色也永远不变
const OWNER_FIXED_COLORS = {
  陈子凡: OWNER_PALETTE[0], // 蓝
  龚彦瑞: OWNER_PALETTE[3], // 紫
  汤喆跃: OWNER_PALETTE[2], // 橙
  唐威: OWNER_PALETTE[1], // 青
  肖童: OWNER_PALETTE[4], // 玫红
  熊毅: OWNER_PALETTE[8], // 天青
}

// 将姓名映射为稳定的数组下标（不依赖列表顺序）
function ownerColorIndex(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  }
  return hash % OWNER_PALETTE.length
}

// 按姓名固定分配颜色：核心人员用指定色，其余人员用姓名哈希，
// 保证同一负责人无论何时、无论列表顺序如何都是同一种颜色
function ownerColorOf(name) {
  return OWNER_FIXED_COLORS[name] || OWNER_PALETTE[ownerColorIndex(name || '')]
}

export default function HomePage({ onOpen }) {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [fields, setFields] = useState({ ...DEFAULT_FIELDS })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [ownerFilter, setOwnerFilter] = useState('')

  // 项目名称/负责人/工作标题等使用非受控输入（defaultValue + ref），避免中文输入被中断
  const nameRef = useRef(null)
  const ownerRef = useRef(null)
  const taskTitleRef = useRef(null)
  const taskDescRef = useRef(null)
  const taskAssigneeRef = useRef(null)

  const load = useCallback(async () => {
    try {
      const data = await fetchBoards()
      setBoards(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
  }, [load])

  const handleCreate = async (e) => {
    e.preventDefault()
    const isSmall = fields.type === 'small'
    const taskTitle = taskTitleRef.current?.value ?? fields.taskTitle
    const taskAssignee = taskAssigneeRef.current?.value ?? fields.taskAssignee
    // 小型工作安排：项目名称直接取任务标题，负责人取分项负责人，无需再填项目信息
    const name = isSmall ? taskTitle : nameRef.current?.value ?? fields.name
    const owner = isSmall ? taskAssignee : ownerRef.current?.value ?? fields.owner
    if (!name.trim()) return
    setCreating(true)
    try {
      const board = await createBoard({ ...fields, name, owner })
      // 创建项目时直接填入首个工作（中大型项目放入待办列，小型工作安排也一并同步）
      if (taskTitle.trim()) {
        await postAction(board.id, 'addTask', {
          title: taskTitle,
          description: taskDescRef.current?.value ?? fields.taskDesc,
          assignee: taskAssignee,
          priority: fields.taskPriority,
          dueDate: fields.taskDueDate,
          columnId: 'col-todo',
        })
      }
      setShowCreate(false)
      setFields({ ...DEFAULT_FIELDS })
      onOpen(board.id)
    } catch (err) {
      setError(err.message)
      setCreating(false)
    }
  }

  const handleDelete = async (id, name) => {
    try {
      await deleteBoard(id)
      await load()
      setConfirmDel(null)
    } catch (err) {
      setError(err.message)
      setConfirmDel(null)
    }
  }

  const progress = (b) => (b.total ? Math.round((b.done / b.total) * 100) : 0)

  // 人员较为固定：收集所有出现过的负责人，用于筛选栏搜索建议
  const persons = useMemo(() => {
    const set = new Set()
    boards.forEach((b) => {
      if (b.owner) set.add(b.owner)
    })
    return [...set].sort((a, b) => a.localeCompare(b, 'zh'))
  }, [boards])

  const kw = ownerFilter.trim()
  const matchOwner = (b) => !kw || (b.owner && b.owner.includes(kw))

  const largeBoards = boards.filter((b) => b.type !== 'small' && matchOwner(b))
  const smallBoards = boards.filter(
    (b) => b.type === 'small' && !(b.total > 0 && b.done === b.total) && matchOwner(b)
  )
  const historyBoards = boards.filter(
    (b) => b.type === 'small' && b.total > 0 && b.done === b.total && matchOwner(b)
  )

  const renderSection = (title, list, typeClass) =>
    list.length > 0 ? (
      <div className="home-section">
        <div className={`home-section-title ${typeClass}`}>{title}</div>
        <div className="project-grid">
          {list.map((b) => {
            const oc = ownerColorOf(b.owner)
            const donePct = progress(b)
            return (
            <div
              key={b.id}
              className={`project-card ${typeClass}`}
              style={{ '--oc': oc.main, '--oc-soft': oc.soft }}
              role="button"
              tabIndex={0}
              onClick={() => onOpen(b.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') onOpen(b.id)
              }}
            >
              <div className="project-card-top">
                <span className="project-name">{b.name}</span>
                <span className="project-progress" style={{ color: 'var(--oc)' }}>{progress(b)}%</span>
              </div>
              <div className="project-card-actions">
                {b.owner && (
                  <div className="project-owner">
                    <span className="owner-dot" style={{ background: oc.main }} />
                    <span style={{ color: oc.main }}>{b.owner}</span>
                  </div>
                )}
                <button
                  className="btn-icon danger"
                  onClick={(e) => {
                    e.stopPropagation()
                    setConfirmDel(b)
                  }}
                  type="button"
                  aria-label={`删除项目 ${b.name}`}
                >
                  删除
                </button>
              </div>
              {b.description && <div className="project-desc">{b.description}</div>}
              <div className="project-meta">
                <span>任务 {b.total}</span>
                <span>已完成 {b.done}</span>
                <span>
                  更新 {b.updatedAt ? new Date(b.updatedAt).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className="project-bar">
                <div
                  className="project-bar-fill"
                  style={{ width: `${Math.max(donePct, 3)}%`, background: 'var(--oc)' }}
                />
              </div>
            </div>
            )
          })}
        </div>
      </div>
    ) : null

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-title">
          <span className="prompt">$</span>
          <h1>项目看板</h1>
          <span className="cursor" aria-hidden="true" />
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)} type="button">
          + 新建项目
        </button>
      </header>

      <div className="home-filter">
        <span className="home-filter-label">负责人</span>
        <input
          list="owner-suggestions"
          className="owner-filter-input"
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          aria-label="按负责人筛选"
        />
        <datalist id="owner-suggestions">
          {persons.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
        {ownerFilter && (
          <button className="btn-ghost" onClick={() => setOwnerFilter('')} type="button">
            清除
          </button>
        )}
      </div>

      {persons.length > 0 && (
        <div className="owner-legend">
          {persons.map((p) => {
            const oc = ownerColorOf(p)
            const active = ownerFilter === p
            return (
              <button
                key={p}
                type="button"
                className={`owner-chip ${active ? 'active' : ''}`}
                style={{
                  '--oc': oc.main,
                  '--oc-soft': oc.soft,
                  borderColor: active ? oc.main : 'var(--border)',
                  background: active ? oc.soft : 'var(--bg-panel)',
                }}
                onClick={() => setOwnerFilter(ownerFilter === p ? '' : p)}
              >
                <span className="owner-dot" style={{ background: oc.main, boxShadow: 'none' }} />
                {p}
              </button>
            )
          })}
        </div>
      )}

      {error && <div className="error-bar">加载失败：{error} • 自动重试中...</div>}

      <div className="home-content">
        {loading && boards.length === 0 ? (
          <div className="boot">正在加载项目列表...</div>
        ) : boards.length === 0 ? (
          <div className="home-empty">
            <p>还没有任何项目</p>
            <button className="btn-primary" onClick={() => setShowCreate(true)} type="button">
              新建第一个项目
            </button>
          </div>
        ) : (
          <div className="home-sections">
            {renderSection('中大型项目', largeBoards, 'large')}
            {renderSection('小型工作安排', smallBoards, 'small')}
            {renderSection('历史工作', historyBoards, 'history')}
            {kw &&
              largeBoards.length === 0 &&
              smallBoards.length === 0 &&
              historyBoards.length === 0 && (
                <div className="home-empty">
                  <p>该负责人暂无项目或工作</p>
                  <button className="btn-ghost" onClick={() => setOwnerFilter('')} type="button">
                    清除筛选
                  </button>
                </div>
              )}
          </div>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)} role="dialog" aria-modal="true">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>新建项目</h2>
              <button className="btn-icon close" onClick={() => setShowCreate(false)} type="button" aria-label="关闭">
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-row">
                  <label>项目类型</label>
                  <div className="type-options">
                    <label className={`type-option ${fields.type === 'large' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="proj-type"
                        value="large"
                        checked={fields.type === 'large'}
                        onChange={(e) => setFields((f) => ({ ...f, type: 'large' }))}
                      />
                      中大型项目
                    </label>
                    <label className={`type-option ${fields.type === 'small' ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="proj-type"
                        value="small"
                        checked={fields.type === 'small'}
                        onChange={(e) => setFields((f) => ({ ...f, type: 'small' }))}
                      />
                      小型工作安排
                    </label>
                  </div>
                </div>
                {fields.type === 'large' && (
                  <>
                    <div className="form-row">
                      <label htmlFor="proj-name">项目名称 *</label>
                      <input
                        id="proj-name"
                        ref={nameRef}
                        required
                        defaultValue={fields.name}
                        onChange={(e) => setFields((f) => ({ ...f, name: e.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="proj-owner">项目负责人</label>
                      <input
                        id="proj-owner"
                        ref={ownerRef}
                        defaultValue={fields.owner}
                        onChange={(e) => setFields((f) => ({ ...f, owner: e.target.value }))}
                      />
                    </div>
                    <div className="form-row">
                      <label htmlFor="proj-desc">项目简介</label>
                      <textarea
                        id="proj-desc"
                        defaultValue={fields.description}
                        onChange={(e) => setFields((f) => ({ ...f, description: e.target.value }))}
                      />
                    </div>
                  </>
                )}
                <div className="home-field-group">
                  <div className="home-field-group-title">
                    {fields.type === 'small' ? '工作信息' : '首个工作'}
                  </div>
                  <div className="form-row">
                    <label htmlFor="task-title">任务标题 *</label>
                    <input
                      id="task-title"
                      ref={taskTitleRef}
                      defaultValue={fields.taskTitle}
                      onChange={(e) => setFields((f) => ({ ...f, taskTitle: e.target.value }))}
                    />
                  </div>
                  <div className="form-row">
                    <label htmlFor="task-desc">任务描述</label>
                    <textarea
                      id="task-desc"
                      ref={taskDescRef}
                      defaultValue={fields.taskDesc}
                      onChange={(e) => setFields((f) => ({ ...f, taskDesc: e.target.value }))}
                    />
                  </div>
                  <div className="form-row form-row-2">
                    <div>
                      <label htmlFor="task-assignee">分项负责人</label>
                      <input
                        id="task-assignee"
                        ref={taskAssigneeRef}
                        defaultValue={fields.taskAssignee}
                        onChange={(e) => setFields((f) => ({ ...f, taskAssignee: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label htmlFor="task-priority">优先级</label>
                      <select
                        id="task-priority"
                        value={fields.taskPriority}
                        onChange={(e) => setFields((f) => ({ ...f, taskPriority: e.target.value }))}
                      >
                        <option value="low">低</option>
                          <option value="medium">中</option>
                          <option value="high">高</option>
                          <option value="critical">紧急</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <label htmlFor="task-due">截止日期</label>
                      <input
                        id="task-due"
                        type="date"
                        value={fields.taskDueDate}
                        onChange={(e) => setFields((f) => ({ ...f, taskDueDate: e.target.value }))}
                      />
                    </div>
                  </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-ghost" onClick={() => setShowCreate(false)}>
                  取消
                </button>
                <button type="submit" className="btn-primary" disabled={creating}>
                  {creating ? '创建中...' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDel && (
        <ConfirmDialog
          open
          title="删除项目"
          message={`确定删除项目「${confirmDel.name}」吗？\n该项目的所有任务和工作信息也会一并删除，此操作不可恢复。`}
          confirmText="确认删除"
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => handleDelete(confirmDel.id, confirmDel.name)}
        />
      )}
    </div>
  )
}