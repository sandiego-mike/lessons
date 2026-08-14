from __future__ import annotations

import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
MATERIALS = ROOT / "materials"
OUT = ROOT / "src" / "generated" / "courseData.ts"


@dataclass
class PdfChapter:
    subject: str
    path: Path
    chapter: int
    pages: list[str]
    title: str


BIOLOGY_TITLES = {
    1: "Biology: The Study of Life",
    2: "Principles of Ecology",
    3: "Communities and Biomes",
    4: "Population Biology",
    5: "Biological Diversity and Conservation",
    6: "The Chemistry of Life",
    7: "A View of the Cell",
    8: "Cellular Transport and the Cell Cycle",
    9: "Energy in a Cell",
    10: "Mendel and Meiosis",
    11: "DNA and Genes",
    12: "Patterns of Heredity and Human Genetics",
    13: "Genetic Technology",
    14: "The History of Life",
    15: "The Theory of Evolution",
    16: "Primate Evolution",
    17: "Organizing Life's Diversity",
}

GEOGRAPHY_TITLES = {
    1: "Exploring Geography",
    2: "Planet Earth",
    3: "Climate and Vegetation",
    4: "The Human World",
    5: "Physical Geography of the United States and Canada",
    6: "Population Patterns",
    7: "Living in the United States and Canada",
    8: "Physical Geography of Latin America",
    9: "Population Patterns",
    10: "Living in Latin America",
    11: "Physical Geography of Europe",
    12: "Population Patterns",
    13: "Living in Europe",
    14: "Physical Geography of Russia",
    15: "Population Patterns",
    16: "Living in Russia",
    17: "Physical Geography of North Africa, Southwest Asia, and Central Asia",
    18: "Population Patterns",
    19: "Living in North Africa, Southwest Asia, and Central Asia",
    20: "Physical Geography of Africa South of the Sahara",
    21: "Population Patterns",
    22: "Living in Africa South of the Sahara",
    23: "Physical Geography of South Asia",
    24: "Population Patterns",
    25: "Living in South Asia",
    26: "Physical Geography of East Asia",
    27: "Population Patterns",
    28: "Living in East Asia",
    29: "Physical Geography of Southeast Asia",
    30: "Population Patterns",
    31: "Living in Southeast Asia",
    32: "Physical Geography of Australia, Oceania, and Antarctica",
    33: "Population Patterns",
    34: "Living in Australia, Oceania, and Antarctica",
}

BIOLOGY_FALLBACK_TERMS = [
    "organism",
    "homeostasis",
    "stimulus",
    "response",
    "adaptation",
    "evolution",
    "cell",
    "energy",
    "DNA",
    "species",
    "ecosystem",
]

GEOGRAPHY_FALLBACK_TERMS = [
    "location",
    "absolute location",
    "relative location",
    "region",
    "latitude",
    "longitude",
    "ecosystem",
    "movement",
    "human-environment interaction",
    "physical geography",
    "human geography",
]

TERM_DEFINITIONS = {
    "biology": {
        "biology": "The study of life and living things.",
        "organism": "A living thing that has all the characteristics of life.",
        "organization": "The orderly structure of living things, including cells and body systems.",
        "reproduction": "The process by which living things produce offspring.",
        "species": "A group of organisms that can interbreed and produce fertile offspring in nature.",
        "growth": "An increase in living material or size.",
        "development": "The changes an organism goes through during its life.",
        "environment": "An organism's surroundings, including living and nonliving factors.",
        "stimulus": "Anything in an internal or external environment that causes an organism to react.",
        "response": "A reaction to a stimulus.",
        "homeostasis": "The regulation of internal conditions so an organism can survive.",
        "energy": "The ability to cause change or do work.",
        "adaptation": "An inherited structure, behavior, or process that helps an organism survive and reproduce.",
        "evolution": "Change in inherited traits of populations over generations.",
        "scientific methods": "Organized ways scientists gather evidence and answer questions.",
        "hypothesis": "A testable explanation for a question or problem.",
        "experiment": "An investigation that tests a hypothesis by collecting information under controlled conditions.",
        "control": "The standard part of an experiment used for comparison.",
        "independent variable": "The condition deliberately changed in an experiment.",
        "dependent variable": "The condition measured in response to the independent variable.",
        "data": "Information gathered from observations or experiments.",
        "theory": "A well-supported explanation based on much evidence.",
        "cell": "The basic unit of structure and function in living things.",
        "DNA": "Genetic material that carries instructions for life processes.",
        "ecosystem": "A community of organisms and the nonliving environment they interact with.",
    },
    "geography": {
        "location": "The position of a place on Earth.",
        "absolute location": "The exact position of a place, often given by latitude and longitude.",
        "hemisphere": "One half of Earth, such as Northern, Southern, Eastern, or Western Hemisphere.",
        "grid system": "A pattern of latitude and longitude lines used to locate places on Earth.",
        "relative location": "The position of a place described in relation to other places.",
        "place": "A particular space with physical and human meaning.",
        "region": "An area united by shared physical or human characteristics.",
        "formal region": "A region defined by a common characteristic.",
        "functional region": "A region organized around a central point or connection.",
        "perceptual region": "A region defined by people's feelings or ideas about it.",
        "ecosystem": "A community of plants and animals that depend on one another and their surroundings.",
        "movement": "The flow of people, goods, ideas, or information from place to place.",
        "human-environment interaction": "The relationship between people and their physical environment.",
        "physical geography": "The study of Earth's natural features and physical systems.",
        "human geography": "The study of people, cultures, settlements, and human activities across Earth.",
        "meteorology": "The study of weather and the atmosphere.",
        "cartography": "The science and art of making maps.",
        "geographic information systems": "Computer systems used to store, analyze, and display geographic data.",
        "GIS": "Computer systems used to store, analyze, and display geographic data.",
        "latitude": "Distance north or south of the Equator, measured in degrees.",
        "longitude": "Distance east or west of the Prime Meridian, measured in degrees.",
        "hydrosphere": "All of Earth's water, including oceans, rivers, lakes, ice, and water vapor.",
        "lithosphere": "Earth's land and rocky outer layer.",
        "atmosphere": "The layer of gases surrounding Earth.",
        "biosphere": "The part of Earth where life exists.",
    },
}


