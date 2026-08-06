import TaskCard from './TaskCard'

export default function Column({ column, tasks, isFirst, isLast, onAdd, onEdit, onMove, onDelete }) {
  return (
    <section className="column" aria-label={`列 ${column.title}`}>
      <header className="column-header">
        <span className="column-title">{column.title}</span>
        <span className="column-count">{tasks.length.toString().padStart(2, '0')}</span>
      </header>
      <div className="column-tasks">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            isFirst={isFirst}
            isLast={isLast}
            onEdit={onEdit}
            onMove={onMove}
            onDelete={onDelete}
          />
        ))}
      </div>
      <footer className="column-footer">
        <button className="btn-add" onClick={onAdd} type="button">
          + 新建工作
        </button>
      </footer>
    </section>
  )
}