import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { Settings } from 'lucide-react';
import { Button } from './ui/button';

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
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            This is where you can change your settings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col space-y-4">
          <Button>Set up API token</Button>
          <Button>View API tokens</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
