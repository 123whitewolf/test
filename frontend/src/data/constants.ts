
// 题目分类
export const CATEGORIES = [
  "全部",
  "计算机组成原理",
  "数据结构",
  "计算机网络",
  "操作系统",
  "算法分析",
];

// 题目难度
export const DIFFICULTY_LEVELS = [
  { value: "easy", label: "简单", color: "text-green-600" },
  { value: "medium", label: "中等", color: "text-yellow-600" },
  { value: "hard", label: "困难", color: "text-red-600" },
];

// 题目类型
export const PROBLEM_TEMPLATES = [
  { value: "multiple-choice", label: "选择题", icon: "fa-circle-check" },
  { value: "coding", label: "编程题", icon: "fa-code" },
  { value: "essay", label: "解答题", icon: "fa-pen-to-square" },
];

// 获取题目类型图标
export const getProblemTypeIcon = (template: string): string => {
  const type = PROBLEM_TEMPLATES.find(t => t.value === template);
  return type ? type.icon : "fa-question";
};

// 获取题目类型名称
export const getProblemTypeName = (template: string): string => {
  const type = PROBLEM_TEMPLATES.find(t => t.value === template);
  return type ? type.label : "未知类型";
};

// 获取难度等级名称和颜色
export const getDifficultyInfo = (difficulty: string) => {
  const level = DIFFICULTY_LEVELS.find(l => l.value === difficulty);
  return level ? { label: level.label, color: level.color } : { label: "未知", color: "text-gray-600" };
};


// 本地存储键名
export const STORAGE_KEYS = {
  USER: "user",
  USER_PROFILE: "userProfile",
  USER_PROBLEMS: "userProblems",
  THEME: "theme",
  SETTINGS: "settings",
};

// 分页设置
export const PAGINATION = {
  PROBLEMS_PER_PAGE: 6,
  BOOKMARKS_PER_PAGE: 10,
};

