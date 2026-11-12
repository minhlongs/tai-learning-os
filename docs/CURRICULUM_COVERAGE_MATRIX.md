# MA TRẬN ÁNH XẠ BÀI HỌC → KỸ NĂNG → MỤC TIÊU (YCCĐ)
## LESSON → SKILL → OBJECTIVE (YCCĐ) MAPPING MATRIX

> **Tệp này được sinh tự động. Không sửa tay.** / *Generated file. Do not edit by hand.*
>
> ```bash
> node scripts/curriculum-coverage.mjs --output docs/CURRICULUM_COVERAGE_MATRIX.md
> ```
>
> Script mở một cơ sở dữ liệu cách ly trong `tmpdir()`, chạy lại toàn bộ migration đã phát hành,
> seed 50 bài qua chính `seedLessons()`, rồi đọc ngược kết quả từ SQLite. Mọi con số dưới đây là
> kết quả truy vấn, không phải số chép tay.

---

## 1. Tổng quan / Summary

| Chỉ số / Measure | Giá trị / Value |
| --- | --- |
| Bài học trong sổ đăng ký / Lessons in registry | **50** |
| Bài học có mục tiêu / Lessons carrying an objective | **50 / 50** |
| Mục tiêu phân biệt được dùng / Distinct objectives used | **40** |
| Mục tiêu được seed trong CSDL / Objectives seeded in the DB | **40** |
| Kỹ năng được dùng / Skills referenced by a lesson | **41 / 41** |
| Cạnh tiên quyết / Prerequisite edges | **33** |
| Bài chẩn đoán đầu vào / Baseline diagnostic lessons | **10** |
| Kết quả seed trên CSDL trống / Seed result on a fresh DB | `{"inserted":50,"rewritten":0,"unchanged":0}` |

Xuất xứ bài học / Lesson provenance:

| Giá trị / Value | Số bài / Lessons |
| --- | --- |
| `original_supplemental` | 50 |

Xuất xứ mục tiêu / Objective provenance:

| Giá trị / Value | Số mục tiêu / Objectives |
| --- | --- |
| `gdpt_2018_objective` | 32 |
| `original_supplemental` | 8 |

---

## 2. Lỗ hổng, tính bằng số / Gaps, as numbers

| Lỗ hổng / Gap | Số lượng / Count |
| --- | --- |
| Mục tiêu không có bài nào / Objectives with no lesson | **0** |
| Bài không có mục tiêu / Lessons with no objective | **0** |
| Bài trỏ tới mục tiêu không tồn tại / Lessons pointing at a missing objective | **0** |
| Kỹ năng không có bài nào / Skills with no lesson | **0** |
| Kỹ năng không có mục tiêu nào / Skills with no objective | **1** |
| Cạnh tiên quyết treo / Dangling prerequisite edges | **0** |
| Cạnh tiên quyết chéo môn / Cross-subject prerequisite edges | **0** |
| Cạnh tiên quyết đi ngược lớp / Prerequisites starting in a later grade than their dependent | **0** |
| Chu trình tiên quyết / Prerequisite cycles | **0** |

Kỹ năng không ánh xạ tới mục tiêu nào / Skills that map to no objective:

- `math-frac-identify` (math, lớp 3–4)

Đây là lỗ hổng ánh xạ thật: kỹ năng này dạy được nhưng không chứng minh được một YCCĐ nào.
Nó được ghi thành số ở đây thay vì bị ẩn đi. / *A real mapping gap: the skill can be taught but proves no YCCĐ.*

---

## 3. Phủ chương trình — tách biệt khỏi độ đầy đủ ánh xạ
## Curriculum coverage — kept separate from mapping completeness

**Độ đầy đủ ánh xạ / Mapping completeness:** mọi bài đều có mục tiêu, mọi mục tiêu đều có bài.
Đây là điều kiện về **cấu trúc**, không phải về **quy mô**.

**Phủ chương trình / Curriculum coverage:** 50 bài mẫu so với chương trình thật:

| Mẫu số / Denominator | Tổng / Total | Tỉ lệ / Ratio |
| --- | --- | --- |
| quỹ tiết Grade 4–5 / Grade 4–5 period budget | 1400 | **3,57%** |
| bài Grade 4–5 chuẩn hoá / standardised Grade 4–5 lesson count | 560 | **8,93%** |
| quy mô Grade 4–12 / Grade 4–12 lesson scope | 2650 | **1,89%** |

