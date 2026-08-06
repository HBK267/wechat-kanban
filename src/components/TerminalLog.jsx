export default function TerminalLog({ logs, boardId }) {
  return (
    <div className="terminal-log">
      <div className="log-line system">
        <span className="log-time">{new Date().toLocaleTimeString()}</span>
        <span>会话 [{boardId}] 已建立 • 每 3 秒自动同步</span>
      </div>
      {logs.map((log, index) => (
        <div key={index} className={`log-line ${log.type}`}>
          <span className="log-time">{new Date(log.time).toLocaleTimeString()}</span>
          <span>{log.message}</span>
        </div>
      ))}
    </div>
  )
}