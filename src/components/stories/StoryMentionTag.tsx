import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface StoryMentionTagProps {
  username: string;
  positionX: number;
  positionY: number;
  onClick?: () => void;
}

const StoryMentionTag = ({ username, positionX, positionY, onClick }: StoryMentionTagProps) => {
  const navigate = useNavigate();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else {
      navigate(`/profile/${username}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 animate-fade-in"
      style={{ 
        left: `${positionX}%`, 
        top: `${positionY}%` 
      }}
    >
      <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg hover:bg-black/80 transition-colors">
        <span>@{username}</span>
      </div>
    </button>
  );
};

export default StoryMentionTag;
