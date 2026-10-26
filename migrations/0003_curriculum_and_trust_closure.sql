-- ============================================================================
-- TAI LEARNING OS — Curriculum Foundation & Trust Closure (Schema v3)
--
-- Migration 0003 installs:
--   1. auth_throttles: Persistent account-scoped & IP-scoped failed-login tracking.
--      Survives Worker restart, header/User-Agent rotation, and enforces a bounded
--      lockout with a documented safe unlock script.
--   2. curriculum_objectives: Formal registry of learning objectives referencing
--      Vietnam's GDPT 2018 General Education Program and supplemental objectives.
--   3. curriculum_intakes: Parent-configured curriculum settings per learner/subject
--      (school year, grade, textbook series, current unit/lesson, weekly sessions).
--   4. lesson_metadata: Extended provenance, GDPT objective linkage, expected
--      duration, review recommendations, and baseline assessment flag.
--   5. baseline_assessments: Supervised baseline assessment run records and findings.
--   6. learning_plan_items: Dynamic four-week learning planner tasks and review queue.
--   7. session_reflections: Post-session reflection notes and feelings.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (3, strftime('%s','now') * 1000, 'Curriculum foundation & trust closure: persistent auth throttling, GDPT 2018 objectives, curriculum intake, lesson metadata, baseline assessments, 4-week planner, session reflections');

-- 1. Persistent Auth Throttling
CREATE TABLE IF NOT EXISTS auth_throttles (
  key TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('account', 'ip')),
  failed_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL,
  locked_until INTEGER,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_auth_throttles_scope ON auth_throttles(scope);
CREATE INDEX IF NOT EXISTS idx_auth_throttles_locked ON auth_throttles(locked_until);

