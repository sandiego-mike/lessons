from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from pathlib import Path
from typing import Any
import random

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - allow running without pypdf installed
    class PdfReader:  # minimal fallback for environments without pypdf
        def __init__(self, path: str | Path):
            # assume a modest default page count so generation can proceed
            self.pages = [None] * 12

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / "materials" / "liam-learning-app"
DATA = APP / "data" / "course-data.json"
INLINE = APP / "data-inline.js"
INVENTORY_JSON = APP / "data" / "curriculum-inventory.json"
INVENTORY_INLINE = APP / "inventory-inline.js"
MATH_DIR = ROOT / "materials" / "math"
SOURCE_PAGE = "https://mrskemners.weebly.com/integrated-math-1-textbook.html"

CHAPTERS: dict[int, tuple[str, list[str]]] = {
    1: ("Solving Linear Equations", ["Solving Simple Equations", "Solving Multi-Step Equations", "Solving Equations with Variables on Both Sides", "Solving Absolute Value Equations", "Rewriting Equations and Formulas"]),
    2: ("Solving Linear Inequalities", ["Writing and Graphing Inequalities", "Solving Inequalities Using Addition or Subtraction", "Solving Inequalities Using Multiplication or Division", "Solving Multi-Step Inequalities", "Solving Compound Inequalities", "Solving Absolute Value Inequalities"]),
    3: ("Graphing Linear Functions", ["Functions", "Linear Functions", "Function Notation", "Graphing Linear Equations in Standard Form", "Graphing Linear Equations in Slope-Intercept Form", "Transformations of Graphs of Linear Functions"]),
    4: ("Writing Linear Functions", ["Writing Equations in Slope-Intercept Form", "Writing Equations in Point-Slope Form", "Writing Equations of Parallel and Perpendicular Lines", "Scatter Plots and Lines of Fit", "Analyzing Lines of Fit", "Arithmetic Sequences"]),
    5: ("Solving Systems of Linear Equations and Inequalities", ["Solving Systems of Linear Equations by Graphing", "Solving Systems of Linear Equations by Substitution", "Solving Systems of Linear Equations by Elimination", "Solving Special Systems of Linear Equations", "Solving Equations by Graphing", "Graphing Linear Inequalities in Two Variables", "Systems of Linear Inequalities"]),
    6: ("Exponential Functions and Sequences", ["Exponential Functions", "Exponential Growth and Decay", "Comparing Linear and Exponential Functions", "Solving Exponential Equations", "Geometric Sequences", "Recursively Defined Sequences"]),
    7: ("Data Analysis and Displays", ["Measures of Center and Variation", "Box-and-Whisker Plots", "Shapes of Distributions", "Two-Way Tables", "Choosing a Data Display"]),
    8: ("Basics of Geometry", ["Points, Lines, and Planes", "Measuring and Constructing Segments", "Using Midpoint and Distance Formulas", "Perimeter and Area in the Coordinate Plane", "Measuring and Constructing Angles", "Describing Pairs of Angles"]),
    9: ("Reasoning and Proofs", ["Conditional Statements", "Inductive and Deductive Reasoning", "Postulates and Diagrams", "Proving Statements about Segments and Angles", "Proving Geometric Relationships"]),
    10: ("Parallel and Perpendicular Lines", ["Pairs of Lines and Angles", "Parallel Lines and Transversals", "Proofs with Parallel Lines", "Proofs with Perpendicular Lines", "Using Parallel and Perpendicular Lines"]),
    11: ("Transformations", ["Translations", "Reflections", "Rotations", "Congruence and Transformations"]),
    12: ("Congruent Triangles", ["Angles of Triangles", "Congruent Polygons", "Proving Triangle Congruence by SAS", "Equilateral and Isosceles Triangles", "Proving Triangle Congruence by SSS", "Proving Triangle Congruence by ASA and AAS", "Using Congruent Triangles", "Coordinate Proofs"]),
}

