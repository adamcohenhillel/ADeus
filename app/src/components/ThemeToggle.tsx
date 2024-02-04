import * as React from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <Button size={'icon'} className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80" onClick={handleToggle}>
        {resolvedTheme === "dark" && <Sun size={20} />}
        {resolvedTheme === "light" && <Moon size={20} />}
        <span className="sr-only">Toggle theme</span>
      </Button>
  )
}
