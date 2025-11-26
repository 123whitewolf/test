// 题目界面颜色设置
export const PROBLEM_COLORS = {
  // 选择题界面
  MULTIPLE_CHOICE: {
    BACKGROUND: "bg-gray-50",
    OPTION_BACKGROUND: "bg-white",
    OPTION_BORDER: "border-gray-300",
    OPTION_HOVER: "hover:bg-blue-50",
    OPTION_SELECTED: "bg-blue-100 border-blue-500",
  },
  // 编程题界面
  CODING: {
    // ========== 顶部导航栏区域 ==========
    // 顶部导航栏整体背景和边框
    HEADER_BACKGROUND: "bg-white",
    HEADER_BORDER: "border-b-2 border-gray-200",
    
    // 提交按钮样式
    SUBMIT_BUTTON: "bg-green-600 hover:bg-green-700 disabled:opacity-50",
    SUBMIT_BUTTON_BORDER: "border border-green-700",
    
    // 用户头像区域样式
    AVATAR_BORDER: "border-2 border-gray-300 hover:border-gray-400",
    AVATAR_DEFAULT_BACKGROUND: "from-blue-400 to-blue-600",
    
    // ========== 难度标签区域 ==========
    // 难度标签样式
    DIFFICULTY_EASY: "bg-green-100 text-green-800",
    DIFFICULTY_MEDIUM: "bg-yellow-100 text-yellow-800",
    DIFFICULTY_HARD: "bg-red-100 text-red-800",
    
    // ========== 左侧题目描述区域 ==========
    // 左侧整体背景
    DESCRIPTION_BACKGROUND: "bg-white",
    DESCRIPTION_PANEL_BACKGROUND: "bg-white",
    DESCRIPTION_CONTENT_BACKGROUND: "bg-white",
    
    // 标签导航样式
    TAB_NAV_BACKGROUND: "bg-white",
    TAB_NAV_BORDER: "border-gray-300",
    TAB_ACTIVE_BORDER: "border-orange-500",
    TAB_ACTIVE_TEXT: "text-gray-900",
    TAB_INACTIVE_TEXT: "text-gray-500",
    TAB_HOVER_TEXT: "text-gray-700",
    
    // 测试用例样式
    TESTCASE_BACKGROUND: "bg-gray-50",
    TESTCASE_INPUT_BACKGROUND: "bg-white",
    TESTCASE_OUTPUT_BACKGROUND: "bg-white",
    
    // ========== 右侧代码编辑区域 ==========
    // 右侧整体背景
    EDITOR_BACKGROUND: "bg-gray-50",
    
    // ========== 输出结果区域 ==========
    // 输出面板样式
    OUTPUT_BACKGROUND: "bg-white",
    OUTPUT_PANEL_BACKGROUND: "bg-gray-50",
    OUTPUT_CONTENT_BACKGROUND: "bg-gray-900",
    OUTPUT_TEXT_COLOR: "text-gray-100",
    
    // ========== 解决方案区域 ==========
    // 解决方案样式
    SOLUTION_BACKGROUND: "bg-gray-50",
    SOLUTION_CODE_BACKGROUND: "bg-gray-900",
    SOLUTION_CODE_TEXT: "text-gray-100",
    SOLUTION_CODE_BORDER: "border-gray-600",
    
    // ========== 通用样式 ==========
    // 整体背景
    BACKGROUND: "bg-gray-50",
    
    // 边框和分割线
    BORDER_COLOR: "border-gray-300",
    DIVIDER_COLOR: "border-gray-500",
    
    // 按钮样式
    BUTTON_PRIMARY: "bg-blue-600 hover:bg-blue-700",
    BUTTON_SECONDARY: "bg-gray-200 hover:bg-gray-300",
  },
  // 解答题界面
  ESSAY: {
    BACKGROUND: "bg-gray-50",
    EDITOR_BACKGROUND: "bg-white",
    BORDER_COLOR: "border-gray-300",
    BUTTON_PRIMARY: "bg-blue-600 hover:bg-blue-700",
  },
};

// 分页设置
export const PAGINATION = {
  PROBLEMS_PER_PAGE: 6,
  BOOKMARKS_PER_PAGE: 10,
};