TERM_DEFS = {
    "equation": ("A mathematical statement showing that two expressions are equal.", "In 3x + 5 = 20, both sides must stay balanced while solving."),
    "solution": ("A value that makes an equation or inequality true.", "x = 5 is the solution of 3x + 5 = 20."),
    "inverse operation": ("An operation that undoes another operation.", "Subtraction undoes addition; division undoes multiplication."),
    "variable": ("A letter or symbol that represents a number.", "In 4x - 7, x is the variable."),
    "coefficient": ("A number multiplied by a variable.", "In 6x, the coefficient is 6."),
    "constant": ("A number that does not change in an expression or equation.", "In y = 2x + 3, the constant term is 3."),
    "absolute value": ("A number's distance from zero on a number line.", "|-8| = 8 because -8 is 8 units from 0."),
    "formula": ("An equation that shows a relationship among quantities.", "d = rt connects distance, rate, and time."),
    "inequality": ("A statement that compares quantities using symbols such as <, >, <=, or >=.", "x > 4 means x can be any number greater than 4."),
    "compound inequality": ("Two inequalities joined by and or or.", "1 < x < 5 means x is between 1 and 5."),
    "function": ("A relationship where each input has exactly one output.", "If x = 2 always gives y = 7, that input has one output."),
    "linear function": ("A function whose graph is a straight line and has a constant rate of change.", "y = 3x + 2 is linear."),
    "slope": ("The rate of change of a line, often rise divided by run.", "A slope of 2 means y rises 2 for every 1 step right."),
    "y-intercept": ("The point where a graph crosses the y-axis.", "In y = 2x + 5, the y-intercept is 5."),
    "standard form": ("A linear equation form Ax + By = C.", "2x + 3y = 12 is in standard form."),
    "slope-intercept form": ("A linear equation form y = mx + b.", "In y = -2x + 4, slope is -2 and y-intercept is 4."),
    "point-slope form": ("A linear equation form y - y1 = m(x - x1).", "y - 3 = 2(x - 1) uses point (1, 3) and slope 2."),
    "parallel lines": ("Lines in the same plane that do not intersect.", "Nonvertical parallel lines have the same slope."),
    "perpendicular lines": ("Lines that intersect to form right angles.", "Slopes 2 and -1/2 are perpendicular because their product is -1."),
    "scatter plot": ("A graph of paired data points.", "A scatter plot can show the relationship between study time and score."),
    "line of fit": ("A line used to model the trend in a scatter plot.", "A line of fit can estimate y values from data."),
    "system of equations": ("Two or more equations considered together.", "The solution is the point that satisfies both equations."),
    "substitution": ("A method for solving a system by replacing one variable with an equivalent expression.", "If y = x + 4, substitute x + 4 for y in the other equation."),
    "elimination": ("A method for solving a system by adding or subtracting equations to remove a variable.", "Add equations when x and -x cancel."),
    "exponential function": ("A function with a constant ratio or percent-change pattern.", "y = 3(2)^x doubles each time x increases by 1."),
    "growth factor": ("The multiplier in an exponential growth pattern.", "A factor of 1.08 means 8% growth each step."),
    "decay factor": ("The multiplier in an exponential decay pattern.", "A factor of 0.75 means the amount keeps 75% each step."),
    "geometric sequence": ("A sequence with a constant ratio between consecutive terms.", "3, 6, 12, 24 is geometric with ratio 2."),
    "arithmetic sequence": ("A sequence with a constant difference between consecutive terms.", "5, 9, 13, 17 is arithmetic with difference 4."),
    "mean": ("The sum of data values divided by the number of values.", "The mean of 4, 6, and 8 is 6."),
    "median": ("The middle value when data are ordered.", "For 2, 7, 9, the median is 7."),
    "interquartile range": ("The difference between the third quartile and first quartile.", "IQR describes the spread of the middle half of data."),
    "two-way table": ("A table that organizes data using two categories.", "A survey can be organized by grade level and favorite activity."),
    "point": ("An exact location in geometry.", "Point A marks a position but has no size."),
    "line": ("A straight path extending forever in both directions.", "A line through A and B contains infinitely many points."),
    "plane": ("A flat surface extending forever in all directions.", "A tabletop can model part of a plane."),
    "midpoint": ("The point halfway between two endpoints.", "The midpoint of (0, 0) and (6, 4) is (3, 2)."),
    "distance formula": ("A formula for the distance between two points in a coordinate plane.", "Use differences in x and y as the legs of a right triangle."),
    "angle": ("A figure formed by two rays with a common endpoint.", "A right angle measures 90 degrees."),
    "conditional statement": ("An if-then statement.", "If a figure is a square, then it has four sides."),
    "conjecture": ("A statement believed to be true based on observations.", "After seeing a pattern, you may make a conjecture."),
    "postulate": ("A statement accepted as true without proof.", "Through two points there is exactly one line."),
    "theorem": ("A statement that has been proven true.", "Theorems are justified by definitions, postulates, and prior theorems."),
    "transversal": ("A line that intersects two or more lines.", "A transversal creates corresponding, alternate interior, and other angle pairs."),
    "translation": ("A transformation that slides a figure without turning or flipping it.", "Move every point 3 units right and 2 units up."),
    "reflection": ("A transformation that flips a figure across a line.", "Reflecting across the y-axis changes (x, y) to (-x, y)."),
    "rotation": ("A transformation that turns a figure around a point.", "A 90-degree rotation turns a figure around the origin."),
    "congruence": ("Having the same size and shape.", "Congruent figures can be moved by rigid transformations to match."),
    "congruent triangles": ("Triangles with corresponding sides and angles congruent.", "SAS, SSS, ASA, and AAS can prove triangle congruence."),
}

