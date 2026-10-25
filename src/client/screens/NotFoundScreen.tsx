/** An unknown path. Bilingual-free: the whole learner experience is Vietnamese. */

export function NotFoundScreen({
  onNavigate,
}: {
  onNavigate: (to: string) => void;
}): React.JSX.Element {
  return (
    <main className="page">
      <section className="card">
        <h1 className="page__title">Không tìm thấy trang</h1>
        <p className="page__lede">
          Đường dẫn này không tồn tại. Em có thể quay về trang học tập.
        </p>
        <p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onNavigate("/")}
          >
            Về trang học tập
          </button>
        </p>
      </section>
    </main>
  );
}
