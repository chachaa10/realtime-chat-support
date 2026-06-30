import { useState, useEffect } from 'react'

import { getSocket } from '@/lib/socket'

type Status = 'online' | 'reconnecting' | 'offline'

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('online')

  useEffect(() => {
    const socket = getSocket()

    if (socket.connected) {
      setStatus('online')
    } else {
      setStatus('offline')
    }

    const onConnect = () => setStatus('online')
    const onDisconnect = () => setStatus('offline')
    const onReconnecting = () => setStatus('reconnecting')

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    socket.on('reconnecting', onReconnecting)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      socket.off('reconnecting', onReconnecting)
    }
  }, [])

  const colorMap: Record<Status, string> = {
    online: 'bg-green-500',
    reconnecting: 'bg-yellow-500 animate-pulse',
    offline: 'bg-red-500',
  }

  const labelMap: Record<Status, string> = {
    online: 'Online',
    reconnecting: 'Reconnecting...',
    offline: 'Offline',
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-block h-2 w-2 rounded-full ${colorMap[status]}`} />
      <span className="text-ink-dim text-[0.6875rem]">{labelMap[status]}</span>
    </div>
  )
}
