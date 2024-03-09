import React, { createContext } from 'react';

export const ModelContext = createContext(
  {} as {
    model: string;
    toggleModel: (value: string) => void;
  }
);

export const useModelContext = () => React.useContext(ModelContext);

function ModelProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = React.useState('openai');

  const toggleModel = (value: string) => {
    setModel(value);
  };

  return (
    <ModelContext.Provider
      value={{
        model,
        toggleModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export default ModelProvider;
