-- ============================================================================
-- TAI LEARNING OS — Grade 4 & Grade 5 Curriculum Expansion Wave 2 (Schema v17)
--
-- Migration 0017 expands the curriculum graph from 50 to 100 shipped lessons
-- (+5 Grade 4 core lessons and +5 Grade 5 core lessons across each of the five
-- active subjects: Math, English, Vietnamese, Science, and Debate / Critical
-- Thinking) and closes the sole remaining skill-to-objective mapping gap on
-- `math-frac-identify`:
--
--   1. Adds 49 new skills (`skills`: 41 -> 90; 18 per subject).
--   2. Adds 49 intra-subject, grade-monotonic prerequisite edges
--      (`skill_prerequisites`: 33 -> 82; acyclic DAG).
--   3. Adds 50 curriculum objectives (`curriculum_objectives`: 40 -> 90;
--      72 national GDPT 2018 outcomes + 18 original supplemental Debate
--      outcomes), including `obj-math-frac-identify` for `math-frac-identify`.
-- ============================================================================

INSERT INTO schema_versions (version, applied_at, description) VALUES
  (17, strftime('%s','now') * 1000, 'Grade 4 & Grade 5 curriculum expansion wave 2: 49 new skills, 49 prerequisite edges, 50 curriculum objectives (closing math-frac-identify gap)');

