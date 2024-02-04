import * as React from "react"
import { useTheme } from "next-themes"
import { PiMoon, PiSun } from "react-icons/pi";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  function handleToggle() {
    if (resolvedTheme === "dark") {
      setTheme("light")
    } else if (resolvedTheme === "light") {
      setTheme("system")
    }
  }

  return (
      <button className="w-8 h-8 rounded-full items-center flex justify-center cursor-pointer z-10 drop-shadow-lg bg-muted" onClick={handleToggle}>
        {resolvedTheme === "dark" && <PiSun />}
        {resolvedTheme === "light" && <PiMoon />}
        <span className="sr-only">Toggle theme</span>
      </button>
  )
}
