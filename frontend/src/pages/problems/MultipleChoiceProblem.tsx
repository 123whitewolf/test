import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Problem } from "@/data";
import { PROBLEM_COLORS } from "@/theme/colors";
import { Timer } from "@/components/Timer";
interface MultipleChoiceProblemProps {
  problem: Problem;
  onSubmit: (answer: string) => void;
  initialAnswer?: string;
}

export const MultipleChoiceProblem: React.FC<MultipleChoiceProblemProps> = ({
  problem,
  onSubmit,
  initialAnswer = "",
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string>(initialAnswer);
  const [submitted, setSubmitted] = useState(false);

  const navigate = useNavigate();

  

  const handleOptionSelect = (option: string) => {
    if (!submitted) {
      setSelectedAnswer(option);
    }
  };

  const handleSubmit = () => {
    if (!selectedAnswer) {
      toast.error("请选择一个答案");
      return;
    }

    setSubmitted(true);
    onSubmit(selectedAnswer);
    toast.success("答案已提交！");
  };

  const isCorrect = submitted && selectedAnswer === problem.correctAnswer;


  return (
    <div className={`min-h-screen ${PROBLEM_COLORS.MULTIPLE_CHOICE.BACKGROUND} flex flex-col`}>
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/problems")}
                className="text-gray-500 hover:text-gray-700 mr-4"
              >
                <i className="fa-solid fa-arrow-left"></i>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 truncate max-w-md">
                  {problem.title}
                </h1>
                <div className="flex items-center mt-0.5">
{/* 在这里使用组件Timer用于记录时间 */}
                  <Timer/>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleSubmit}
                disabled={submitted}
                className="px-4 py-1.5 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200"
              >
                提交答案
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={`${PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_BACKGROUND} rounded-xl shadow-sm p-6 border border-gray-200`}>
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">题目描述</h2>
            <div className="text-gray-800 whitespace-pre-line mb-6">
              {problem.content}
            </div>
          </div>
        </div>

        <div className={`mt-6 ${PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_BACKGROUND} rounded-xl shadow-sm border border-gray-200 overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_BORDER}`}>
            <h3 className="text-lg font-medium text-gray-700">选项</h3>
          </div>

          <div className="p-4">
            <div className="space-y-3">
              {problem.options?.map((option, index) => (
                <div
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  className={`block p-4 rounded-lg border cursor-pointer transition-all ${
                    submitted
                      ? option === problem.correctAnswer
                        ? "border-green-500 bg-green-50"
                        : selectedAnswer === option
                        ? "border-red-500 bg-red-50"
                        : PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_BORDER
                      : selectedAnswer === option
                      ? PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_SELECTED
                      : `${PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_BORDER} hover:border-blue-300 ${PROBLEM_COLORS.MULTIPLE_CHOICE.OPTION_HOVER}`
                  }`}
                >
                  <div className="flex items-center">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full border flex items-center justify-center mr-3 ${
                        selectedAnswer === option
                          ? submitted && option === problem.correctAnswer
                            ? "border-green-500 bg-green-500"
                            : submitted && option !== problem.correctAnswer
                            ? "border-red-500 bg-red-500"
                            : "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {selectedAnswer === option && (
                        <span
                          className={`w-2 h-2 rounded-full bg-white`}
                        ></span>
                      )}
                    </div>
                    <span className="flex-grow">{option}</span>
                    {submitted && option === problem.correctAnswer && (
                      <i className="fas fa-check-circle text-green-500 ml-2"></i>
                    )}
                    {submitted &&
                      selectedAnswer === option &&
                      option !== problem.correctAnswer && (
                        <i className="fas fa-times-circle text-red-500 ml-2"></i>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {submitted && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-medium mb-4">提交结果</h3>

            {isCorrect ? (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-2 rounded-full bg-green-100 text-green-500">
                    <i className="fa-solid fa-check text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-green-800 font-medium">回答正确！</h4>
                    <p className="text-green-700 mt-1">
                      恭喜你，选择了正确答案。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0 p-2 rounded-full bg-red-100 text-red-500">
                    <i className="fa-solid fa-times text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h4 className="text-red-800 font-medium">回答错误</h4>
                    <p className="text-red-700 mt-1">
                      正确答案是: {problem.correctAnswer}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setSelectedAnswer("");
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                重新作答
              </button>
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
              <a href="#" className="hover:text-gray-700">
                使用条款
              </a>
              <a href="#" className="hover:text-gray-700">
                隐私政策
              </a>
              <a href="#" className="hover:text-gray-700">
                帮助中心
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
