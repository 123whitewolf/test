import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Problem } from "@/data";
import { Timer } from "@/components/Timer";

interface EssayProblemProps {
  problem: Problem;
  onSubmit: (answer: string) => void;
  initialAnswer?: string;
}

export const EssayProblem: React.FC<EssayProblemProps> = ({
  problem,
  onSubmit,
  initialAnswer = ""
}) => {
  const [answer, setAnswer] = useState(initialAnswer);
  const [wordCount, setWordCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate()
  
  // 计算字数
  useEffect(() => {
    const count = answer.replace(/\s/g, '').length;
    setWordCount(count);
  }, [answer]);

  

  const handleSubmit = () => {
    if (answer.trim() === "") {
      toast.error("请输入答案");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
      onSubmit(answer);
      toast.success("答案已提交！");
    }, 1000);
  };

  const isWithinLimit = !problem.expectedLength || wordCount <= problem.expectedLength;
  const isOverMinimum = problem.expectedLength && wordCount >= problem.expectedLength * 0.5;

  

  return (
    <div className="min-h-screen bg- flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate('/problems')}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  {problem.title}
                </h1>
                <div className="flex items-center mt-0.5">
                  <Timer/>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || submitted}
                className="px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    提交中...
                  </>
                ) : (
                  "提交答案"
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">题目描述</h2>
            <div className="text-gray-800 whitespace-pre-line mb-6">
              {problem.content}
            </div>

            {problem.expectedLength && (
              <div className={`mt-6 p-4 rounded-lg ${
                isWithinLimit ? "bg-blue-50" : "bg-red-50"
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      <span className="font-medium">字数要求: {problem.expectedLength}字</span>
                      {wordCount > 0 && (
                        <span className="ml-2">
                          当前字数: <span className="font-medium">{wordCount}字</span>
                        </span>
                      )}
                    </p>
                    {!isWithinLimit && (
                      <p className="text-red-600 text-sm mt-1">
                        已超出字数限制！
                      </p>
                    )}
                    {!isOverMinimum && wordCount > 0 && (
                      <p className="text-yellow-600 text-sm mt-1">
                        建议至少完成 {Math.ceil(problem.expectedLength * 0.5)} 字
                      </p>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-blue-500">
                    {wordCount}/{problem.expectedLength}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">答题区域</span>
              <div className="flex items-center text-xs text-gray-500">
                <span className="w-3 h-3 rounded-full bg-red-400 mr-1"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400 mr-1"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
              </div>
            </div>
          </div>

          <div className="flex-grow flex flex-col p-4">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="flex-grow w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              placeholder="请在此输入你的答案..."
              disabled={submitted}
              spellCheck="false"
            />
          </div>
        </div>

        {submitted && (
          <div className="mt-6 p-5 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-start">
              <div className="flex-shrink-0 p-2 rounded-full bg-green-100 text-green-500">
                <i className="fa-solid fa-check text-xl"></i>
              </div>

              <div className="ml-4">
                <h3 className="text-lg font-medium text-green-800">
                  答案已提交！
                </h3>
                <p className="mt-1 text-green-700">
                  感谢您的提交，我们会尽快批阅。
                </p>

                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setIsSubmitting(false);
                    }}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-200"
                  >
                    修改答案
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} CodeMaster. 保留所有权利。</p>
            <div className="flex space-x-4 mt-2 md:mt-0">
              <a href="#" className="hover:text-gray-700">使用条款</a>
              <a href="#" className="hover:text-gray-700">隐私政策</a>
              <a href="#" className="hover:text-gray-700">帮助中心</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