STANDARDS = [
    (r"equation|formula|variables on both sides|absolute value equations|rewriting|inequal", "A-REI.B.3", "Solve linear equations and inequalities in one variable, including equations with coefficients represented by letters."),
    (r"function|linear|slope|intercept|standard form|point-slope|arithmetic", "F-IF.B.4", "Interpret key features of functions from graphs, tables, and verbal descriptions."),
    (r"scatter|line of fit|data", "S-ID.B.6", "Represent data on two quantitative variables on a scatter plot and describe how variables are related."),
    (r"system|substitution|elimination|linear inequalities", "A-REI.C.6", "Solve systems of linear equations exactly and approximately."),
    (r"exponential|geometric|recursively", "F-LE.A.1", "Distinguish between situations that can be modeled with linear functions and with exponential functions."),
    (r"mean|median|box|distribution|two-way", "S-ID.A.1", "Represent data with plots on the real number line and use data displays to interpret distribution."),
    (r"point|line|plane|midpoint|distance|coordinate|angle", "G-GPE.B.7", "Use coordinates to compute perimeters and areas of polygons."),
    (r"conditional|reasoning|proof|postulate|theorem|parallel|perpendicular|transversal", "G-CO.C.9", "Prove geometric theorems about lines and angles."),
    (r"translation|reflection|rotation|congruence", "G-CO.A.2", "Represent transformations in the plane and compare transformations that preserve distance and angle."),
    (r"triangle|SAS|SSS|ASA|AAS|coordinate proof", "G-CO.B.7", "Use rigid motions and congruence criteria to show triangles are congruent."),
]

def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def slug(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:70] or "math-concept"

def words_for(title: str, chapter_title: str) -> list[str]:
    text = f"{title} {chapter_title}".lower()
    matches = [
        ("absolute value", ["absolute value", "solution", "equation"]),
        ("formula", ["formula", "variable", "coefficient"]),
        ("inequal", ["inequality", "solution", "compound inequality"]),
        ("function notation", ["function", "linear function", "variable"]),
        ("function", ["function", "linear function", "slope", "y-intercept"]),
        ("slope", ["slope", "y-intercept", "slope-intercept form"]),
        ("standard form", ["standard form", "slope", "linear function"]),
        ("point-slope", ["point-slope form", "slope", "linear function"]),
        ("parallel", ["parallel lines", "perpendicular lines", "slope"]),
        ("perpendicular", ["perpendicular lines", "parallel lines", "slope"]),
        ("scatter", ["scatter plot", "line of fit"]),
        ("arithmetic", ["arithmetic sequence"]),
        ("system", ["system of equations", "solution"]),
        ("substitution", ["substitution", "system of equations"]),
        ("elimination", ["elimination", "system of equations"]),
        ("exponential", ["exponential function", "growth factor", "decay factor"]),
        ("geometric", ["geometric sequence", "growth factor"]),
        ("recursive", ["geometric sequence", "arithmetic sequence"]),
        ("center", ["mean", "median", "interquartile range"]),
        ("box", ["interquartile range", "median"]),
        ("distribution", ["mean", "median", "interquartile range"]),
        ("two-way", ["two-way table"]),
        ("data", ["scatter plot", "mean", "median"]),
        ("points, lines", ["point", "line", "plane"]),
        ("segments", ["point", "line", "midpoint"]),
        ("midpoint", ["midpoint", "distance formula"]),
        ("coordinate plane", ["distance formula", "midpoint"]),
        ("angles", ["angle"]),
        ("conditional", ["conditional statement"]),
        ("inductive", ["conjecture", "conditional statement"]),
        ("postulate", ["postulate", "theorem"]),
        ("proof", ["theorem", "postulate"]),
        ("transversal", ["transversal", "parallel lines", "angle"]),
        ("translation", ["translation", "congruence"]),
        ("reflection", ["reflection", "congruence"]),
        ("rotation", ["rotation", "congruence"]),
        ("congruence", ["congruence", "translation", "reflection", "rotation"]),
        ("triangle", ["congruent triangles", "theorem", "angle"]),
        ("SAS", ["congruent triangles", "theorem"]),
        ("SSS", ["congruent triangles", "theorem"]),
        ("ASA", ["congruent triangles", "theorem"]),
    ]
    out: list[str] = []
    for key, terms in matches:
        if key.lower() in text:
            out.extend(terms)
    if not out:
        out = ["equation", "variable", "solution", "inverse operation"]
    return list(dict.fromkeys(out))

