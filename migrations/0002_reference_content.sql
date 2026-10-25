-- ============================================================================
-- TAI LEARNING OS — Reference content (schema v1)
--
-- This migration installs the catalogue: subjects, skills, and prerequisites.
-- It is REQUIRED for the app to work — no app behaviour depends on it being
-- optional, and it contains no learner data.
--
-- Lessons live in TypeScript (src/shared/content/) so they can be typechecked
-- and unit-tested. They are inserted at runtime by the seed script, because
-- their content payload must match the exercise schema exactly.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (1, strftime('%s','now') * 1000, 'Initial schema: parents through audit_events');

-- --- Subjects ---------------------------------------------------------------
-- Three active subjects. Science and later subjects are documented as future
-- modules and are marked inactive so they never appear as if implemented.
INSERT INTO subjects (id, name_vi, name_en, sort, active) VALUES
  ('math',      'Toán',        'Mathematics', 1, 1),
  ('english',   'Tiếng Anh',   'English',     2, 1),
  ('vietnamese','Tiếng Việt',  'Vietnamese',  3, 1),
  ('science',   'Khoa học',    'Science',     4, 0),
  ('debate',    'Tư duy phản biện', 'Reasoning & Debate', 5, 0);

-- --- Skills -----------------------------------------------------------------
INSERT INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to) VALUES
  -- Mathematics
  ('math-frac-identify',  'math', 'MATH.FRAC.IDENTIFY',  'Nhận biết phân số',          'Identify fractions',                3, 4),
  ('math-frac-equiv',     'math', 'MATH.FRAC.EQUIV',     'Phân số tương đương',        'Equivalent fractions',              3, 4),
  ('math-frac-compare',   'math', 'MATH.FRAC.COMPARE',   'So sánh phân số',            'Compare fractions',                 4, 5),
  ('math-area',           'math', 'MATH.AREA.RECT',      'Diện tích hình chữ nhật',    'Area of a rectangle',               4, 5),
  ('math-word-problem',   'math', 'MATH.WORD.ADD',       'Bài toán có lời văn',        'Word problems',                     3, 4),
  -- English
  ('eng-voc-noun',        'english', 'ENG.VOC.NOUN',     'Danh từ thông dụng',         'Common nouns',                      3, 4),
  ('eng-sentence-basic',  'english', 'ENG.SENT.SIMPLE',  'Câu đơn S–V–O',              'Simple sentences',                  3, 4),
  ('eng-dialogue',        'english', 'ENG.DIALOG.GREET', 'Hội thoại chào hỏi',         'Short dialogues',                   3, 4),
  ('eng-voc-home',        'english', 'ENG.VOC.HOME',     'Từ vựng trong nhà',          'Home vocabulary',                   3, 4),
  -- Vietnamese
  ('vie-reading-main',    'vietnamese','VIE.READ.MAIN',  'Ý chính đoạn văn',           'Main idea of a passage',            4, 5),
  ('vie-evidence',        'vietnamese','VIE.READ.EVID',  'Dẫn chứng từ bài đọc',       'Textual evidence',                  4, 5),
  ('vie-sentence-clear',  'vietnamese','VIE.WRITE.CLEAR','Câu văn rõ ràng',            'Clear sentence construction',       4, 5);

-- --- Prerequisites ----------------------------------------------------------
-- Only edges we actually use for lesson ordering. Keep this minimal: a
-- prerequisite edge the app does not read is speculative structure.
INSERT INTO skill_prerequisites (skill_id, prerequisite_id) VALUES
  ('math-frac-equiv',       'math-frac-identify'),
  ('math-frac-compare',     'math-frac-equiv'),
  ('math-word-problem',     'math-frac-identify'),
  ('eng-sentence-basic',    'eng-voc-noun'),
  ('eng-voc-home',          'eng-voc-noun'),
  ('vie-evidence',          'vie-reading-main');
