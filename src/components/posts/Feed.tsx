import { mockPosts } from '@/lib/mockData';
import PostCard from './PostCard';

const Feed = () => {
  return (
    <div className="max-w-lg mx-auto space-y-6 px-4 md:px-0">
      {mockPosts.map((post, index) => (
        <div 
          key={post.id} 
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <PostCard post={post} />
        </div>
      ))}
    </div>
  );
};

export default Feed;
