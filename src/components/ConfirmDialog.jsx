export default function ConfirmDialog({
  open,
  title = '确认操作',
  message,
  confirmText = '确认删除',
  cancelText = '取消',
  onConfirm,
  onCancel,
}) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="modal confirm-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-icon" aria-hidden="true">
          !
        </div>
        <div className="confirm-body">
          <h2>{title}</h2>
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}