def chapter_number(path: Path) -> int | None:
    name = path.stem.lower()
    patterns = [
        r"chapter[_\s-]*(\d+)",
        r"chap(?:ter)?[_\s-]*(\d+)",
        r"^(\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, name)
        if match:
            return int(match.group(1))
    return None


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text.replace("\u2022", " "))
    return text.strip()


def extract_pdf(path: Path, subject: str) -> PdfChapter | None:
    chapter = chapter_number(path)
    if chapter is None:
        return None
    reader = PdfReader(str(path))
    pages = []
    for page in reader.pages:
        try:
            pages.append(page.extract_text() or "")
        except Exception:
            pages.append("")
    title = infer_title(subject, chapter, pages)
    return PdfChapter(subject=subject, path=path, chapter=chapter, pages=pages, title=title)


def infer_title(subject: str, chapter: int, pages: list[str]) -> str:
    known = BIOLOGY_TITLES if subject == "biology" else GEOGRAPHY_TITLES
    if chapter in known:
        return known[chapter]
    if subject == "geography":
        title = infer_geography_title(pages)
        if title:
            return title
    for page in pages[:4]:
        lines = [line.strip() for line in page.splitlines() if line.strip()]
        for line in lines:
            if 4 <= len(line) <= 80 and not re.search(r"chapter|unit|page|www\\.", line, re.I):
                return line
    return f"Chapter {chapter}"


def infer_geography_title(pages: list[str]) -> str | None:
    lines: list[str] = []
    for page in pages[:3]:
        for line in page.splitlines():
            cleaned = clean_text(line)
            if cleaned:
                lines.append(cleaned)
    noise = re.compile(
        r"^(GeoJournal|Guide to Reading|Consider What You Know|Read to Find Out|Terms to Know|Places to Locate|Chapter Overview|A Geographic View|Unit \\d+|Chapter \\d+|www\\.|NGS ONLINE)",
        re.I,
    )
    for index, line in enumerate(lines):
        if re.match(r"A Geographic View", line, re.I):
            title_parts = []
            cursor = index - 1
            while cursor >= 0 and len(title_parts) < 3:
                candidate = lines[cursor].strip(" ,")
                if noise.search(candidate) or len(candidate) < 4:
                    cursor -= 1
                    continue
                title_parts.insert(0, candidate)
                cursor -= 1
            title = clean_text(" ".join(title_parts)).strip(" ,")
            if 4 <= len(title) <= 90:
                return title
    return None


def extract_objectives(chapter: PdfChapter) -> list[str]:
    joined = "\n".join(chapter.pages[:5])
    objectives: list[str] = []
    learn_match = re.search(r"What You.ll Learn(.+?)(Why It.s Important|Visit|Guide to Reading|Understanding)", joined, re.S | re.I)
    if learn_match:
        chunk = learn_match.group(1)
        for part in re.split(r"[■•\n]+", chunk):
            part = clean_text(part)
            if len(part) > 12 and len(part) < 180:
                objectives.append(part.rstrip(".") + ".")
    read_match = re.search(r"Read to Find Out(.+?)(Terms to Know|Places to Locate|The |Chapter)", joined, re.S | re.I)
    if read_match:
        for part in re.split(r"[•\n]+", read_match.group(1)):
            part = clean_text(part)
            if len(part) > 12 and len(part) < 180:
                objectives.append(part.rstrip(".") + ".")
    if objectives:
        return dedupe(objectives)[:8]
    if chapter.subject == "biology":
        return [
            f"Explain the major ideas in {chapter.title}.",
            "Use chapter vocabulary correctly.",
            "Apply the chapter concepts to a new biological situation.",
        ]
    return [
        f"Explain the major ideas in {chapter.title}.",
        "Use chapter vocabulary correctly.",
        "Apply the chapter concepts to a new geographic situation.",
    ]


