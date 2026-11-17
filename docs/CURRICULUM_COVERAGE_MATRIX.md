# MA TRẬN ÁNH XẠ BÀI HỌC → KỸ NĂNG → MỤC TIÊU (YCCĐ)
## LESSON → SKILL → OBJECTIVE (YCCĐ) MAPPING MATRIX

> **Tệp này được sinh tự động. Không sửa tay.** / *Generated file. Do not edit by hand.*
>
> ```bash
> node scripts/curriculum-coverage.mjs --output docs/CURRICULUM_COVERAGE_MATRIX.md
> ```
>
> Script mở một cơ sở dữ liệu cách ly trong `tmpdir()`, chạy lại toàn bộ migration đã phát hành,
> seed 100 bài qua chính `seedLessons()`, rồi đọc ngược kết quả từ SQLite. Mọi con số dưới đây là
> kết quả truy vấn, không phải số chép tay.

---

## 1. Tổng quan / Summary

| Chỉ số / Measure | Giá trị / Value |
| --- | --- |
| Bài học trong sổ đăng ký / Lessons in registry | **100** |
| Bài học có mục tiêu / Lessons carrying an objective | **100 / 100** |
| Mục tiêu phân biệt được dùng / Distinct objectives used | **90** |
| Mục tiêu được seed trong CSDL / Objectives seeded in the DB | **90** |
| Kỹ năng được dùng / Skills referenced by a lesson | **90 / 90** |
| Cạnh tiên quyết / Prerequisite edges | **82** |
| Bài chẩn đoán đầu vào / Baseline diagnostic lessons | **10** |
| Kết quả seed trên CSDL trống / Seed result on a fresh DB | `{"inserted":100,"rewritten":0,"unchanged":0}` |

Xuất xứ bài học / Lesson provenance:

| Giá trị / Value | Số bài / Lessons |
| --- | --- |
| `original_supplemental` | 100 |

Xuất xứ mục tiêu / Objective provenance:

| Giá trị / Value | Số mục tiêu / Objectives |
| --- | --- |
| `gdpt_2018_objective` | 72 |
| `original_supplemental` | 18 |

---

## 2. Lỗ hổng, tính bằng số / Gaps, as numbers

| Lỗ hổng / Gap | Số lượng / Count |
| --- | --- |
| Mục tiêu không có bài nào / Objectives with no lesson | **0** |
| Bài không có mục tiêu / Lessons with no objective | **0** |
| Bài trỏ tới mục tiêu không tồn tại / Lessons pointing at a missing objective | **0** |
| Kỹ năng không có bài nào / Skills with no lesson | **0** |
| Kỹ năng không có mục tiêu nào / Skills with no objective | **0** |
| Cạnh tiên quyết treo / Dangling prerequisite edges | **0** |
| Cạnh tiên quyết chéo môn / Cross-subject prerequisite edges | **0** |
| Cạnh tiên quyết đi ngược lớp / Prerequisites starting in a later grade than their dependent | **0** |
| Chu trình tiên quyết / Prerequisite cycles | **0** |

---

## 3. Phủ chương trình — tách biệt khỏi độ đầy đủ ánh xạ
## Curriculum coverage — kept separate from mapping completeness

**Độ đầy đủ ánh xạ / Mapping completeness:** mọi bài đều có mục tiêu, mọi mục tiêu đều có bài.
Đây là điều kiện về **cấu trúc**, không phải về **quy mô**.

**Phủ chương trình / Curriculum coverage:** 100 bài đã phát hành so với chương trình thật:

| Mẫu số / Denominator | Tổng / Total | Tỉ lệ / Ratio |
| --- | --- | --- |
| quỹ tiết Grade 4–5 / Grade 4–5 period budget | 1400 | **7,14%** |
| bài Grade 4–5 chuẩn hoá / standardised Grade 4–5 lesson count | 560 | **17,86%** |
| quy mô Grade 4–12 / Grade 4–12 lesson scope | 2650 | **3,77%** |

Hai sự thật này phải được báo cáo riêng. Ánh xạ đầy đủ **không** có nghĩa là chương trình đã phủ;
và phủ mỏng **không** có nghĩa là ánh xạ sai. / *Mapping completeness does not imply curriculum coverage, and thin coverage does not imply a broken mapping.*

