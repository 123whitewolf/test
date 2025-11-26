import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ProfilePanel from "@/pages/ProfilePanel";
import AIGeneratePanel from "@/pages/AIGeneratePanel";
import BookmarkPanel from "@/pages/BookmarkPanel";
import { useContext } from "react";
import { AuthContext } from "@/contexts/authContext";
import { api } from "@/lib/api";
import { Problem, CATEGORIES, getProblemTypeIcon, getProblemTypeName } from "@/data";
//- 引入自定义组件
import SmoothDropdown from "@/components/SmoothDropdown";
import Input  from "@/components/input";
import Checkbox2 from "@/components/CusomCheckbox2";
import AvatarButton from "@/components/setting";
import SettingMenu from "@/components/setting_show";
import BookmarkCheckbox from "@/components/CusomCheckbox3";


export default function ProblemSelectionPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);
  const [showBookmarked, setShowBookmarked] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeView, setActiveView] = useState<
    "problems" | "profile" | "ai-generate" | "bookmarks"
  >("problems");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false); // 控制设置菜单的显示状态
  const [bgColor, setBgColor] = useState(
    "bg-gradient-to-br  from-blue-100 to-blue-100 "
  ); // 当前背景颜色
  
  // 获取用户头像
  const getUserAvatar = () => {
    try {
      const userProfile = localStorage.getItem('userProfile');
      if (userProfile) {
        const parsedProfile = JSON.parse(userProfile);
        return parsedProfile.avatar;
      }
    } catch (error) {
      console.error('Failed to get user avatar:', error);
    }
    // 默认头像
    return "https://picsum.photos/seed/defaultuser/100/100.jpg";
  };
  

  
  const userAvatar = getUserAvatar();