def extract_terms(chapter: PdfChapter) -> list[str]:
    text = "\n".join(chapter.pages[:8])
    terms: list[str] = []
    for label in ["New Vocabulary", "Terms to Know", "Review Vocabulary", "Places to Locate"]:
        for match in re.finditer(label + r"(.{0,900})", text, re.S | re.I):
            chunk = match.group(1)
            chunk = re.split(r"(North Carolina Objectives|Guide to Reading|Read to Find Out|SECTION PREVIEW|Objective|Places to Locate|A Geographic View)", chunk)[0]
            for line in chunk.splitlines():
                line = clean_text(line)
                if 2 <= len(line) <= 45 and not re.search(r"objective|chapter|section|preview|read|page|visit", line, re.I):
                    terms.append(line)
    fallback = BIOLOGY_FALLBACK_TERMS if chapter.subject == "biology" else GEOGRAPHY_FALLBACK_TERMS
    body = clean_text(" ".join(chapter.pages))
    for term in fallback:
        if re.search(r"\b" + re.escape(term) + r"\b", body, re.I):
            terms.append(term)
    return dedupe([normalize_term(term) for term in terms if valid_term(term)])[:22]


def valid_term(term: str) -> bool:
    if len(term.split()) > 5:
        return False
    return not re.search(r"\d|www|visit|chapter|page|figure|guide|reading", term, re.I)


def normalize_term(term: str) -> str:
    return term.strip(" .,:;•").replace("  ", " ")


def extract_sections(chapter: PdfChapter) -> list[dict[str, Any]]:
    sections = []
    joined = "\n".join(chapter.pages)
    for match in re.finditer(rf"\b{chapter.chapter}\.(\d+)\s+([A-Z][^\n]{{3,80}})", joined):
        title = normalize_section_title(clean_text(match.group(2)))
        if title and not re.search(r"SECTION PREVIEW|OBJECTIVE|CHAPTER", title, re.I):
            if title.lower() not in {section["title"].lower() for section in sections}:
                sections.append({"id": f"{chapter.chapter}.{match.group(1)}", "title": title, "pages": []})
    if not sections:
        objectives = extract_objectives(chapter)
        if len(objectives) >= 2:
            sections = [
                {"id": f"{chapter.chapter}.1", "title": objective.rstrip("."), "pages": []}
                for objective in objectives[:3]
            ]
        else:
            sections = [{"id": f"{chapter.chapter}.1", "title": chapter.title, "pages": []}]
    if len(sections) < 3:
        used_titles = {section["title"].lower() for section in sections}
        objectives = extract_objectives(chapter)
        terms = extract_terms(chapter)
        candidates = [objective.rstrip(".") for objective in objectives]
        if chapter.subject == "biology":
            candidates.extend([f"Using {term} in biological explanations" for term in terms[:4]])
            candidates.extend(["Chapter examples and evidence", "Applying the biology concept"])
        else:
            candidates.extend([f"Using {term} in geographic explanations" for term in terms[:4]])
            candidates.extend(["Place patterns and map evidence", "Applying the geography concept"])
        for candidate in candidates:
            if len(sections) >= 3:
                break
            key = candidate.lower()
            if key in used_titles or len(candidate) < 6:
                continue
            sections.append({"id": f"{chapter.chapter}.{len(sections) + 1}", "title": candidate, "pages": []})
            used_titles.add(key)
    page_count = max(1, len(chapter.pages))
    for i, section in enumerate(sections):
        start = int(i * page_count / len(sections)) + 1
        end = int((i + 1) * page_count / len(sections))
        section["pages"] = list(range(start, max(start, end) + 1))
    return sections[:5]


def normalize_section_title(title: str) -> str:
    title = re.sub(r"\s+\d+$", "", title).strip(" .,:;")
    title = re.sub(r"\s+", " ", title)
    if title.isupper():
        title = title.title()
    return title


def extract_review_questions(chapter: PdfChapter) -> list[str]:
    text = "\n".join(chapter.pages[-6:])
    questions = []
    for match in re.finditer(r"(?:\d+\.\s+)([A-Z][^?]{20,180}\?)", text):
        questions.append(clean_text(match.group(1)))
    return dedupe(questions)[:8]


def dedupe(items: list[str]) -> list[str]:
    seen = set()
    out = []
    for item in items:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            out.append(item)
    return out


def term_definition(term: str, subject: str) -> dict[str, str]:
    key = term.lower()
    simple = TERM_DEFINITIONS.get(subject, {}).get(key)
    if not simple:
        simple = infer_definition_from_term(term, subject)
    return {
        "term": term,
        "shortDefinition": simple,
        "fullExplanation": expand_definition(term, simple, subject),
        "example": term_example(term, subject),
        "whyItMatters": why_term_matters(term, subject),
        "relatedConcept": "chapter concept",
    }


def infer_definition_from_term(term: str, subject: str) -> str:
    if subject == "biology":
        return f"A biology term used to describe a specific living system, process, structure, or relationship: {term}."
    return f"A geography term used to describe a specific place, pattern, process, tool, or human-environment relationship: {term}."