---

## 4. Ma trận 100 bài / The 100-lesson matrix

| # | Môn / Subject | Lớp / Grade | Bài học / Lesson | Kỹ năng / Skill | Mục tiêu (YCCĐ) / Objective | Xuất xứ / Provenance | Chẩn đoán / Baseline |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | debate | 4 | `deb-baseline-grade4` | `deb-claim-reason` | `TLO.DEB.4.CLAIM.01` | `original_supplemental` | ✔ |
| 2 | debate | 4 | `deb-cause-vs-coincidence` | `deb-cause-vs-coincidence` | `TLO.DEB.4.CAUSE.07` | `original_supplemental` |  |
| 3 | debate | 4–5 | `deb-claim-reason` | `deb-claim-reason` | `TLO.DEB.4.CLAIM.01` | `original_supplemental` |  |
| 4 | debate | 4 | `deb-clarifying-questions` | `deb-clarifying-questions` | `TLO.DEB.4.CLARIFY.05` | `original_supplemental` |  |
| 5 | debate | 4–5 | `deb-counterargument-respect` | `deb-counterargument-respect` | `TLO.DEB.4.RESP.04` | `original_supplemental` |  |
| 6 | debate | 4–5 | `deb-evidence-relevance` | `deb-evidence-relevance` | `TLO.DEB.4.EVID.03` | `original_supplemental` |  |
| 7 | debate | 4 | `deb-example-vs-rule` | `deb-example-vs-rule` | `TLO.DEB.4.EXAMPLE.06` | `original_supplemental` |  |
| 8 | debate | 4–5 | `deb-fact-opinion` | `deb-fact-opinion` | `TLO.DEB.4.FACT.02` | `original_supplemental` |  |
| 9 | debate | 4 | `deb-fair-comparison` | `deb-fair-comparison` | `TLO.DEB.4.COMPARE.08` | `original_supplemental` |  |
| 10 | debate | 4 | `deb-restating-fairly` | `deb-restating-fairly` | `TLO.DEB.4.RESTATE.09` | `original_supplemental` |  |
| 11 | debate | 5 | `deb-argument-structure` | `deb-argument-structure` | `TLO.DEB.5.ARG.01` | `original_supplemental` |  |
| 12 | debate | 5 | `deb-baseline-grade5` | `deb-argument-structure` | `TLO.DEB.5.ARG.01` | `original_supplemental` | ✔ |
| 13 | debate | 5 | `deb-changing-mind` | `deb-changing-mind` | `TLO.DEB.5.UPDATE.08` | `original_supplemental` |  |
| 14 | debate | 5 | `deb-civil-disagreement` | `deb-civil-disagreement` | `TLO.DEB.5.DIALOG.04` | `original_supplemental` |  |
| 15 | debate | 5 | `deb-fallacies` | `deb-fallacies` | `TLO.DEB.5.FALLACY.03` | `original_supplemental` |  |
| 16 | debate | 5 | `deb-hidden-assumptions` | `deb-hidden-assumptions` | `TLO.DEB.5.ASSUME.05` | `original_supplemental` |  |
| 17 | debate | 5 | `deb-rebuttal-evidence` | `deb-rebuttal-evidence` | `TLO.DEB.5.REBUT.07` | `original_supplemental` |  |
| 18 | debate | 5 | `deb-source-credibility` | `deb-source-credibility` | `TLO.DEB.5.SOURCE.02` | `original_supplemental` |  |
| 19 | debate | 5 | `deb-structured-conclusion` | `deb-structured-conclusion` | `TLO.DEB.5.CONCLUDE.09` | `original_supplemental` |  |
| 20 | debate | 5 | `deb-weighing-pros-cons` | `deb-weighing-pros-cons` | `TLO.DEB.5.TRADEOFF.06` | `original_supplemental` |  |
| 21 | english | 3–4 | `eng-everyday-nouns` | `eng-voc-noun` | `GDPT2018.ENG.4.VOC.01` | `gdpt_2018_objective` |  |
| 22 | english | 3–4 | `eng-greetings-dialogue` | `eng-dialogue` | `GDPT2018.ENG.4.DIAL.01` | `gdpt_2018_objective` |  |
| 23 | english | 3–4 | `eng-home-vocabulary` | `eng-voc-home` | `GDPT2018.ENG.4.VOC.02` | `gdpt_2018_objective` |  |
| 24 | english | 3–4 | `eng-simple-sentences` | `eng-sentence-basic` | `GDPT2018.ENG.4.SENT.01` | `gdpt_2018_objective` |  |
| 25 | english | 4 | `eng-baseline-grade4` | `eng-voc-noun` | `GDPT2018.ENG.4.VOC.01` | `gdpt_2018_objective` | ✔ |
| 26 | english | 4 | `eng-can-abilities` | `eng-can-abilities` | `GDPT2018.ENG.4.GRAM.01` | `gdpt_2018_objective` |  |
| 27 | english | 4 | `eng-present-continuous` | `eng-present-continuous` | `GDPT2018.ENG.4.GRAM.02` | `gdpt_2018_objective` |  |
| 28 | english | 4 | `eng-school-subjects` | `eng-school-subjects` | `GDPT2018.ENG.4.VOC.03` | `gdpt_2018_objective` |  |
| 29 | english | 4 | `eng-time-activities` | `eng-time-activities` | `GDPT2018.ENG.4.COMM.02` | `gdpt_2018_objective` |  |
| 30 | english | 4 | `eng-weather-clothes` | `eng-weather-clothes` | `GDPT2018.ENG.4.VOC.04` | `gdpt_2018_objective` |  |
| 31 | english | 5 | `eng-baseline-grade5` | `eng-past-simple` | `GDPT2018.ENG.5.GRAM.01` | `gdpt_2018_objective` | ✔ |
| 32 | english | 5 | `eng-comparatives` | `eng-comparatives` | `GDPT2018.ENG.5.GRAM.02` | `gdpt_2018_objective` |  |
| 33 | english | 5 | `eng-daily-routine` | `eng-daily-routine` | `GDPT2018.ENG.5.VOC.03` | `gdpt_2018_objective` |  |
| 34 | english | 5 | `eng-directions` | `eng-directions` | `GDPT2018.ENG.5.COMM.04` | `gdpt_2018_objective` |  |
| 35 | english | 5 | `eng-frequency-adverbs` | `eng-frequency-adverbs` | `GDPT2018.ENG.5.GRAM.07` | `gdpt_2018_objective` |  |
| 36 | english | 5 | `eng-future-plans` | `eng-future-plans` | `GDPT2018.ENG.5.GRAM.05` | `gdpt_2018_objective` |  |
| 37 | english | 5 | `eng-health-advice` | `eng-health-advice` | `GDPT2018.ENG.5.COMM.06` | `gdpt_2018_objective` |  |
| 38 | english | 5 | `eng-past-simple` | `eng-past-simple` | `GDPT2018.ENG.5.GRAM.01` | `gdpt_2018_objective` |  |
| 39 | english | 5 | `eng-short-email-reading` | `eng-short-email-reading` | `GDPT2018.ENG.5.READ.09` | `gdpt_2018_objective` |  |
| 40 | english | 5 | `eng-superlatives` | `eng-superlatives` | `GDPT2018.ENG.5.GRAM.08` | `gdpt_2018_objective` |  |
| 41 | math | 3–4 | `math-fractions-equivalent` | `math-frac-equiv` | `GDPT2018.MATH.4.FRAC.01` | `gdpt_2018_objective` |  |
| 42 | math | 3–4 | `math-word-problems` | `math-word-problem` | `GDPT2018.MATH.4.WORD.01` | `gdpt_2018_objective` |  |
| 43 | math | 4 | `math-angles-and-lines` | `math-angles-lines` | `GDPT2018.MATH.4.GEO.02` | `gdpt_2018_objective` |  |
| 44 | math | 4–5 | `math-area-measurement` | `math-area` | `GDPT2018.MATH.4.GEO.01` | `gdpt_2018_objective` |  |
| 45 | math | 4 | `math-average-value` | `math-average` | `GDPT2018.MATH.4.STAT.01` | `gdpt_2018_objective` |  |
| 46 | math | 4 | `math-baseline-grade4` | `math-frac-identify` | `GDPT2018.MATH.4.FRAC.03` | `gdpt_2018_objective` | ✔ |
| 47 | math | 4 | `math-fractions-add-sub` | `math-frac-add-sub` | `GDPT2018.MATH.4.FRAC.04` | `gdpt_2018_objective` |  |
| 48 | math | 4–5 | `math-fractions-compare` | `math-frac-compare` | `GDPT2018.MATH.4.FRAC.02` | `gdpt_2018_objective` |  |
| 49 | math | 4 | `math-fractions-identify` | `math-frac-identify` | `GDPT2018.MATH.4.FRAC.03` | `gdpt_2018_objective` |  |
| 50 | math | 4 | `math-multi-digit-ops` | `math-multi-digit-ops` | `GDPT2018.MATH.4.NUM.01` | `gdpt_2018_objective` |  |
| 51 | math | 5 | `math-baseline-grade5` | `math-dec-place-value` | `GDPT2018.MATH.5.DEC.01` | `gdpt_2018_objective` | ✔ |
| 52 | math | 5 | `math-circle` | `math-circle` | `GDPT2018.MATH.5.GEO.04` | `gdpt_2018_objective` |  |
| 53 | math | 5 | `math-cuboid-volume` | `math-cuboid-volume` | `GDPT2018.MATH.5.GEO.06` | `gdpt_2018_objective` |  |
| 54 | math | 5 | `math-dec-add-sub` | `math-dec-add-sub` | `GDPT2018.MATH.5.DEC.02` | `gdpt_2018_objective` |  |
| 55 | math | 5 | `math-dec-place-value` | `math-dec-place-value` | `GDPT2018.MATH.5.DEC.01` | `gdpt_2018_objective` |  |
| 56 | math | 5 | `math-decimals-mul-div` | `math-dec-mul-div` | `GDPT2018.MATH.5.DEC.03` | `gdpt_2018_objective` |  |
| 57 | math | 5 | `math-percent` | `math-percent` | `GDPT2018.MATH.5.PERCENT.03` | `gdpt_2018_objective` |  |
| 58 | math | 5 | `math-ratios-and-scales` | `math-ratio-scale` | `GDPT2018.MATH.5.RATIO.01` | `gdpt_2018_objective` |  |
| 59 | math | 5 | `math-speed-distance-time` | `math-motion` | `GDPT2018.MATH.5.MEAS.01` | `gdpt_2018_objective` |  |
| 60 | math | 5 | `math-triangle-trapezoid-area` | `math-tri-trap-area` | `GDPT2018.MATH.5.GEO.05` | `gdpt_2018_objective` |  |
| 61 | science | 4 | `sci-air-properties` | `sci-air-properties` | `GDPT2018.SCI.4.AIR.05` | `gdpt_2018_objective` |  |
| 62 | science | 4 | `sci-baseline-grade4` | `sci-water-cycle` | `GDPT2018.SCI.4.WATER.01` | `gdpt_2018_objective` | ✔ |
| 63 | science | 4 | `sci-fungi-bacteria` | `sci-fungi-bacteria` | `GDPT2018.SCI.4.BIO.09` | `gdpt_2018_objective` |  |
| 64 | science | 4 | `sci-heat-conductors` | `sci-heat-conductors` | `GDPT2018.SCI.4.HEAT.07` | `gdpt_2018_objective` |  |
| 65 | science | 4–5 | `sci-light-and-shadow` | `sci-light-and-shadow` | `GDPT2018.SCI.4.LIGHT.04` | `gdpt_2018_objective` |  |
| 66 | science | 4 | `sci-nutrients-health` | `sci-nutrients-health` | `GDPT2018.SCI.4.HEALTH.08` | `gdpt_2018_objective` |  |
| 67 | science | 4–5 | `sci-plant-needs` | `sci-plant-needs` | `GDPT2018.SCI.4.PLANT.02` | `gdpt_2018_objective` |  |
| 68 | science | 4 | `sci-sound-waves` | `sci-sound-waves` | `GDPT2018.SCI.4.SOUND.06` | `gdpt_2018_objective` |  |
| 69 | science | 4–5 | `sci-states-of-matter` | `sci-states-of-matter` | `GDPT2018.SCI.4.MATTER.03` | `gdpt_2018_objective` |  |
| 70 | science | 4–5 | `sci-water-cycle` | `sci-water-cycle` | `GDPT2018.SCI.4.WATER.01` | `gdpt_2018_objective` |  |
| 71 | science | 5 | `sci-baseline-grade5` | `sci-life-cycles` | `GDPT2018.SCI.5.LIFE.01` | `gdpt_2018_objective` | ✔ |
| 72 | science | 5 | `sci-chemical-physical-change` | `sci-chemical-physical-change` | `GDPT2018.SCI.5.CHEM.07` | `gdpt_2018_objective` |  |
| 73 | science | 5 | `sci-energy-forms` | `sci-energy-forms` | `GDPT2018.SCI.5.ENERGY.03` | `gdpt_2018_objective` |  |
| 74 | science | 5 | `sci-environment` | `sci-environment` | `GDPT2018.SCI.5.ENV.04` | `gdpt_2018_objective` |  |
| 75 | science | 5 | `sci-flowering-reproduction` | `sci-flowering-reproduction` | `GDPT2018.SCI.5.BIO.09` | `gdpt_2018_objective` |  |
| 76 | science | 5 | `sci-food-chains` | `sci-food-chains` | `GDPT2018.SCI.5.LIFE.02` | `gdpt_2018_objective` |  |
| 77 | science | 5 | `sci-life-cycles` | `sci-life-cycles` | `GDPT2018.SCI.5.LIFE.01` | `gdpt_2018_objective` |  |
| 78 | science | 5 | `sci-mixtures-solutions` | `sci-mixtures-solutions` | `GDPT2018.SCI.5.CHEM.06` | `gdpt_2018_objective` |  |
| 79 | science | 5 | `sci-simple-circuits` | `sci-simple-circuits` | `GDPT2018.SCI.5.ELEC.08` | `gdpt_2018_objective` |  |
| 80 | science | 5 | `sci-soil-erosion` | `sci-soil-erosion` | `GDPT2018.SCI.5.SOIL.05` | `gdpt_2018_objective` |  |
| 81 | vietnamese | 4 | `vie-adverbials` | `vie-adverbials` | `GDPT2018.VIE.4.GRAM.03` | `gdpt_2018_objective` |  |
| 82 | vietnamese | 4 | `vie-baseline-grade4` | `vie-reading-main` | `GDPT2018.VIE.4.READ.01` | `gdpt_2018_objective` | ✔ |
| 83 | vietnamese | 4 | `vie-descriptive-writing` | `vie-descriptive-writing` | `GDPT2018.VIE.4.WRITE.02` | `gdpt_2018_objective` |  |
| 84 | vietnamese | 4 | `vie-find-evidence` | `vie-evidence` | `GDPT2018.VIE.4.READ.02` | `gdpt_2018_objective` |  |
| 85 | vietnamese | 4 | `vie-personification` | `vie-personification` | `GDPT2018.VIE.4.RHET.01` | `gdpt_2018_objective` |  |
| 86 | vietnamese | 4 | `vie-reading-main-idea` | `vie-reading-main` | `GDPT2018.VIE.4.READ.01` | `gdpt_2018_objective` |  |
| 87 | vietnamese | 4 | `vie-sentence-clarity` | `vie-sentence-clear` | `GDPT2018.VIE.4.WRITE.01` | `gdpt_2018_objective` |  |
| 88 | vietnamese | 4–5 | `vie-story-lesson` | `vie-story-lesson` | `GDPT2018.VIE.4.READ.03` | `gdpt_2018_objective` |  |
| 89 | vietnamese | 4 | `vie-subject-predicate` | `vie-subject-predicate` | `GDPT2018.VIE.4.GRAM.02` | `gdpt_2018_objective` |  |
| 90 | vietnamese | 4 | `vie-word-classes` | `vie-word-classes` | `GDPT2018.VIE.4.GRAM.01` | `gdpt_2018_objective` |  |
| 91 | vietnamese | 5 | `vie-baseline-grade5` | `vie-paragraph-structure` | `GDPT2018.VIE.5.WRITE.01` | `gdpt_2018_objective` | ✔ |
| 92 | vietnamese | 5 | `vie-compound-sentences` | `vie-compound-sentences` | `GDPT2018.VIE.5.GRAM.05` | `gdpt_2018_objective` |  |
| 93 | vietnamese | 5 | `vie-expressive-argument` | `vie-expressive-argument` | `GDPT2018.VIE.5.WRITE.06` | `gdpt_2018_objective` |  |
| 94 | vietnamese | 5 | `vie-figurative-language` | `vie-figurative` | `GDPT2018.VIE.5.READ.02` | `gdpt_2018_objective` |  |
| 95 | vietnamese | 5 | `vie-inference` | `vie-inference` | `GDPT2018.VIE.5.READ.03` | `gdpt_2018_objective` |  |
| 96 | vietnamese | 5 | `vie-info-text-summary` | `vie-info-text-summary` | `GDPT2018.VIE.5.READ.05` | `gdpt_2018_objective` |  |
| 97 | vietnamese | 5 | `vie-paragraph-structure` | `vie-paragraph-structure` | `GDPT2018.VIE.5.WRITE.01` | `gdpt_2018_objective` |  |
| 98 | vietnamese | 5 | `vie-pronoun-substitution` | `vie-pronoun-substitution` | `GDPT2018.VIE.5.WRITE.05` | `gdpt_2018_objective` |  |
| 99 | vietnamese | 5 | `vie-sentence-linking` | `vie-sentence-linking` | `GDPT2018.VIE.5.WRITE.04` | `gdpt_2018_objective` |  |
| 100 | vietnamese | 5 | `vie-synonyms-polysemy` | `vie-synonyms-polysemy` | `GDPT2018.VIE.5.VOC.01` | `gdpt_2018_objective` |  |

