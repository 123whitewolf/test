import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "../lib/api";
import { Problem, CATEGORIES, getProblemTypeIcon, getProblemTypeName } from "@/data";
import SmoothDropdown from "../components/SmoothDropdown";
import Checkbox2 from "@/components/CusomCheckbox2";
import Input from "@/components/input";

export default function BookmarkPanel() {
  const navigate = useNavigate();
  const [bookmarkedProblems, setBookmarkedProblems] = useState<Problem[]>([]);
  const [filteredProblems, setFilteredProblems] = useState<Problem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const problemsPerPage = 6;

  // 初始化收藏题目数据
  useEffect(() => {
    const loadBookmarkedProblems = async () => {
      try {
        // 从 localStorage 获取所有题目
        const savedProblems = localStorage.getItem("userProblems");
        
        if (savedProblems) {
          // 如果有本地存储的数据，使用它
          const allProblems = JSON.parse(savedProblems);
          // 只获取收藏的题目
          const bookmarked = allProblems.filter((problem: any) => problem.bookmarked);
          setBookmarkedProblems(bookmarked);
        } else {
          // 否则从 API 获取数据
          const allProblems = await api.getProblems();
          // 只获取收藏的题目
          const bookmarked = allProblems.filter(problem => problem.bookmarked);
          setBookmarkedProblems(bookmarked);
        }
      } catch (error) {
        console.error('Failed to load bookmarked problems:', error);
        toast.error('加载收藏题目失败');
      }
    };

    loadBookmarkedProblems();
    
    // 监听收藏状态更新事件
    const handleBookmarksUpdated = (event: CustomEvent) => {
      if (event.detail && event.detail.updatedProblems) {
        const bookmarked = event.detail.updatedProblems.filter((problem: any) => problem.bookmarked);
        setBookmarkedProblems(bookmarked);
      }
    };
    
    window.addEventListener("bookmarksUpdated", handleBookmarksUpdated as EventListener);
    
    // 清理函数
    return () => {
      window.removeEventListener("bookmarksUpdated", handleBookmarksUpdated as EventListener);
    };
  }, []);

  // 过滤题目
  useEffect(() => {
    let result = [...bookmarkedProblems];

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

    setFilteredProblems(result);
    setCurrentPage(1); // 重置到第一页
  }, [
    bookmarkedProblems,
    selectedCategory,
    difficultyFilter,
    searchQuery,
    showCompleted,
  ]);

  // 取消收藏
  const removeBookmark = async (id: number) => {
    try {
      const problem = bookmarkedProblems.find(p => p.id === id);
      if (problem) {
        const updatedProblem = await api.updateProblem(id, {
          bookmarked: false
        });
        
        // 更新收藏题目列表
        const updatedBookmarkedProblems = bookmarkedProblems.filter(p => p.id !== id);
        setBookmarkedProblems(updatedBookmarkedProblems);
        
        // 更新 localStorage 中的所有题目数据
        const savedProblems = localStorage.getItem("userProblems");
        if (savedProblems) {
          const allProblems = JSON.parse(savedProblems);
          const updatedAllProblems = allProblems.map((p: Problem) => 
            p.id === id ? updatedProblem : p
          );
          localStorage.setItem("userProblems", JSON.stringify(updatedAllProblems));
          
          // 触发自定义事件，通知其他组件收藏状态已更新
          window.dispatchEvent(
            new CustomEvent("bookmarksUpdated", {
              detail: { updatedProblems: updatedAllProblems },
            })
          );
        }
        
        toast.success("已取消收藏");
      }
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
      toast.error('操作失败');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            我的收藏
          </h1>
          <p className="text-gray-500">
            管理您收藏的题目，随时回顾和学习📚
          </p>
        </div>

        {/* 搜索和筛选区 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 搜索框 */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fa-solid fa-search text-gray-400"></i>
              </div>
              <Input
                placeholder="搜索收藏的题目..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            {/* 分类筛选 */}
            <div>
              <SmoothDropdown
                options={CATEGORIES}
                value={selectedCategory}
                onChange={(value) => setSelectedCategory(value)}
                placeholder="选择分类"
                className="w-full"
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

        {/* 收藏题目列表 */}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBookmark(problem.id);
                        }}
                        className="text-yellow-500 hover:text-yellow-600 transition-colors"
                        aria-label="取消收藏此题目"
                      >
                        <i className="fa-solid fa-bookmark text-yellow-500"></i>
                        <span className="sr-only">已收藏</span>
                      </button>
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
              <i className="fa-solid fa-bookmark text-gray-400 text-2xl"></i>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              暂无收藏题目
            </h3>
            <p className="text-gray-500 mb-6">
              收藏您感兴趣的题目，方便随时查看
            </p>
           
          </div>
        )}
      </div>
    </div>
  );
}