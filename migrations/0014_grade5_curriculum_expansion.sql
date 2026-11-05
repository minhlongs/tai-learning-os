-- ============================================================================
-- TAI LEARNING OS — Grade 5 Curriculum Expansion (Schema v14)
--
-- Migration 0014 gives Grade 5 the same 5-lesson parity Grade 4 already has:
-- 4 core skills per active subject plus one baseline diagnostic that reuses a
-- core skill of the same subject. It adds catalogue rows only.
--
-- Lesson bodies do NOT live in SQL. They are TypeScript definitions under
-- `src/shared/content/`, walked by the seed. A lesson whose `skill_id` is not
-- present in `skills` is dropped by the seed without an error, so this
-- migration must run before `npm run seed:demo`.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (14, strftime('%s','now') * 1000, 'Grade 5 curriculum expansion: 20 skills, 20 objectives, Grade 5 parity');

-- ── Grade 5 skills ──────────────────────────────────────────────────────────
INSERT OR IGNORE INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to) VALUES
  -- Toan
  ('math-dec-place-value', 'math', 'MATH.DEC.PLACE', 'Hàng và giá trị của số thập phân', 'Place value in decimals', 5, 5),
  ('math-dec-add-sub', 'math', 'MATH.DEC.OPS', 'Cộng và trừ số thập phân', 'Adding and subtracting decimals', 5, 5),
  ('math-percent', 'math', 'MATH.PERCENT', 'Tỉ số phần trăm', 'Percentages', 5, 5),
  ('math-circle', 'math', 'MATH.GEO.CIRCLE', 'Chu vi và diện tích hình tròn', 'Circumference and area of a circle', 5, 5),
  -- Tieng Anh
  ('eng-past-simple', 'english', 'ENG.GRAM.PAST', 'Thì quá khứ đơn với động từ có quy tắc', 'Past simple with regular verbs', 5, 5),
  ('eng-comparatives', 'english', 'ENG.GRAM.COMPARE', 'So sánh hơn với tính từ ngắn', 'Comparatives with short adjectives', 5, 5),
  ('eng-daily-routine', 'english', 'ENG.VOC.ROUTINE', 'Thói quen hằng ngày và trạng từ tần suất', 'Daily routines and adverbs of frequency', 5, 5),
  ('eng-directions', 'english', 'ENG.COMM.DIRECT', 'Chỉ đường và giới từ chỉ vị trí', 'Asking for and giving directions', 5, 5),
  -- Tieng Viet
  ('vie-paragraph-structure', 'vietnamese', 'VIE.WRITE.STRUCT', 'Cấu trúc đoạn văn: mở, thân, kết', 'Paragraph structure: opening, body, closing', 5, 5),
  ('vie-figurative', 'vietnamese', 'VIE.READ.FIGUR', 'So sánh và nhân hóa', 'Simile and personification', 5, 5),
  ('vie-inference', 'vietnamese', 'VIE.READ.INFER', 'Suy luận từ chi tiết trong văn bản', 'Inferring from textual details', 5, 5),
  ('vie-sentence-linking', 'vietnamese', 'VIE.WRITE.LINK', 'Liên kết câu trong đoạn văn', 'Linking sentences in a paragraph', 5, 5),
  -- Khoa hoc
  ('sci-life-cycles', 'science', 'SCI.LIFE.CYCLE', 'Vòng đời của sinh vật', 'Life cycles of living things', 5, 5),
  ('sci-food-chains', 'science', 'SCI.LIFE.FOODCHAIN', 'Chuỗi thức ăn trong tự nhiên', 'Food chains in nature', 5, 5),
  ('sci-energy-forms', 'science', 'SCI.PHYS.ENERGY', 'Các dạng năng lượng và sự chuyển hóa', 'Forms and transformations of energy', 5, 5),
  ('sci-environment', 'science', 'SCI.ENV.IMPACT', 'Con người và môi trường', 'Human impact on the environment', 5, 5),
  -- Tu duy phan bien
  ('deb-argument-structure', 'debate', 'DEB.ARG.STRUCT', 'Cấu trúc lập luận: luận điểm và lý do', 'Argument structure: claim and reason', 5, 5),
  ('deb-source-credibility', 'debate', 'DEB.EVAL.SOURCE', 'Đánh giá độ tin cậy của nguồn', 'Evaluating source credibility', 5, 5),
  ('deb-fallacies', 'debate', 'DEB.EVAL.FALLACY', 'Lỗi lập luận thường gặp', 'Common reasoning fallacies', 5, 5),
  ('deb-civil-disagreement', 'debate', 'DEB.DIAL.CIVIL', 'Tranh luận văn minh', 'Civil disagreement', 5, 5);

