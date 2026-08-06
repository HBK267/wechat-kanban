import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchBoard, postAction } from '../api'

export function useBoard(boardId) {
  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [syncing, setSyncing] = useState(false)
  const [lastSynced, setLastSynced] = useState(null)
  const pendingRef = useRef(0)

  const load = useCallback(
    async (silent = false) => {
      if (!boardId) return
      if (pendingRef.current > 0) return
      if (!silent) setLoading(true)
      try {
        const data = await fetchBoard(boardId)
        setBoard(data)
        setLastSynced(new Date())
        setError(null)
      } catch (err) {
        setError(err.message)
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [boardId]
  )

  useEffect(() => {
    load(false)
    const interval = setInterval(() => load(true), 3000)
    return () => clearInterval(interval)
  }, [load])

  const mutate = useCallback(
    async (type, payload) => {
      if (!boardId) return
      pendingRef.current += 1
      setSyncing(true)
      try {
        const data = await postAction(boardId, type, payload)
        setBoard(data)
        setLastSynced(new Date())
        setError(null)
      } catch (err) {
        setError(err.message)
        throw err
      } finally {
        pendingRef.current = Math.max(0, pendingRef.current - 1)
        setSyncing(false)
      }
    },
    [boardId]
  )

  return {
    board,
    loading,
    error,
    syncing,
    lastSynced,
    addTask: (payload) => mutate('addTask', payload),
    updateTask: (taskId, fields) => mutate('updateTask', { taskId, fields }),
    moveTask: (taskId, direction) => mutate('moveTask', { taskId, direction }),
    deleteTask: (taskId) => mutate('deleteTask', { taskId }),
    updateBoardMeta: (fields) => mutate('updateBoardMeta', fields),
    reload: () => load(false),
  }
}
