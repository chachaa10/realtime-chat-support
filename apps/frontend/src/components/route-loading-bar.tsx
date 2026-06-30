import { useEffect, useState, useCallback } from 'react'
import { useRouter } from '@tanstack/react-router'

export function RouteLoadingBar() {
  const router = useRouter()
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleStart = useCallback(() => {
    setProgress(30)
    setVisible(true)
  }, [])

  const handleComplete = useCallback(() => {
    setProgress(100)
  }, [])

  useEffect(() => {
    return router.subscribe('onBeforeLoad', () => {
      handleStart()
    })
  }, [router, handleStart])

  useEffect(() => {
    return router.subscribe('onLoad', () => {
      handleComplete()
    })
  }, [router, handleComplete])

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [progress])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-brand transition-all duration-[400ms] ease-out"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        boxShadow: '0 0 8px var(--color-brand)',
      }}
    >
      <div className="absolute inset-0 animate-loading-bar-shimmer" />
    </div>
  )
}
