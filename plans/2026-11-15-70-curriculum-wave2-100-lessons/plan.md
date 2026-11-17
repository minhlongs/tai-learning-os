# Kế hoạch triển khai: Mở rộng kho học liệu Đợt 2 — 100 bài học (#70)

- **Issue**: [#70](https://github.com/minhlongs/tai-learning-os/issues/70)
- **Branch**: `feat/70-curriculum-wave2-100-lessons`
- **Ngày**: 2026-11-15
- **Mục tiêu**: Nâng tổng kho học liệu từ `50 -> 100` bài (`20` bài/môn × 5 môn), bổ sung `49` kỹ năng mới (`41 -> 90`), `50` mục tiêu YCCĐ mới (`40 -> 90`), vá kín lỗ hổng ánh xạ `math-frac-identify`, đạt `0` lỗi trên `validate:lessons` + `qa:content` + toàn bộ unit/integration suite, cập nhật ma trận phủ `G8` (`7,14%` quỹ tiết / `17,86%` bài chuẩn hoá), merge PR vào `main` và nạp kho DB hộ gia đình (`schemaVersion = 17`, `0` dòng duyệt tự động).

## Phân chia pha & quyền sở hữu file độc lập (Disjoint Ownership)

| Pha | Đơn vị thực thi | File sở hữu độc quyền | Phụ thuộc |
| --- | --- | --- | --- |
| **Phase 1** | Orchestrator | `migrations/0017_grade4_grade5_curriculum_wave2.sql` | Khởi tạo đầu tiên |
| **Phase 2A** | Subagent Toán (`math`) | `src/shared/content/math/{fractions-identify,fractions-add-sub,multi-digit-ops,average-value,angles-and-lines,decimals-mul-div,ratios-and-scales,triangle-trapezoid-area,cuboid-volume,speed-distance-time}.ts` | Phase 1 |
| **Phase 2B** | Subagent Tiếng Việt (`vietnamese`) | `src/shared/content/vietnamese/{word-classes,subject-predicate,adverbials,personification,descriptive-writing,synonyms-polysemy,compound-sentences,pronoun-substitution,info-text-summary,expressive-argument}.ts` | Phase 1 |
| **Phase 2C** | Subagent Tiếng Anh (`english`) | `src/shared/content/english/{school-subjects,time-activities,can-abilities,weather-clothes,present-continuous,future-plans,health-advice,frequency-adverbs,superlatives,short-email-reading}.ts` | Phase 1 |
| **Phase 2D** | Subagent Khoa học (`science`) | `src/shared/content/science/{air-properties,sound-waves,heat-conductors,nutrients-health,fungi-bacteria,soil-erosion,mixtures-solutions,chemical-physical-change,simple-circuits,flowering-reproduction}.ts` | Phase 1 |
| **Phase 2E** | Subagent Tư duy phản biện (`debate`) | `src/shared/content/debate/{clarifying-questions,example-vs-rule,cause-vs-coincidence,fair-comparison,restating-fairly,hidden-assumptions,weighing-pros-cons,rebuttal-evidence,changing-mind,structured-conclusion}.ts` | Phase 1 |
| **Phase 3** | Orchestrator | `src/shared/content/index.ts`, cập nhật các test đếm số lượng danh mục (`content-registry.test.ts`, `lesson-gate-stages.test.ts`, `curriculum-graph-integrity.test.ts`, `reprovision-household-db.test.ts`, `household-cli-scripts.test.ts`, `m4-ui-multi-learner-and-curriculum.test.ts`), chạy `curriculum-coverage.mjs` + cập nhật `G0_G16_AUDIT_MATRIX.md` | Phase 2A–2E |
| **Phase 4** | Fresh `code-reviewer` subagent | Review độc lập toàn bộ diff PR (ngữ cảnh cô lập) | Phase 3 |
| **Phase 5** | Orchestrator | Mở PR, squash-merge vào `main`, chuyển nhãn `#70 -> shipped`, chạy `db:migrate` + `seed:demo` + `household:preflight` trên DB hộ gia đình | Phase 4 |
