-- ============================================================================
-- TAI LEARNING OS — Phase 3: Science & Debate Modules Activation (Schema v10)
--
-- Migration 0010 activates the Science (`science` — Khoa học) and Reasoning
-- (`debate` — Tư duy phản biện) modules for Grade 4 learners, adds their skills,
-- prerequisite graph edges, and GDPT 2018 / supplemental curriculum objectives.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (10, strftime('%s','now') * 1000, 'Phase 3: activate science and debate subjects, skills, prerequisite edges, and curriculum objectives');

-- Activate Science (Khoa học) and Reasoning & Debate (Tư duy phản biện)
UPDATE subjects
SET active = 1
WHERE id IN ('science', 'debate');

-- Add Grade 4 Science & Debate skills
INSERT OR IGNORE INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to) VALUES
  ('sci-water-cycle', 'science', 'SCI.EARTH.WATER', 'Vòng tuần hoàn của nước', 'The water cycle', 4, 5),
  ('sci-plant-needs', 'science', 'SCI.LIFE.PLANTS', 'Nhu cầu sống của thực vật', 'What plants need to live', 4, 5),
  ('deb-claim-reason', 'debate', 'DEB.ARG.CLAIM', 'Ý kiến và lý lẽ hỗ trợ', 'Claims and supporting reasons', 4, 5),
  ('deb-fact-opinion', 'debate', 'DEB.EVAL.FACT', 'Phân biệt sự thật và ý kiến', 'Distinguishing fact from opinion', 4, 5);

-- Add prerequisite edges for the new skills
INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_id) VALUES
  ('sci-plant-needs', 'sci-water-cycle'),
  ('deb-fact-opinion', 'deb-claim-reason');

-- Add GDPT 2018 / supplemental curriculum objectives
INSERT OR IGNORE INTO curriculum_objectives (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at) VALUES
  ('obj-sci-water-cycle', 'science', 4, 'GDPT2018.SCI.4.WATER.01', 'Mô tả sự chuyển thể và vòng tuần hoàn của nước trong tự nhiên', 'Nhận biết sự bay hơi, ngưng tụ và mô tả vòng tuần hoàn của nước trong tự nhiên.', 'sci-water-cycle', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-plant-needs', 'science', 4, 'GDPT2018.SCI.4.PLANT.02', 'Xác định các yếu tố cần cho sự sống và phát triển của thực vật', 'Nêu được thực vật cần ánh sáng, không khí, nước, chất khoáng và nhiệt độ thích hợp để sống và phát triển.', 'sci-plant-needs', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-deb-claim-reason', 'debate', 4, 'TLO.DEB.4.CLAIM.01', 'Nêu ý kiến rõ ràng kèm lý lẽ giải thích', 'Biết nêu một ý kiến (luận điểm) và đưa ra lý lẽ phù hợp để giải thích vì sao mình nghĩ như vậy.', 'deb-claim-reason', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4', strftime('%s','now') * 1000),
  ('obj-deb-fact-opinion', 'debate', 4, 'TLO.DEB.4.FACT.02', 'Phân biệt điều kiểm chứng được với cảm nhận cá nhân', 'Phân biệt câu nêu sự thật có thể kiểm chứng bằng quan sát/đo đạc với câu nêu cảm nhận hoặc ý kiến riêng.', 'deb-fact-opinion', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4', strftime('%s','now') * 1000);