-- ── 1. New Grade 4 & Grade 5 skills (49 skills: 9 Math + 10 Eng + 10 Vie + 10 Sci + 10 Deb) ──
INSERT OR IGNORE INTO skills (id, subject_id, code, name_vi, name_en, grade_from, grade_to) VALUES
  -- Toán Lớp 4 (+4; `math-frac-identify` already exists from 0002)
  ('math-frac-add-sub', 'math', 'MATH.FRAC.ADDSUB', 'Cộng và trừ phân số', 'Add and subtract fractions', 4, 4),
  ('math-multi-digit-ops', 'math', 'MATH.NUM.MULTIDIGIT', 'Nhân và chia với số có hai chữ số', 'Multiply and divide by two-digit numbers', 4, 4),
  ('math-average', 'math', 'MATH.STAT.AVG', 'Tìm số trung bình cộng', 'Find the arithmetic average', 4, 4),
  ('math-angles-lines', 'math', 'MATH.GEO.ANGLES', 'Góc và hai đường thẳng vuông góc, song song', 'Angles, perpendicular and parallel lines', 4, 4),
  -- Toán Lớp 5 (+5)
  ('math-dec-mul-div', 'math', 'MATH.DEC.MULDIV', 'Nhân và chia số thập phân', 'Multiply and divide decimals', 5, 5),
  ('math-ratio-scale', 'math', 'MATH.NUM.RATIO', 'Tỉ số và tỉ lệ bản đồ', 'Ratios and map scales', 5, 5),
  ('math-tri-trap-area', 'math', 'MATH.GEO.TRITRAP', 'Diện tích hình tam giác và hình thang', 'Area of triangles and trapezoids', 5, 5),
  ('math-cuboid-volume', 'math', 'MATH.GEO.VOLUME', 'Thể tích hình hộp chữ nhật và hình lập phương', 'Volume of rectangular prisms and cubes', 5, 5),
  ('math-motion', 'math', 'MATH.MEAS.MOTION', 'Vận tốc, quãng đường và thời gian', 'Speed, distance, and time', 5, 5),

  -- Tiếng Anh Lớp 4 (+5)
  ('eng-school-subjects', 'english', 'ENG.VOC.SCHOOL', 'Môn học và thời khóa biểu ở trường', 'School subjects and timetable', 4, 4),
  ('eng-time-activities', 'english', 'ENG.COMM.TIME', 'Hỏi giờ và hoạt động hằng ngày', 'Telling the time and daily activities', 4, 4),
  ('eng-can-abilities', 'english', 'ENG.GRAM.CAN', 'Diễn đạt khả năng với can và cannot', 'Expressing ability with can and cannot', 4, 4),
  ('eng-weather-clothes', 'english', 'ENG.VOC.WEATHER', 'Thời tiết và trang phục phù hợp', 'Weather and suitable clothing', 4, 4),
  ('eng-present-continuous', 'english', 'ENG.GRAM.PRESCONT', 'Miêu tả việc đang diễn ra với hiện tại tiếp diễn', 'Actions happening now with present continuous', 4, 4),
  -- Tiếng Anh Lớp 5 (+5)
  ('eng-future-plans', 'english', 'ENG.GRAM.FUTURE', 'Dự định tương lai với be going to', 'Future plans with be going to', 5, 5),
  ('eng-health-advice', 'english', 'ENG.COMM.HEALTH', 'Sức khỏe thường gặp và lời khuyên should', 'Health problems and advice with should', 5, 5),
  ('eng-frequency-adverbs', 'english', 'ENG.GRAM.FREQ', 'Trạng từ chỉ tần suất trong thói quen', 'Adverbs of frequency in routines', 5, 5),
  ('eng-superlatives', 'english', 'ENG.GRAM.SUPER', 'So sánh nhất của tính từ', 'Superlative adjectives', 5, 5),
  ('eng-short-email-reading', 'english', 'ENG.READ.EMAIL', 'Đọc hiểu bưu thiếp và thư điện tử ngắn', 'Reading short postcards and emails', 5, 5),

  -- Tiếng Việt Lớp 4 (+5)
  ('vie-word-classes', 'vietnamese', 'VIE.GRAM.WORDS', 'Danh từ, động từ và tính từ', 'Nouns, verbs, and adjectives', 4, 4),
  ('vie-subject-predicate', 'vietnamese', 'VIE.GRAM.SUBJPRED', 'Chủ ngữ và vị ngữ trong câu kể', 'Subject and predicate in declarative sentences', 4, 4),
  ('vie-adverbials', 'vietnamese', 'VIE.GRAM.ADVERB', 'Trạng ngữ chỉ thời gian, nơi chốn và nguyên nhân', 'Adverbials of time, place, and cause', 4, 4),
  ('vie-personification', 'vietnamese', 'VIE.RHET.PERSON', 'Biện pháp nhân hóa trong thơ văn', 'Personification in poetry and prose', 4, 4),
  ('vie-descriptive-writing', 'vietnamese', 'VIE.WRITE.DESC', 'Quan sát và chọn chi tiết tiêu biểu khi miêu tả', 'Observation and vivid details in descriptive writing', 4, 4),
  -- Tiếng Việt Lớp 5 (+5)
  ('vie-synonyms-polysemy', 'vietnamese', 'VIE.VOC.POLYSEMY', 'Từ đồng nghĩa và từ nhiều nghĩa', 'Synonyms and polysemous words', 5, 5),
  ('vie-compound-sentences', 'vietnamese', 'VIE.GRAM.COMPOUND', 'Câu ghép và quan hệ từ nối vế câu', 'Compound sentences and conjunctions', 5, 5),
  ('vie-pronoun-substitution', 'vietnamese', 'VIE.WRITE.COHESION', 'Liên kết câu bằng phép thế đại từ và từ đồng nghĩa', 'Sentence cohesion via pronoun and synonym substitution', 5, 5),
  ('vie-info-text-summary', 'vietnamese', 'VIE.READ.SUMMARY', 'Tóm tắt văn bản thông tin nhiều đoạn', 'Summarising multi-paragraph informational texts', 5, 5),
  ('vie-expressive-argument', 'vietnamese', 'VIE.WRITE.OPINION', 'Viết đoạn văn nêu ý kiến về một hiện tượng đời sống', 'Writing an opinion paragraph on an everyday topic', 5, 5),

  -- Khoa học Lớp 4 (+5)
  ('sci-air-properties', 'science', 'SCI.MATTER.AIR', 'Tính chất của không khí và sự tạo thành gió', 'Properties of air and how wind forms', 4, 4),
  ('sci-sound-waves', 'science', 'SCI.PHYS.SOUND', 'Sự phát ra và lan truyền âm thanh', 'How sound is produced and travels', 4, 4),
  ('sci-heat-conductors', 'science', 'SCI.PHYS.HEAT', 'Nhiệt độ, vật dẫn nhiệt và vật cách nhiệt', 'Temperature, heat conductors, and insulators', 4, 4),
  ('sci-nutrients-health', 'science', 'SCI.HUM.NUTRI', 'Bốn nhóm chất dinh dưỡng và bữa ăn cân đối', 'Four nutrient groups and balanced meals', 4, 4),
  ('sci-fungi-bacteria', 'science', 'SCI.BIO.FUNGI', 'Nấm và vi khuẩn có ích, có hại trong đời sống', 'Helpful and harmful fungi and bacteria', 4, 4),
  -- Khoa học Lớp 5 (+5)
  ('sci-soil-erosion', 'science', 'SCI.EARTH.SOIL', 'Thành phần của đất, xói mòn và bảo vệ đất', 'Soil composition, erosion, and conservation', 5, 5),
  ('sci-mixtures-solutions', 'science', 'SCI.CHEM.MIX', 'Hỗn hợp, dung dịch và cách tách chất đơn giản', 'Mixtures, solutions, and simple separation', 5, 5),
  ('sci-chemical-physical-change', 'science', 'SCI.CHEM.CHANGE', 'Biến đổi vật lí và biến đổi hóa học của chất', 'Physical vs chemical changes of matter', 5, 5),
  ('sci-simple-circuits', 'science', 'SCI.PHYS.CIRCUIT', 'Mạch điện đơn giản và an toàn khi dùng điện', 'Simple electric circuits and electrical safety', 5, 5),
  ('sci-flowering-reproduction', 'science', 'SCI.BIO.FLOWER', 'Sự thụ phấn, thụ tinh và phát tán hạt ở thực vật có hoa', 'Pollination, fertilisation, and seed dispersal', 5, 5),

  -- Tư duy phản biện Lớp 4 (+5)
  ('deb-clarifying-questions', 'debate', 'DEB.DIAL.CLARIFY', 'Đặt câu hỏi làm rõ ý người đang nói', 'Asking clarifying questions', 4, 4),
  ('deb-example-vs-rule', 'debate', 'DEB.ARG.EXAMPLE', 'Phân biệt một ví dụ lẻ và quy luật chung', 'Single example versus general rule', 4, 4),
  ('deb-cause-vs-coincidence', 'debate', 'DEB.EVAL.CAUSE', 'Phân biệt nguyên nhân thật và sự trùng hợp ngẫu nhiên', 'Real cause versus coincidence', 4, 4),
  ('deb-fair-comparison', 'debate', 'DEB.EVAL.COMPARE', 'So sánh công bằng trên cùng một tiêu chí', 'Fair comparison on the same criterion', 4, 4),
  ('deb-restating-fairly', 'debate', 'DEB.DIAL.RESTATE', 'Tóm tắt đúng ý bạn trước khi phản hồi', 'Restating another view accurately before replying', 4, 4),
  -- Tư duy phản biện Lớp 5 (+5)
  ('deb-hidden-assumptions', 'debate', 'DEB.EVAL.ASSUME', 'Nhận diện giả định ngầm trong lập luận', 'Spotting hidden assumptions in an argument', 5, 5),
  ('deb-weighing-pros-cons', 'debate', 'DEB.ARG.TRADEOFF', 'Cân nhắc lợi ích và hạn chế của hai phương án', 'Weighing benefits and trade-offs of two options', 5, 5),
  ('deb-rebuttal-evidence', 'debate', 'DEB.ARG.REBUT', 'Phản biện bằng bằng chứng thay vì cảm tính', 'Rebutting with evidence rather than emotion', 5, 5),
  ('deb-changing-mind', 'debate', 'DEB.DIAL.UPDATE', 'Điều chỉnh quan điểm khi có bằng chứng mới thuyết phục', 'Updating a view when stronger evidence appears', 5, 5),
  ('deb-structured-conclusion', 'debate', 'DEB.ARG.CONCLUDE', 'Tổng kết cuộc thảo luận và nêu điểm thống nhất', 'Summarising a discussion and stating common ground', 5, 5);

