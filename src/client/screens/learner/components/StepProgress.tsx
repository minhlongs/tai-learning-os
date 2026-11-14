/**
 * Step progress.
 *
 * The count of completed steps is the count of ANSWERED steps, not the count of
 * steps viewed. Reporting "3/7" from the page index would let clicking through a
 * lesson look like progress, which is exactly what this product refuses to do.
 */

export function StepProgress({
  position,
  total,
  completed,
}: {
  position: number;
  total: number;
  completed: number;
}): React.JSX.Element {
  return (
    <div className="step-progress">
      <div className="step-progress__row">
        <p className="step-progress__text" data-testid="step-progress">
          Bước {position} trên {total} · Đã làm xong {completed}
        </p>
        {completed < total ? (
          <p className="step-progress__note">Còn {total - completed} bước chưa hoàn thành.</p>
        ) : null}
      </div>
      {/* A plain, precise bar. No animation, so reduced-motion is respected by
          construction and the number beside it stays the authority. */}
      <div
        className="step-progress__track"
        role="progressbar"
        aria-label="Tiến độ các bước trong bài học"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={`${completed} trên ${total} bước đã hoàn thành`}
      >
        <div className="step-progress__fill" style={{ width: `${(completed / total) * 100}%` }} />
      </div>
    </div>
  );
}
