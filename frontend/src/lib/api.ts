import { Problem } from "@/data";

const API_BASE_URL = "http://localhost:3001/api";

export const api = {
  // 获取所有题目
  getProblems: async (): Promise<Problem[]> => {
    const response = await fetch(`${API_BASE_URL}/problems`);
    return response.json();
  },

  // 获取单个题目
  getProblem: async (id: number): Promise<Problem> => {
    const response = await fetch(`${API_BASE_URL}/problems/${id}`);
    return response.json();
  },

  // 更新题目状态（完成/收藏等）
  updateProblem: async (
    id: number,
    data: Partial<Problem>
  ): Promise<Problem> => {
    try {
      // 获取用户信息，增加错误处理
      let user;
      try {
        const userStr =
          localStorage.getItem("user") ||
          sessionStorage.getItem("user") ||
          "{}";
        user = JSON.parse(userStr);
      } catch (e) {
        console.error("Failed to parse user data:", e);
        throw new Error("用户信息无效，请重新登录");
      }

      if (!user || !user.id) {
        throw new Error("用户未登录，请先登录");
      }

      const response = await fetch(`${API_BASE_URL}/problems/${id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          ...data,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "请求失败" }));
        throw new Error(
          errorData.message || `请求失败，状态码: ${response.status}`
        );
      }

      return response.json();
    } catch (error) {
      console.error("API请求失败:", error);
      throw error; // 重新抛出错误，让调用方处理
    }
  },
  // 用户注册
  register: async (username: string, email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "注册失败");
      }

      return data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  // 用户登录
  login: async (email: string, password: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // 如果是用户不存在错误，确保抛出特定错误
        if (data.message === "用户不存在") {
          const error = new Error(data.message);
          (error as any).isUserNotExist = true;
          throw error;
        }
        throw new Error(data.message || "登录失败");
      }

      return data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  // 获取所有用户
  getAllUsers: async () => {
    try {
      const response = await fetch("http://localhost:3001/api/users");
      return await response.json();
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // 发送邮箱验证码
  sendEmailVerificationCode: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-email-verification`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "发送验证码失败");
      }

      return data;
    } catch (error) {
      console.error("Send verification code error:", error);
      throw error;
    }
  },
  
  // 发送密码重置验证码
  sendPasswordResetCode: async (email: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-password-reset-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "发送重置验证码失败");
      }

      return data;
    } catch (error) {
      console.error("Send password reset code error:", error);
      throw error;
    }
  },

  // 验证邮箱和验证码
  verifyEmail: async (email: string, code: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "验证失败");
      }

      return data;
    } catch (error) {
      console.error("Verify phone error:", error);
      throw error;
    }
  },

  

  // 检查用户是否存在
  checkUserExists: async (userId: string) => {
    try {
      const users = await api.getAllUsers();
      return users.some((user: any) => user.id === parseInt(userId));
    } catch (error) {
      console.error("Error checking user:", error);
      throw error;
    }
  },

  // 通过邮箱重置用户密码
  resetPasswordByEmail: async (email: string, newPassword: string) => {
    try {
      // 获取用户数据
      const users = await api.getAllUsers();

      // 查找用户
      const user = users.find((user: any) => user.email === email);

      if (!user) {
        throw new Error("用户不存在");
      }

      // 更新密码
      const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error("密码重置失败");
      }

      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },

  // 重置用户密码
  resetPassword: async (userId: string, newPassword: string) => {
    try {
      // 获取用户数据
      const users = await api.getAllUsers();

      // 查找用户
      const user = users.find((user: any) => user.id === parseInt(userId));

      if (!user) {
        throw new Error("用户不存在");
      }

      // 更新密码
      const response = await fetch(`http://localhost:3001/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) {
        throw new Error("密码重置失败");
      }

      return true;
    } catch (error) {
      console.error("Password reset error:", error);
      throw error;
    }
  },
};
