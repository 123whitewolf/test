import Editor from '@monaco-editor/react';
import { useRef, useEffect } from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  theme?: string;
  height?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  theme = 'vs-dark',
  height = '100%'
}) => {
  const editorRef = useRef(null);

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      onChange(value);
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
  };

  return (
    <Editor
      onMount={handleEditorMount}
      height={height}
      defaultLanguage={language}
      language={language}
      value={value}
      onChange={handleEditorChange}
      theme={theme}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "Monaco, 'Courier New', monospace",
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        formatOnPaste: true,
        formatOnType: true,
        autoClosingBrackets: 'always',
        autoClosingQuotes: 'always',
        automaticLayout: true,
      }}
    />
  );
};
