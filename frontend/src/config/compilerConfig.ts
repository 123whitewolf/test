export const executeWithPiston = async (code: string, language: string): Promise<string> => {
  const languageMap: { [key: string]: string } = {
    javascript: 'javascript',
    python: 'python',
    java: 'java',
    cpp: 'cpp',
  };

  const pistonLanguage = languageMap[language] || language;

  const response = await fetch('https://emkc.org/api/v2/piston/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      language: pistonLanguage,
      version: '*',
      files: [
        {
          name: `main.${getFileExtension(language)}`,
          content: code,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`编译器错误: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.run?.stderr) {
    return `运行错误：\n${data.run.stderr}`;
  }
  
  return data.run?.stdout || '执行完成（无输出）';
};

export const getFileExtension = (language: string): string => {
  const extensions: { [key: string]: string } = {
    javascript: 'js',
    python: 'py',
    java: 'java',
    cpp: 'cpp',
  };
  return extensions[language] || language;
};
