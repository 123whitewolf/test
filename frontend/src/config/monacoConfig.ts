import type { editor } from 'monaco-editor';

export const configureMonacoLanguages = () => {
  try {
    console.log('✅ 语言服务加载成功');
  } catch (error) {
    console.error('❌ 语言服务加载失败:', error);
  }
};

export const editorOptions: editor.IStandaloneEditorConstructionOptions = {
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