-- 2. Curriculum Objectives Registry (GDPT 2018 + Supplemental)
CREATE TABLE IF NOT EXISTS curriculum_objectives (
  id TEXT PRIMARY KEY,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE,
  grade INTEGER NOT NULL,
  code TEXT NOT NULL UNIQUE,
  title_vi TEXT NOT NULL,
  description_vi TEXT NOT NULL,
  skill_id TEXT REFERENCES skills(id) ON DELETE SET NULL,
  provenance TEXT NOT NULL CHECK (provenance IN ('gdpt_2018_objective', 'parent_textbook', 'original_supplemental', 'unverified_assumption')),
  source_ref TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_curriculum_objectives_subject_grade ON curriculum_objectives(subject_id, grade);
CREATE INDEX IF NOT EXISTS idx_curriculum_objectives_skill ON curriculum_objectives(skill_id);

-- 3. Parent Curriculum Intake Configuration
CREATE TABLE IF NOT EXISTS curriculum_intakes (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  school_year_label TEXT NOT NULL,
  grade INTEGER NOT NULL,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE,
  textbook_series TEXT NOT NULL DEFAULT 'UNKNOWN',
  current_unit TEXT NOT NULL DEFAULT 'UNKNOWN',
  current_lesson TEXT NOT NULL DEFAULT 'UNKNOWN',
  weekly_sessions INTEGER NOT NULL DEFAULT 3,
  session_duration_minutes INTEGER NOT NULL DEFAULT 20,
  material_reference TEXT,
  learning_goals_vi TEXT,
  provenance TEXT NOT NULL DEFAULT 'parent_textbook' CHECK (provenance IN ('gdpt_2018_objective', 'parent_textbook', 'original_supplemental', 'unverified_assumption')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(learner_id, subject_id, school_year_label)
);
CREATE INDEX IF NOT EXISTS idx_curriculum_intakes_learner ON curriculum_intakes(learner_id);

-- 4. Lesson Extended Metadata & Provenance
CREATE TABLE IF NOT EXISTS lesson_metadata (
  lesson_id TEXT PRIMARY KEY REFERENCES lessons(id) ON DELETE CASCADE,
  objective_id TEXT REFERENCES curriculum_objectives(id) ON DELETE SET NULL,
  provenance TEXT NOT NULL DEFAULT 'original_supplemental' CHECK (provenance IN ('gdpt_2018_objective', 'parent_textbook', 'original_supplemental', 'unverified_assumption')),
  source_ref TEXT,
  expected_duration_minutes INTEGER NOT NULL DEFAULT 20,
  review_recommendation_vi TEXT,
  is_baseline INTEGER NOT NULL DEFAULT 0 CHECK (is_baseline IN (0, 1)),
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_lesson_metadata_objective ON lesson_metadata(objective_id);
CREATE INDEX IF NOT EXISTS idx_lesson_metadata_baseline ON lesson_metadata(is_baseline);

-- 5. Baseline Assessments
CREATE TABLE IF NOT EXISTS baseline_assessments (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE,
  session_id TEXT REFERENCES learning_sessions(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reviewed')),
  observed_summary_vi TEXT,
  supported_summary_vi TEXT,
  needs_observation_json TEXT NOT NULL DEFAULT '[]',
  suggested_lessons_json TEXT NOT NULL DEFAULT '[]',
  parent_review_required INTEGER NOT NULL DEFAULT 1 CHECK (parent_review_required IN (0, 1)),
  created_at INTEGER NOT NULL,
  completed_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_baseline_assessments_learner ON baseline_assessments(learner_id);

-- 6. Dynamic Four-Week Learning Planner Items
CREATE TABLE IF NOT EXISTS learning_plan_items (
  id TEXT PRIMARY KEY,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  school_year_label TEXT NOT NULL,
  week_index INTEGER NOT NULL CHECK (week_index BETWEEN 1 AND 4),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  scheduled_date TEXT,
  subject_id TEXT NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE,
  skill_id TEXT REFERENCES skills(id) ON DELETE SET NULL,
  lesson_id TEXT REFERENCES lessons(id) ON DELETE SET NULL,
  item_kind TEXT NOT NULL CHECK (item_kind IN ('lesson', 'review', 'baseline')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'skipped', 'rescheduled')),
  duration_minutes INTEGER NOT NULL DEFAULT 20,
  parent_note TEXT,
  reason_vi TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_learning_plan_items_learner_week ON learning_plan_items(learner_id, week_index, day_of_week);
CREATE INDEX IF NOT EXISTS idx_learning_plan_items_status ON learning_plan_items(status);

-- 7. Session Reflection
CREATE TABLE IF NOT EXISTS session_reflections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE REFERENCES learning_sessions(id) ON DELETE CASCADE,
  learner_id TEXT NOT NULL REFERENCES learners(id) ON DELETE CASCADE,
  feeling TEXT NOT NULL CHECK (feeling IN ('confident', 'good', 'neutral', 'confused', 'tired')),
  note_vi TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_reflections_learner ON session_reflections(learner_id);

-- --- GDPT 2018 Official Grade 4 Curriculum Objectives Seed -------------------
INSERT INTO curriculum_objectives (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at) VALUES
  ('obj-math-frac-intro', 'math', 4, 'GDPT2018.MATH.4.FRAC.01', 'Hình thành khái niệm phân số và phân số bằng nhau', 'Nhận biết phân số, tử số, mẫu số; nhận biết tính chất cơ bản của phân số và hai phân số bằng nhau.', 'math-frac-equiv', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-frac-comp', 'math', 4, 'GDPT2018.MATH.4.FRAC.02', 'So sánh hai phân số cùng và khác mẫu số', 'Quy đồng mẫu số và so sánh hai phân số trong phạm vi chương trình lớp 4.', 'math-frac-compare', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-geo-area', 'math', 4, 'GDPT2018.MATH.4.GEO.01', 'Tính diện tích hình chữ nhật và hình vuông', 'Biết cách tính diện tích hình chữ nhật, hình vuông và vận dụng giải các bài toán thực tế đơn giản.', 'math-area', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-word-prob', 'math', 4, 'GDPT2018.MATH.4.WORD.01', 'Giải bài toán có lời văn đến hai bước tính', 'Nhận biết yêu cầu, dữ kiện bài toán có lời văn liên quan đến số tự nhiên và phân số, trình bày lời giải rõ ràng.', 'math-word-problem', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-read-main', 'vietnamese', 4, 'GDPT2018.VIE.4.READ.01', 'Xác định chủ đề và ý chính của đoạn văn', 'Đọc hiểu văn bản văn học và thông tin, xác định ý chính của từng đoạn và toàn bài.', 'vie-reading-main', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-read-evid', 'vietnamese', 4, 'GDPT2018.VIE.4.READ.02', 'Tìm chi tiết, hình ảnh và dẫn chứng minh họa trong văn bản', 'Chỉ ra chi tiết, dẫn chứng trong văn bản làm cơ sở cho câu trả lời và nhận xét của mình.', 'vie-evidence', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-write-sent', 'vietnamese', 4, 'GDPT2018.VIE.4.WRITE.01', 'Viết câu hoàn chỉnh có đủ thành phần chính', 'Nhận biết chủ ngữ, vị ngữ; viết câu đúng ngữ pháp, sử dụng đúng dấu câu và viết hoa đúng quy tắc.', 'vie-sentence-clear', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-voc-noun', 'english', 4, 'GDPT2018.ENG.4.VOC.01', 'Nhận biết và sử dụng danh từ quen thuộc', 'Nhận biết và sử dụng từ vựng chỉ đồ vật, người, con vật trong ngữ cảnh lớp học và gia đình.', 'eng-voc-noun', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-sent-basic', 'english', 4, 'GDPT2018.ENG.4.SENT.01', 'Xây dựng câu đơn ngữ pháp cơ bản S-V-O', 'Sắp xếp từ ngữ thành câu đơn ngắn, đúng trật tự chủ ngữ - động từ - bổ ngữ.', 'eng-sentence-basic', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-dial-greet', 'english', 4, 'GDPT2018.ENG.4.DIAL.01', 'Giao tiếp chào hỏi và hỏi thăm đơn giản', 'Thực hành hội thoại chào hỏi, cảm ơn, xin phép lịch sự trong môi trường học đường.', 'eng-dialogue', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000);
