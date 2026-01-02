const TypingIndicator = () => {
  return (
    <div className="flex justify-start">
      <div className="bg-secondary rounded-2xl rounded-bl-sm px-4 py-3 max-w-[80px]">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