Tổng / Total: **100** bài. / *100 lessons.*

---

## 5. Mục tiêu mang nhiều hơn một bài / Objectives carrying more than one lesson

Bài chẩn đoán đầu vào dùng chung mục tiêu với bài chủ đề mà nó chẩn đoán. Đó là lý do
**100** bài nằm gọn trong **90** mục tiêu.
/ *Baseline diagnostics share an objective with the topic lesson they diagnose.*

| Mục tiêu / Objective | Số bài / Lessons | Bài / Lessons |
| --- | --- | --- |
| `GDPT2018.ENG.4.VOC.01` | 2 | `eng-baseline-grade4`, `eng-everyday-nouns` |
| `GDPT2018.ENG.5.GRAM.01` | 2 | `eng-baseline-grade5`, `eng-past-simple` |
| `GDPT2018.MATH.4.FRAC.03` | 2 | `math-baseline-grade4`, `math-fractions-identify` |
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
| debate | 20 | 18 | 18 | 17 |
| english | 20 | 18 | 18 | 16 |
| math | 20 | 18 | 18 | 16 |
| science | 20 | 18 | 18 | 17 |
| vietnamese | 20 | 18 | 18 | 16 |

---

## 7. Đồ thị tiên quyết / The prerequisite graph

**82** cạnh, **0** treo, **0** chéo môn, **0** chu trình, **0** đi ngược lớp — tất cả ở trên
là kết quả đo, và mỗi thuộc tính trong số đó được canh bởi
`test/integration/curriculum-graph-integrity.test.ts` để một lần import nội dung không thể
âm thầm làm hỏng đồ thị.

---

## 8. Phạm vi tài liệu này / Scope of this document

Tài liệu này **không** nói rằng chương trình Grade 4–5 đã được viết xong. Nó nói rằng 100 bài
đang có được ánh xạ đầy đủ, không mồ côi, và rằng phần còn thiếu là một con số đã biết.
/ *This document does not claim the Grade 4–5 programme is written. It claims the 100 existing*
*lessons are fully and honestly mapped, and that the remainder is a known number.*

Không bài học nào trong `src/shared/content/` bị sửa bởi quá trình sinh tài liệu này.
/ *No lesson in `src/shared/content/` is modified by this generation.*
