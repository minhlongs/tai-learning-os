-- ============================================================================
-- TAI LEARNING OS — Grade 4 Curriculum Expansion (Schema v8)
--
-- Migration 0008 adds the new Vietnamese Grade 4 skill `vie-story-lesson`
-- ("Bài học từ câu chuyện") and the GDPT 2018 curriculum objectives for
-- English home vocabulary (`obj-eng-voc-home`) and Vietnamese story moral
-- comprehension (`obj-vie-story-lesson`), so each of the 12 core Grade 4
-- lessons maps 1-to-1 to a distinct skill and GDPT 2018 objective.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (8, strftime('%s','now') * 1000, 'Grade 4 curriculum expansion: vie-story-lesson skill and GDPT 2018 objectives');

INSERT OR IGNORE INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to) VALUES
  ('vie-story-lesson', 'vietnamese', 'VIE.READ.MORAL', 'Bài học từ câu chuyện', 'Moral of a story', 4, 5);

INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_id) VALUES
  ('vie-story-lesson', 'vie-evidence');

INSERT OR IGNORE INTO curriculum_objectives (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at) VALUES
  ('obj-eng-voc-home', 'english', 4, 'GDPT2018.ENG.4.VOC.02', 'Nhận biết và sử dụng từ vựng về ngôi nhà', 'Nhận biết và sử dụng từ vựng chỉ các phòng và đồ vật quen thuộc trong gia đình.', 'eng-voc-home', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-story-lesson', 'vietnamese', 4, 'GDPT2018.VIE.4.READ.03', 'Rút ra bài học và thông điệp từ câu chuyện', 'Hiểu nội dung chính và liên hệ chi tiết trong truyện để rút ra bài học hoặc thông điệp có ý nghĩa.', 'vie-story-lesson', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000);
