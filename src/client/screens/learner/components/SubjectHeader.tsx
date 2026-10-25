/**
 * The subject header: title, back, home.
 *
 * Three fixed actions, so a learner never has to hunt. The subject title comes
 * from the response; a subject that came back null shows a neutral label rather
 * than a guessed name.
 */

type SubjectSummary = {
  id: string;
  nameVi: string;
  nameEn: string;
  active: boolean;
  lessonCount: number;
};

export function SubjectHeader({
  subject,
  onBack,
  onHome,
}: {
  subject: SubjectSummary | null;
  onBack: () => void;
  onHome: () => void;
}): React.JSX.Element {
  return (
    <header className="subject-header">
      <div className="subject-header__row">
        <button type="button" className="btn btn--secondary" onClick={onBack}>
          ← Quay lại
        </button>
        <button type="button" className="btn btn--secondary" onClick={onHome}>
          🏠 Trang chủ
        </button>
      </div>
      <h1 className="subject-header__title">{subject ? subject.nameVi : "Môn học"}</h1>
      <p className="subject-header__subtitle">
        {subject ? `Bản mẫu tiếng Anh: ${subject.nameEn}` : "Đang tải thông tin môn học…"}
      </p>
    </header>
  );
}
