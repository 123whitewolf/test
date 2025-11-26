import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { UserProfile } from '@/data';

// Type definitions
interface LearningStats {
  totalProblems: number;
  completedProblems: number;
  accuracyRate: number;
  dailyStreak: number;
  averageTimePerProblem: number;
  problemsByCategory: { name: string; value: number; }[];
  weeklyProgress: { day: string; problemsSolved: number; }[];
  difficultyDistribution: { name: string; value: number; }[];
}

interface WrongProblem {
  id: number;
  title: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastAttempt: string;
  mistakeCount: number;
}

interface BookmarkedProblem extends Omit<WrongProblem, 'mistakeCount'> {
  addedDate: string;
}

// Mock data
const MOCK_USER_PROFILE: UserProfile = {
  id: 1,
  userId: 1,
  firstName: '明',
  lastName: '张',
  bio: '计算机科学专业大三学生，热爱编程和算法挑战。',
  avatar: 'https://space.coze.cn/api/coze_space/gen_image?image_size=square&prompt=user%20avatar%20male&sign=ebabea4c1f7e5ee731c308221c34a2fe',
  learningGoals: ['掌握数据结构与算法', '提高编程能力', '准备面试'],
  skills: ['JavaScript', 'React', 'Node.js', 'Python'],
  completedProblems: 48,
  totalProblems: 126,
  successRate: 78.5,
  studyTime: 240,
  lastActive: '2023-11-22',
  createdAt: '2023-09-15',
  updatedAt: '2023-11-22'
};

const MOCK_LEARNING_STATS: LearningStats = {
  totalProblems: 126,
  completedProblems: 48,
  accuracyRate: 78.5,
  dailyStreak: 12,
  averageTimePerProblem: 15.2,
  problemsByCategory: [
    { name: '数组', value: 12 },
    { name: '字符串', value: 8 },
    { name: '链表', value: 5 },
    { name: '树', value: 7 },
    { name: '动态规划', value: 6 },
    { name: '其他', value: 10 },
  ],
  weeklyProgress: [
    { day: '周一', problemsSolved: 3 },
    { day: '周二', problemsSolved: 5 },
    { day: '周三', problemsSolved: 2 },
    { day: '周四', problemsSolved: 7 },
    { day: '周五', problemsSolved: 4 },
    { day: '周六', problemsSolved: 8 },
    { day: '周日', problemsSolved: 6 },
  ],
  difficultyDistribution: [
    { name: '简单', value: 24 },
    { name: '中等', value: 18 },
    { name: '困难', value: 6 },
  ]
};

const MOCK_WRONG_PROBLEMS: WrongProblem[] = [
  { id: 15, title: '最长公共前缀', category: '字符串', difficulty: 'easy', lastAttempt: '2023-11-15', mistakeCount: 2 },
  { id: 23, title: '三数之和', category: '数组', difficulty: 'medium', lastAttempt: '2023-11-18', mistakeCount: 3 },
  { id: 42, title: '接雨水', category: '数组', difficulty: 'hard', lastAttempt: '2023-11-20', mistakeCount: 5 },
  { id: 76, title: '最小覆盖子串', category: '字符串', difficulty: 'hard', lastAttempt: '2023-11-22', mistakeCount: 4 }
];

const MOCK_BOOKMARKED_PROBLEMS: BookmarkedProblem[] = [
  { id: 5, title: '最长回文子串', category: '字符串', difficulty: 'medium', lastAttempt: '2023-11-10', addedDate: '2023-11-05' },
  { id: 10, title: '正则表达式匹配', category: '字符串', difficulty: 'hard', lastAttempt: '2023-11-12', addedDate: '2023-11-08' },
  { id: 22, title: '括号生成', category: '字符串', difficulty: 'medium', lastAttempt: '2023-11-14', addedDate: '2023-11-10' },
  { id: 30, title: '串联所有单词的子串', category: '字符串', difficulty: 'hard', lastAttempt: '2023-11-16', addedDate: '2023-11-12' }
];

const COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

// 生成访问热力图数据
const generateHeatmapData = () => {
  const data = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 8),
      weekDay: date.getDay()
    });
  }
  return data;
};

const HEATMAP_DATA = generateHeatmapData();

