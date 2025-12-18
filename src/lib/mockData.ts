export interface User {
  id: string;
  username: string;
  email: string;
  profilePhoto: string;
  bio: string;
  postCount: number;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  imageUrl: string;
  caption: string;
  likeCount: number;
  commentCount: number;
  isLiked: boolean;
  timestamp: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  timestamp: string;
}

export interface Story {
  id: string;
  userId: string;
  user: User;
  imageUrl: string;
  createdAt: string;
  expiresAt: string;
  views: StoryView[];
  isViewed: boolean;
}

export interface StoryView {
  userId: string;
  user: User;
  viewedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface Conversation {
  id: string;
  user: User;
  lastMessage: Message;
  unreadCount: number;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'dm';
  user: User;
  postId?: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'alex_creative',
    email: 'alex@example.com',
    profilePhoto: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
    bio: '📸 Photography enthusiast | ✈️ Travel lover | 🎨 Creating art daily',
    postCount: 42,
    followersCount: 1234,
    followingCount: 567,
    isFollowing: false,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    username: 'sarah_adventures',
    email: 'sarah@example.com',
    profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    bio: '🌍 Explorer | 📖 Storyteller | ☕ Coffee addict',
    postCount: 89,
    followersCount: 5678,
    followingCount: 432,
    isFollowing: true,
    createdAt: '2023-11-20',
  },
  {
    id: '3',
    username: 'mike_designs',
    email: 'mike@example.com',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    bio: '🎨 UI/UX Designer | 💻 Tech lover | 🎮 Gamer',
    postCount: 156,
    followersCount: 12345,
    followingCount: 234,
    isFollowing: true,
    createdAt: '2023-06-10',
  },
  {
    id: '4',
    username: 'emma_lifestyle',
    email: 'emma@example.com',
    profilePhoto: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    bio: '✨ Living my best life | 🧘 Wellness | 🌸 Fashion',
    postCount: 203,
    followersCount: 8765,
    followingCount: 543,
    isFollowing: false,
    createdAt: '2023-08-05',
  },
  {
    id: '5',
    username: 'david_nature',
    email: 'david@example.com',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    bio: '🏔️ Nature photographer | 🌲 Outdoor enthusiast | 📷 Canon shooter',
    postCount: 78,
    followersCount: 3456,
    followingCount: 321,
    isFollowing: true,
    createdAt: '2023-09-15',
  },
];

export const currentUser: User = {
  id: 'current',
  username: 'nova_user',
  email: 'nova@example.com',
  profilePhoto: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop',
  bio: '🚀 Welcome to my Novagram | Creating amazing content',
  postCount: 24,
  followersCount: 789,
  followingCount: 234,
  isFollowing: false,
  createdAt: '2024-01-01',
};

// Mock Posts
export const mockPosts: Post[] = [
  {
    id: 'p1',
    userId: '2',
    user: mockUsers[1],
    imageUrl: 'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=600&h=600&fit=crop',
    caption: 'Amazing sunset views from my latest adventure! 🌅 The colors were absolutely breathtaking. #travel #sunset #nature',
    likeCount: 234,
    commentCount: 18,
    isLiked: false,
    timestamp: '2h ago',
    comments: [],
  },
  {
    id: 'p2',
    userId: '3',
    user: mockUsers[2],
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&h=600&fit=crop',
    caption: 'New design project coming soon! Can\'t wait to share more details 🎨✨ #design #creative',
    likeCount: 567,
    commentCount: 42,
    isLiked: true,
    timestamp: '4h ago',
    comments: [],
  },
  {
    id: 'p3',
    userId: '5',
    user: mockUsers[4],
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=600&fit=crop',
    caption: 'Morning hike through the mountains. Nothing beats fresh air and stunning views 🏔️ #hiking #nature #mountains',
    likeCount: 892,
    commentCount: 56,
    isLiked: false,
    timestamp: '6h ago',
    comments: [],
  },
  {
    id: 'p4',
    userId: '4',
    user: mockUsers[3],
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=600&fit=crop',
    caption: 'New outfit of the day! Feeling confident and ready to take on the world 💃 #fashion #ootd #style',
    likeCount: 1234,
    commentCount: 89,
    isLiked: true,
    timestamp: '8h ago',
    comments: [],
  },
  {
    id: 'p5',
    userId: '1',
    user: mockUsers[0],
    imageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=600&h=600&fit=crop',
    caption: 'Perfect evening for photography 📸 The light was just right! #photography #golden hour',
    likeCount: 456,
    commentCount: 23,
    isLiked: false,
    timestamp: '12h ago',
    comments: [],
  },
];

// Mock Stories
export const mockStories: Story[] = [
  {
    id: 's1',
    userId: 'current',
    user: currentUser,
    imageUrl: 'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400&h=700&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    views: [
      { userId: '2', user: mockUsers[1], viewedAt: '1h ago' },
      { userId: '3', user: mockUsers[2], viewedAt: '2h ago' },
    ],
    isViewed: false,
  },
  {
    id: 's2',
    userId: '2',
    user: mockUsers[1],
    imageUrl: 'https://images.unsplash.com/photo-1682695798522-6e208131916d?w=400&h=700&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    views: [],
    isViewed: false,
  },
  {
    id: 's3',
    userId: '3',
    user: mockUsers[2],
    imageUrl: 'https://images.unsplash.com/photo-1682686580391-615b1f28e5ee?w=400&h=700&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    views: [],
    isViewed: true,
  },
  {
    id: 's4',
    userId: '4',
    user: mockUsers[3],
    imageUrl: 'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=400&h=700&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    views: [],
    isViewed: false,
  },
  {
    id: 's5',
    userId: '5',
    user: mockUsers[4],
    imageUrl: 'https://images.unsplash.com/photo-1682687220208-22d7a2543e88?w=400&h=700&fit=crop',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    views: [],
    isViewed: true,
  },
];

// Mock Conversations
export const mockConversations: Conversation[] = [
  {
    id: 'c1',
    user: mockUsers[1],
    lastMessage: {
      id: 'm1',
      senderId: '2',
      receiverId: 'current',
      text: 'Hey! Loved your latest post 😍',
      timestamp: '5m ago',
      isRead: false,
    },
    unreadCount: 2,
  },
  {
    id: 'c2',
    user: mockUsers[2],
    lastMessage: {
      id: 'm2',
      senderId: 'current',
      receiverId: '3',
      text: 'Thanks for the design tips!',
      timestamp: '1h ago',
      isRead: true,
    },
    unreadCount: 0,
  },
  {
    id: 'c3',
    user: mockUsers[4],
    lastMessage: {
      id: 'm3',
      senderId: '5',
      receiverId: 'current',
      text: 'What camera do you use?',
      timestamp: '3h ago',
      isRead: true,
    },
    unreadCount: 0,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'like',
    user: mockUsers[1],
    postId: 'p1',
    message: 'liked your post',
    timestamp: '5m ago',
    isRead: false,
  },
  {
    id: 'n2',
    type: 'follow',
    user: mockUsers[3],
    message: 'started following you',
    timestamp: '1h ago',
    isRead: false,
  },
  {
    id: 'n3',
    type: 'comment',
    user: mockUsers[2],
    postId: 'p2',
    message: 'commented on your post',
    timestamp: '2h ago',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'dm',
    user: mockUsers[4],
    message: 'sent you a message',
    timestamp: '4h ago',
    isRead: true,
  },
];
