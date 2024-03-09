import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { MessageCirclePlus } from 'lucide-react';
import { useState } from 'react';
import { useModelContext } from './ModelProvider';

export function NewConversationMenuBar({
  newConversation,
}: {
  newConversation: { mutate: () => void };
}) {
  const { model, toggleModel } = useModelContext();
  const [activeModel, setActiveModel] = useState(model);

  const handleModelChange = (value: string) => {
    setActiveModel(value);
    newConversation.mutate();
  };

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>{activeModel}</MenubarTrigger>
        <MenubarContent className="mr-4">
          <MenubarRadioGroup value={activeModel}>
            <RadioItem value="openai" setActiveModel={handleModelChange} />
            <RadioItem value="openrouter" setActiveModel={handleModelChange} />
            <RadioItem value="ollama" setActiveModel={handleModelChange} />
          </MenubarRadioGroup>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
}

function RadioItem({
  value,
  setActiveModel,
}: {
  value: string;
  setActiveModel: (value: string) => void;
}) {
  return (
    <MenubarRadioItem value={value} onClick={() => setActiveModel(value)}>
      {value} <MessageCirclePlus className="ml-auto" size={14} />
    </MenubarRadioItem>
  );
}