def expand_definition(term: str, definition: str, subject: str) -> str:
    if subject == "biology":
        return f"{definition} In Biology, use this term to explain living things with evidence from observations, examples, or experiments."
    return f"{definition} In World Geography, use this term to explain where something is, what a place is like, or why a spatial pattern exists."


def term_example(term: str, subject: str) -> str:
    examples = {
        "organism": "A bacterium, oak tree, dog, and human are all organisms.",
        "homeostasis": "Sweating when hot helps the body maintain a stable internal temperature.",
        "stimulus": "Heat is a stimulus when it causes a person to sweat.",
        "response": "Sweating is a response to becoming hot.",
        "absolute location": "Dallas, Texas can be described near 32 degrees north and 96 degrees west.",
        "relative location": "New Orleans is near the mouth of the Mississippi River.",
        "region": "The Corn Belt is a region defined by a shared agricultural pattern.",
        "human-environment interaction": "Building canals, farms, cities, or roads changes how people use the environment.",
    }
    if term.lower() in examples:
        return examples[term.lower()]
    if subject == "biology":
        return f"Example: use {term} to explain a living thing, body process, ecosystem, experiment, or inherited trait."
    return f"Example: use {term} to explain a map, place, region, population pattern, or environmental decision."


def why_term_matters(term: str, subject: str) -> str:
    if subject == "biology":
        return f"{term} helps Liam explain how living things are structured, survive, change, or interact."
    return f"{term} helps Liam explain where things are, why places differ, and how people interact with Earth."


def make_lesson_blocks(chapter: PdfChapter, sections: list[dict[str, Any]], terms: list[str], objectives: list[str]) -> list[dict[str, Any]]:
    blocks = []
    for index, section in enumerate(sections[:4], start=1):
        page_text = section_text(chapter, section["pages"])
        summary = summarize(page_text, chapter.subject, chapter.title, section["title"])
        visual_items = terms[(index - 1) * 4 : index * 4] or terms[:4] or objectives[:4]
        blocks.append(
            {
                "id": f"{chapter.subject}-c{chapter.chapter}-s{index}-learn",
                "kind": "learn",
                "title": section["title"],
                "estimatedMinutes": "8-12",
                "source": source(chapter, section["pages"], section["id"]),
                "learnText": summary,
                "keyIdea": key_idea(chapter.subject, chapter.title, section["title"]),
                "visual": {
                    "title": "Key ideas to connect",
                    "items": visual_items[:6],
                },
                "tellMeMore": expanded_detail(page_text),
                "helpOptions": help_options(chapter.subject),
            }
        )
        blocks.append(
            {
                "id": f"{chapter.subject}-c{chapter.chapter}-s{index}-try",
                "kind": "interaction",
                "title": interaction_title(chapter.subject, section["title"]),
                "estimatedMinutes": "5-8",
                "source": source(chapter, section["pages"], section["id"]),
                "prompt": interaction_prompt(chapter.subject, chapter.title, terms[:5]),
                "choices": interaction_choices(chapter.subject, terms[:4]),
                "correctAnswer": interaction_choices(chapter.subject, terms[:4])[0],
                "feedback": feedback_text(chapter.subject),
                "requiresResponse": True,
            }
        )
    blocks.append(
        {
            "id": f"{chapter.subject}-c{chapter.chapter}-check",
            "kind": "check",
            "title": "Chapter knowledge check",
            "estimatedMinutes": "8-12",
            "source": source(chapter, [1, min(len(chapter.pages), 2)], "chapter"),
            "prompt": f"Which statement best captures the main idea of {chapter.title}?",
            "choices": [
                objectives[0] if objectives else f"{chapter.title} explains a core idea in this course.",
                "The chapter is only a list of unrelated facts.",
                "The chapter should be skipped unless a worksheet is assigned.",
            ],
            "correctAnswer": objectives[0] if objectives else f"{chapter.title} explains a core idea in this course.",
            "feedback": "Good. The goal is to connect the chapter's main ideas, not memorize isolated facts.",
            "requiresResponse": True,
        }
    )
    blocks.append(
        {
            "id": f"{chapter.subject}-c{chapter.chapter}-evidence",
            "kind": "evidence",
            "title": "Chapter evidence challenge",
            "estimatedMinutes": "10-15",
            "source": source(chapter, [1, min(len(chapter.pages), 3)], "chapter"),
            "prompt": evidence_prompt(chapter.subject, chapter.title),
            "requiresResponse": True,
        }
    )
    return blocks


def source(chapter: PdfChapter, pages: list[int], section: str) -> dict[str, Any]:
    return {
        "subject": chapter.subject,
        "chapter": chapter.chapter,
        "pdf": chapter.path.name,
        "pages": pages,
        "section": section,
    }


def section_text(chapter: PdfChapter, pages: list[int]) -> str:
    chunks = []
    for page in pages[:4]:
        if 1 <= page <= len(chapter.pages):
            chunks.append(chapter.pages[page - 1])
    return clean_text(" ".join(chunks))


