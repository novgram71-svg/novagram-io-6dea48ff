import { createContext, useContext, useState, ReactNode } from 'react';

interface StoryViewerContextType {
  isViewingStory: boolean;
  setIsViewingStory: (value: boolean) => void;
}

const StoryViewerContext = createContext<StoryViewerContextType | undefined>(undefined);

export const StoryViewerProvider = ({ children }: { children: ReactNode }) => {
  const [isViewingStory, setIsViewingStory] = useState(false);

  return (
    <StoryViewerContext.Provider value={{ isViewingStory, setIsViewingStory }}>
      {children}
    </StoryViewerContext.Provider>
  );
};

export const useStoryViewer = () => {
  const context = useContext(StoryViewerContext);
  if (context === undefined) {
    throw new Error('useStoryViewer must be used within a StoryViewerProvider');
  }
  return context;
};
