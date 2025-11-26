
// 题目类型定义
export interface Problem {
  id: number;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  tags: string[];
  completed: boolean;
  bookmarked: boolean;
  通过率: number;
  template: "multiple-choice" | "coding" | "essay" ;
  content: string;
  // 根据题目类型添加特定字段
  options?: string[]; // 选择题选项
  correctAnswer?: string | string[]; // 正确答案
  explanation?: string; // 题目解释
  sampleCode?: string; // 编程题示例代码
  testCases?: TestCase[]; // 编程题测试用例
  expectedLength?: number; // 解答题期望字数
  blanks?: Blank[]; // 填空题空格信息
}

interface TestCase {
  input: string;
  output: string;
}

interface Blank {
  id: number;
  position: number;
  type: "text" | "number" | "code";
  answer: string;
}

// 用户类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 用户个人资料类型定义
export interface UserProfile {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatar?: string;
  learningGoals?: string[];
  skills?: string[];
  completedProblems?: number;
  totalProblems?: number;
  successRate?: number;
  studyTime?: number;
  lastActive?: string;
  createdAt: string;
  updatedAt: string;
}

// AI生成题目参数类型
export interface AIGenerateParams {
  category: string;
  difficulty: "easy" | "medium" | "hard";
  count: number;
  topics?: string[];
  template?: "multiple-choice" | "coding" | "essay" | "fill-blank";
  customInstructions?: string;
}

// 题目提交结果类型
export interface SubmissionResult {
  id: number;
  problemId: number;
  userId: number;
  status: "pending" | "correct" | "wrong" | "partial";
  score?: number;
  submittedAt: string;
  feedback?: string;
  testResults?: TestResult[];
}

interface TestResult {
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  executionTime?: number;
}
