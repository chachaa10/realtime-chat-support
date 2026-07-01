const dotStyles = `
  @keyframes typing-bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }
`;

export function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-2 py-2">
      <style>{dotStyles}</style>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-ink-dim h-[6px] w-[6px] rounded-full"
          style={{
            animation: 'typing-bounce 1.2s ease-in-out infinite',
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}