def summarize(text: str, subject: str, chapter_title: str, section_title: str) -> list[str]:
    sentences = re.split(r"(?<=[.!?])\s+", text)
    useful = [clean_text(s) for s in sentences if 60 <= len(clean_text(s)) <= 260]
    if len(useful) >= 2:
        return useful[:3]
    if subject == "biology":
        return [
            f"{section_title} is part of {chapter_title}. Liam should read it as a biology explanation: identify the living system, name the important parts or processes, and connect each claim to evidence from the chapter.",
            "A good biology answer usually explains what is happening, why it matters for an organism or cell, and what evidence would support the explanation. Vocabulary is useful only when it helps explain the system clearly.",
            "After the short lesson, Liam should be able to use one chapter term in context, apply the idea to a new living thing or biological situation, and explain his reasoning in a sentence or two.",
        ]
    return [
        f"{section_title} is part of {chapter_title}. Liam should read it as a geography explanation: identify the place or region, notice the spatial pattern, and connect the pattern to physical or human causes.",
        "A good geography answer usually uses map-style thinking. It explains where something is, what the place is like, how people interact with the environment, and why that pattern matters.",
        "After the short lesson, Liam should be able to use one chapter term in context, compare places or regions when useful, and support his answer with evidence from the chapter.",
    ]


def expanded_detail(text: str) -> str:
    return " ".join(re.split(r"(?<=[.!?])\s+", text)[:8])[:1200]


def key_idea(subject: str, title: str, section: str) -> str:
    if subject == "biology":
        return f"{section} helps explain how living systems work in {title}."
    return f"{section} helps explain places, patterns, or human-environment relationships in {title}."


def help_options(subject: str) -> list[str]:
    if subject == "biology":
        return ["Explain it more simply", "Show me an example", "Show me visually", "Ask me one question at a time"]
    return ["Explain it more simply", "Show me a map-style example", "Compare two places", "Ask me one question at a time"]


def interaction_title(subject: str, section: str) -> str:
    return ("Try it: connect the biology idea" if subject == "biology" else "Try it: apply the geography idea") + f" - {section[:42]}"


def interaction_prompt(subject: str, chapter_title: str, terms: list[str]) -> str:
    if subject == "biology":
        return f"Choose the option that best fits the biology idea from {chapter_title}."
    return f"Choose the option that best fits the geography idea from {chapter_title}."


def interaction_choices(subject: str, terms: list[str]) -> list[str]:
    primary = terms[0] if terms else ("organism" if subject == "biology" else "location")
    if subject == "biology":
        return [f"Use {primary} to explain a living system.", "Ignore the evidence.", "Memorize the word without an example."]
    return [f"Use {primary} to explain a place or pattern.", "Ignore the map or setting.", "Memorize the word without an example."]


def feedback_text(subject: str) -> str:
    return "Correct. Good learning connects terms to examples and evidence." if subject == "biology" else "Correct. Good geography connects terms to places, maps, and patterns."


def evidence_prompt(subject: str, title: str) -> str:
    if subject == "biology":
        if "Study of Life" in title:
            return "Scientists discover an unknown object near a volcanic vent. It grows, uses energy, and responds to heat. Would you classify it as living? Explain what additional evidence you would need."
        if "Ecology" in title or "Biological Diversity" in title or "Communities" in title:
            return f"Analyze a living system from {title}. Explain how organisms interact with each other and with nonliving parts of the environment."
        if "Cell" in title or "Chemistry" in title:
            return f"Use a structure/function explanation from {title} to predict what would happen if one part of the system stopped working."
        if "Mendel" in title or "DNA" in title or "Heredity" in title or "Genetic" in title:
            return f"Use a genetics concept from {title} to explain how information or traits can be passed on or changed."
        return f"Use evidence from {title} to explain a biological process and apply it to a new organism or situation."
    if "Exploring Geography" in title:
        return "A city planner describes a location as 32 degrees north, 96 degrees west. Is this absolute or relative location? Explain why and give an example of how the other type of location could describe the same place."
    if "Planet Earth" in title:
        return "A new island forms after volcanic activity. Explain which Earth systems or forces from this chapter help explain what happened."
    if "Climate" in title:
        return "A farming community is choosing a crop. Use climate and vegetation ideas to recommend what information they should study first."
    return f"Use evidence from {title} to explain a place, pattern, region, or human-environment decision."


