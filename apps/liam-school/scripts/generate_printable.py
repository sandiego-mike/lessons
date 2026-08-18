#!/usr/bin/env python3
"""Generate printable A-F worksheet PDF for a chapter in Integrated Math I.

Usage:
  python3 scripts/generate_printable.py --chapter 1 --student "Liam DeVries" --output chapter1-worksheet.pdf

Requires: reportlab (pip install reportlab)
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Frame, PageTemplate
from reportlab.lib import colors


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "materials" / "liam-learning-app" / "data" / "course-data.json"


def load_course() -> dict[str, Any]:
    return json.loads(DATA.read_text(encoding="utf-8"))


def choose_items(chapter: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    w = chapter.get("worksheet", [])
    used = set()
    out = {"A": [], "B": [], "C": [], "D": [], "E": [], "F": []}

    # A: Warm-Up — up to 3 simple one-step equations (no parentheses)
    for it in w:
        if len(out["A"]) >= 3:
            break
        if it["type"] == "equation" and "(" not in it["prompt"]:
            out["A"].append(it)
            used.add(it["prompt"])

    # B: Level Up — 3 others, prefer multi-step or parentheses
    for it in w:
        if len(out["B"]) >= 3:
            break
        if it["prompt"] in used:
            continue
        if it["type"] == "equation":
            out["B"].append(it)
            used.add(it["prompt"])

    # C: Spot the Mistake — first error-analysis
    for it in w:
        if it["type"] == "error-analysis":
            out["C"].append(it)
            used.add(it["prompt"])
            break

    # D: Choose the Correct Move — first multiple-choice
    for it in w:
        if it["type"] == "multiple-choice":
            out["D"].append(it)
            used.add(it["prompt"])
            break

    # E: Match/Graph/Data — pick up to 4 varied items not used
    for it in w:
        if len(out["E"]) >= 4:
            break
        if it["prompt"] in used:
            continue
        if it["type"] in ("graph-identify", "data-median", "data-analysis", "model", "definition"):
            out["E"].append(it)
            used.add(it["prompt"])

    # F: Challenge — pick first challenge or remaining hard item
    for it in w:
        if it["prompt"] in used:
            continue
        if it["type"] in ("challenge", "equation"):
            out["F"].append(it)
            used.add(it["prompt"])
            break

    return out


def render_pdf(chapter: dict[str, Any], student: str, outpath: Path, two_column: bool = True, include_answers: bool = False, teacher_hints: bool = False) -> None:
    styles = getSampleStyleSheet()
    normal = styles["Normal"]
    title_style = ParagraphStyle("Title", parent=styles["Heading1"], alignment=0, fontSize=18)
    section_style = ParagraphStyle("Section", parent=styles["Heading2"], fontSize=12)

    width, height = letter
    doc = SimpleDocTemplate(str(outpath), pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)

    # Two-column frame setup
    if two_column:
        frame1 = Frame(doc.leftMargin, doc.bottomMargin, (width - doc.leftMargin - doc.rightMargin) / 2 - 6, height - doc.topMargin - doc.bottomMargin, id='col1')
        frame2 = Frame(doc.leftMargin + (width - doc.leftMargin - doc.rightMargin) / 2 + 6, doc.bottomMargin, (width - doc.leftMargin - doc.rightMargin) / 2 - 6, height - doc.topMargin - doc.bottomMargin, id='col2')
        template = PageTemplate(id='TwoCol', frames=[frame1, frame2])
        doc.addPageTemplates([template])

    story = []
    story.append(Paragraph("INTEGRATED MATH I", title_style))
    story.append(Paragraph(f"Chapter {chapter.get('number')}: {chapter.get('title')}", normal))
    story.append(Paragraph(f"Student: {student}", normal))
    story.append(Spacer(1, 8))

    parts = choose_items(chapter)

    sec_labels = {
        "A": "A. Warm-Up",
        "B": "B. Level Up",
        "C": "C. Spot the Mistake",
        "D": "D. Choose the Correct Move",
        "E": "E. Match / Graph / Short Tasks",
        "F": "F. Challenge",
    }

    # Layout: each item renders with space for handwritten work (gap lines)
    def render_item(num: int, it: dict[str, Any]):
        ptext = it.get("prompt", "")
        elems = []
        elems.append(Paragraph(f"{num}. {ptext}", normal))
        # Provide space for working: small spacer lines
        # Use empty Paragraphs to create vertical space suitable for handwriting
        for _ in range(3):
            elems.append(Spacer(1, 12))
        # Optionally include minimal hint for teacher/student if requested
        if teacher_hints and it.get("type") in ("equation", "challenge"):
            hint = it.get("hint") or "Try isolating the variable with inverse operations."
            elems.append(Paragraph(f"Hint: {hint}", ParagraphStyle('hint', parent=normal, fontSize=9, textColor=colors.grey)))
        if include_answers:
            # Include concise answer and expanded worked example / solution steps when available
            ans = it.get("answer", "")
            elems.append(Paragraph(f"Answer: {ans}", ParagraphStyle('answer', parent=normal, fontSize=9, textColor=colors.black)))
            # Prefer a detailed worked example field if present
            worked = it.get('worked_example') or it.get('expanded_solution') or it.get('solution_steps')
            if worked:
                elems.append(Spacer(1,6))
                elems.append(Paragraph("Solution:", ParagraphStyle('solTitle', parent=normal, fontSize=10, textColor=colors.darkgray)))
                # If solution is a list of steps, render each as a bullet/paragraph
                if isinstance(worked, list):
                    for step in worked:
                        elems.append(Paragraph(f"- {step}", ParagraphStyle('solStep', parent=normal, fontSize=9)))
                else:
                    elems.append(Paragraph(str(worked), ParagraphStyle('solText', parent=normal, fontSize=9)))
        return elems

    num = 1
    for key in ["A", "B", "C", "D", "E", "F"]:
        items = parts[key]
        story.append(Spacer(1, 6))
        story.append(Paragraph(sec_labels[key], section_style))
        story.append(Spacer(1, 6))
        if not items:
            story.append(Paragraph("(No items generated)", normal))
            continue
        for it in items:
            for e in render_item(num, it):
                story.append(e)
            num += 1

    doc.build(story)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--chapter", type=int, required=True)
    ap.add_argument("--student", type=str, default="")
    ap.add_argument("--output", type=str, default="worksheet.pdf")
    ap.add_argument("--two-column", action="store_true", help="Render in two-column layout")
    ap.add_argument("--answer-key", action="store_true", help="Also generate an answer key PDF")
    ap.add_argument("--teacher", action="store_true", help="Include teacher hints/worked examples in output")
    args = ap.parse_args()

    data = load_course()
    math = data.get("math", {})
    chapter = next((c for c in math.get("chapters", []) if c.get("number") == args.chapter), None)
    if not chapter:
        raise SystemExit(f"Chapter {args.chapter} not found in course data")

    outpath = Path(args.output)
    render_pdf(chapter, args.student or "", outpath, two_column=args.two_column, include_answers=False, teacher_hints=args.teacher)
    if args.answer_key:
        keypath = outpath.with_name(outpath.stem + "-answer-key" + outpath.suffix)
        render_pdf(chapter, args.student or "", keypath, two_column=False, include_answers=True, teacher_hints=False)
        print(f"Wrote answer key {keypath}")
        # If teacher requested, also emit a teacher PDF with hints/worked examples expanded
        if args.teacher:
            teacherpath = outpath.with_name(outpath.stem + "-teacher" + outpath.suffix)
            render_pdf(chapter, args.student or "", teacherpath, two_column=False, include_answers=True, teacher_hints=True)
            print(f"Wrote teacher PDF {teacherpath}")
    print(f"Wrote {outpath}")


if __name__ == "__main__":
    main()