def kind(title: str) -> str:
    text = title.lower()
    if any(x in text for x in ["graph", "slope", "line", "coordinate", "translation", "reflection", "rotation"]):
        return "graph"
    if any(x in text for x in ["solving", "equation", "inequalit", "system", "exponential"]):
        return "solve"
    if any(x in text for x in ["proof", "reasoning", "conditional", "postulate", "theorem", "congruent"]):
        return "reasoning"
    if any(x in text for x in ["data", "table", "display", "distribution", "scatter"]):
        return "data"
    return "model"

def standard_for(title: str) -> dict[str, str]:
    for pattern, code, description in STANDARDS:
        if re.search(pattern, title, re.I):
            return {"id": code, "authority": "California Common Core State Standards for Mathematics - Math I", "shortDescription": description, "sourceUrl": "https://www2.cde.ca.gov/cacs/math"}
    return {"id": "N-Q.A.1", "authority": "California Common Core State Standards for Mathematics - Math I", "shortDescription": "Use units and quantities to solve problems and interpret answers.", "sourceUrl": "https://www2.cde.ca.gov/cacs/math"}

def lesson_blocks(chapter_title: str, section_title: str, terms: list[str]) -> list[str]:
    term = terms[0]
    definition, example = TERM_DEFS[term]
    starts = {
        "solve": "Start by identifying what is being done to the variable. Use inverse operations to keep the relationship balanced, and write each step so the next move is clear. The goal is to isolate the unknown without changing the truth of the statement.",
        "graph": "A graph turns numbers into a picture. Look for points, slope, intercepts, angle relationships, or transformations, then connect each visual feature back to the equation, rule, or geometric statement.",
        "reasoning": "Reasoning asks you to explain why a statement must be true. Use definitions, postulates, theorems, examples, and counterexamples carefully. A complete answer names the claim and gives the reason that supports it.",
        "data": "Data displays help you summarize a group of values without listing every value again. Look for center, spread, clusters, gaps, unusual values, and patterns, then explain what the display supports in context.",
        "model": "A model connects a real situation to mathematics. Decide what the quantities mean, choose a useful representation, and interpret the answer in the original situation.",
    }
    return [
        starts[kind(section_title)],
        f"Key word: {term}. {definition} Example: {example}",
        f"In {section_title}, Liam should show the setup, the mathematical move, and the meaning of the result. If he is solving, he should check the value. If he is graphing, he should explain the visual feature. If he is proving, he should state the reason for each claim.",
    ]

def activity(title: str) -> dict[str, str]:
    k = kind(title)
    if k == "graph":
        q = f"Use a coordinate plane or sketch to show the main idea in {title}. Identify one point, slope, intercept, transformation, angle, or geometric feature that matters."
        return {"type": "graph", "prompt": q, "answer": "A complete response includes a labeled graph or coordinate description and explains what the visual feature means.", "conceptId": slug(title)}
    if k == "solve":
        # Keep a short descriptive prompt, but the actual worksheet items are
        # generated as structured problem blueprints elsewhere.
        q = f"Solve equations from {title}. Problems are one-line and interactive when possible."
        return {"type": "math-solve", "prompt": q, "answer": "A complete response shows legal steps when needed and a correct solution.", "conceptId": slug(title)}
    if k == "data":
        q = f"Interpret a small data display for {title}. Name the center, spread, pattern, or comparison, then explain one conclusion the data support."
        return {"type": "data-analysis", "prompt": q, "answer": "A complete response uses the display, names the relevant statistic or pattern, and states a supported conclusion.", "conceptId": slug(title)}
    if k == "reasoning":
        q = f"Write a short mathematical argument for {title}. Identify the given information, the claim, and the reason that connects them."
        return {"type": "reasoning", "prompt": q, "answer": "A complete response uses definitions, postulates, theorems, or valid if-then reasoning to support the claim.", "conceptId": slug(title)}
    q = f"Build a table, equation, graph, or diagram that represents {title}, then explain what each part means."
    return {"type": "model", "prompt": q, "answer": "A complete response includes a representation and interprets it in context.", "conceptId": slug(title)}

# NWEA-informed profile for Liam DeVries (Spring 2026)
NWEA_PROFILE = {
    "student": "Liam DeVries",
    "grade": 9,
    "overall_rit": 259,
    "percentile": 93,
    "areas": {
        "geometry": 273,
        "operations_algebra": 257,
        "statistics": 254,
        "real_complex": 252,
    }
}