def make_worksheet(chapter: PdfChapter, terms: list[str], objectives: list[str], review_questions: list[str]) -> dict[str, Any]:
    questions = []
    terms = terms or (BIOLOGY_FALLBACK_TERMS if chapter.subject == "biology" else GEOGRAPHY_FALLBACK_TERMS)
    for i, term in enumerate(terms[:4], start=1):
        questions.append(
            {
                "id": f"w{i}",
                "type": "short-response",
                "prompt": f"Define {term} in your own words and give one chapter example.",
                "answerKey": f"Answer should accurately explain {term} and include a relevant example from {chapter.title}.",
                "source": source(chapter, [1], "vocabulary"),
            }
        )
    questions.extend(
        [
            {
                "id": "w5",
                "type": "matching",
                "prompt": f"Match three important words from Chapter {chapter.chapter} to examples from the lesson: {', '.join(terms[:3])}.",
                "answerKey": "Answers should correctly connect terms to examples presented in the chapter.",
                "source": source(chapter, [1, 2], "chapter"),
            },
            {
                "id": "w6",
                "type": "scenario",
                "prompt": scenario_prompt(chapter.subject, chapter.title),
                "answerKey": scenario_key(chapter.subject, chapter.title),
                "source": source(chapter, [1, min(3, len(chapter.pages))], "chapter"),
            },
            {
                "id": "w7",
                "type": "classification" if chapter.subject == "biology" else "map-interpretation",
                "prompt": activity_prompt(chapter.subject, chapter.title, terms),
                "answerKey": "Answer should address the learning objective using accurate chapter vocabulary.",
                "source": source(chapter, [1], "objectives"),
            },
            {
                "id": "w8",
                "type": "application",
                "prompt": evidence_prompt(chapter.subject, chapter.title),
                "answerKey": "Answer should apply the chapter concept to a new example and explain reasoning.",
                "source": source(chapter, [1, min(4, len(chapter.pages))], "chapter"),
            },
        ]
    )
    for n, prompt in enumerate(review_questions[:4], start=9):
        questions.append(
            {
                "id": f"w{n}",
                "type": "review",
                "prompt": prompt,
                "answerKey": "Answer should match the textbook explanation and use chapter vocabulary accurately.",
                "source": source(chapter, [max(1, len(chapter.pages) - 2)], "review"),
            }
        )
    return {"title": "Core Chapter Worksheet", "questions": questions[:15]}


def scenario_prompt(subject: str, title: str) -> str:
    if subject == "biology":
        return f"Describe a real or imagined biological situation where a concept from {title} matters."
    return f"Describe a real or imagined place where a concept from {title} helps explain what is happening."


def scenario_key(subject: str, title: str) -> str:
    if subject == "biology":
        return f"Answer should identify a concept from {title}, apply it to a biological situation, and explain the outcome."
    return f"Answer should identify a concept from {title}, apply it to a place or region, and explain the geographic pattern."


def make_chapter(chapter: PdfChapter) -> dict[str, Any]:
    objectives = extract_objectives(chapter)
    terms = extract_terms(chapter)
    sections = extract_sections(chapter)
    review_questions = extract_review_questions(chapter)
    concepts = objectives + [f"Use {term} accurately." for term in terms[:8]]
    worksheet = make_worksheet(chapter, terms, objectives, review_questions)
    lesson_blocks = make_lesson_blocks(chapter, sections, terms, objectives)
    glossary = [term_definition(term, chapter.subject) | {"chapter": chapter.chapter, "section": sections[0]["id"], "unit": unit_for(chapter.subject, chapter.chapter), "relatedConcepts": concepts[:3]} for term in terms]
    study_guide = make_study_guide(chapter, sections, terms, objectives)
    return {
        "subject": chapter.subject,
        "chapter": chapter.chapter,
        "unit": unit_for(chapter.subject, chapter.chapter),
        "title": chapter.title,
        "pdf": str(chapter.path.relative_to(ROOT)),
        "pageCount": len(chapter.pages),
        "sourceStatus": "indexed",
        "status": "current" if chapter.chapter == 1 else "locked",
        "validationStatus": "READY" if terms and objectives and lesson_blocks and worksheet["questions"] else "READY_WITH_WARNING",
        "completenessScore": completeness_score(sections, objectives, terms, lesson_blocks, worksheet),
        "bigIdea": big_idea(chapter.subject, chapter.title, objectives),
        "objectives": objectives,
        "sections": sections,
        "concepts": concepts[:18],
        "vocabulary": terms,
        "glossary": glossary,
        "diagrams": detect_visuals(chapter),
        "notes": make_notes(chapter, sections),
        "studyGuide": study_guide,
        "lessonBlocks": lesson_blocks,
        "worksheet": worksheet,
        "knowledgeCheck": make_knowledge_check(chapter, objectives, terms),
        "evidenceChallenge": {
            "title": "End-of-chapter challenge",
            "prompt": evidence_prompt(chapter.subject, chapter.title),
            "source": source(chapter, [1, min(3, len(chapter.pages))], "chapter"),
        },
    }


def unit_for(subject: str, chapter: int) -> str:
    if subject == "biology":
        if chapter == 1:
            return "What is biology?"
        if chapter <= 5:
            return "Ecology"
        if chapter <= 9:
            return "The Life of a Cell"
        if chapter <= 13:
            return "Genetics"
        return "Change Through Time"
    if chapter <= 4:
        return "The World"
    if chapter <= 8:
        return "The United States, Canada, Latin America, Europe, and Russia"
    if chapter <= 14:
        return "Africa, Asia, Australia, Oceania, and Antarctica"
    return "World Regions"


def completeness_score(sections: list, objectives: list, terms: list, lessons: list, worksheet: dict) -> dict[str, Any]:
    checks = {
        "sectionsMapped": bool(sections),
        "objectivesMapped": bool(objectives),
        "vocabularyMapped": bool(terms),
        "lessonsMapped": len(lessons) >= 3,
        "worksheetMapped": len(worksheet.get("questions", [])) >= 8,
        "assessmentMapped": True,
    }
    score = round(sum(1 for value in checks.values() if value) / len(checks) * 100)
    return {"score": score, **checks}