-- ── Prerequisite edges: each Grade 5 skill rests on a Grade 4 foundation ────
INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_id) VALUES
  ('math-dec-place-value', 'math-frac-identify'),
  ('math-dec-add-sub', 'math-dec-place-value'),
  ('math-percent', 'math-dec-add-sub'),
  ('math-circle', 'math-area'),
  ('eng-past-simple', 'eng-sentence-basic'),
  ('eng-comparatives', 'eng-sentence-basic'),
  ('eng-daily-routine', 'eng-voc-home'),
  ('eng-directions', 'eng-dialogue'),
  ('vie-paragraph-structure', 'vie-sentence-clear'),
  ('vie-figurative', 'vie-reading-main'),
  ('vie-inference', 'vie-evidence'),
  ('vie-sentence-linking', 'vie-paragraph-structure'),
  ('sci-life-cycles', 'sci-plant-needs'),
  ('sci-food-chains', 'sci-life-cycles'),
  ('sci-energy-forms', 'sci-light-and-shadow'),
  ('sci-environment', 'sci-food-chains'),
  ('deb-argument-structure', 'deb-claim-reason'),
  ('deb-source-credibility', 'deb-evidence-relevance'),
  ('deb-fallacies', 'deb-fact-opinion'),
  ('deb-civil-disagreement', 'deb-counterargument-respect');