Hai sự thật này phải được báo cáo riêng. Ánh xạ đầy đủ **không** có nghĩa là chương trình đã phủ;
và phủ mỏng **không** có nghĩa là ánh xạ sai. / *Mapping completeness does not imply curriculum coverage, and thin coverage does not imply a broken mapping.*

---

## 4. Ma trận 50 bài / The 50-lesson matrix

| # | Môn / Subject | Lớp / Grade | Bài học / Lesson | Kỹ năng / Skill | Mục tiêu (YCCĐ) / Objective | Xuất xứ / Provenance | Chẩn đoán / Baseline |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | debate | 4 | `deb-baseline-grade4` | `deb-claim-reason` | `TLO.DEB.4.CLAIM.01` | `original_supplemental` | ✔ |
| 2 | debate | 4–5 | `deb-claim-reason` | `deb-claim-reason` | `TLO.DEB.4.CLAIM.01` | `original_supplemental` |  |
| 3 | debate | 4–5 | `deb-counterargument-respect` | `deb-counterargument-respect` | `TLO.DEB.4.RESP.04` | `original_supplemental` |  |
| 4 | debate | 4–5 | `deb-evidence-relevance` | `deb-evidence-relevance` | `TLO.DEB.4.EVID.03` | `original_supplemental` |  |
| 5 | debate | 4–5 | `deb-fact-opinion` | `deb-fact-opinion` | `TLO.DEB.4.FACT.02` | `original_supplemental` |  |
| 6 | debate | 5 | `deb-argument-structure` | `deb-argument-structure` | `TLO.DEB.5.ARG.01` | `original_supplemental` |  |
| 7 | debate | 5 | `deb-baseline-grade5` | `deb-argument-structure` | `TLO.DEB.5.ARG.01` | `original_supplemental` | ✔ |
| 8 | debate | 5 | `deb-civil-disagreement` | `deb-civil-disagreement` | `TLO.DEB.5.DIALOG.04` | `original_supplemental` |  |
| 9 | debate | 5 | `deb-fallacies` | `deb-fallacies` | `TLO.DEB.5.FALLACY.03` | `original_supplemental` |  |
| 10 | debate | 5 | `deb-source-credibility` | `deb-source-credibility` | `TLO.DEB.5.SOURCE.02` | `original_supplemental` |  |
| 11 | english | 3–4 | `eng-everyday-nouns` | `eng-voc-noun` | `GDPT2018.ENG.4.VOC.01` | `gdpt_2018_objective` |  |
| 12 | english | 3–4 | `eng-greetings-dialogue` | `eng-dialogue` | `GDPT2018.ENG.4.DIAL.01` | `gdpt_2018_objective` |  |
| 13 | english | 3–4 | `eng-home-vocabulary` | `eng-voc-home` | `GDPT2018.ENG.4.VOC.02` | `gdpt_2018_objective` |  |
| 14 | english | 3–4 | `eng-simple-sentences` | `eng-sentence-basic` | `GDPT2018.ENG.4.SENT.01` | `gdpt_2018_objective` |  |
| 15 | english | 4 | `eng-baseline-grade4` | `eng-voc-noun` | `GDPT2018.ENG.4.VOC.01` | `gdpt_2018_objective` | ✔ |
| 16 | english | 5 | `eng-baseline-grade5` | `eng-past-simple` | `GDPT2018.ENG.5.GRAM.01` | `gdpt_2018_objective` | ✔ |
| 17 | english | 5 | `eng-comparatives` | `eng-comparatives` | `GDPT2018.ENG.5.GRAM.02` | `gdpt_2018_objective` |  |
| 18 | english | 5 | `eng-daily-routine` | `eng-daily-routine` | `GDPT2018.ENG.5.VOC.03` | `gdpt_2018_objective` |  |
| 19 | english | 5 | `eng-directions` | `eng-directions` | `GDPT2018.ENG.5.COMM.04` | `gdpt_2018_objective` |  |
| 20 | english | 5 | `eng-past-simple` | `eng-past-simple` | `GDPT2018.ENG.5.GRAM.01` | `gdpt_2018_objective` |  |
| 21 | math | 3–4 | `math-fractions-equivalent` | `math-frac-equiv` | `GDPT2018.MATH.4.FRAC.01` | `gdpt_2018_objective` |  |
| 22 | math | 3–4 | `math-word-problems` | `math-word-problem` | `GDPT2018.MATH.4.WORD.01` | `gdpt_2018_objective` |  |
| 23 | math | 4–5 | `math-area-measurement` | `math-area` | `GDPT2018.MATH.4.GEO.01` | `gdpt_2018_objective` |  |
| 24 | math | 4 | `math-baseline-grade4` | `math-frac-identify` | `GDPT2018.MATH.4.FRAC.01` | `gdpt_2018_objective` | ✔ |
| 25 | math | 4–5 | `math-fractions-compare` | `math-frac-compare` | `GDPT2018.MATH.4.FRAC.02` | `gdpt_2018_objective` |  |
| 26 | math | 5 | `math-baseline-grade5` | `math-dec-place-value` | `GDPT2018.MATH.5.DEC.01` | `gdpt_2018_objective` | ✔ |
| 27 | math | 5 | `math-circle` | `math-circle` | `GDPT2018.MATH.5.GEO.04` | `gdpt_2018_objective` |  |
| 28 | math | 5 | `math-dec-add-sub` | `math-dec-add-sub` | `GDPT2018.MATH.5.DEC.02` | `gdpt_2018_objective` |  |
| 29 | math | 5 | `math-dec-place-value` | `math-dec-place-value` | `GDPT2018.MATH.5.DEC.01` | `gdpt_2018_objective` |  |
| 30 | math | 5 | `math-percent` | `math-percent` | `GDPT2018.MATH.5.PERCENT.03` | `gdpt_2018_objective` |  |
| 31 | science | 4 | `sci-baseline-grade4` | `sci-water-cycle` | `GDPT2018.SCI.4.WATER.01` | `gdpt_2018_objective` | ✔ |
| 32 | science | 4–5 | `sci-light-and-shadow` | `sci-light-and-shadow` | `GDPT2018.SCI.4.LIGHT.04` | `gdpt_2018_objective` |  |
| 33 | science | 4–5 | `sci-plant-needs` | `sci-plant-needs` | `GDPT2018.SCI.4.PLANT.02` | `gdpt_2018_objective` |  |
| 34 | science | 4–5 | `sci-states-of-matter` | `sci-states-of-matter` | `GDPT2018.SCI.4.MATTER.03` | `gdpt_2018_objective` |  |
| 35 | science | 4–5 | `sci-water-cycle` | `sci-water-cycle` | `GDPT2018.SCI.4.WATER.01` | `gdpt_2018_objective` |  |
| 36 | science | 5 | `sci-baseline-grade5` | `sci-life-cycles` | `GDPT2018.SCI.5.LIFE.01` | `gdpt_2018_objective` | ✔ |
| 37 | science | 5 | `sci-energy-forms` | `sci-energy-forms` | `GDPT2018.SCI.5.ENERGY.03` | `gdpt_2018_objective` |  |
| 38 | science | 5 | `sci-environment` | `sci-environment` | `GDPT2018.SCI.5.ENV.04` | `gdpt_2018_objective` |  |
| 39 | science | 5 | `sci-food-chains` | `sci-food-chains` | `GDPT2018.SCI.5.LIFE.02` | `gdpt_2018_objective` |  |
| 40 | science | 5 | `sci-life-cycles` | `sci-life-cycles` | `GDPT2018.SCI.5.LIFE.01` | `gdpt_2018_objective` |  |
| 41 | vietnamese | 4 | `vie-baseline-grade4` | `vie-reading-main` | `GDPT2018.VIE.4.READ.01` | `gdpt_2018_objective` | ✔ |
| 42 | vietnamese | 4 | `vie-find-evidence` | `vie-evidence` | `GDPT2018.VIE.4.READ.02` | `gdpt_2018_objective` |  |
| 43 | vietnamese | 4 | `vie-reading-main-idea` | `vie-reading-main` | `GDPT2018.VIE.4.READ.01` | `gdpt_2018_objective` |  |
| 44 | vietnamese | 4 | `vie-sentence-clarity` | `vie-sentence-clear` | `GDPT2018.VIE.4.WRITE.01` | `gdpt_2018_objective` |  |
| 45 | vietnamese | 4–5 | `vie-story-lesson` | `vie-story-lesson` | `GDPT2018.VIE.4.READ.03` | `gdpt_2018_objective` |  |
| 46 | vietnamese | 5 | `vie-baseline-grade5` | `vie-paragraph-structure` | `GDPT2018.VIE.5.WRITE.01` | `gdpt_2018_objective` | ✔ |
| 47 | vietnamese | 5 | `vie-figurative-language` | `vie-figurative` | `GDPT2018.VIE.5.READ.02` | `gdpt_2018_objective` |  |
| 48 | vietnamese | 5 | `vie-inference` | `vie-inference` | `GDPT2018.VIE.5.READ.03` | `gdpt_2018_objective` |  |
| 49 | vietnamese | 5 | `vie-paragraph-structure` | `vie-paragraph-structure` | `GDPT2018.VIE.5.WRITE.01` | `gdpt_2018_objective` |  |
| 50 | vietnamese | 5 | `vie-sentence-linking` | `vie-sentence-linking` | `GDPT2018.VIE.5.WRITE.04` | `gdpt_2018_objective` |  |