def big_idea(subject: str, title: str, objectives: list[str]) -> str:
    if objectives:
        return objectives[0]
    return f"{title} introduces important {'biology' if subject == 'biology' else 'geography'} concepts Liam will use throughout the course."


def make_study_guide(chapter: PdfChapter, sections: list[dict[str, Any]], terms: list[str], objectives: list[str]) -> dict[str, Any]:
    term_sentences = []
    for term in terms[:8]:
        definition = term_definition(term, chapter.subject)["shortDefinition"]
        term_sentences.append(f"{term}: {definition}")
    section_sentences = [
        f"{section['title']}: know the main explanation and be able to connect it to a chapter example."
        for section in sections[:5]
    ]
    if chapter.subject == "biology":
        understand = [
            f"How evidence from {chapter.title} helps decide whether a biological explanation is reasonable.",
            "How vocabulary connects to real living systems, not just memorized definitions.",
            "Why structure, function, process, and environment often work together in biology.",
        ]
        explain = [
            f"Explain the big idea of {chapter.title} using at least two accurate chapter terms.",
            "Explain one example from the chapter and the evidence that supports it.",
            "Explain how the concept could apply to a new organism, cell, ecosystem, or investigation.",
        ]
    else:
        understand = [
            f"How places and regions in {chapter.title} can be explained with physical geography and human geography together.",
            "How location, environment, movement, and region help explain spatial patterns.",
            "Why a map, place description, climate clue, or population clue can support a geographic explanation.",
        ]
        explain = [
            f"Explain the big idea of {chapter.title} using at least two accurate chapter terms.",
            "Explain how a place or region is shaped by both environment and human decisions.",
            "Explain a map-style pattern by naming where it happens and why it happens there.",
        ]
    return {
        "bigIdeas": [big_idea(chapter.subject, chapter.title, objectives)],
        "importantWords": term_sentences[:12],
        "knowThis": (objectives[:5] or section_sentences[:3]) + term_sentences[:6],
        "understandThis": (objectives[:3] + understand)[:6],
        "explainThis": explain,
        "applyThis": [evidence_prompt(chapter.subject, chapter.title), scenario_prompt(chapter.subject, chapter.title)],
    }


def detect_visuals(chapter: PdfChapter) -> list[str]:
    text = "\n".join(chapter.pages)
    visuals = []
    for match in re.finditer(r"(Figure|Map Study|Diagram Study|Table)\s+([\d.]+)?", text, re.I):
        visuals.append(clean_text(match.group(0)))
    if not visuals:
        visuals.append("Generated concept visual")
    return dedupe(visuals)[:12]


