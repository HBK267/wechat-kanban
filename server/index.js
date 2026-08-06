import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as store from './boardStore.js'
import * as logStore from './workLogStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

app.use(cors())
app.use(express.json())

// 项目列表
app.get('/api/boards', async (req, res) => {
  try {
    const boards = await store.listBoards()
    res.json(boards)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 新建项目
app.post('/api/board', async (req, res) => {
  try {
    const board = await store.createBoard(req.body || {})
    res.json(board)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 删除项目
app.delete('/api/board/:id', async (req, res) => {
  try {
    const result = await store.deleteBoard(req.params.id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// 获取单个看板
app.get('/api/board/:id', async (req, res) => {
  try {
    const board = await store.getBoard(req.params.id)
    res.json(board)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 看板内操作
app.post('/api/board/:id/action', async (req, res) => {
  try {
    const { type, payload } = req.body
    let board

    switch (type) {
      case 'addTask':
        board = await store.addTask(req.params.id, payload)
        break
      case 'updateTask':
        board = await store.updateTask(req.params.id, payload.taskId, payload.fields)
        break
      case 'moveTask':
        board = await store.moveTask(req.params.id, payload.taskId, payload.direction)
        break
      case 'deleteTask':
        board = await store.deleteTask(req.params.id, payload.taskId)
        break
      case 'updateBoardMeta':
        board = await store.updateBoardMeta(req.params.id, payload)
        break
      default:
        return res.status(400).json({ error: 'UNKNOWN_ACTION' })
    }

    res.json(board)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// 工作日志
// 获取某日期的日志
app.get('/api/logs/:date', async (req, res) => {
  try {
    const logs = await logStore.getLogs(req.params.date)
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 追加一条日志
app.post('/api/logs/:date', async (req, res) => {
  try {
    const entry = await logStore.addLog(req.params.date, req.body || {})
    res.json(entry)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 整体保存某日期日志
app.put('/api/logs/:date', async (req, res) => {
  try {
    const logs = await logStore.saveLogs(req.params.date, req.body || [])
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 删除一条日志
app.delete('/api/logs/:date/:id', async (req, res) => {
  try {
    const logs = await logStore.removeLog(req.params.date, req.params.id)
    res.json(logs)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// 有记录的所有日期
app.get('/api/logs', async (req, res) => {
  try {
    const dates = await logStore.listDates()
    res.json(dates)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

const distPath = path.join(__dirname, '../dist')
app.use(express.static(distPath))

app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`> SERVER READY ON PORT ${PORT}`)
})