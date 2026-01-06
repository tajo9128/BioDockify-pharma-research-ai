'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface UseResearchSocketOptions {
  onProgressUpdate?: (data: any) => void
  onTaskComplete?: (data: any) => void
  onTaskError?: (data: any) => void
  autoConnect?: boolean
}

interface TaskUpdate {
  taskId: string
  status: string
  progress: number
  currentStep?: string
  result?: any
  error?: string
  timestamp: string
}

export function useResearchSocket(options: UseResearchSocketOptions = {}) {
  const {
    onProgressUpdate,
    onTaskComplete,
    onTaskError,
    autoConnect = true
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)

  const socketRef = useRef<any>(null)
  const subscribedTasksRef = useRef<Set<string>>(new Set())
  const updateHandlersRef = useRef<Map<string, (data: any) => void>>(new Map())

  const connect = useCallback(() => {
    if (typeof window === 'undefined') return

    // Import socket.io-client dynamically (only on client side)
    import('socket.io-client').then(({ io }) => {
      const socket = io('/?XTransformPort=3003', {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      })

      socketRef.current = socket

      socket.on('connect', () => {
        console.log('✅ Connected to Research Updater Service')
        setIsConnected(true)
        setConnectionError(null)
      })

      socket.on('disconnect', () => {
        console.log('❌ Disconnected from Research Updater Service')
        setIsConnected(false)
      })

      socket.on('connect_error', (error: any) => {
        console.error('❌ WebSocket connection error:', error)
        setConnectionError(error.message || 'Connection failed')
        setIsConnected(false)
      })

      socket.on('connected', (data: any) => {
        console.log('🎉 WebSocket connection established:', data)
      })

      socket.on('task-update', (data: TaskUpdate) => {
        console.log('📨 Task update received:', data.taskId, data.status, data.progress)

        // Call specific task handler if exists
        const handler = updateHandlersRef.current.get(data.taskId)
        if (handler) {
          handler(data)
        }

        // Call global handlers based on status
        if (data.status === 'completed' && onTaskComplete) {
          onTaskComplete(data)
        } else if (data.status === 'failed' && onTaskError) {
          onTaskError(data)
        } else if (onProgressUpdate) {
          onProgressUpdate(data)
        }
      })

      socket.on('progress-update', (data: any) => {
        console.log('📊 Progress update:', data.taskId, data.progress)

        // Call specific task handler if exists
        const handler = updateHandlersRef.current.get(data.taskId)
        if (handler) {
          handler({ ...data, type: 'progress' })
        }

        if (onProgressUpdate) {
          onProgressUpdate({ ...data, type: 'progress' })
        }
      })

      socket.on('task-status', (data: any) => {
        console.log('📋 Task status:', data)

        const handler = updateHandlersRef.current.get(data.taskId)
        if (handler) {
          handler({ ...data, type: 'status' })
        }
      })
    }).catch((error) => {
      console.error('❌ Failed to load socket.io-client:', error)
      setConnectionError('Failed to load socket library')
    })
  }, [onProgressUpdate, onTaskComplete, onTaskError])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
      setIsConnected(false)
      subscribedTasksRef.current.clear()
      updateHandlersRef.current.clear()
      console.log('🔌 Disconnected from WebSocket service')
    }
  }, [])

  const subscribeToTask = useCallback((taskId: string, onUpdate?: (data: any) => void) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Cannot subscribe: WebSocket not connected')
      return
    }

    console.log(`📌 Subscribing to task: ${taskId}`)
    socketRef.current.emit('subscribe-task', taskId)
    subscribedTasksRef.current.add(taskId)

    // Store task-specific update handler
    if (onUpdate) {
      updateHandlersRef.current.set(taskId, onUpdate)
    }
  }, [])

  const unsubscribeFromTask = useCallback((taskId: string) => {
    if (!socketRef.current?.connected) {
      return
    }

    console.log(`📌 Unsubscribing from task: ${taskId}`)
    socketRef.current.emit('unsubscribe-task', taskId)
    subscribedTasksRef.current.delete(taskId)
    updateHandlersRef.current.delete(taskId)
  }, [])

  const getTaskStatus = useCallback((taskId: string) => {
    if (!socketRef.current?.connected) {
      console.warn('⚠️ Cannot get status: WebSocket not connected')
      return null
    }

    console.log(`📋 Requesting status for task: ${taskId}`)
    socketRef.current.emit('get-task-status', taskId)
  }, [])

  const unsubscribeAllTasks = useCallback(() => {
    const tasks = Array.from(subscribedTasksRef.current)

    tasks.forEach(taskId => {
      socketRef.current?.emit('unsubscribe-task', taskId)
    })

    subscribedTasksRef.current.clear()
    updateHandlersRef.current.clear()

    console.log(`📌 Unsubscribed from ${tasks.length} tasks`)
  }, [])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  return {
    isConnected,
    connectionError,
    subscribeToTask,
    unsubscribeFromTask,
    unsubscribeAllTasks,
    getTaskStatus,
    disconnect,
    reconnect: connect
  }
}

// Hook for monitoring a single task
export function useResearchTask(taskId: string | null) {
  const [status, setStatus] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const { isConnected, subscribeToTask, unsubscribeFromTask } = useResearchSocket({
    autoConnect: true,
    onProgressUpdate: (data) => {
      if (data.taskId === taskId) {
        setProgress(data.progress || 0)
        setCurrentStep(data.currentStep || null)
        if (data.status) setStatus(data.status)
      }
    },
    onTaskComplete: (data) => {
      if (data.taskId === taskId) {
        setStatus('completed')
        setProgress(100)
        setResult(data.result)
      }
    },
    onTaskError: (data) => {
      if (data.taskId === taskId) {
        setStatus('failed')
        setError(data.error || 'Unknown error')
      }
    }
  })

  useEffect(() => {
    if (taskId && isConnected) {
      subscribeToTask(taskId)

      return () => {
        unsubscribeFromTask(taskId)
      }
    }
  }, [taskId, isConnected, subscribeToTask, unsubscribeFromTask])

  return {
    status,
    progress,
    currentStep,
    result,
    error,
    isConnected
  }
}