def make_notes(chapter: PdfChapter, sections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    notes = []
    for section in sections[:5]:
        text = section_text(chapter, section["pages"])
        notes.append(
            {
                "heading": section["title"],
                "body": " ".join(summarize(text, chapter.subject, chapter.title, section["title"])[:2]),
                "source": source(chapter, section["pages"], section["id"]),
            }
        )
    return notes


def make_knowledge_check(chapter: PdfChapter, objectives: list[str], terms: list[str]) -> list[dict[str, Any]]:
    checks = []
    content_questions = academic_questions(chapter.subject, chapter.title, terms)
    for i, item in enumerate(content_questions[:7], start=1):
        checks.append(
            {
                "id": f"k{i}",
                "type": "choice",
                "prompt": item["prompt"],
                "choices": item["choices"],
                "correctAnswer": item["correctAnswer"],
                "feedback": item["feedback"],
                "source": source(chapter, [1], "objectives"),
            }
        )
    for term in terms[:5]:
        checks.append(
            {
                "id": f"k-term-{re.sub(r'[^a-z0-9]+', '-', term.lower()).strip('-')}",
                "type": "short",
                "prompt": f"Use {term} correctly in one sentence.",
                "correctAnswer": f"Sentence should use {term} accurately.",
                "feedback": "Check that the sentence explains the term in context.",
                "source": source(chapter, [1], "vocabulary"),
            }
        )
    return checks[:12]


def activity_prompt(subject: str, title: str, terms: list[str]) -> str:
    if subject == "biology":
        return f"Classify a new example using evidence from {title}. Which traits or processes prove your answer?"
    return f"Use a map-style description from {title}. Explain whether the example is about location, region, movement, or human-environment interaction."


def academic_questions(subject: str, title: str, terms: list[str]) -> list[dict[str, Any]]:
    first = terms[0] if terms else ("organism" if subject == "biology" else "location")
    second = terms[1] if len(terms) > 1 else ("homeostasis" if subject == "biology" else "relative location")
    if subject == "biology":
        return [
            {
                "prompt": f"Which answer best explains {first}?",
                "choices": [term_definition(first, subject)["shortDefinition"], "A random label with no biological meaning.", "A map coordinate."],
                "correctAnswer": term_definition(first, subject)["shortDefinition"],
                "feedback": f"Correct. {first} must be explained as a biology idea, not just memorized.",
            },
            {
                "prompt": "Which characteristic of life is shown when an organism reacts to heat, light, or sound?",
                "choices": ["Response to a stimulus", "Longitude", "A formal region"],
                "correctAnswer": "Response to a stimulus",
                "feedback": "Correct. A stimulus causes a response.",
            },
            {
                "prompt": f"Why does {second} matter in this chapter?",
                "choices": [why_term_matters(second, subject), "It is only a spelling word.", "It replaces evidence."],
                "correctAnswer": why_term_matters(second, subject),
                "feedback": "Correct. Vocabulary should help explain a real biological idea.",
            },
        ]
    return [
        {
            "prompt": f"Which answer best explains {first}?",
            "choices": [term_definition(first, subject)["shortDefinition"], "A cell structure.", "An unrelated memorized phrase."],
            "correctAnswer": term_definition(first, subject)["shortDefinition"],
            "feedback": f"Correct. {first} helps explain a place, pattern, or geographic relationship.",
        },
        {
            "prompt": "Which type of location uses latitude and longitude?",
            "choices": ["Absolute location", "Relative location", "Perceptual region"],
            "correctAnswer": "Absolute location",
            "feedback": "Correct. Latitude and longitude identify an exact position.",
        },
        {
            "prompt": f"Why does {second} matter in geography?",
            "choices": [why_term_matters(second, subject), "It is only a spelling word.", "It replaces maps and evidence."],
            "correctAnswer": why_term_matters(second, subject),
            "feedback": "Correct. Geography vocabulary should help explain places and patterns.",
        },
    ]


def discover(subject: str) -> tuple[list[PdfChapter], list[str]]:
    folder = MATERIALS / ("biology" if subject == "biology" else "world-geography")
    chapters = []
    warnings = []
    for path in sorted(folder.glob("*.pdf")):
        if subject == "world-geography" and not re.search(r"chap(?:ter)?[-_\s]*\d+", path.stem, re.I):
            continue
        parsed = extract_pdf(path, subject)
        if parsed:
            chapters.append(parsed)
        else:
            warnings.append(f"Could not classify {path.name}")
    chapters.sort(key=lambda item: item.chapter)
    seen = set()
    unique = []
    for item in chapters:
        if item.chapter in seen:
            warnings.append(f"Duplicate chapter {item.chapter}: {item.path.name}")
            continue
        seen.add(item.chapter)
        unique.append(item)
    if subject == "biology":
        for missing in sorted(set(range(1, max(seen or {0}) + 1)) - seen):
            warnings.append(f"Missing chapter {missing}")
    return unique, warnings


def semester_assets(subject: str, chapters: list[dict[str, Any]]) -> dict[str, Any]:
    midpoint = max(1, len(chapters) // 2)
    semesters = {
        "semester1": chapters[:midpoint],
        "semester2": chapters[midpoint:],
    }
    out = {}
    for key, items in semesters.items():
        labels = [f"Chapter {item['chapter']}: {item['title']}" for item in items]
        out[key] = {
            "review": {
                "title": f"{subject_label(subject)} {key.replace('semester', 'Semester ')} Review",
                "chapters": [item["chapter"] for item in items],
                "focus": labels,
            },
            "practiceFinal": make_final(subject, items, "Practice Final"),
            "final": make_final(subject, items, "Semester Final"),
        }
    return out


def make_final(subject: str, chapters: list[dict[str, Any]], label: str) -> dict[str, Any]:
    questions = []
    for item in chapters:
        questions.append(
            {
                "id": f"{label.lower().replace(' ', '-')}-{item['chapter']}",
                "prompt": f"Explain one major concept from Chapter {item['chapter']}: {item['title']}.",
                "answerKey": "Answer should use chapter vocabulary and explain a major concept accurately.",
            }
        )
    return {"title": f"{subject_label(subject)} {label}", "questions": questions}


def subject_label(subject: str) -> str:
    return "Biology" if subject == "biology" else "World Geography"


def main() -> None:
    subjects = {}
    report = {}
    for subject in ["biology", "geography"]:
        discovered, warnings = discover(subject)
        generated = []
        failures = []
        for chapter in discovered:
            try:
                generated.append(make_chapter(chapter))
            except Exception as exc:
                failures.append(f"Chapter {chapter.chapter}: {exc}")
        subjects[subject] = {
            "label": subject_label(subject),
            "chapters": generated,
            "glossary": sorted(
                [term for chapter in generated for term in chapter["glossary"]],
                key=lambda item: item["term"].lower(),
            ),
            "semesterAssets": semester_assets(subject, generated),
        }
        report[subject] = {
            "chaptersDiscovered": len(discovered),
            "chaptersProcessed": len(generated),
            "chaptersReady": sum(1 for item in generated if item["validationStatus"] == "READY"),
            "warnings": warnings,
            "failures": failures,
        }
    data = {"subjects": subjects, "generationReport": report}
    OUT.write_text(
        "/* Auto-generated by scripts/generate_courses.py. Do not edit by hand. */\n"
        "export const generatedCourseData = "
        + json.dumps(data, indent=2)
        + " as const;\n",
        encoding="utf-8",
    )
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
