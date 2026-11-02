-- ============================================================================
-- TAI LEARNING OS — Phase 3.5: Science & Debate 5-Lesson Depth Parity (Schema v11)
--
-- Migration 0011 expands Grade 4 Science (`science` — Khoa học) and Reasoning
-- (`debate` — Tư duy phản biện) from 2 core skills each to 4 core skills each
-- (plus 1 baseline diagnostic per subject = 5 lessons per subject, 25 total),
-- adding prerequisite graph edges and GDPT 2018 / supplemental objectives.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (11, strftime('%s','now') * 1000, 'Phase 3.5: expand science and debate to 4 core skills each (25 total lessons across 5 subjects)');

-- Add 2 Grade 4 Science skills & 2 Grade 4 Debate skills
INSERT OR IGNORE INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to) VALUES
  ('sci-states-of-matter', 'science', 'SCI.MATTER.STATES', 'Ba thể của chất và sự chuyển thể', 'Three states of matter and phase changes', 4, 5),
  ('sci-light-and-shadow', 'science', 'SCI.ENERGY.LIGHT', 'Ánh sáng, bóng tối và bảo vệ thị giác', 'Light, shadows, and eye protection', 4, 5),
  ('deb-evidence-relevance', 'debate', 'DEB.ARG.EVIDENCE', 'Chọn bằng chứng đúng trọng tâm', 'Choosing relevant supporting evidence', 4, 5),
  ('deb-counterargument-respect', 'debate', 'DEB.DIAL.RESPECT', 'Lắng nghe và phản hồi lịch sự trước góc nhìn khác', 'Respectful listening and responding to counterviews', 4, 5);

-- Add prerequisite edges for the new skills
INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_id) VALUES
  ('sci-states-of-matter', 'sci-water-cycle'),
  ('sci-light-and-shadow', 'sci-plant-needs'),
  ('deb-evidence-relevance', 'deb-fact-opinion'),
  ('deb-counterargument-respect', 'deb-evidence-relevance');

-- Add GDPT 2018 / supplemental curriculum objectives
INSERT OR IGNORE INTO curriculum_objectives (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at) VALUES
  ('obj-sci-states-of-matter', 'science', 4, 'GDPT2018.SCI.4.MATTER.03', 'Phân biệt ba thể rắn, lỏng, khí và sự chuyển thể của chất', 'Nhận biết đặc điểm của chất ở thể rắn, lỏng, khí và giải thích hiện tượng nóng chảy, đông đặc, bay hơi, ngưng tụ.', 'sci-states-of-matter', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-light-and-shadow', 'science', 4, 'GDPT2018.SCI.4.LIGHT.04', 'Giải thích sự truyền ánh sáng, sự tạo thành bóng tối và cách bảo vệ mắt', 'Phân biệt vật tự phát sáng và vật được chiếu sáng, giải thích vì sao có bóng tối sau vật cản sáng và vận dụng bảo vệ mắt.', 'sci-light-and-shadow', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-deb-evidence-relevance', 'debate', 4, 'TLO.DEB.4.EVID.03', 'Đánh giá mức độ phù hợp và độ tin cậy của bằng chứng', 'Biết lựa chọn dẫn chứng cụ thể, sát với luận điểm và phân biệt bằng chứng thực tế với suy đoán cảm tính.', 'deb-evidence-relevance', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4', strftime('%s','now') * 1000),
  ('obj-deb-counterargument-respect', 'debate', 4, 'TLO.DEB.4.RESP.04', 'Lắng nghe ý kiến trái chiều và phản hồi văn minh vào nội dung', 'Biết ghi nhận điểm hợp lý của người khác, phản hồi vào lý lẽ thay vì công kích cá nhân và đề xuất giải pháp chung.', 'deb-counterargument-respect', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 4', strftime('%s','now') * 1000);
