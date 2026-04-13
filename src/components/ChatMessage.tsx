export interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

function renderContent(text: string) {
  return text.split('\n').map((line, i) => {
    // Bold: **text**
    let parts: (string | React.ReactNode)[] = [line];
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return [part];
      const segments: (string | React.ReactNode)[] = [];
      const regex = /\*\*(.+?)\*\*/g;
      let lastIndex = 0;
      let match;
      while ((match = regex.exec(part)) !== null) {
        if (match.index > lastIndex) segments.push(part.slice(lastIndex, match.index));
        segments.push(<strong key={`b-${i}-${match.index}`}>{match[1]}</strong>);
        lastIndex = regex.lastIndex;
      }
      if (lastIndex < part.length) segments.push(part.slice(lastIndex));
      return segments;
    });

    // List items
    const trimmed = line.trimStart();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      return (
        <div key={i} className="flex gap-1.5 ml-2">
          <span className="shrink-0">•</span>
          <span>{parts.map((p, j) => (typeof p === 'string' && j === 0 ? p.replace(/^[-•]\s*/, '') : p))}</span>
        </div>
      );
    }

    // Empty line = spacing
    if (line.trim() === '') return <div key={i} className="h-2" />;

    return <p key={i}>{parts}</p>;
  });
}

export default function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-1'}`}>
        {!isUser && (
          <span className="text-xs font-medium text-slate-500 mb-1 block">🎓 Coach</span>
        )}
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed space-y-1 ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-md'
              : 'bg-slate-100 text-slate-800 rounded-bl-md'
          }`}
        >
          {renderContent(content)}
        </div>
        {timestamp && (
          <span
            className={`text-[10px] text-slate-400 mt-1 block ${
              isUser ? 'text-right' : 'text-left'
            }`}
          >
            {timestamp}
          </span>
        )}
      </div>
    </div>
  );
}
