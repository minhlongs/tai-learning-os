/**
 * Progressive hints.
 *
 * Disclosure is one-way: levels are offered in order, and a level already shown
 * stays shown. The tray never offers to hide a hint, because the server records
 * the highest level the learner reached and would then be told a smaller number
 * than the truth.
 *
 * The text of each hint comes from the server (`hintFor` in
 * `shared/schemas/answer.ts`), clamped server-side. This component decides which
 * buttons exist and what they are called, never what they say.
 */

const LEVEL_LABELS: Record<number, string> = {
  1: "Gợi ý nhỏ",
  2: "Gợi ý rõ hơn",
  3: "Gợi ý một phần lời giải",
  4: "Gợi ý gần đầy đủ",
};

export function HintTray({
  levels,
  reachedLevel,
  hints,
  onRequest,
}: {
  levels: readonly number[];
  reachedLevel: number;
  hints: readonly string[];
  onRequest: (level: number) => void;
}): React.JSX.Element {
  return (
    <section className="hint-tray" aria-labelledby="hint-tray-title">
      <h3 className="hint-tray__title" id="hint-tray-title">
        Cần giúp đỡ?
      </h3>

      <div className="hint-tray__buttons">
        {levels.map((level) => {
          const alreadyShown = reachedLevel >= level;
          const isNext = level === reachedLevel + 1;
          return (
            <button
              key={level}
              type="button"
              className={`btn btn--hint ${alreadyShown ? "is-used" : ""}`}
              disabled={!isNext}
              aria-disabled={!isNext}
              onClick={() => onRequest(level)}
              title={
                alreadyShown
                  ? "Gợi ý này đã được mở."
                  : !isNext
                    ? "Em hãy mở gợi ý trước đó đã."
                    : undefined
              }
            >
              {LEVEL_LABELS[level] ?? `Gợi ý mức ${level}`}
              {alreadyShown ? " ✓" : ""}
            </button>
          );
        })}
      </div>

      {hints.length > 0 ? (
        <ol className="hint-tray__list" data-testid="hint-list">
          {hints.map((hint) => (
            <li key={hint} className="hint-tray__item">
              {hint}
            </li>
          ))}
        </ol>
      ) : null}

      {reachedLevel > 0 ? (
        <p className="hint-tray__note">
          Em đã dùng gợi ý mức {reachedLevel}. Câu trả lời lần này sẽ được ghi nhận là có
          giúp đỡ.
        </p>
      ) : null}
    </section>
  );
}
