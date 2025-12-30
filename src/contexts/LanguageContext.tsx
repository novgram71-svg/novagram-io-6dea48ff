import React, { createContext, useContext, useState, useEffect } from 'react';

interface Translations {
  [key: string]: {
    [key: string]: string;
  };
}

const translations: Translations = {
  en: {
    home: 'Home',
    search: 'Search',
    create: 'Create',
    notifications: 'Notifications',
    messages: 'Messages',
    profile: 'Profile',
    settings: 'Settings',
    logout: 'Log Out',
    login: 'Sign In',
    signup: 'Sign Up',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    language: 'Language',
    saved: 'Saved',
    followers: 'Followers',
    following: 'Following',
    posts: 'Posts',
    noPostsYet: 'No posts yet',
    searchUsers: 'Search users...',
    askAI: 'Ask Nova AI...',
  },
  es: {
    home: 'Inicio',
    search: 'Buscar',
    create: 'Crear',
    notifications: 'Notificaciones',
    messages: 'Mensajes',
    profile: 'Perfil',
    settings: 'Configuración',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    signup: 'Registrarse',
    darkMode: 'Modo Oscuro',
    lightMode: 'Modo Claro',
    language: 'Idioma',
    saved: 'Guardados',
    followers: 'Seguidores',
    following: 'Siguiendo',
    posts: 'Publicaciones',
    noPostsYet: 'Sin publicaciones aún',
    searchUsers: 'Buscar usuarios...',
    askAI: 'Pregunta a Nova AI...',
  },
  fr: {
    home: 'Accueil',
    search: 'Rechercher',
    create: 'Créer',
    notifications: 'Notifications',
    messages: 'Messages',
    profile: 'Profil',
    settings: 'Paramètres',
    logout: 'Déconnexion',
    login: 'Connexion',
    signup: 'Inscription',
    darkMode: 'Mode Sombre',
    lightMode: 'Mode Clair',
    language: 'Langue',
    saved: 'Enregistrés',
    followers: 'Abonnés',
    following: 'Abonnements',
    posts: 'Publications',
    noPostsYet: 'Pas encore de publications',
    searchUsers: 'Rechercher des utilisateurs...',
    askAI: 'Demandez à Nova AI...',
  },
  de: {
    home: 'Startseite',
    search: 'Suchen',
    create: 'Erstellen',
    notifications: 'Benachrichtigungen',
    messages: 'Nachrichten',
    profile: 'Profil',
    settings: 'Einstellungen',
    logout: 'Abmelden',
    login: 'Anmelden',
    signup: 'Registrieren',
    darkMode: 'Dunkelmodus',
    lightMode: 'Hellmodus',
    language: 'Sprache',
    saved: 'Gespeichert',
    followers: 'Follower',
    following: 'Gefolgt',
    posts: 'Beiträge',
    noPostsYet: 'Noch keine Beiträge',
    searchUsers: 'Benutzer suchen...',
    askAI: 'Frag Nova AI...',
  },
  ja: {
    home: 'ホーム',
    search: '検索',
    create: '作成',
    notifications: '通知',
    messages: 'メッセージ',
    profile: 'プロフィール',
    settings: '設定',
    logout: 'ログアウト',
    login: 'ログイン',
    signup: 'サインアップ',
    darkMode: 'ダークモード',
    lightMode: 'ライトモード',
    language: '言語',
    saved: '保存済み',
    followers: 'フォロワー',
    following: 'フォロー中',
    posts: '投稿',
    noPostsYet: 'まだ投稿がありません',
    searchUsers: 'ユーザーを検索...',
    askAI: 'Nova AIに聞く...',
  },
  ko: {
    home: '홈',
    search: '검색',
    create: '만들기',
    notifications: '알림',
    messages: '메시지',
    profile: '프로필',
    settings: '설정',
    logout: '로그아웃',
    login: '로그인',
    signup: '가입',
    darkMode: '다크 모드',
    lightMode: '라이트 모드',
    language: '언어',
    saved: '저장됨',
    followers: '팔로워',
    following: '팔로잉',
    posts: '게시물',
    noPostsYet: '아직 게시물이 없습니다',
    searchUsers: '사용자 검색...',
    askAI: 'Nova AI에게 물어보세요...',
  },
  zh: {
    home: '首页',
    search: '搜索',
    create: '创建',
    notifications: '通知',
    messages: '消息',
    profile: '个人资料',
    settings: '设置',
    logout: '登出',
    login: '登录',
    signup: '注册',
    darkMode: '深色模式',
    lightMode: '浅色模式',
    language: '语言',
    saved: '已保存',
    followers: '粉丝',
    following: '关注',
    posts: '帖子',
    noPostsYet: '还没有帖子',
    searchUsers: '搜索用户...',
    askAI: '问 Nova AI...',
  },
  hi: {
    home: 'होम',
    search: 'खोजें',
    create: 'बनाएं',
    notifications: 'सूचनाएं',
    messages: 'संदेश',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    logout: 'लॉग आउट',
    login: 'लॉग इन',
    signup: 'साइन अप',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    language: 'भाषा',
    saved: 'सहेजा गया',
    followers: 'फॉलोअर्स',
    following: 'फॉलोइंग',
    posts: 'पोस्ट',
    noPostsYet: 'अभी तक कोई पोस्ट नहीं',
    searchUsers: 'यूज़र्स खोजें...',
    askAI: 'Nova AI से पूछें...',
  },
};

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
  }, []);

  const handleSetLanguage = (lang: string) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
