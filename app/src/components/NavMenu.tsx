import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Menu } from 'lucide-react';

export function NavMenu({ children }: { children: React.ReactNode }) {
  return (
    <Popover>
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="hover:bg-muted hover:text-muted-foreground"
      >
        <PopoverTrigger>
          <Menu />
        </PopoverTrigger>
      </Button>
      <PopoverContent
        className="flex w-fit gap-2 border-none bg-transparent shadow-none"
        side="left"
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
