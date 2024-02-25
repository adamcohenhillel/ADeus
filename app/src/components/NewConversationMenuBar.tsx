import {
  Menubar,
  MenubarContent,
  MenubarMenu,
  MenubarRadioGroup,
  MenubarRadioItem,
  MenubarTrigger,
} from '@/components/ui/menubar';
import { useState } from 'react';

export function NewConversationMenuBar({
  newConversation,
}: {
  newConversation: { mutate: () => void };
}) {
  const [activeModel, setActiveModel] = useState('openai');

  const handleModelChange = (value: string) => {
    setActiveModel(value);
    newConversation.mutate();
  };

  return (
    <Menubar>
      <MenubarMenu>
        <MenubarTrigger>Model: {activeModel}</MenubarTrigger>
        <MenubarContent className="mr-2 ">
          <MenubarRadioGroup value={activeModel}>
            <RadioItem value="openai" setActiveModel={handleModelChange} />
            <RadioItem value="gpt3" setActiveModel={handleModelChange} />
            <RadioItem value="gpt4" setActiveModel={handleModelChange} />
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
      {value}
    </MenubarRadioItem>
  );
}
