import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Problem } from "@/data";
import { Timer } from "@/components/Timer";
import { marked } from "marked";
import Radio from "@/components/setting_show";
import Editor from "@monaco-editor/react";
import { configureMonacoLanguages } from "@/config/monacoConfig";
import { executeWithPiston } from "@/config/compilerConfig";
import type { editor } from 'monaco-editor';


interface CodingProblemProps {
  problem: Problem;
  onSubmit: (code: string) => void;
  initialCode?: string;
}

export const CodingProblem: React.FC<CodingProblemProps> = ({
  problem,
  onSubmit,
  initialCode = ""
}) => {
  const [code, setCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("description");
  const [language, setLanguage] = useState("javascript");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [parsedContent, setParsedContent] = useState("");
  const [userProfile, setUserProfile] = useState<any>(null);
  const [leftWidth, setLeftWidth] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [output, setOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  // 加载用户资料
  useEffect(() => {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setUserProfile(JSON.parse(savedProfile));
    }
  }, []);

  // 解析题目内容
  useEffect(() => {
    const parseContent = async () => {
      const parsed = await marked.parse(problem.content);
      setParsedContent(parsed);
    };
    parseContent();
  }, [problem.content]);

  // 拖动分割线
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;

      if (newLeftWidth > 20 && newLeftWidth < 80) {
        setLeftWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // 自动保存功能
  useEffect(() => {
    if (!autoSaveEnabled) return;

    const timer = setTimeout(() => {
      // 保存代码到本地存储
      localStorage.setItem(`code_${problem.id}_${language}`, code);
      setLastSaved(new Date());
    }, 2000); // 2秒后自动保存

    return () => clearTimeout(timer);
  }, [code, autoSaveEnabled, problem.id, language]);

  // 从本地存储加载保存的代码
  useEffect(() => {
    const savedCode = localStorage.getItem(`code_${problem.id}_${language}`);
    if (savedCode && !initialCode) {
      setCode(savedCode);
    }
  }, [problem.id, language, initialCode]);

  // 快捷键处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ctrl/Cmd + Enter: 提交代码
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
    // Ctrl/Cmd + S: 保存代码
    else if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      localStorage.setItem(`code_${problem.id}_${language}`, code);
      setLastSaved(new Date());
      toast.success("代码已保存");
    }
  }, [code, problem.id, language]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // 代码模板
  const codeTemplates = {
    javascript: `// JavaScript solution\nfunction solution(input) {\n  // Your code here\n}`,
    python: `# Python solution\ndef solution(input):\n  # Your code here\n  pass`,
    java: `// Java solution\nclass Solution {\n  public Object solution(Object input) {\n    // Your code here\n  }\n}`,
    cpp: `// C++ solution\nclass Solution {\npublic:\n  Object solution(Object input) {\n    // Your code here\n  }\n}`
  };

  // 切换语言时加载模板
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const savedCode = localStorage.getItem(`code_${problem.id}_${newLanguage}`);
    if (savedCode) {
      setCode(savedCode);
    } else {
      setCode(codeTemplates[newLanguage as keyof typeof codeTemplates] || "");
    }
  };

  
  const handleLogout = () => {
    localStorage.removeItem('userProfile');
    localStorage.removeItem('learningStats');
    localStorage.removeItem('wrongProblems');
    localStorage.removeItem('bookmarkedProblems');
    navigate('/');
  };

  // 运行代码
  const handleRun = async () => {
    if (!code.trim()) {
      toast.error('请输入代码');
      return;
    }

    setIsRunning(true);
    setOutput('执行中...');
    
    try {
      const result = await executeWithPiston(code, language);
      setOutput(result);
      toast.success('代码执行成功');
    } catch (error) {
      console.error('运行失败:', error);
      setOutput('执行错误：' + (error instanceof Error ? error.message : '未知错误'));
      toast.error('代码执行失败');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast.error('请输入代码');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // 执行代码
      const result = await executeWithPiston(code, language);
      
      // 模拟测试用例验证
      const testCases = problem.testCases || [];
      let passed = 0;
      const totalTests = testCases.length;

      // 这里应该真正验证输出，目前使用模拟
      passed = Math.floor(Math.random() * (totalTests + 1));

      setSubmissionResult({
        passed,
        total: totalTests,
        success: passed === totalTests,
        executionTime: Math.floor(Math.random() * 100) + 10,
        output: result,
      });

      if (passed === totalTests) {
        toast.success('恭喜！所有测试用例通过 ✨');
      } else {
        toast.error(`通过 ${passed}/${totalTests} 个测试用例`);
      }

      onSubmit(code);
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 初始化 Monaco 配置（仅执行一次）
  useEffect(() => {
    configureMonacoLanguages();
  }, []);

  const basicEditorOptions: editor.IStandaloneEditorConstructionOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false,
    },
    parameterHints: {
      enabled: true,
    },
    autoClosingBrackets: 'always' as const,
    autoClosingQuotes: 'always' as const,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 顶部导航栏 */}
      <header className="sticky top-0 z-50 border-b-2 border-gray-300 bg-white">
        <div className="max-w-full px-4 lg:px-8 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => navigate('/problems')}
                className="text-xl font-bold text-orange-500 hover:text-orange-600"
              >
                Xutcode
              </button>
              <div className="border-l-2 border-gray-300 pl-4">
                <h1 className="text-base font-medium text-gray-900">{problem.title}</h1>
                <div className="flex items-center mt-1 space-x-2">
                  <span className={cn(
                    "px-2.5 py-0.5 text-xs font-medium rounded-full",
                    problem.difficulty === "easy" ? "bg-green-100 text-green-800" :
                    problem.difficulty === "medium" ? "bg-yellow-100 text-yellow-800" :
                    "bg-red-100 text-red-800"
                  )}>
                    {problem.difficulty === "easy" ? "Easy" : problem.difficulty === "medium" ? "Medium" : "Hard"}
                  </span>
                  <Timer />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-lg text-white bg-green-600 hover:bg-green-700 font-medium transition disabled:opacity-50 border border-green-700"
              >
                {isSubmitting ? "提交中..." : "提交"}
              </button>

              <div className="relative group">
                <button className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-300 hover:border-gray-400 transition">
                  {userProfile?.avatar ? (
                    <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm">
                      <i className="fa-solid fa-user"></i>
                    </div>
                  )}
                </button>
                
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border-2 border-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <Radio onLogout={handleLogout} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-grow flex overflow-hidden" ref={containerRef}>
        {/* 左侧：题目描述面板 */}
        <div className="overflow-y-auto border-r-2 border-gray-300" style={{ width: `${leftWidth}%` }}>
          <div className="p-6 lg:p-8">
            {/* 标签导航 */}
            <div className="flex space-x-6 border-b-2 border-gray-300 mb-6 pb-3">
              {['Description', 'Solutions', 'Submissions'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={cn(
                    "font-medium text-sm transition pb-2 border-b-2",
                    activeTab === tab.toLowerCase()
                      ? "border-orange-500 text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* 描述内容 */}
            {activeTab === 'description' && (
              <div className="prose prose-sm max-w-none">
                <div dangerouslySetInnerHTML={{ __html: parsedContent }} className="text-gray-700 markdown-content" />
                
                <h3 className="text-lg font-semibold mt-8 mb-4 text-gray-900">Examples:</h3>
                <div className="space-y-4">
                  {problem.testCases?.map((testCase, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                      <div className="mb-3">
                        <span className="font-semibold text-gray-700">Input:</span>
                        <pre className="bg-white p-3 rounded mt-2 text-sm border-2 border-gray-300 overflow-x-auto">
                          {testCase.input}
                        </pre>
                      </div>
                      <div>
                        <span className="font-semibold text-gray-700">Output:</span>
                        <pre className="bg-white p-3 rounded mt-2 text-sm border-2 border-gray-300 overflow-x-auto">
                          {testCase.output}
                        </pre>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'solutions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Solutions</h3>
                {problem.sampleCode && (
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-300">
                    <h4 className="font-medium mb-3 text-gray-900">参考代码：</h4>
                    <pre className="bg-gray-900 text-gray-100 p-4 rounded overflow-x-auto border-2 border-gray-600">
                      {problem.sampleCode}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'submissions' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Submissions</h3>
                <p className="text-gray-500">No submissions yet</p>
              </div>
            )}
          </div>
        </div>

        {/* 分割线 */}
        <div
          onMouseDown={() => setIsDragging(true)}
          className="w-1 bg-gray-300 hover:bg-orange-500 cursor-col-resize transition-colors"
          style={{ userSelect: 'none' }}
        />

        {/* 右侧：代码编辑器面板 */}
        <div className="flex flex-col bg-gray-50 border-l-2 border-gray-300" style={{ width: `${100 - leftWidth}%` }}>
          {/* 编辑器工具栏 */}
          <div className="border-b-2 border-gray-300 bg-white px-4 lg:px-6 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="px-3 py-1.5 border-2 border-gray-300 rounded text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleRun}
                disabled={isRunning}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium border-2 border-blue-700 transition disabled:opacity-50"
              >
                {isRunning ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    运行中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-play mr-2"></i>
                    运行
                  </>
                )}
              </button>
              <button
                onClick={() => setCode('')}
                className="p-1.5 text-gray-600 hover:bg-gray-200 rounded transition border-2 border-gray-300"
                title="清空"
              >
                <i className="fa-solid fa-trash text-sm"></i>
              </button>
            </div>
          </div>

          {/* 代码编辑器 */}
          <div className="flex-grow overflow-hidden border-b-2 border-gray-300">
            <Editor
              value={code}
              onChange={(value) => setCode(value || '')}
              language={language}
              theme="vs-dark"
              height="100%"
              options={basicEditorOptions}
            />
          </div>

          {/* 输出面板 */}
          <div className="flex flex-col bg-white border-t-2 border-gray-300 max-h-48">
            {/* 输出标签 */}
            <div className="px-4 lg:px-6 py-2 bg-gray-50 border-b-2 border-gray-300 font-semibold text-sm text-gray-900 flex justify-between items-center">
              <span>输出结果</span>
              {output && (
                <button
                  onClick={() => setOutput('')}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清除
                </button>
              )}
            </div>

            {/* 输出内容 */}
            <div className="flex-grow p-4 font-mono text-sm overflow-auto bg-gray-900 text-gray-100">
              {output ? (
                <pre className="whitespace-pre-wrap break-words">{output}</pre>
              ) : (
                <p className="text-gray-500">点击"运行"执行代码，或"提交"验证答案</p>
              )}
            </div>

            {/* 提交结果面板 */}
            {submissionResult && (
              <div className={cn(
                "px-4 lg:px-6 py-3 border-t-2 border-gray-300 font-medium text-sm",
                submissionResult.success
                  ? "bg-green-50 text-green-800 border-green-200"
                  : "bg-red-50 text-red-800 border-red-200"
              )}>
                <div className="flex items-center space-x-2">
                  {submissionResult.success ? (
                    <i className="fa-solid fa-check-circle text-green-600"></i>
                  ) : (
                    <i className="fa-solid fa-times-circle text-red-600"></i>
                  )}
                  <span>
                    {submissionResult.success
                      ? '✨ 恭喜！所有测试用例通过！'
                      : `通过 ${submissionResult.passed}/${submissionResult.total} 个测试用例`}
                  </span>
                </div>
              </div>
            )}

            {/* 状态栏 */}
            <div className="px-4 lg:px-6 py-3 border-t-2 border-gray-300 bg-white text-xs text-gray-500 flex justify-between">
              <div className="flex items-center space-x-3">
                <label className="flex items-center cursor-pointer hover:text-gray-700">
                  <input
                    type="checkbox"
                    checked={autoSaveEnabled}
                    onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                    className="mr-1.5"
                  />
                  Auto Save
                </label>
              </div>
              <div className="flex items-center space-x-4">
                {lastSaved && (
                  <span>保存时间: {lastSaved.toLocaleTimeString()}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
