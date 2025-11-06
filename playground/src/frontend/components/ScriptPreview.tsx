import { useMemo } from 'preact/hooks';

interface ScriptPreviewProps {
  content: string;
  onExport?: () => void;
  onTestScript?: () => void;
}

// Simple markdown parser for basic formatting
function parseMarkdown(markdown: string): string {
  if (!markdown) return '';
  
  return markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-base font-semibold mt-4 mb-2 text-white">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mt-5 mb-3 text-white">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4 text-white border-b-2 border-gray-600 pb-2">$1</h1>')
    // Code blocks
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre class="bg-gray-800 border border-gray-600 rounded p-4 overflow-x-auto my-4 text-white"><code class="language-$1 font-mono text-sm">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-gray-800 px-1.5 py-0.5 rounded font-mono text-sm text-white">$1</code>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic text-white">$1</em>')
    // Lists
    .replace(/^\* (.*$)/gim, '<li class="my-1 text-white list-disc">$1</li>')
    .replace(/(<li>.*<\/li>)/s, '<ul class="my-3 pl-6 text-white">$1</ul>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="my-3 text-white">')
    // Line breaks
    .replace(/\n/g, '<br>');
}

export function ScriptPreview({ content, onExport, onTestScript }: ScriptPreviewProps) {
  const htmlContent = useMemo(() => parseMarkdown(content), [content]);

  const handleExport = () => {
    if (onExport) {
      onExport();
    } else {
      // Default export behavior
      const blob = new Blob([content], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'agent-script.script.md';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900" role="complementary" aria-label="Script preview">
      <div className="p-4 border-b border-gray-700 bg-gray-800 flex justify-between items-center h-[66px]">
        <h2 className="m-0 text-lg font-semibold text-white">
          Preview
        </h2>
        {content && (
          <div className="flex space-x-2">
            <button
              onClick={onTestScript}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
              aria-label="Test agent script"
            >
              Test Script
            </button>
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white border-none rounded cursor-pointer text-sm font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-300"
              aria-label="Export script as markdown file"
            >
              Export
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
        {!content ? (
          <div className="text-center text-gray-400 italic mt-10">
            <div className="text-5xl mb-4 opacity-30">
              📄
            </div>
            <p className="text-base">Your agent script will appear here as you create it...</p>
            <p className="text-sm mt-2">
              Start chatting with the agent to generate your script.
            </p>
          </div>
        ) : (
          <div 
            className="leading-relaxed text-white font-sans prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: `<p class="my-3 text-white">${htmlContent}</p>` }}
          />
        )}
      </div>
    </div>
  );
}