-- ── 2. Intra-subject, grade-monotonic prerequisite edges (+49 -> 82 total) ──
INSERT OR IGNORE INTO skill_prerequisites (skill_id, prerequisite_id) VALUES
  -- Toán (+9 -> 16)
  ('math-frac-add-sub', 'math-frac-compare'),
  ('math-multi-digit-ops', 'math-word-problem'),
  ('math-average', 'math-multi-digit-ops'),
  ('math-angles-lines', 'math-area'),
  ('math-dec-mul-div', 'math-dec-add-sub'),
  ('math-ratio-scale', 'math-frac-add-sub'),
  ('math-tri-trap-area', 'math-angles-lines'),
  ('math-cuboid-volume', 'math-tri-trap-area'),
  ('math-motion', 'math-dec-mul-div'),

  -- Tiếng Anh (+10 -> 16)
  ('eng-school-subjects', 'eng-voc-noun'),
  ('eng-time-activities', 'eng-dialogue'),
  ('eng-can-abilities', 'eng-sentence-basic'),
  ('eng-weather-clothes', 'eng-voc-home'),
  ('eng-present-continuous', 'eng-can-abilities'),
  ('eng-future-plans', 'eng-present-continuous'),
  ('eng-health-advice', 'eng-daily-routine'),
  ('eng-frequency-adverbs', 'eng-daily-routine'),
  ('eng-superlatives', 'eng-comparatives'),
  ('eng-short-email-reading', 'eng-past-simple'),

  -- Tiếng Việt (+10 -> 16)
  ('vie-word-classes', 'vie-sentence-clear'),
  ('vie-subject-predicate', 'vie-word-classes'),
  ('vie-adverbials', 'vie-subject-predicate'),
  ('vie-personification', 'vie-reading-main'),
  ('vie-descriptive-writing', 'vie-personification'),
  ('vie-synonyms-polysemy', 'vie-word-classes'),
  ('vie-compound-sentences', 'vie-adverbials'),
  ('vie-pronoun-substitution', 'vie-sentence-linking'),
  ('vie-info-text-summary', 'vie-inference'),
  ('vie-expressive-argument', 'vie-paragraph-structure'),

  -- Khoa học (+10 -> 17)
  ('sci-air-properties', 'sci-states-of-matter'),
  ('sci-sound-waves', 'sci-air-properties'),
  ('sci-heat-conductors', 'sci-states-of-matter'),
  ('sci-nutrients-health', 'sci-plant-needs'),
  ('sci-fungi-bacteria', 'sci-nutrients-health'),
  ('sci-soil-erosion', 'sci-water-cycle'),
  ('sci-mixtures-solutions', 'sci-heat-conductors'),
  ('sci-chemical-physical-change', 'sci-mixtures-solutions'),
  ('sci-simple-circuits', 'sci-energy-forms'),
  ('sci-flowering-reproduction', 'sci-life-cycles'),

  -- Tư duy phản biện (+10 -> 17)
  ('deb-clarifying-questions', 'deb-counterargument-respect'),
  ('deb-example-vs-rule', 'deb-evidence-relevance'),
  ('deb-cause-vs-coincidence', 'deb-fact-opinion'),
  ('deb-fair-comparison', 'deb-claim-reason'),
  ('deb-restating-fairly', 'deb-clarifying-questions'),
  ('deb-hidden-assumptions', 'deb-argument-structure'),
  ('deb-weighing-pros-cons', 'deb-fair-comparison'),
  ('deb-rebuttal-evidence', 'deb-source-credibility'),
  ('deb-changing-mind', 'deb-civil-disagreement'),
  ('deb-structured-conclusion', 'deb-weighing-pros-cons');