//! 处理AI生成的题目
  const handleGeneratedProblems = (problems: any[]) => {
    // 将生成的题目添加到问题列表中
    const newProblems = problems.map((problem) => ({
      ...problem,
      completed: false,
      bookmarked: false,
      通过率: 0,
    }));

    setProblems((prev) => [...prev, ...newProblems]);
    setFilteredProblems((prev) => [...prev, ...newProblems]);

    // 切换到题目视图
    setActiveView("problems");
    toast.success("题目已添加到题库！");
  };

  const problemsPerPage = 6;

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext); // 使用 AuthContext 中的 logout 函数

  //! 当导航栏关闭时，自动关闭设置菜单
  useEffect(() => {
    if (sidebarCollapsed) {
      setShowSettingsMenu(false);
    }
  }, [sidebarCollapsed]);

  //! 全局点击检测，当点击页面上任何一点时关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查点击是否在用户菜单内部
      const userMenu = document.querySelector(".absolute.top-12.right-0");
      const avatarButton = document.querySelector(".avatar-button");
      
      if (userMenu && !userMenu.contains(event.target as Node) && 
          avatarButton && !avatarButton.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };

    // 当用户菜单显示时，添加全局点击监听
    if (showSettingsMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    // 清理函数，移除事件监听
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettingsMenu]);

  //! 退出登录函数
  const handleLogout = () => {
    localStorage.removeItem("userProblems"); // 清除题目数据
    logout(); // 调用 AuthContext 中的 logout 函数
    setShowSettingsMenu(false); // 关闭用户菜单
  };

  //! 切换设置菜单显示状态
  const toggleSettingsMenu = () => {
    setShowSettingsMenu(!showSettingsMenu);
  };

  useEffect(() => {
    const loadProblems = async () => {
      try {
        // 从 API 获取数据
        const problems = await api.getProblems();
        setProblems(problems);
        localStorage.setItem("userProblems", JSON.stringify(problems));
      } catch (error) {
        console.error("Failed to load problems:", error);
        toast.error("加载题目失败");
      }
    };

    loadProblems();

    // 监听收藏状态更新事件
    const handleBookmarksUpdated = (event: CustomEvent) => {
      setProblems(event.detail.updatedProblems);
    };

    // 监听导航到题目列表的事件
    const handleNavigateToProblems = () => {
      setActiveView("problems");
    };

    window.addEventListener(
      "bookmarksUpdated",
      handleBookmarksUpdated as EventListener
    );
    window.addEventListener("navigateToProblems", handleNavigateToProblems);

    // 清理函数
    return () => {
      window.removeEventListener(
        "bookmarksUpdated",
        handleBookmarksUpdated as EventListener
      );
      window.removeEventListener(
        "navigateToProblems",
        handleNavigateToProblems
      );
    };
  }, []);

  // 过滤题目
  useEffect(() => {
    let result = [...problems];

    // 学科分类过滤
    if (selectedCategory !== "全部") {
      result = result.filter(
        (problem) => problem.category === selectedCategory
      );
    }

    // 难度过滤
    if (difficultyFilter.length > 0) {
      result = result.filter((problem) =>
        difficultyFilter.includes(problem.difficulty)
      );
    }

    // 搜索过滤
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (problem) =>
          problem.title.toLowerCase().includes(query) ||
          problem.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // 已完成过滤
    if (!showCompleted) {
      result = result.filter((problem) => !problem.completed);
    }

    // 收藏过滤
    if (showBookmarked) {
      result = result.filter((problem) => problem.bookmarked);
    }

    setFilteredProblems(result);
    setCurrentPage(1); // 重置到第一页
  }, [
    problems,
    selectedCategory,
    difficultyFilter,
    searchQuery,
    showCompleted,
    showBookmarked,
  ]);

  // 切换题目收藏状态
  const toggleBookmark = async (id: number) => {
    try {
      const problem = problems.find((p) => p.id === id);
      if (problem) {
        const updatedProblem = await api.updateProblem(id, {
          bookmarked: !problem.bookmarked,
        });

        const updatedProblems = problems.map((p) =>
          p.id === id ? updatedProblem : p
        );

        setProblems(updatedProblems);
        localStorage.setItem("userProblems", JSON.stringify(updatedProblems));
        toast.success(
          `题目已${updatedProblem.bookmarked ? "收藏" : "取消收藏"}`
        );

        // 触发自定义事件，通知其他组件收藏状态已更新
        window.dispatchEvent(
          new CustomEvent("bookmarksUpdated", {
            detail: { updatedProblems },
          })
        );
      }
    } catch (error) {
      console.error("Failed to update bookmark:", error);
      toast.error("操作失败");
    }
  };

  // 导航到题目详情页
  const navigateToProblem = (id: number) => {
    navigate(`/problems/${id}`);
  };

  // 处理难度过滤切换
  const handleDifficultyToggle = (difficulty: string) => {
    setDifficultyFilter((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  // 计算当前页显示的题目
  const indexOfLastProblem = currentPage * problemsPerPage;
  const indexOfFirstProblem = indexOfLastProblem - problemsPerPage;
  const currentProblems = filteredProblems.slice(
    indexOfFirstProblem,
    indexOfLastProblem
  );
  const totalPages = Math.ceil(filteredProblems.length / problemsPerPage);

  // 生成页码数组
  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br">
      {/* 顶部导航栏 */}
      <header className={cn("shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center", bgColor)}>
        <div className="flex items-center">
          <i className="fa-solid fa-code text-blue-600 text-2xl"></i>
          <span className="ml-2 text-xl font-bold text-gray-900">XUTCode</span>
        </div>
        <div className="relative">
        <AvatarButton 
          avatarUrl={userAvatar} 
          onClick={toggleSettingsMenu}
        />
        
        {/* 设置弹出菜单 - 使用SettingMenu组件 */}
        {showSettingsMenu && (
          <div className="absolute top-12 right-0 z-50 overflow-hidden transition-all duration-200 transform origin-top-right animate-scaleIn">
            <SettingMenu onLogout={handleLogout} />
          </div>
        )}
      </div>
      </header>
      
      <div className="flex flex-1 overflow-hidden relative">
        {/* 左侧导航栏 */}
        <aside
          className={cn(
            bgColor,
            "fixed md:static inset-y-0 left-0 z-50 shadow-lg border-r-2 border-gray-200transition-all duration-500 ease-in-out flex-shrink-0",
            sidebarCollapsed ? "translate-x-0 w-16" : "translate-x-0 w-64"
          )}
        >
          {/* 边框栏收缩/展开按钮 - 灵动设计 */}
          <button
            onClick={() => {
              setSidebarCollapsed(!sidebarCollapsed);
            }}
            className="text-gray-600 hover:text-blue-600 p-2 absolute -right-4 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-white to-gray-50 rounded-full shadow-lg border border-gray-200 transition-all duration-300 hover:scale-110 hover:shadow-xl hover:border-blue-300 flex items-center justify-center"
          >
            {sidebarCollapsed ? (
              <i className="iconfont icon-forward_line text-sm transform transition-transform duration-300 hover:translate-x-1"></i>
            ) : (
              <i className="iconfont icon-backward_line text-sm transform transition-transform duration-300 hover:-translate-x-1"></i>
            )}
          </button>
          <div className="h-full flex flex-col">
           
            <div
              className={`flex-1 overflow-y-auto transition-all duration-500 ${
                sidebarCollapsed ? "p-2" : "p-4"
              }`}
            >
              <nav className="space-y-1">
               
                <button
                  onClick={() => setActiveView("problems")}
                  className={cn(
                    "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                    activeView === "problems"
                      ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-blue-600 hover:shadow-sm"
                  )}
                >
                  <i className="fa-solid fa-list-ul flex-shrink-0 transition-transform duration-300 group-hover:scale-110"></i>
                  {!sidebarCollapsed && (
                    <span className="ml-3 whitespace-nowrap transition-all duration-300 group-hover:translate-x-1">
                      题目列表
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveView("bookmarks")}
                  className={cn(
                    "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                    activeView === "bookmarks"
                      ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-blue-600 hover:shadow-sm"
                  )}
                >
                  <i className="fa-solid fa-bookmark flex-shrink-0 transition-transform duration-300 group-hover:scale-110"></i>
                  {!sidebarCollapsed && (
                    <span className="ml-3 whitespace-nowrap transition-all duration-300 group-hover:translate-x-1">
                      我的收藏
                    </span>
                  )}
                </button>

                <div
                  className={`pt-4 pb-2 transition-all duration-500 ${
                    sidebarCollapsed ? "px-2" : "px-4"
                  }`}
                >
                  {!sidebarCollapsed && (
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider transition-opacity duration-300">
                      功能
                    </h3>
                  )}
                </div>

                <button
                  onClick={() => setActiveView("ai-generate")}
                  className={cn(
                    "w-full flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-300",
                    activeView === "ai-generate"
                      ? "text-blue-600 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm"
                      : "text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:text-blue-600 hover:shadow-sm"
                  )}
                >
                  <i className="fa-solid fa-magic flex-shrink-0 transition-transform duration-300 group-hover:scale-110"></i>
                  {!sidebarCollapsed && (
                    <span className="ml-3 whitespace-nowrap transition-all duration-300 group-hover:translate-x-1">
                      AI 题目生成
                    </span>
                  )}
                </button>
              </nav>
            </div>


          </div>
        </aside>

        {/* 主内容区 - 使用padding-left而不是margin来避免布局偏移 */}
        <main
          className={cn(
            "flex-grow overflow-y-auto p-4 sm:p-6 lg:p-8 transition-all duration-300",
            bgColor,
            sidebarCollapsed ? "md:pl-10" : "md:pl-72"
          )}
        >
          <div>
            {activeView === "problems" ? (
              <>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    题目列表
                  </h1>
                  <p className="text-gray-500">
                    探索别样的世界,提升自己的能力📚
                  </p>
                </div>

                {/* 搜索和筛选区 */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 搜索框 */}
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      </div>
                    <Input 
                      
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
    
                      />
                    </div>

                    {/* 分类筛选 */}
                    <div>
                      <SmoothDropdown
                        options={CATEGORIES}
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        placeholder="选择分类"
                      />
                    </div>

                    {/* 难度筛选 */}
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium text-gray-700">
                        难度:
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDifficultyToggle("easy")}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition duration-200",
                            difficultyFilter.includes("easy")
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          )}
                          aria-label="筛选简单难度题目"
                        >
                          <i className="fa-solid fa-check mr-1"></i>
                          简单
                        </button>
                        <button
                          onClick={() => handleDifficultyToggle("medium")}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition duration-200",
                            difficultyFilter.includes("medium")
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          )}
                          aria-label="筛选中等难度题目"
                        >
                          <i className="fa-solid fa-check mr-1"></i>
                          中等
                        </button>
                        <button
                          onClick={() => handleDifficultyToggle("hard")}
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-medium transition duration-200",
                            difficultyFilter.includes("hard")
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                          )}
                          aria-label="筛选困难难度题目"
                        >
                          <i className="fa-solid fa-check mr-1"></i>
                          困难
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 额外筛选选项 */}
                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex items-center">
                      <Checkbox2
                        id="showCompleted"
                        checked={showCompleted}
                        onChange={setShowCompleted}
                      />
                      <label
                        htmlFor="showCompleted"
                        className="ml-2 block text-sm text-gray-700"
                      >
                        显示已完成题目
                      </label>
                    </div>
                  </div>
                </div>

                {/* 题目列表 */}
                {filteredProblems.length > 0 ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {currentProblems.map((problem) => (
                        <div
                          key={problem.id}
                          className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 transition-all duration-300 hover:shadow-md hover:-translate-y-1 group "
                        >
                          <div
                            className="p-6 cursor-pointer"
                            onClick={() => navigateToProblem(problem.id)}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {problem.title}
                              </h3>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(problem.id);
                                }}
                                className="cursor-pointer"
                                aria-label={
                                  problem.bookmarked
                                    ? "取消收藏此题目"
                                    : "收藏此题目"
                                }
                              >
                                <BookmarkCheckbox 
                                  checked={problem.bookmarked}
                                  onChange={(checked) => {
                                    if (checked !== problem.bookmarked) {
                                      toggleBookmark(problem.id);
                                    }
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mb-4">
                              <span
                                className={cn(
                                  "px-2.5 py-0.5 rounded-full text-xs font-medium",
                                  problem.difficulty === "easy"
                                    ? "bg-green-100 text-green-800"
                                    : problem.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                                )}
                              >
                                {problem.difficulty === "easy"
                                  ? "简单"
                                  : problem.difficulty === "medium"
                                  ? "中等"
                                  : "困难"}
                              </span>
                              {/* 类型标签 */}
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {problem.category}
                              </span>
                              {/* 题目类型 */}
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 flex items-center">
                                <i
                                  className={`fas ${getProblemTypeIcon(
                                    problem.template
                                  )} mr-1`}
                                ></i>
                                {getProblemTypeName(problem.template)}
                              </span>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4">
                              {problem.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            <div className="flex justify-between items-center text-sm">
                              <div className="flex items-center text-gray-500">
                                <i className="fa-solid fa-check-circle mr-1"></i>
                                <span>通过率: {problem.通过率}%</span>
                              </div>

                              {problem.completed && (
                                <span className="flex items-center text-green-600">
                                  <i className="fa-solid fa-check mr-1"></i>
                                  <span>已完成</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 分页控件 */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-10">
                        <nav className="inline-flex rounded-md shadow">
                          <button
                            onClick={() =>
                              setCurrentPage((prev) => Math.max(prev - 1, 1))
                            }
                            disabled={currentPage === 1}
                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="上一页"
                          >
                            <i className="fa-solid fa-chevron-left text-xs"></i>
                            <span className="sr-only">上一页</span>
                          </button>

                          {pageNumbers.map((number) => (
                            <button
                              key={number}
                              onClick={() => setCurrentPage(number)}
                              className={cn(
                                "relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium",
                                currentPage === number
                                  ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                  : "text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {number}
                            </button>
                          ))}

                          <button
                            onClick={() =>
                              setCurrentPage((prev) =>
                                Math.min(prev + 1, totalPages)
                              )
                            }
                            disabled={currentPage === totalPages}
                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="下一页"
                          >
                            <i className="fa-solid fa-chevron-right text-xs"></i>
                            <span className="sr-only">下一页</span>
                          </button>
                        </nav>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                      <i className="fa-solid fa-search text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      未找到题目
                    </h3>
                    <p className="text-gray-500 mb-6">
                      尝试调整筛选条件或搜索其他关键词
                    </p>
                    <button
                      onClick={() => {
                        setSelectedCategory("全部");
                        setDifficultyFilter([]);
                        setSearchQuery("");
                        setShowCompleted(true);
                        setShowBookmarked(false);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      重置筛选条件
                    </button>
                  </div>
                )}
              </>
            ) : activeView === "profile" ? (
              <ProfilePanel />
            ) : activeView === "bookmarks" ? (
              <BookmarkPanel />
            ) : (
              <AIGeneratePanel onProblemsGenerated={handleGeneratedProblems} />
            )}
          </div>
        </main>
      </div>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} XUTCode. 保留所有权利.
            </p>
            <div className="flex space-x-6 mt-2 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fa-solid fa-question-circle"></i>
                <span className="ml-1">帮助中心</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fa-solid fa-file-text"></i>
                <span className="ml-1">使用条款</span>
              </a>
              <a href="#" className="text-gray-400 hover:text-gray-500">
                <i className="fa-solid fa-shield"></i>
                <span className="ml-1">隐私政策</span>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