-- ── Grade 5 curriculum objectives ────────────────────────────────────────────
INSERT OR IGNORE INTO curriculum_objectives (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at) VALUES
  ('obj-math-dec-place', 'math', 5, 'GDPT2018.MATH.5.DEC.01', 'Đọc, viết và xác định giá trị các hàng của số thập phân', 'Đọc và viết số thập phân, xác định được giá trị của từng chữ số theo hàng phần mười, phần trăm, phần nghìn.', 'math-dec-place-value', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-dec-ops', 'math', 5, 'GDPT2018.MATH.5.DEC.02', 'Thực hiện phép cộng và trừ số thập phân', 'Đặt tính và thực hiện đúng phép cộng, phép trừ hai số thập phân, vận dụng vào bài toán có lời văn.', 'math-dec-add-sub', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-percent', 'math', 5, 'GDPT2018.MATH.5.PERCENT.03', 'Giải bài toán về tỉ số phần trăm', 'Hiểu ý nghĩa tỉ số phần trăm và tìm được giá trị phần trăm của một số trong tình huống quen thuộc.', 'math-percent', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-circle', 'math', 5, 'GDPT2018.MATH.5.GEO.04', 'Tính chu vi và diện tích hình tròn', 'Nắm được quan hệ giữa đường kính và bán kính, tính được chu vi và diện tích hình tròn với số pi cho trước.', 'math-circle', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-past-simple', 'english', 5, 'GDPT2018.ENG.5.GRAM.01', 'Dùng thì quá khứ đơn với động từ có quy tắc', 'Nhận biết và sử dụng dạng quá khứ của động từ có quy tắc (thêm -ed) để kể lại việc đã xảy ra.', 'eng-past-simple', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-comparatives', 'english', 5, 'GDPT2018.ENG.5.GRAM.02', 'So sánh hơn với tính từ ngắn', 'Tạo và dùng dạng so sánh hơn của tính từ ngắn (thêm -er) để so sánh hai người hoặc hai vật.', 'eng-comparatives', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-routine', 'english', 5, 'GDPT2018.ENG.5.VOC.03', 'Nói về thói quen hằng ngày và tần suất', 'Sử dụng từ vựng chỉ hoạt động hằng ngày và trạng từ tần suất để mô tả thói quen của bản thân.', 'eng-daily-routine', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-directions', 'english', 5, 'GDPT2018.ENG.5.COMM.04', 'Hỏi và chỉ đường, dùng giới từ chỉ vị trí', 'Hỏi đường và chỉ đường đơn giản, dùng đúng giới từ chỉ vị trí như next to, between, opposite.', 'eng-directions', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-para-structure', 'vietnamese', 5, 'GDPT2018.VIE.5.WRITE.01', 'Viết đoạn văn có mở, thân, kết', 'Sắp xếp được các câu thành đoạn văn hoàn chỉnh gồm câu mở đoạn, các câu làm rõ ý và câu kết đoạn.', 'vie-paragraph-structure', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-figurative', 'vietnamese', 5, 'GDPT2018.VIE.5.READ.02', 'Nhận biết và hiểu tác dụng của so sánh, nhân hóa', 'Phát hiện biện pháp so sánh, nhân hóa trong câu văn và nêu được tác dụng của chúng.', 'vie-figurative', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-inference', 'vietnamese', 5, 'GDPT2018.VIE.5.READ.03', 'Suy luận từ chi tiết trong văn bản', 'Dựa vào chi tiết đã đọc để suy ra điều chưa được nói trực tiếp trong văn bản.', 'vie-inference', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-linking', 'vietnamese', 5, 'GDPT2018.VIE.5.WRITE.04', 'Liên kết câu trong đoạn văn', 'Dùng từ nối hoặc lặp từ hợp lý để các câu trong đoạn văn gắn bó và mạch lạc.', 'vie-sentence-linking', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-life-cycles', 'science', 5, 'GDPT2018.SCI.5.LIFE.01', 'Mô tả vòng đời của một số sinh vật', 'Nhận biết các giai đoạn trong vòng đời của cây và động vật quen thuộc, nêu được thứ tự các giai đoạn.', 'sci-life-cycles', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-food-chains', 'science', 5, 'GDPT2018.SCI.5.LIFE.02', 'Mô tả chuỗi thức ăn trong tự nhiên', 'Xác định được sinh vật sản xuất, sinh vật tiêu thụ và mối quan hệ ăn – bị ăn trong chuỗi thức ăn.', 'sci-food-chains', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-energy', 'science', 5, 'GDPT2018.SCI.5.ENERGY.03', 'Nhận biết các dạng năng lượng và sự chuyển hóa', 'Nêu được một số dạng năng lượng quen thuộc và ví dụ về sự chuyển hóa năng lượng trong đời sống.', 'sci-energy-forms', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-environment', 'science', 5, 'GDPT2018.SCI.5.ENV.04', 'Nêu tác động của con người đến môi trường và biện pháp bảo vệ', 'Nhận biết việc làm gây ô nhiễm hoặc bảo vệ môi trường và đề xuất hành động phù hợp với lứa tuổi.', 'sci-environment', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-deb-argument', 'debate', 5, 'TLO.DEB.5.ARG.01', 'Xây dựng lập luận gồm luận điểm và lý do', 'Nêu được luận điểm rõ ràng và đưa ra lý do phù hợp để bảo vệ luận điểm đó.', 'deb-argument-structure', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5', strftime('%s','now') * 1000),
  ('obj-deb-credibility', 'debate', 5, 'TLO.DEB.5.SOURCE.02', 'Đánh giá độ tin cậy của nguồn thông tin', 'Phân biệt nguồn đáng tin và nguồn cần kiểm chứng dựa trên người cung cấp, thời điểm và bằng chứng đi kèm.', 'deb-source-credibility', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5', strftime('%s','now') * 1000),
  ('obj-deb-fallacy', 'debate', 5, 'TLO.DEB.5.FALLACY.03', 'Nhận diện một số lỗi lập luận thường gặp', 'Nhận ra lỗi như thay vì bàn nội dung lại công kích người nói, hoặc lấy số đông làm bằng chứng.', 'deb-fallacies', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5', strftime('%s','now') * 1000),
  ('obj-deb-civil', 'debate', 5, 'TLO.DEB.5.DIALOG.04', 'Tranh luận văn minh và phản hồi vào nội dung', 'Giữ bình tĩnh khi bất đồng, ghi nhận điểm hợp lý của người khác và phản hồi vào lý lẽ thay vì con người.', 'deb-civil-disagreement', 'original_supplemental', 'Biên soạn riêng cho TAI Learning OS — Môn Tư duy phản biện Lớp 5', strftime('%s','now') * 1000);
