import { useEffect, useRef, useState } from 'react'

export default function WorkloadPanel({ board, saveWorkloads }) {
  const [workloads, setWorkloads] = useState([])
  const saveTimer = useRef(null)

  // 当外部数据刷新时同步本地（避免覆盖正在编辑的内容）
  useEffect(() => {
    setWorkloads(board.workloads || [])
  }, [board])

  // 防抖自动保存
  const scheduleSave = (next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveWorkloads(next)
    }, 600)
  }

  const handleChange = (id, field, value) => {
    const next = workloads.map((item) =>
      item.id === id ? { ...item, [field]: value } : item
    )
    setWorkloads(next)
    scheduleSave(next)
  }

  const addRow = () => {
    const newRow = {
      id: `workload-${Date.now()}`,
      item: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
      note: '',
    }
    const next = [...workloads, newRow]
    setWorkloads(next)
    scheduleSave(next)
  }

  const deleteRow = (id) => {
    const next = workloads.filter((item) => item.id !== id)
    setWorkloads(next)
    scheduleSave(next)
  }

  const total = workloads.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
    0
  )

  return (
    <div className="workload-panel">
      <div className="workload-header">
        <h3>工作量统计</h3>
        <button className="btn-primary" onClick={addRow} type="button">
          + 新增分项
        </button>
      </div>

      <div className="workload-table-wrap">
        <table className="workload-table">
          <thead>
            <tr>
              <th style={{ width: '26%' }}>工作项</th>
              <th style={{ width: '12%' }}>单位</th>
              <th style={{ width: '14%' }}>数量</th>
              <th style={{ width: '14%' }}>单价</th>
              <th style={{ width: '14%' }}>小计</th>
              <th style={{ width: '20%' }}>备注</th>
              <th style={{ width: 'auto' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {workloads.map((item) => (
              <tr key={item.id}>
                <td>
                  <input
                    type="text"
                    value={item.item}
                    onChange={(e) => handleChange(item.id, 'item', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleChange(item.id, 'unit', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleChange(item.id, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleChange(item.id, 'unitPrice', e.target.value)}
                  />
                </td>
                <td className="total-cell">
                  {(Number(item.quantity) || 0) * (Number(item.unitPrice) || 0)}
                </td>
                <td>
                  <input
                    type="text"
                    value={item.note}
                    onChange={(e) => handleChange(item.id, 'note', e.target.value)}
                  />
                </td>
                <td>
                  <button
                    className="btn-icon danger"
                    onClick={() => deleteRow(item.id)}
                    type="button"
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
            {workloads.length === 0 && (
              <tr className="empty-row">
                <td colSpan="7">暂无分项，点击“新增分项”开始添加</td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan="4" className="total-label">
                总计
              </td>
              <td className="total-value">{total}</td>
              <td colSpan="2"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}