Tổng / Total: **50** bài. / *50 lessons.*

---

## 5. Mục tiêu mang nhiều hơn một bài / Objectives carrying more than one lesson

Bài chẩn đoán đầu vào dùng chung mục tiêu với bài chủ đề mà nó chẩn đoán. Đó là lý do
**50** bài nằm gọn trong **40** mục tiêu.
/ *Baseline diagnostics share an objective with the topic lesson they diagnose.*

| Mục tiêu / Objective | Số bài / Lessons | Bài / Lessons |
| --- | --- | --- |
| `GDPT2018.ENG.4.VOC.01` | 2 | `eng-baseline-grade4`, `eng-everyday-nouns` |
| `GDPT2018.ENG.5.GRAM.01` | 2 | `eng-baseline-grade5`, `eng-past-simple` |
| `GDPT2018.MATH.4.FRAC.01` | 2 | `math-baseline-grade4`, `math-fractions-equivalent` |
| `GDPT2018.MATH.5.DEC.01` | 2 | `math-baseline-grade5`, `math-dec-place-value` |
| `GDPT2018.SCI.4.WATER.01` | 2 | `sci-baseline-grade4`, `sci-water-cycle` |
| `GDPT2018.SCI.5.LIFE.01` | 2 | `sci-baseline-grade5`, `sci-life-cycles` |
| `GDPT2018.VIE.4.READ.01` | 2 | `vie-baseline-grade4`, `vie-reading-main-idea` |
| `GDPT2018.VIE.5.WRITE.01` | 2 | `vie-baseline-grade5`, `vie-paragraph-structure` |
| `TLO.DEB.4.CLAIM.01` | 2 | `deb-baseline-grade4`, `deb-claim-reason` |
| `TLO.DEB.5.ARG.01` | 2 | `deb-argument-structure`, `deb-baseline-grade5` |

