Redesign notes — Integrated Math I

Summary:
- Replaced generic long-text prompts with structured problem blueprints.
- Added concrete generators for `math-solve` sections: Quick Start, Level Up, Spot the Mistake, Choose the Move, Challenge.
- Added generators for `graph`, `data`, and `reasoning` section kinds to produce concise interactive-friendly items.
- Implemented basic validation (numeric answers, reasonable ranges) and deduplication per-worksheet.

How to regenerate course data:

```bash
python3 scripts/add_math_course.py
```

Files changed:
- `scripts/add_math_course.py` — main changes and generators
- `materials/liam-learning-app/data/course-data.json` — generated output
- `materials/liam-learning-app/data-inline.js` — generated inline JS used by the app

Next steps:
1. Expand interactive UI (equation solver, balance-scale, drag-and-drop matching, number-line, plotting).
2. Add richer validation and unit tests for generators.
3. Create printable worksheet templates (A..F sections) using the generated problems.
4. Replace remaining generic activity prompts across all modules.

If you want, I can now:
- Implement the UI components for the interactive equation solver and drag-and-drop matching.
- Add more rigorous validation (no near-duplicate problems across lessons, ensure difficulty calibration).
