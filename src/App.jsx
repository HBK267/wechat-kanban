import { useState } from 'react'
import HomePage from './components/HomePage'
import Board from './components/Board'
import WorkLog from './components/WorkLog'
import './App.css'

export default function App() {
  const [tab, setTab] = useState('kanban')
  const [boardId, setBoardId] = useState(
    () => new URLSearchParams(window.location.search).get('board')
  )

  const handleOpen = (id) => {
    const url = new URL(window.location.href)
    url.searchParams.set('board', id)
    window.history.pushState({}, '', url)
    setBoardId(id)
  }

  const handleBack = () => {
    const url = new URL(window.location.href)
    url.searchParams.delete('board')
    window.history.pushState({}, '', url)
    setBoardId(null)
  }

  const handleNewProject = () => {
    handleBack()
  }

  const switchTab = (next) => {
    setTab(next)
    if (next !== 'kanban') {
      // 切到工作日志时退出项目明细
      handleBack()
    }
  }

  return (
    <div className="app-shell">
      <nav className="top-nav">
        <div className="top-nav-brand">测绘一部管理看板</div>
        <div className="top-nav-tabs">
          <button
            type="button"
            className={`top-nav-tab ${tab === 'kanban' ? 'active' : ''}`}
            onClick={() => switchTab('kanban')}
          >
            项目看板
          </button>
          <button
            type="button"
            className={`top-nav-tab ${tab === 'log' ? 'active' : ''}`}
            onClick={() => switchTab('log')}
          >
            工作日志
          </button>
        </div>
      </nav>

      <div className="top-nav-body">
        {tab === 'log' ? (
          <WorkLog />
        ) : !boardId ? (
          <HomePage onOpen={handleOpen} />
        ) : (
          <Board boardId={boardId} onBack={handleBack} onNewProject={handleNewProject} />
        )}
      </div>
    </div>
  )
}