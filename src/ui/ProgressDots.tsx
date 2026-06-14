type ProgressDotsProps = {
  total: number;
  current: number;
};

export function ProgressDots({ total, current }: ProgressDotsProps) {
  const dots = Array.from({ length: total }, (_, index) => index);

  return (
    <div className="progress-dots" aria-label={`进度 ${Math.min(current + 1, total)} / ${total}`}>
      {dots.map((dot) => (
        <span
          className="progress-dot"
          data-active={dot === current ? "true" : "false"}
          data-done={dot < current ? "true" : "false"}
          key={dot}
        />
      ))}
    </div>
  );
}
