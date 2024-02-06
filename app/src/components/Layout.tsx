import React from 'react'

export default function Layout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="h-24 bg-gradient-to-b from-background flex justify-between items-center fixed top-0 w-full"></div>

      {children}
    </div>
  )
}
