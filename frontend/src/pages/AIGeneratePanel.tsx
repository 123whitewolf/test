import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { CATEGORIES,  Problem } from '@/data';

// AI 生成题目选项类型
interface GenerationOptions {
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  tags: string[];
  questionCount: number;
}

// 知识点标签
const ALL_TAGS = [
  '数组', '哈希表', '双指针', '字符串', '栈', '递归', '链表',
  '动态规划', '贪心算法', '排序', '搜索', '树', '图', '位运算'
];

interface AIGeneratePanelProps {
  onProblemsGenerated: (problems: Problem[]) => void;
}

export default function AIGeneratePanel({ onProblemsGenerated }: AIGeneratePanelProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedProblems, setGeneratedProblems] = useState<Problem[]>([]);
  const [options, setOptions] = useState<GenerationOptions>({
    difficulty: 'medium',
    category: '数据结构',
    tags: [],
    questionCount: 1
  });

  // 处理标签选择
  const handleTagToggle = (tag: string) => {
    setOptions(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // 生成AI题目
  const generateProblems = () => {
    setIsGenerating(true);
    // 模拟AI生成题目过程
    setTimeout(() => {
      // 生成模拟题目数据
      const problems = Array.from({ length: options.questionCount }, (_, i) => ({
        id: Date.now() + i,
        title: `${options.category} - ${options.difficulty === 'easy' ? '简单' : options.difficulty === 'medium' ? '中等' : '困难'}题目 ${i + 1}`,
        difficulty: options.difficulty,
        category: options.category,
        tags: options.tags.length > 0 ? options.tags : [ALL_TAGS[Math.floor(Math.random() * ALL_TAGS.length)]],
        completed: false,
        bookmarked: false,
        通过率: 0,
        template: "coding" as const,
        content: `这是一道由AI生成的${options.difficulty === 'easy' ? '简单' : options.difficulty === 'medium' ? '中等' : '困难'}难度${options.category}题目。\n\n请解决以下问题：\n\n实现一个函数，该函数能够处理${options.tags.length > 0 ? options.tags.join('、') : '指定'}相关的任务，要求时间复杂度不超过O(n log n)。`,
        sampleCode: `function solution(input) {
  // 在这里实现你的解决方案
  return output;
}`,
        testCases: [
          {
            input: "示例输入",
            output: "示例输出"
          }
        ]
      }));

      setGeneratedProblems(problems);
      setIsGenerating(false);
      toast.success(`成功生成 ${options.questionCount} 道题目！`);
      onProblemsGenerated(problems);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">生成选项</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 难度选择 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">难度</label>
          <div className="flex space-x-4">
            {['easy', 'medium', 'hard'].map(difficulty => (
              <div key={difficulty} className="flex items-center">
                <input
                  type="radio"
                  id={`difficulty-${difficulty}`}
                  name="difficulty"
                  value={difficulty}
                  checked={options.difficulty === difficulty}
                  onChange={(e) => setOptions(prev => ({
                    ...prev,
                    difficulty: e.target.value as 'easy' | 'medium' | 'hard'
                  }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor={`difficulty-${difficulty}`}
                  className="ml-2 block text-sm text-gray-700 capitalize"
                >
                  {difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* 题目数量 */}
        <div>
          <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2">
            题目数量
          </label>
          <input
            type="number"
            id="questionCount"
            min="1"
            max="5"
            value={options.questionCount}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              questionCount: Math.min(5, Math.max(1, parseInt(e.target.value) || 1))
            }))}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200"
          />
        </div>

        {/* 分类选择 */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
            题目分类
          </label>
          <select
            id="category"
            value={options.category}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              category: e.target.value
            }))}
            className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 appearance-none bg-white"
          >
            {CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* 知识点标签 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            知识点标签 (可选)
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg">
            {ALL_TAGS.map(tag => (
              <label
                key={tag}
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors ${
                  options.tags.includes(tag)
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-transparent'
                }`}
              >
                <input
                  type="checkbox"
                  checked={options.tags.includes(tag)}
                  onChange={() => handleTagToggle(tag)}
                  className="sr-only"
                />
                {tag}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center">
        <button
          onClick={generateProblems}
          disabled={isGenerating}
          className="px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 flex items-center"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2"></i>
              生成中...
            </>
          ) : (
            <>
              <i className="fa-solid fa-magic mr-2"></i>
              生成题目
            </>
          )}
        </button>
      </div>

      {/* 生成结果 */}
      {generatedProblems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mt-8">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">生成结果</h2>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {generatedProblems.map((problem) => (
                <div
                  key={problem.id}
                  className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-200 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{problem.title}</h3>

                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-medium",
                      problem.difficulty === 'easy'
                        ? "bg-green-100 text-green-800"
                        : problem.difficulty === 'medium'
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                    )}>
                      {problem.difficulty === 'easy' ? '简单' : problem.difficulty === 'medium' ? '中等' : '困难'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {problem.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {problem.tags.map((tag:string)  => (
                      <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded-full text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-700 line-clamp-3 mb-4">{problem.content}</p>

                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        // 这里可以实现查看题目详情的功能
                        toast.info('查看题目详情功能待实现');
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      查看详情 <i className="fa-solid fa-arrow-right ml-1"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-center">
              <button
                onClick={() => {
                  toast.success('题目已保存到您的题库！');
                }}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-200"
              >
                <i className="fa-solid fa-save mr-2"></i>保存到题库
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
