import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { Problem } from "@/data";
import { MultipleChoiceProblem } from "./MultipleChoiceProblem";
import { CodingProblem } from "./CodingProblem";
import { EssayProblem } from "./EssayProblem";
import { toast } from "sonner";


export const ProblemRouter = () => {
  const { id } = useParams<{ id: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const navigate = useNavigate();

  // 从localStorage加载用户的答题进度
  useEffect(() => {
    const loadUserProgress = () => {
      const progress = localStorage.getItem(`problemProgress_${id}`);
      if (progress) {
        try {
          setUserAnswers(JSON.parse(progress));
        } catch (e) {
          console.error("Failed to parse user progress:", e);
        }
      }
    };

    loadUserProgress();
  }, [id]);

  // 保存答题进度到localStorage
  const saveUserProgress = (answers: Record<string, any>) => {
    localStorage.setItem(`problemProgress_${id}`, JSON.stringify(answers));
  };

  // 处理题目提交
  const handleProblemSubmit = async (answer: any) => {
    if (!id) {
      toast.error("题目ID无效");
      return;
    }
    
    try {
      // 保存答题进度
      const newAnswers = { ...userAnswers, [id]: answer };
      setUserAnswers(newAnswers);
      saveUserProgress(newAnswers);

      // 更新题目完成状态
      const updateProblemStatus = async () => {
        try {
          await api.updateProblem(Number(id), { completed: true });

          // 更新localStorage中的题目列表
          const problems = JSON.parse(
            localStorage.getItem("userProblems") || "[]"
          );
          const updatedProblems = problems.map((p: Problem) =>
            p.id === Number(id) ? { ...p, completed: true } : p
          );
          localStorage.setItem("userProblems", JSON.stringify(updatedProblems));

          // 触发自定义事件，通知其他组件题目状态已更新
          window.dispatchEvent(
            new CustomEvent("bookmarksUpdated", {
              detail: { updatedProblems },
            })
          );
          
          toast.success("提交成功！");
        } catch (error) {
          console.error("Failed to update problem status:", error);
          toast.error("提交失败，请重试");
        }
      };

      await updateProblemStatus();
    } catch (error) {
      console.error("提交过程中发生错误:", error);
      toast.error("提交失败，请重试");
    }
  };

  // 获取题目数据
  useEffect(() => {
    const loadProblem = async () => {
      try {
        setLoading(true);
        setError(null);

        // 尝试从localStorage获取题目数据
        const savedProblems = localStorage.getItem("userProblems");
        if (savedProblems) {
          const problems = JSON.parse(savedProblems);
          const foundProblem = problems.find(
            (p: Problem) => p.id === Number(id)
          );

          if (foundProblem) {
            setProblem(foundProblem);
            setLoading(false);
            return;
          }
        }

        // 如果localStorage中没有，则从API获取
        const data = await api.getProblem(Number(id));
        setProblem(data);
      } catch (error) {
        console.error("Failed to load problem:", error);
        setError("题目不存在或加载失败");
      } finally {
        setLoading(false);
      }
    };

    loadProblem();
  }, [id]);

  // 根据题目类型渲染对应的组件
  const renderProblemComponent = () => {
    if (!problem) return null;

    switch (problem.template) {
      case "multiple-choice":
        return (
          <MultipleChoiceProblem
            problem={problem}
            onSubmit={handleProblemSubmit}
            
            initialAnswer={userAnswers[id || ""]?.answer}
          />
        );
      case "coding":
        return (
          <CodingProblem
            problem={problem}
            onSubmit={handleProblemSubmit}
            initialCode={userAnswers[id || ""]?.code}
          />
        );
      case "essay":
        return (
          <EssayProblem
            problem={problem}
            onSubmit={handleProblemSubmit}
            initialAnswer={userAnswers[id ||""]?.answer}
          />
        );
     
      default:
        return (
          <div className="error p-6 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-medium text-red-800 mb-2">
              不支持的题目类型
            </h3>
            <p className="text-red-600">
              题目模板 "{problem.template}" 暂不支持
            </p>
            <button
              onClick={() => navigate("/problems")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              返回题目列表
            </button>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <h2 className="text-xl font-medium text-gray-900">加载题目中...</h2>
          <p className="text-gray-500 mt-1">请稍候，我们正在准备题目内容</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="error p-8 bg-red-50 border border-red-200 rounded-lg max-w-md text-center">
          <i className="fas fa-exclamation-circle text-red-500 text-4xl mb-4"></i>
          <h2 className="text-xl font-medium text-red-800 mb-2">加载失败</h2>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/problems")}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            返回题目列表
          </button>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900">题目不存在</h2>
          <button
            onClick={() => navigate("/problems")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            返回题目列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">{renderProblemComponent()}</div>
  );
};