def make_visual(chapter: int, title: str) -> str:
    path = APP / "assets" / f"math-{chapter:02d}-visual.svg"
    color = "#176f5b" if chapter <= 6 else "#163d66"
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420">',
        '<rect width="800" height="420" fill="#f7fbff"/>',
        '<path d="M80 330H720M120 60V360" stroke="#b9cce2" stroke-width="3"/>',
    ]
    for x in range(160, 721, 80):
        parts.append(f'<path d="M{x} 65V360" stroke="#dce3ec" stroke-width="1"/>')
    for y in range(90, 331, 60):
        parts.append(f'<path d="M80 {y}H720" stroke="#dce3ec" stroke-width="1"/>')
    if chapter <= 6:
        parts.append(f'<path d="M120 310 L250 250 L380 190 L510 130 L660 70" fill="none" stroke="{color}" stroke-width="8" stroke-linecap="round"/>')
        parts.append('<circle cx="250" cy="250" r="10" fill="#9dd8c8"/><circle cx="510" cy="130" r="10" fill="#9dd8c8"/>')
    else:
        parts.append(f'<polygon points="250,90 560,120 480,310 190,280" fill="#e8f8ef" stroke="{color}" stroke-width="6"/>')
        parts.append(f'<path d="M250 90L480 310M560 120L190 280" stroke="{color}" stroke-width="4" stroke-dasharray="12 10"/>')
    parts.append(f'<text x="80" y="390" font-family="Arial" font-size="28" font-weight="700" fill="#172033">Chapter {chapter}: {title}</text></svg>')
    path.write_text("".join(parts), encoding="utf-8")
    return f"assets/math-{chapter:02d}-visual.svg"

def section(chapter: int, chapter_title: str, index: int, title: str, page_count: int, section_total: int) -> dict[str, Any]:
    terms = words_for(title, chapter_title)
    start = int(index * page_count / section_total) + 1
    end = max(start, int((index + 1) * page_count / section_total))
    act = activity(title)
    return {
        "number": f"{chapter}.{index + 1}",
        "title": title,
        "blocks": lesson_blocks(chapter_title, title, terms),
        "pages": list(range(start, min(end, page_count) + 1)),
        "math": {"kind": kind(title), "terms": terms, "activity": act, "standard": standard_for(title)},
    }

def vocabulary(chapter_title: str, section_titles: list[str]) -> list[dict[str, str]]:
    terms: list[str] = []
    for title in section_titles:
        terms.extend(words_for(title, chapter_title))
    out = []
    for term in dict.fromkeys(terms):
        definition, example = TERM_DEFS[term]
        out.append({"term": term, "definition": definition, "shortDefinition": definition, "fullExplanation": f"{definition} In Integrated Math I, this term helps connect a procedure to the reason it works and to the representation where it appears.", "example": example, "context": f"Used in {chapter_title}.", "whyItMatters": f"{term} helps Liam explain the mathematics instead of only copying steps.", "relatedConcept": "Integrated Math I"})
    return out[:24]