-- ── 3. Curriculum objectives (+50 -> 90 total: 72 GDPT 2018 + 18 supplemental) ──
INSERT OR IGNORE INTO curriculum_objectives (id, subject_id, grade, code, title_vi, description_vi, skill_id, provenance, source_ref, created_at) VALUES
  -- Toán Lớp 4 (+5, bao gồm vá kín `math-frac-identify`)
  ('obj-math-frac-identify', 'math', 4, 'GDPT2018.MATH.4.FRAC.03', 'Nhận biết tử số, mẫu số và đọc viết phân số từ hình trực quan', 'Đọc, viết và giải thích được ý nghĩa tử số, mẫu số của phân số gắn với các phần bằng nhau của một đơn vị.', 'math-frac-identify', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-frac-add-sub', 'math', 4, 'GDPT2018.MATH.4.FRAC.04', 'Thực hiện phép cộng và phép trừ hai phân số', 'Thực hiện được phép cộng, phép trừ hai phân số cùng mẫu số hoặc có một mẫu số chia hết cho mẫu số còn lại.', 'math-frac-add-sub', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-multi-digit-ops', 'math', 4, 'GDPT2018.MATH.4.NUM.01', 'Nhân và chia số tự nhiên với số có hai chữ số', 'Đặt tính, ước lượng thương và thực hiện đúng phép nhân, phép chia số tự nhiên cho số có hai chữ số.', 'math-multi-digit-ops', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-average', 'math', 4, 'GDPT2018.MATH.4.STAT.01', 'Tìm số trung bình cộng và giải toán thực tế liên quan', 'Hiểu ý nghĩa san đều của số trung bình cộng và tính đúng số trung bình cộng của hai hay nhiều số.', 'math-average', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-angles-lines', 'math', 4, 'GDPT2018.MATH.4.GEO.02', 'Nhận biết góc nhọn, góc tù, hai đường thẳng vuông góc và song song', 'Phân biệt góc nhọn, góc vuông, góc tù, góc bẹt; nhận diện hai đường thẳng vuông góc và hai đường thẳng song song.', 'math-angles-lines', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Toán Lớp 5 (+5)
  ('obj-math-dec-mul-div', 'math', 5, 'GDPT2018.MATH.5.DEC.03', 'Nhân và chia số thập phân trong tính toán và giải toán', 'Thực hiện được phép nhân, phép chia số thập phân và nhẩm nhân chia với 10, 100, 0,1, 0,01.', 'math-dec-mul-div', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-ratio-scale', 'math', 5, 'GDPT2018.MATH.5.RATIO.01', 'Giải bài toán về tỉ số và tỉ lệ bản đồ', 'Viết được tỉ số của hai đại lượng cùng loại và vận dụng tỉ lệ bản đồ để tính độ dài thật hoặc độ dài thu nhỏ.', 'math-ratio-scale', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-tri-trap-area', 'math', 5, 'GDPT2018.MATH.5.GEO.05', 'Tính diện tích hình tam giác và diện tích hình thang', 'Hiểu quy tắc và tính đúng diện tích hình tam giác, diện tích hình thang khi biết độ dài đáy và chiều cao cùng đơn vị đo.', 'math-tri-trap-area', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-cuboid-volume', 'math', 5, 'GDPT2018.MATH.5.GEO.06', 'Tính thể tích hình hộp chữ nhật và hình lập phương', 'Nhận biết đơn vị đo thể tích và vận dụng công thức tính thể tích hình hộp chữ nhật, hình lập phương vào tình huống thực tế.', 'math-cuboid-volume', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-math-motion', 'math', 5, 'GDPT2018.MATH.5.MEAS.01', 'Giải bài toán chuyển động đều về vận tốc, quãng đường, thời gian', 'Hiểu mối quan hệ giữa vận tốc, quãng đường, thời gian trong chuyển động đều và đổi đúng đơn vị đo trước khi tính.', 'math-motion', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Toán Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Tiếng Anh Lớp 4 (+5)
  ('obj-eng-school-subjects', 'english', 4, 'GDPT2018.ENG.4.VOC.03', 'Hỏi và trả lời về môn học và thời khóa biểu ở trường', 'Nhận biết từ vựng các môn học ở tiểu học và hỏi đáp đơn giản về môn học yêu thích hoặc ngày học trong tuần.', 'eng-school-subjects', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-time-activities', 'english', 4, 'GDPT2018.ENG.4.COMM.02', 'Hỏi giờ và nói về giờ thực hiện hoạt động trong ngày', 'Sử dụng mẫu câu hỏi giờ What time is it? và nêu thời điểm thực hiện các hoạt động quen thuộc trong ngày.', 'eng-time-activities', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-can-abilities', 'english', 4, 'GDPT2018.ENG.4.GRAM.01', 'Diễn đạt khả năng làm được hoặc chưa làm được với can / cannot', 'Đặt câu khẳng định, phủ định và câu hỏi ngắn với động từ khuyết thiếu can để nói về khả năng cá nhân.', 'eng-can-abilities', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-weather-clothes', 'english', 4, 'GDPT2018.ENG.4.VOC.04', 'Miêu tả thời tiết và lựa chọn trang phục phù hợp', 'Nhận biết từ vựng chỉ thời tiết và trang phục cơ bản, ghép được câu mô tả thời tiết gắn với trang phục phù hợp.', 'eng-weather-clothes', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-present-continuous', 'english', 4, 'GDPT2018.ENG.4.GRAM.02', 'Miêu tả hành động đang diễn ra tại thời điểm nói', 'Sử dụng đúng cấu trúc be + V-ing để hỏi và trả lời về việc ai đó đang làm ngay lúc nói.', 'eng-present-continuous', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Tiếng Anh Lớp 5 (+5)
  ('obj-eng-future-plans', 'english', 5, 'GDPT2018.ENG.5.GRAM.05', 'Diễn đạt dự định tương lai gần với cấu trúc be going to', 'Hỏi và trả lời về kế hoạch cuối tuần hoặc kỳ nghỉ sắp tới bằng cấu trúc be going to + động từ nguyên mẫu.', 'eng-future-plans', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-health-advice', 'english', 5, 'GDPT2018.ENG.5.COMM.06', 'Hỏi thăm sức khỏe và đưa lời khuyên với should / should not', 'Nhận biết từ vựng chỉ triệu chứng sức khỏe thường gặp và đưa lời khuyên lịch sự bằng should hoặc should not.', 'eng-health-advice', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-frequency-adverbs', 'english', 5, 'GDPT2018.ENG.5.GRAM.07', 'Sử dụng trạng từ chỉ tần suất khi nói về thói quen học tập và sinh hoạt', 'Đặt đúng vị trí các trạng từ always, usually, often, sometimes, never trong câu thì hiện tại đơn.', 'eng-frequency-adverbs', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-superlatives', 'english', 5, 'GDPT2018.ENG.5.GRAM.08', 'Sử dụng cấp so sánh nhất của tính từ để mô tả sự vật, địa danh', 'Phân biệt và sử dụng đúng the + adj-est với tính từ ngắn và the most + adj với tính từ dài.', 'eng-superlatives', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-eng-short-email-reading', 'english', 5, 'GDPT2018.ENG.5.READ.09', 'Đọc hiểu thông tin chính và chi tiết trong thư điện tử ngắn', 'Đọc bưu thiếp hoặc thư điện tử ngắn 60-80 từ bằng tiếng Anh để xác định người gửi, mục đích và chi tiết cụ thể.', 'eng-short-email-reading', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Anh Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Tiếng Việt Lớp 4 (+5)
  ('obj-vie-word-classes', 'vietnamese', 4, 'GDPT2018.VIE.4.GRAM.01', 'Nhận diện và sử dụng đúng danh từ, động từ, tính từ', 'Phân biệt danh từ, động từ, tính từ dựa vào ý nghĩa và khả năng kết hợp trong câu tiếng Việt.', 'vie-word-classes', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-subject-predicate', 'vietnamese', 4, 'GDPT2018.VIE.4.GRAM.02', 'Xác định thành phần chủ ngữ và vị ngữ trong câu kể', 'Đặt câu hỏi Ai/Cái gì và Làm gì/Thế nào/Là gì để tách đúng chủ ngữ, vị ngữ và hoàn thiện câu thiếu thành phần.', 'vie-subject-predicate', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-adverbials', 'vietnamese', 4, 'GDPT2018.VIE.4.GRAM.03', 'Nhận biết và thêm trạng ngữ chỉ thời gian, nơi chốn, nguyên nhân', 'Nhận diện vai trò bổ sung thông tin của trạng ngữ và dùng dấu phẩy ngăn cách trạng ngữ với nòng cốt câu.', 'vie-adverbials', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-personification', 'vietnamese', 4, 'GDPT2018.VIE.4.RHET.01', 'Nhận biết và nêu tác dụng của biện pháp nhân hóa', 'Nhận ra các cách nhân hóa sự vật trong thơ văn thiếu nhi và giải thích vì sao cách viết đó làm hình ảnh gần gũi, sinh động.', 'vie-personification', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-descriptive-writing', 'vietnamese', 4, 'GDPT2018.VIE.4.WRITE.02', 'Quan sát bằng nhiều giác quan và chọn chi tiết tiêu biểu khi viết văn miêu tả', 'Lựa chọn nét riêng nổi bật thay vì liệt kê chung chung khi viết đoạn văn miêu tả cây cối, con vật quen thuộc.', 'vie-descriptive-writing', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Tiếng Việt Lớp 5 (+5)
  ('obj-vie-synonyms-polysemy', 'vietnamese', 5, 'GDPT2018.VIE.5.VOC.01', 'Phân biệt từ đồng nghĩa, nghĩa gốc và nghĩa chuyển của từ nhiều nghĩa', 'Chọn từ đồng nghĩa đúng sắc thái biểu cảm và phân biệt nghĩa gốc với nghĩa chuyển của từ nhiều nghĩa theo ngữ cảnh.', 'vie-synonyms-polysemy', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-compound-sentences', 'vietnamese', 5, 'GDPT2018.VIE.5.GRAM.05', 'Nhận biết câu ghép và sử dụng cặp quan hệ từ đúng logic', 'Xác định các vế câu ghép và dùng đúng các cặp quan hệ từ nguyên nhân - kết quả, điều kiện - kết quả, tương phản.', 'vie-compound-sentences', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-pronoun-substitution', 'vietnamese', 5, 'GDPT2018.VIE.5.WRITE.05', 'Liên kết các câu trong đoạn bằng phép thế đại từ và từ ngữ đồng nghĩa', 'Sửa lỗi lặp từ nặng nề giữa các câu liền kề bằng cách thay thế bằng đại từ hoặc từ ngữ đồng nghĩa phù hợp.', 'vie-pronoun-substitution', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-info-text-summary', 'vietnamese', 5, 'GDPT2018.VIE.5.READ.05', 'Rút ý chính từng đoạn để tóm tắt văn bản thông tin ngắn gọn, trung thực', 'Tách thông tin cốt lõi khỏi ví dụ minh họa để tóm tắt văn bản thông tin nhiều đoạn mà không làm sai lệch nội dung.', 'vie-info-text-summary', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-vie-expressive-argument', 'vietnamese', 5, 'GDPT2018.VIE.5.WRITE.06', 'Viết đoạn văn nêu ý kiến có lí lẽ và dẫn chứng thuyết phục', 'Sắp xếp câu nêu ý kiến, lí lẽ giải thích và dẫn chứng thực tế mạch lạc khi bàn về một vấn đề gần gũi với học sinh.', 'vie-expressive-argument', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Tiếng Việt Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Khoa học Lớp 4 (+5)
  ('obj-sci-air-properties', 'science', 4, 'GDPT2018.SCI.4.AIR.05', 'Nêu tính chất của không khí và giải thích sự hình thành gió', 'Nhận biết không khí chiếm chỗ, có thể bị nén và giãn ra; giải thích gió hình thành do không khí chuyển động từ nơi lạnh sang nơi nóng.', 'sci-air-properties', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-sound-waves', 'science', 4, 'GDPT2018.SCI.4.SOUND.06', 'Giải thích nguồn phát âm thanh do vật rung động và môi trường truyền âm', 'Nhận ra mọi âm thanh phát ra từ sự rung động và truyền được qua chất khí, chất lỏng, chất rắn.', 'sci-sound-waves', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-heat-conductors', 'science', 4, 'GDPT2018.SCI.4.HEAT.07', 'Phân biệt vật dẫn nhiệt tốt và vật dẫn nhiệt kém trong sinh hoạt', 'Biết nhiệt truyền từ vật nóng hơn sang vật lạnh hơn và giải thích ứng dụng của vật dẫn nhiệt, cách nhiệt an toàn trong nhà bếp, đời sống.', 'sci-heat-conductors', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-nutrients-health', 'science', 4, 'GDPT2018.SCI.4.HEALTH.08', 'Phân loại bốn nhóm chất dinh dưỡng và thiết kế bữa ăn cân đối', 'Nêu vai trò của chất bột đường, chất đạm, chất béo, vi-ta-min và chất khoáng để lựa chọn khẩu phần ăn hợp lí.', 'sci-nutrients-health', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-fungi-bacteria', 'science', 4, 'GDPT2018.SCI.4.BIO.09', 'Nhận biết vai trò có ích của nấm, vi khuẩn và cách bảo quản thực phẩm', 'Phân biệt ứng dụng lên men có ích với nguy cơ gây ôi thiu thực phẩm và nêu cách bảo quản thức ăn đúng khoa học.', 'sci-fungi-bacteria', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 4 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Khoa học Lớp 5 (+5)
  ('obj-sci-soil-erosion', 'science', 5, 'GDPT2018.SCI.5.SOIL.05', 'Nêu thành phần của đất, nguyên nhân xói mòn và biện pháp bảo vệ đất', 'Nhận biết các thành phần chính của đất trồng và giải thích vai trò của thảm thực vật trong việc chống xói mòn, sạt lở.', 'sci-soil-erosion', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-mixtures-solutions', 'science', 5, 'GDPT2018.SCI.5.CHEM.06', 'Phân biệt hỗn hợp với dung dịch và chọn cách tách chất phù hợp', 'Phân biệt hỗn hợp không đồng nhất với dung dịch hòa tan và chọn cách lắng, lọc hoặc làm bay hơi để tách chất.', 'sci-mixtures-solutions', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-chemical-physical-change', 'science', 5, 'GDPT2018.SCI.5.CHEM.07', 'Phân biệt biến đổi vật lí và biến đổi hóa học của chất', 'Nhận ra sự khác nhau giữa biến đổi chỉ thay đổi hình dạng, trạng thái với biến đổi tạo ra chất mới có tính chất khác.', 'sci-chemical-physical-change', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-simple-circuits', 'science', 5, 'GDPT2018.SCI.5.ELEC.08', 'Nhận biết điều kiện mạch điện kín và quy tắc an toàn khi sử dụng điện', 'Giải thích khi nào bóng đèn sáng trong mạch điện đơn giản, phân biệt vật dẫn điện - cách điện và cách phòng tránh tai nạn điện.', 'sci-simple-circuits', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),
  ('obj-sci-flowering-reproduction', 'science', 5, 'GDPT2018.SCI.5.BIO.09', 'Mô tả quá trình thụ phấn, thụ tinh và sự phát tán quả, hạt ở thực vật có hoa', 'Phân biệt hoa thụ phấn nhờ côn trùng với hoa thụ phấn nhờ gió và liên hệ đặc điểm quả, hạt với cách phát tán.', 'sci-flowering-reproduction', 'gdpt_2018_objective', 'Chương trình GDPT 2018 Môn Khoa học Lớp 5 (Thông tư 32/2018/TT-BGDĐT)', strftime('%s','now') * 1000),

  -- Tư duy phản biện Lớp 4 (+5, `original_supplemental`)
  ('obj-deb-clarifying-questions', 'debate', 4, 'TLO.DEB.4.CLARIFY.05', 'Đặt câu hỏi làm rõ ý trước khi đồng tình hoặc phản đối', 'Nhận ra từ ngữ còn mơ hồ trong lời nói của bạn và đặt câu hỏi lịch sự để hiểu đúng ý trước khi tranh luận.', 'deb-clarifying-questions', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-example-vs-rule', 'debate', 4, 'TLO.DEB.4.EXAMPLE.06', 'Phân biệt một trường hợp cá biệt với kết luận khái quát cho số đông', 'Hiểu vì sao một ví dụ đơn lẻ chưa đủ chứng minh từ luôn luôn và biết cách dùng phản ví dụ để kiểm tra nhận định.', 'deb-example-vs-rule', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-cause-vs-coincidence', 'debate', 4, 'TLO.DEB.4.CAUSE.07', 'Phân biệt nguyên nhân thực sự với hai việc chỉ xảy ra kế tiếp nhau', 'Không vội kết luận việc xảy ra trước là nguyên nhân của việc xảy ra sau khi chưa có cơ chế giải thích hợp lí.', 'deb-cause-vs-coincidence', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-fair-comparison', 'debate', 4, 'TLO.DEB.4.COMPARE.08', 'So sánh hai lựa chọn công bằng trên cùng tiêu chí và điều kiện', 'Nhận ra sự khập khiễng khi đem điểm mạnh của lựa chọn này so với tiêu chí khác hẳn của lựa chọn kia.', 'deb-fair-comparison', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-restating-fairly', 'debate', 4, 'TLO.DEB.4.RESTATE.09', 'Diễn đạt lại trung thực ý của người đối thoại trước khi phản hồi', 'Tóm tắt đúng lập luận của bạn mà không bóp méo hay phóng đại để cuộc trao đổi luôn tôn trọng và đúng trọng tâm.', 'deb-restating-fairly', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 4 — TAI Learning OS', strftime('%s','now') * 1000),

  -- Tư duy phản biện Lớp 5 (+5, `original_supplemental`)
  ('obj-deb-hidden-assumptions', 'debate', 5, 'TLO.DEB.5.ASSUME.05', 'Phát hiện giả định ngầm nằm giữa lý do và kết luận', 'Tìm ra điều người nói mặc nhiên coi là đúng nhưng chưa nêu ra, từ đó đánh giá lập luận chặt chẽ hay chưa.', 'deb-hidden-assumptions', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-weighing-pros-cons', 'debate', 5, 'TLO.DEB.5.TRADEOFF.06', 'Cân nhắc cả lợi ích lẫn sự đánh đổi khi lựa chọn một giải pháp', 'Lập bảng đối chiếu mặt được, mặt hạn chế và đối tượng chịu ảnh hưởng trước khi đề xuất quyết định chung cho tập thể.', 'deb-weighing-pros-cons', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-rebuttal-evidence', 'debate', 5, 'TLO.DEB.5.REBUT.07', 'Phản biện trực diện vào lý do bằng số liệu và quan sát kiểm chứng được', 'Tránh phản bác bằng cảm tính cá nhân; biết nêu bằng chứng cụ thể làm suy yếu mắt xích lập luận đối lập.', 'deb-rebuttal-evidence', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-changing-mind', 'debate', 5, 'TLO.DEB.5.UPDATE.08', 'Sẵn sàng cập nhật quan điểm khi xuất hiện bằng chứng mới đáng tin cậy', 'Hiểu rằng điều chỉnh kết luận theo bằng chứng xác thực là biểu hiện của tư duy khoa học trung thực, không phải thua cuộc.', 'deb-changing-mind', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS', strftime('%s','now') * 1000),
  ('obj-deb-structured-conclusion', 'debate', 5, 'TLO.DEB.5.CONCLUDE.09', 'Tổng kết cuộc thảo luận bằng điểm đồng thuận và câu hỏi mở cần tìm hiểu tiếp', 'Khép lại buổi thảo luận bằng cách nêu rõ điểm các bên đã thống nhất, điểm còn khác biệt và bước kiểm chứng tiếp theo.', 'deb-structured-conclusion', 'original_supplemental', 'Chương trình bổ trợ Tư duy phản biện Lớp 5 — TAI Learning OS', strftime('%s','now') * 1000);