---

## 6. Theo môn học / Per subject

| Môn / Subject | Bài / Lessons | Kỹ năng / Skills | Mục tiêu / Objectives | Cạnh tiên quyết / Prerequisite edges |
| --- | --- | --- | --- | --- |
| debate | 10 | 8 | 8 | 7 |
| english | 10 | 8 | 8 | 6 |
| math | 10 | 9 | 8 | 7 |
| science | 10 | 8 | 8 | 7 |
| vietnamese | 10 | 8 | 8 | 6 |

---

## 7. Đồ thị tiên quyết / The prerequisite graph

**33** cạnh, **0** treo, **0** chéo môn, **0** chu trình, **0** đi ngược lớp — tất cả ở trên
là kết quả đo, và mỗi thuộc tính trong số đó được canh bởi
`test/integration/curriculum-graph-integrity.test.ts` để một lần import nội dung không thể
âm thầm làm hỏng đồ thị.

---

## 8. Phạm vi tài liệu này / Scope of this document

Tài liệu này **không** nói rằng chương trình Grade 4–5 đã được viết xong. Nó nói rằng 50 bài
đang có được ánh xạ đầy đủ, không mồ côi, và rằng phần còn thiếu là một con số đã biết.
/ *This document does not claim the Grade 4–5 programme is written. It claims the 50 existing*
*lessons are fully and honestly mapped, and that the remainder is a known number.*

Không bài học nào trong `src/shared/content/` bị sửa bởi quá trình sinh tài liệu này.
/ *No lesson in `src/shared/content/` is modified by this generation.*
