import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Settings } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

export default function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline" className="w-full">
          Settings <Settings size={20} className="ml-auto" />
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-xl">
        <DialogHeader>
          <DialogTitle className="text-4xl">Settings</DialogTitle>
        </DialogHeader>

        <h3 className="text-xl font-semibold">Appearance</h3>
        <ThemeToggle />

        <h3 className="text-xl font-semibold">Models</h3>
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="openai">OpenAI API Key</Label>
            <Input name="openai" type="text" placeholder="sk-..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="openrouter">OpenRouter API Key</Label>
            <Input name="openrouter" type="text" placeholder="sk-..." />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="ollama">Ollama Base URL</Label>
            <Input
              name="ollama"
              type="text"
              placeholder="https://ollama.com/..."
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