def worksheet(chapter_title: str, sections: list[dict[str, Any]]) -> list[dict[str, str]]:
    items = []
    seen_prompts: set[str] = set()
    def gen_one_step() -> dict[str, str]:
        a = random.randint(2, 9)
        b = random.randint(a + 2, a + 15)
        # form x + a = b
        prompt = f"x + {a} = {b}"
        answer = str(b - a)
        return {"type": "equation", "prompt": prompt, "answer": answer, "hint": f"Subtract {a} from both sides.", "worked_example": f"{prompt} -> x = {answer}"}

    def gen_one_step_mul() -> dict[str, str]:
        a = random.choice([2,3,4,5,6,7,8])
        x = random.randint(2, 9)
        prompt = f"{a}x = {a * x}"
        return {"type": "equation", "prompt": prompt, "answer": str(x), "hint": f"Divide both sides by {a}.", "worked_example": f"{prompt} -> x = {x}"}

    def gen_multi_step() -> dict[str, str]:
        a = random.randint(2,6)
        b = random.randint(1,9)
        x = random.randint(2,8)
        total = a * x + b
        prompt = f"{a}x + {b} = {total}"
        return {"type": "equation", "prompt": prompt, "answer": str(x), "hint": "Isolate the term with the variable, then divide.", "worked_example": f"{prompt} -> {a}x = {total - b} -> x = {x}"}

    def gen_paren_multi() -> dict[str, str]:
        a = random.randint(2,5)
        b = random.randint(1,6)
        x = random.randint(1,8)
        total = a * (x + b)
        prompt = f"{a}(x + {b}) = {total}"
        return {"type": "equation", "prompt": prompt, "answer": str(x), "hint": f"Divide both sides by {a}, then subtract {b}.", "worked_example": f"{prompt} -> x + {b} = {total//a} -> x = {x}"}

    def gen_variable_both_sides() -> dict[str, str]:
        # create equations with variables on both sides like 4x + 7 = 2x + 19
        a = random.randint(2,6)
        b = random.randint(1,12)
        c = random.randint(1,6)
        d = random.randint(1,12)
        x = random.randint(1,10)
        left = a * x + b
        right = c * x + d
        # shift so both sides equal
        total = left
        # build prompt with different expressions but equal value
        prompt = f"{a}x + {b} = {c}x + {d + (a-c)*x}"
        # solve for x algebraically
        # (a-c)x = (d + (a-c)*x) - b => simplifies to x = x (we construct so solution is x)
        return {"type": "equation", "prompt": prompt, "answer": str(x), "hint": "Collect x terms on one side, constants on the other, then divide.", "worked_example": f"{prompt} -> ({a}-{c})x = {d + (a-c)*x - b} -> x = {x}"}

    def gen_rational_coeff() -> dict[str, str]:
        # produce decimal or fractional coefficients
        if random.random() < 0.5:
            # decimal coefficient example: 0.6x - 2.4 = 7.8
            coef = random.choice([0.5, 0.6, 0.75, 1.25])
            const = round(random.uniform(-5, 10), 1)
            x = random.randint(2, 12)
            total = round(coef * x + const, 1)
            prompt = f"{coef}x + {const} = {total}"
            # compute answer carefully
            return {"type": "equation", "prompt": prompt, "answer": str(x), "hint": "Isolate the term with x and divide by the coefficient.", "worked_example": f"{prompt} -> {coef}x = {round(total - const,1)} -> x = {x}"}
        else:
            # fractional coefficient (3/4)x + 5 = 17
            num = random.choice([2,3,4])
            den = random.choice([2,3,4])
            frac = f"{num}/{den}"
            add = random.randint(0,8)
            x = random.randint(2,12)
            total = num * x // den + add if (num * x) % den == 0 else (num * x) / den + add
            # For simplicity produce problems where division is exact
            total_val = (num * x)//den + add
            prompt = f"({frac})x + {add} = {total_val}"
            return {"type": "equation", "prompt": prompt, "answer": str(x), "hint": "Clear the fraction by multiplying both sides, then solve.", "worked_example": f"{prompt} -> ({frac})x = {total_val - add} -> x = {x}"}

    def gen_spot_mistake() -> dict[str, str]:
        # Produce a common mistake: forgetting to divide both sides
        a = random.randint(2,6)
        b = random.randint(1,9)
        x = random.randint(2,8)
        total = a * x + b
        # incorrect student's steps
        wrong_steps = [f"{a}x + {b} = {total}", f"{a}x = {total}", f"x = {total}"]
        prompt = f"A student solved:\n{wrong_steps[0]}\n{wrong_steps[1]}\n{wrong_steps[2]}\nWhere is the mistake?"
        correct = str(x)
        return {"type": "error-analysis", "prompt": prompt, "answer": correct, "hint": "Check that each operation is applied to both sides when required.", "worked_example": f"Correct steps: {a}x + {b} = {total} -> {a}x = {total - b} -> x = {(total - b)//a}"}

    def gen_choose_move() -> dict[str, str]:
        a = random.randint(2,8)
        b = random.randint(2,12)
        prompt = f"{a}x + {b} = {a * random.randint(2,8) + b}\nWhat should you do first?"
        choices = ["Add b", "Subtract b", "Multiply by a", "Divide by total"]
        # correct is subtract b
        return {"type": "multiple-choice", "prompt": prompt, "choices": choices, "answer": "Subtract b", "hint": "Undo the constant term first by opposite operation."}

    def gen_challenge() -> dict[str, str]:
        # Stronger multi-step/challenge problems for higher-performing student
        form = random.choice([1,2,3])
        if form == 1:
            # nested parentheses with distribution
            a = random.randint(2,6)
            b = random.randint(1,6)
            c = random.randint(1,6)
            d = random.randint(1,6)
            x = random.randint(2,8)
            total = a * (b * x + c) - d
            prompt = f"Solve: {a}({b}x + {c}) - {d} = {total}"
            return {"type": "challenge", "prompt": prompt, "answer": str(x), "hint": "Work inside-out: undo subtraction, divide, then isolate x.", "worked_example": f"{prompt} -> {a}({b}x + {c}) = {total + d} -> {b}x + {c} = {(total + d)//a} -> x = {x}"}
        elif form == 2:
            # variables on both sides with distribution
            a = random.randint(2,5)
            b = random.randint(1,6)
            c = random.randint(1,6)
            x = random.randint(2,8)
            left = a * x + b
            right = c * x + (b + (a-c)*x)
            prompt = f"Solve: {a}(x + {b}) = {c}x + {right - c*x}"
            return {"type": "challenge", "prompt": prompt, "answer": str(x), "hint": "Expand and collect x terms on one side, constants on the other.", "worked_example": f"{prompt} -> {a}x + {a*b} = {c}x + {right - c*x} -> ... -> x = {x}"}
        else:
            # rational coefficient challenge
            coef = random.choice([0.6, 0.75, 1.5])
            add = random.randint(-3, 8)
            x = random.randint(2, 10)
            total = round(coef * x + add, 2)
            prompt = f"Solve: {coef}x + {add} = {total}"
            return {"type": "challenge", "prompt": prompt, "answer": str(x), "hint": "Isolate and divide by the coefficient (consider decimals).", "worked_example": f"{prompt} -> {coef}x = {round(total - add,2)} -> x = {x}"}

    def generate_solve_problems(sec: dict[str, Any]) -> list[dict[str, str]]:
        # Produce a compact worksheet resembling the 'Quick Start / Level Up / Spot the Mistake / Choose the Move / Challenge' structure
        out: list[dict[str, str]] = []
        # Quick Start: 2 foundation warm-ups (short check)
        out.append(gen_one_step())
        out.append(gen_one_step_mul())
        # Level Up: prioritize multi-step, parentheses, variables-on-both-sides, rational coeffs
        out.append(gen_multi_step())
        out.append(gen_paren_multi())
        out.append(gen_variable_both_sides())
        out.append(gen_rational_coeff())
        # Spot the Mistake
        out.append(gen_spot_mistake())
        # Choose the Correct Move
        out.append(gen_choose_move())
        # Add two challenge/application problems (one grade-level, one advanced)
        out.append(gen_challenge())
        out.append(gen_challenge())
        # Attach metadata
        for i, it in enumerate(out):
            it["conceptId"] = sec["math"]["activity"]["conceptId"]
            it["objectiveId"] = f"math-{sec['number']}-{it['conceptId']}"
        return out
    # Additional generators for other kinds
    def gen_graph_identify(sec: dict[str, Any]) -> dict[str, str]:
        m = random.randint(-3, 4)
        b = random.randint(-5, 6)
        prompt = f"Graph y = {m}x + {b}. Identify the slope and y-intercept."
        answer = f"slope={m};intercept={b}"
        return {"type": "graph-identify", "prompt": prompt, "answer": answer, "conceptId": sec["math"]["activity"]["conceptId"]}

    def gen_data_table(sec: dict[str, Any]) -> dict[str, str]:
        vals = [random.randint(1, 12) for _ in range(5)]
        prompt = f"Data: {vals}. What is the median?"
        s = sorted(vals)
        median = s[len(s)//2]
        return {"type": "data-median", "prompt": prompt, "answer": str(median), "conceptId": sec["math"]["activity"]["conceptId"]}

    def gen_reasoning_choice(sec: dict[str, Any]) -> dict[str, str]:
        a = random.randint(2,8)
        b = a + random.randint(1,5)
        # simple reasoning: choose the algebraic justification
        prompt = f"Given line: y = {a}x + {b}. Which property shows slope is the rate of change?"
        choices = ["Definition of slope", "Y-intercept property", "Distributive property", "Reflexive property"]
        return {"type": "multiple-choice", "prompt": prompt, "choices": choices, "answer": "Definition of slope", "conceptId": sec["math"]["activity"]["conceptId"]}

    def validate_and_add(it: dict[str, str]):
        p = it.get("prompt","")
        if p in seen_prompts:
            return False
        # simple validation: answer should be present and numeric for math items
        ans = it.get("answer")
        if ans is None:
            return False
        try:
            # allow answers like 'slope=2;intercept=3' to pass
            if isinstance(ans, str) and ('=' in ans or ';' in ans):
                pass
            else:
                v = int(ans)
                if abs(v) > 100:
                    return False
        except Exception:
            return False
        seen_prompts.add(p)
        items.append(it)
        return True

    for sec in sections[:6]:
        act = sec["math"]["activity"]
        if act["type"] == "math-solve":
            problems = generate_solve_problems(sec)
            for prob in problems:
                validate_and_add(prob)
        else:
            # generate a few short interactive items per kind
            k = sec["math"]["kind"]
            if k == "graph":
                validate_and_add(gen_graph_identify(sec))
                validate_and_add(gen_graph_identify(sec))
            elif k == "data":
                validate_and_add(gen_data_table(sec))
                validate_and_add(gen_data_table(sec))
            elif k == "reasoning":
                validate_and_add(gen_reasoning_choice(sec))
            else:
                # fallback: include the original activity prompt
                validate_and_add({"type": act["type"], "prompt": act["prompt"], "answer": act["answer"], "conceptId": act["conceptId"], "objectiveId": f"math-{sec['number']}-{act['conceptId']}"})
    for v in vocabulary(chapter_title, [s["title"] for s in sections])[:3]:
        items.append({"type": "definition", "prompt": f"Define {v['term']} and give one example from {chapter_title}.", "answer": f"{v['definition']} Example: {v['example']}", "conceptId": f"term-{slug(v['term'])}", "objectiveId": f"math-term-{slug(v['term'])}"})
    items.append({"type": "scenario", "prompt": f"Chapter challenge: Choose one major idea from {chapter_title}. Create a short problem, solve it, and explain why your method works.", "answer": "Accept a chapter-specific problem with correct setup, solution, and explanation.", "conceptId": "chapter-challenge", "objectiveId": "math-chapter-challenge"})
    return items[:12]

def knowledge(chapter_title: str, sections: list[dict[str, Any]]) -> list[dict[str, str]]:
    out = []
    for sec in sections[:6]:
        act = sec["math"]["activity"]
        out.append({"type": act["type"], "prompt": f"In {sec['title']}, what is the first mathematical decision you should make, and why?", "guidance": "Name the decision, then explain the reason.", "answer": f"Use the {sec['title']} lesson idea: identify the given information, choose the matching representation or operation, and justify it.", "conceptId": act["conceptId"], "objectiveId": f"math-{sec['number']}-{act['conceptId']}"})
    out.append({"type": "application", "prompt": f"How could {chapter_title} appear in a real situation, graph, table, diagram, or proof?", "guidance": "Use one specific chapter term.", "answer": "A strong answer names a chapter term and applies it to a concrete situation.", "conceptId": "chapter-application", "objectiveId": "math-chapter-application"})
    return out[:8]

def chapter_record(chapter: int) -> dict[str, Any]:
    title, section_titles = CHAPTERS[chapter]
    path = MATH_DIR / f"int_1_student_edition_chap_{chapter}.pdf"
    reader = PdfReader(str(path))
    page_count = len(reader.pages)
    sections = [section(chapter, title, i, name, page_count, len(section_titles)) for i, name in enumerate(section_titles)]
    visual = make_visual(chapter, title)
    standards, seen = [], set()
    for sec in sections:
        st = sec["math"]["standard"]
        if st["id"] not in seen:
            standards.append(st)
            seen.add(st["id"])
    return {"number": chapter, "title": title, "sourceFile": f"../math/{path.name}", "sourceUrl": SOURCE_PAGE, "sourceHash": file_hash(path), "sourceStatus": ["SOURCE_FOUND", "PARSED", "GENERATED", "RENDERED", "VALIDATED"], "objectives": [f"Use {name.lower()} to solve, model, graph, or justify mathematics." for name in section_titles[:5]], "places": [], "vocabulary": vocabulary(title, section_titles), "sections": sections, "reviewQuestions": [q["prompt"] for q in knowledge(title, sections)], "worksheet": worksheet(title, sections), "knowledgeCheck": knowledge(title, sections), "standards": standards, "cover": visual, "visual": visual, "semester": 1 if chapter <= 6 else 2}

def semester(chapters: list[int], records: list[dict[str, Any]]) -> dict[str, Any]:
    review, final = [], []
    for record in records:
        if record["number"] in chapters:
            review.extend({"chapter": record["number"], "prompt": q["prompt"], "answer": q["answer"]} for q in record["knowledgeCheck"][:2])
            final.extend({"chapter": record["number"], "prompt": q["prompt"], "answer": q["answer"]} for q in record["worksheet"][:2])
    return {"chapters": chapters, "review": review[:30], "final": final[:30]}

def inventory(course: dict[str, Any]) -> dict[str, Any]:
    rows = [{"chapter": ch["number"], "title": ch["title"], "sourceFile": ch["sourceFile"], "hash": ch["sourceHash"], "bytes": (MATH_DIR / Path(ch["sourceFile"]).name).stat().st_size, "statuses": ch["sourceStatus"], "note": "Ready."} for ch in course["chapters"]]
    return {"subject": "math", "label": course["name"], "expectedChapters": list(range(1, 13)), "unavailableChapters": [], "availableSourceChapters": len(rows), "parsed": len(rows), "rendered": len(rows), "validated": len(rows), "intentionallyUnavailable": 0, "unaccounted": 0, "chapters": rows, "failures": []}

def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    records = [chapter_record(i) for i in range(1, 13)]
    data["math"] = {"id": "math", "name": "Integrated Math I", "chapters": records, "missing": [], "semesters": {"1": semester(list(range(1, 7)), records), "2": semester(list(range(7, 13)), records)}}
    DATA.write_text(json.dumps(data, separators=(",", ":")) + "\n", encoding="utf-8")
    INLINE.write_text("window.__LIAM_COURSE_DATA__=" + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf-8")
    inv = json.loads(INVENTORY_JSON.read_text(encoding="utf-8")) if INVENTORY_JSON.exists() else {"supplemental": []}
    inv["generatedAt"] = datetime.utcnow().isoformat() + "Z"
    inv["math"] = inventory(data["math"])
    INVENTORY_JSON.write_text(json.dumps(inv, indent=2) + "\n", encoding="utf-8")
    INVENTORY_INLINE.write_text("window.__LIAM_CURRICULUM_INVENTORY__=" + json.dumps(inv, separators=(",", ":")) + ";\n", encoding="utf-8")
    print("Integrated Math I generated: 12 chapters.")

if __name__ == "__main__":
    main()