export default function ProfilePanel() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // 状态管理
  const [activeTab, setActiveTab] = useState('stats');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [learningStats, setLearningStats] = useState<LearningStats | null>(null);
  const [wrongProblems, setWrongProblems] = useState<WrongProblem[]>([]);
  const [bookmarkedProblems, setBookmarkedProblems] = useState<BookmarkedProblem[]>([]);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);

  // 数据初始化 - 从LocalStorage读取
  useEffect(() => {
    const loadUserData = () => {
      try {
        // 从LocalStorage读取用户数据
        const savedProfile = localStorage.getItem('userProfile');
        const savedStats = localStorage.getItem('learningStats');
        const savedWrongProblems = localStorage.getItem('wrongProblems');
        const savedBookmarkedProblems = localStorage.getItem('bookmarkedProblems');

        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile));
          setEditedProfile(JSON.parse(savedProfile));
        } else {
          // 如果本地存储没有数据，使用模拟数据并保存
          setUserProfile(MOCK_USER_PROFILE);
          setEditedProfile(MOCK_USER_PROFILE);
          localStorage.setItem('userProfile', JSON.stringify(MOCK_USER_PROFILE));
        }

        if (savedStats) {
          setLearningStats(JSON.parse(savedStats));
        } else {
          setLearningStats(MOCK_LEARNING_STATS);
          localStorage.setItem('learningStats', JSON.stringify(MOCK_LEARNING_STATS));
        }

        if (savedWrongProblems) {
          setWrongProblems(JSON.parse(savedWrongProblems));
        } else {
          setWrongProblems(MOCK_WRONG_PROBLEMS);
          localStorage.setItem('wrongProblems', JSON.stringify(MOCK_WRONG_PROBLEMS));
        }

        if (savedBookmarkedProblems) {
          setBookmarkedProblems(JSON.parse(savedBookmarkedProblems));
        } else {
          setBookmarkedProblems(MOCK_BOOKMARKED_PROBLEMS);
          localStorage.setItem('bookmarkedProblems', JSON.stringify(MOCK_BOOKMARKED_PROBLEMS));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
        // 加载失败时使用默认数据
        setUserProfile(MOCK_USER_PROFILE);
        setLearningStats(MOCK_LEARNING_STATS);
        setWrongProblems(MOCK_WRONG_PROBLEMS);
        setBookmarkedProblems(MOCK_BOOKMARKED_PROBLEMS);
      }
    };

    loadUserData();
  }, []);

  // TODO: 后续替换为实际API调用
  // const fetchData = async () => {
  //   try {
  //     const [profileRes, statsRes, wrongRes, bookmarkRes] = await Promise.all([
  //       fetch('/api/user/profile', { headers: { Authorization: `Bearer ${token}` } }),
  //       fetch('/api/user/learning-stats', { headers: { Authorization: `Bearer ${token}` } }),
  //       fetch('/api/user/wrong-problems', { headers: { Authorization: `Bearer ${token}` } }),
  //       fetch('/api/user/bookmarked-problems', { headers: { Authorization: `Bearer ${token}` } })
  //     ]);
  //
  //     const profile = await profileRes.json();
  //     const stats = await statsRes.json();
  //     const wrong = await wrongRes.json();
  //     const bookmarked = await bookmarkRes.json();
  //
  //     setUserProfile(profile);
  //     setLearningStats(stats);
  //     setWrongProblems(wrong);
  //     setBookmarkedProblems(bookmarked);
  //   } catch (error) {
  //     console.error('Failed to fetch data:', error);
  //   }
  // };

  const handleProfileSave = () => {
    if (editedProfile) {
      setUserProfile(editedProfile);
      setIsEditingProfile(false);
      
      // 保存到LocalStorage
      localStorage.setItem('userProfile', JSON.stringify(editedProfile));
      
      toast.success('个人资料更新成功！');
      // TODO: 后续添加API调用
      // await fetch('/api/user/profile', { 
      //   method: 'PUT', 
      //   headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      //   body: JSON.stringify(editedProfile) 
      // })
    }
  };

  const removeFromWrongProblems = (id: number) => {
    const updated = wrongProblems.filter(problem => problem.id !== id);
    setWrongProblems(updated);
    localStorage.setItem('wrongProblems', JSON.stringify(updated));
    toast.success('已从错题本中移除');
    // TODO: 后续添加API调用
  };

  const toggleBookmark = (problemId: number) => {
    const isBookmarked = bookmarkedProblems.some(p => p.id === problemId);
    let updated: BookmarkedProblem[];
    
    if (isBookmarked) {
      updated = bookmarkedProblems.filter(p => p.id !== problemId);
      toast.success('已取消收藏');
    } else {
      // 从错题本或其他地方找到该题目
      const problem = wrongProblems.find(p => p.id === problemId);
      if (problem) {
        const newBookmark: BookmarkedProblem = {
          id: problem.id,
          title: problem.title,
          category: problem.category,
          difficulty: problem.difficulty,
          lastAttempt: problem.lastAttempt,
          addedDate: new Date().toISOString().split('T')[0]
        };
        updated = [...bookmarkedProblems, newBookmark];
      } else {
        return;
      }
      toast.success('已添加到收藏');
    }
    
    setBookmarkedProblems(updated);
    localStorage.setItem('bookmarkedProblems', JSON.stringify(updated));
    // TODO: 后续添加API调用
  };

  // 处理头像上传
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小 (限制为 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过 5MB');
      return;
    }

    // 读取本地文件并预览
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      // 更新本地预览和状态
      if (userProfile) {
        const updatedProfile = {
          ...userProfile,
          avatar: imageUrl
        };
        setUserProfile(updatedProfile);
        setEditedProfile(updatedProfile);
        
        // 保存到LocalStorage
        localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
        
        toast.success('头像已更新');
      }

      // TODO: 后续添加API调用上传到服务器
      // uploadAvatarToServer(file, imageUrl);
    };

    reader.onerror = () => {
      toast.error('读取文件失败');
    };

    reader.readAsDataURL(file);

    // 重置文件输入
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 触发文件上传对话框
  const triggerAvatarUpload = () => {
    fileInputRef.current?.click();
  };

  // 返回题目页面
  const handleBackToProblems = () => {
    navigate('/problems');
  };

  // 登出处理
  const handleLogout = () => {
    // 清除所有本地数据
    localStorage.removeItem('userProfile');
    localStorage.removeItem('learningStats');
    localStorage.removeItem('wrongProblems');
    localStorage.removeItem('bookmarkedProblems');
    localStorage.removeItem('authToken'); // 如果有token的话
    
    toast.success('已登出');
    setShowLogoutConfirm(false);
    
    // 跳转到主页面
    navigate('/');
  };

  // 重置用户数据
  const handleResetData = () => {
    if (confirm('确定要重置所有学习数据吗？此操作无法撤销。')) {
      setUserProfile(MOCK_USER_PROFILE);
      setEditedProfile(MOCK_USER_PROFILE);
      setLearningStats(MOCK_LEARNING_STATS);
      setWrongProblems(MOCK_WRONG_PROBLEMS);
      setBookmarkedProblems(MOCK_BOOKMARKED_PROBLEMS);
      
      localStorage.setItem('userProfile', JSON.stringify(MOCK_USER_PROFILE));
      localStorage.setItem('learningStats', JSON.stringify(MOCK_LEARNING_STATS));
      localStorage.setItem('wrongProblems', JSON.stringify(MOCK_WRONG_PROBLEMS));
      localStorage.setItem('bookmarkedProblems', JSON.stringify(MOCK_BOOKMARKED_PROBLEMS));
      
      toast.success('数据已重置');
      
      // TODO: 后续添加API调用
      // await fetch('/api/user/reset', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
    }
  };

  const completionPercentage = learningStats 
    ? Math.round((learningStats.completedProblems / learningStats.totalProblems) * 100)
    : 0;

  const getHeatmapColor = (count: number) => {
    if (count === 0) return '#ebedf0';
    if (count === 1) return '#c6e48b';
    if (count === 2) return '#7bc96f';
    if (count <= 4) return '#239a3b';
    return '#196127';
  };

  // 按周分组热力图数据
  const groupedHeatmap = [];
  for (let i = 0; i < HEATMAP_DATA.length; i += 7) {
    groupedHeatmap.push(HEATMAP_DATA.slice(i, i + 7));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* 固定导航栏 */}
      <div className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <button
            onClick={handleBackToProblems}
            className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 transition-all duration-300 group"
            title="返回题目选择"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" stroke="currentColor" />
            </svg>
          </button>
          <span className=" text-slate-600  text-center">个人资料</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {userProfile && (
              <>
                {/* 主卡片 - 头像和基础信息 */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200/50 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* 背景装饰 */}
                  <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml?base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9InBhdHRlcm4iIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCI+PHBhdGggZD0iTTAgMzBMMzAgMEw2MCwzMEwzMCA2MCBaIiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMC41Ii8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iNjAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNwYXR0ZXJuKSIvPjwvc3ZnPg==')]"></div>
                  </div>

                  {/* 头像和信息 */}
                  <div className="px-6 pb-6">
                    <div className="flex flex-col items-center -mt-16 mb-4">
                      <div className="relative group mb-4">
                        <img 
                          src={userProfile.avatar} 
                          alt={`${userProfile.firstName}${userProfile.lastName}`} 
                          className="w-44 h-44 rounded-full border-4 border-white object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                        />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400/0 via-purple-400/0 to-pink-400/20 group-hover:to-pink-400/40 transition-all"></div>
                        
                        {/* 上传按钮 */}
                        <button
                          onClick={triggerAvatarUpload}
                          disabled={avatarUploading}
                          className="absolute bottom-2 right-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 p-2.5 rounded-full border-2 border-white text-white transition-all shadow-lg hover:shadow-xl"
                          title="上传新头像"
                        >
                          {avatarUploading ? (
                            <i className="fa-solid fa-spinner animate-spin text-sm"></i>
                          ) : (
                            <i className="fa-solid fa-camera text-sm"></i>
                          )}
                        </button>
                      </div>

                      {/* 隐藏的文件输入 */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                        aria-label="上传头像"
                      />

                      <h1 className="text-2xl font-bold text-slate-900 text-center mb-1">{userProfile.firstName}{userProfile.lastName}</h1>
                      <p className="text-slate-500 text-sm text-center mb-3">用户ID: {userProfile.userId}</p>
                    </div>

                    {/* 个人简介 */}
                    <p className="text-slate-600 text-sm leading-relaxed text-center mb-4">{userProfile.bio}</p>

                    {/* 加入时间 */}
                    <div className="text-center text-xs text-slate-600 mb-4 pb-4 border-b border-slate-200/50">
                      <i className="fa-solid fa-calendar mr-1.5 text-indigo-500"></i>
                      加入于 {userProfile.createdAt}
                    </div>

                    {/* 统计数据 - 三列 */}
                    <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-slate-200/50 text-center">
                      <div>
                        <p className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{learningStats?.completedProblems || 0}</p>
                        <p className="text-xs text-slate-600 mt-0.5">已完成</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">{learningStats?.dailyStreak || 0}</p>
                        <p className="text-xs text-slate-600 mt-0.5">连续天数</p>
                      </div>
                      <div>
                        <p className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{learningStats?.accuracyRate.toFixed(1) || 0}%</p>
                        <p className="text-xs text-slate-600 mt-0.5">准确率</p>
                      </div>
                    </div>

                    {/* 关注者 */}
                    <div className="flex justify-center gap-8 text-sm mb-4 pb-4 border-b border-slate-200/50">
                      <div className="text-center">
                        <span className="font-bold text-slate-900 text-lg block">0</span>
                        <span className="text-slate-600 text-xs">关注者</span>
                      </div>
                      <div className="text-center">
                        <span className="font-bold text-slate-900 text-lg block">0</span>
                        <span className="text-slate-600 text-xs">正在关注</span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <button 
                      onClick={() => { 
                        setIsEditingProfile(true); 
                        setEditedProfile({...userProfile}); 
                      }} 
                      className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 bg-white hover:bg-slate-50 hover:border-slate-400 transition-all duration-300 flex items-center justify-center"
                    >
                      <i className="fa-solid fa-edit mr-2"></i>编辑个人资料
                    </button>
                  </div>
                </div>

                {/* 学习进度卡片 */}
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-md border border-slate-200/50 p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-base font-bold text-slate-900 mb-4">学习进度</h3>
                  {learningStats && (
                    <div className="space-y-5">
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-600 font-medium">完成度</span>
                          <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{completionPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-indigo-500/30" style={{ width: `${completionPercentage}%` }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-2">
                          <span className="text-slate-600 font-medium">准确率</span>
                          <span className="font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{learningStats.accuracyRate}%</span>
                        </div>
                        <div className="w-full bg-slate-200/50 rounded-full h-2.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500 shadow-lg shadow-green-500/30" style={{ width: `${learningStats.accuracyRate}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 访问热力图 */}
                <div className="bg-white/80 backdrop-blur rounded-xl shadow-md border border-slate-200/50 p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-base font-bold text-slate-900 mb-4">学习热力图</h3>
                  <div className="overflow-x-auto">
                    <div className="flex gap-1 pb-4">
                      {groupedHeatmap.map((week, weekIdx) => (
                        <div key={weekIdx} className="flex flex-col gap-1">
                          {week.map((day, dayIdx) => (
                            <div
                              key={`${weekIdx}-${dayIdx}`}
                              className="w-3 h-3 rounded-sm transition-all hover:ring-2 hover:ring-offset-1 hover:ring-indigo-500 cursor-pointer"
                              style={{ backgroundColor: getHeatmapColor(day.count) }}
                              title={`${day.date}: ${day.count} 次访问`}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-slate-200/50 text-xs text-slate-600">
                    <span>较少</span>
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map(level => (
                        <div
                          key={level}
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: getHeatmapColor(level === 0 ? 0 : level === 1 ? 1 : level === 2 ? 2 : level === 3 ? 3 : 5) }}
                        />
                      ))}
                    </div>
                    <span>较多</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 space-y-6">
            {/* 标签导航 */}
            <div className="flex space-x-1 border-b border-slate-200/50 bg-white/80 backdrop-blur rounded-t-xl shadow-sm overflow-hidden">
              <button
                onClick={() => setActiveTab('stats')}
                className={cn(
                  "px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-300",
                  activeTab === 'stats'
                    ? "border-indigo-500 text-indigo-600 bg-indigo-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
                )}
              >
                <i className="fa-solid fa-chart-line mr-2"></i>学习统计
              </button>
              <button
                onClick={() => setActiveTab('wrong')}
                className={cn(
                  "px-4 py-3 text-sm font-semibold border-b-2 transition-all duration-300",
                  activeTab === 'wrong'
                    ? "border-rose-500 text-rose-600 bg-rose-50/50"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50/50"
                )}
              >
                <i className="fa-solid fa-circle-xmark mr-2"></i>错题本
              </button>
             
            </div>

            {/* 内容区 */}
            <div className="bg-white/90 backdrop-blur rounded-xl shadow-md border border-slate-200/50 p-6 hover:shadow-lg transition-shadow">
              {/* 学习统计标签 */}
              {activeTab === 'stats' && learningStats && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">学习统计</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-lg p-4 border border-slate-200/30">
                      <h3 className="text-base font-semibold text-slate-900 mb-4">周进度</h3>
                      <div className="h-64">
                        {learningStats.weeklyProgress.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={learningStats.weeklyProgress}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                              <YAxis stroke="#64748b" fontSize={12} />
                              <Tooltip 
                                formatter={(value) => [`${value}题`, '解决题目数']} 
                                contentStyle={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}}
                              />
                              <Bar dataKey="problemsSolved" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-400">暂无数据</div>
                        )}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-slate-50 to-pink-50/30 rounded-lg p-4 border border-slate-200/30">
                      <h3 className="text-base font-semibold text-slate-900 mb-4">难度分布</h3>
                      <div className="h-64 flex items-center justify-center">
                        {learningStats.difficultyDistribution.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={learningStats.difficultyDistribution} 
                                cx="50%" cy="50%" 
                                labelLine={false} 
                                outerRadius={80} 
                                dataKey="value" 
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {learningStats.difficultyDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value}题`, '数量']} contentStyle={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} />
                              <Legend wrapperStyle={{color: '#64748b'}} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="text-slate-400">暂无数据</div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 rounded-lg p-4 border border-slate-200/30">
                    <h3 className="text-base font-semibold text-slate-900 mb-4">按类别统计</h3>
                    <div className="h-80">
                      {learningStats.problemsByCategory.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            layout="vertical" 
                            data={learningStats.problemsByCategory} 
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" stroke="#64748b" fontSize={12} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" width={60} fontSize={12} />
                            <Tooltip formatter={(value) => [`${value}题`, '解决数量']} contentStyle={{backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)'}} />
                            <Bar dataKey="value" fill="#6366f1" radius={[0, 8, 8, 0]}>
                              {learningStats.problemsByCategory.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-slate-400">暂无数据</div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 错题本标签 */}
              {activeTab === 'wrong' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">错题本</h2>
                    {wrongProblems.length > 0 && (
                      <button className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors">
                        <i className="fa-solid fa-download mr-1.5"></i>导出
                      </button>
                    )}
                  </div>
                  
                  {wrongProblems.length === 0 ? (
                    <div className="text-center py-16 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-lg border border-slate-200/30">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 mb-4 shadow-lg">
                        <i className="fa-solid fa-check-circle text-green-600 text-3xl"></i>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">恭喜！没有错题</h3>
                      <p className="text-slate-600">继续保持良好的解题习惯</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-slate-200/30">
                      <table className="min-w-full divide-y divide-slate-200/50">
                        <thead className="bg-gradient-to-r from-slate-50 to-slate-100/50">
                          <tr>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">题目</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">类别</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">难度</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">错误次数</th>
                            <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-700 uppercase tracking-wide">上次尝试</th>
                            <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-700 uppercase tracking-wide">操作</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200/30">
                          {wrongProblems.map((problem) => (
                            <tr key={problem.id} className="hover:bg-indigo-50/50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <button onClick={() => navigate(`/problems/${problem.id}`)} className="text-indigo-600 hover:text-indigo-700 font-semibold hover:underline text-sm">
                                  {problem.title}
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-700 rounded-full border border-indigo-200/50">
                                  {problem.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={cn(
                                  "px-3 py-1 text-xs font-semibold rounded-full border",
                                  problem.difficulty === 'easy' ? "bg-gradient-to-r from-green-100 to-emerald-50 text-green-700 border-green-200/50" :
                                  problem.difficulty === 'medium' ? "bg-gradient-to-r from-amber-100 to-yellow-50 text-amber-700 border-amber-200/50" :
                                  "bg-gradient-to-r from-rose-100 to-red-50 text-rose-700 border-rose-200/50"
                                )}>
                                  {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{problem.mistakeCount}次</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{problem.lastAttempt}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                                <div className="flex justify-end space-x-3">
                                  <button onClick={() => navigate(`/problems/${problem.id}`)} className="text-indigo-600 hover:text-indigo-700 font-semibold hover:bg-indigo-50 px-2.5 py-1 rounded transition-colors">重练</button>
                                  <button onClick={() => removeFromWrongProblems(problem.id)} className="text-rose-600 hover:text-rose-700 font-semibold hover:bg-rose-50 px-2.5 py-1 rounded transition-colors">移除</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 登出确认对话框 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200/50">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
                <i className="fa-solid fa-sign-out-alt text-red-600 text-lg"></i>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-2">确认登出？</h2>
              <p className="text-slate-600 text-sm mb-6">
                登出后，您的本地数据将被保留，下次登录时可继续使用。
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-all"
                >
                  确认登出
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑个人资料模态框 */}
      {isEditingProfile && editedProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/50">
            <div className="flex justify-between items-center p-6 border-b border-slate-200/50 bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
              <h2 className="text-lg font-bold text-slate-900">编辑个人资料</h2>
              <button onClick={() => setIsEditingProfile(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>
            <form className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">姓</label>
                  <input 
                    type="text" 
                    value={editedProfile.firstName}
                    onChange={(e) => setEditedProfile({...editedProfile, firstName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-900 mb-2">名</label>
                  <input 
                    type="text" 
                    value={editedProfile.lastName}
                    onChange={(e) => setEditedProfile({...editedProfile, lastName: e.target.value})}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-900 mb-2">个人简介</label>
                <textarea 
                  value={editedProfile.bio}
                  onChange={(e) => setEditedProfile({...editedProfile, bio: e.target.value})}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all h-24 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200/50">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)} 
                  className="px-5 py-2.5 border border-slate-200 rounded-lg shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all"
                >
                  取消
                </button>
                <button 
                  type="button" 
                  onClick={handleProfileSave} 
                  className="px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all"
                >
                  保存更改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
