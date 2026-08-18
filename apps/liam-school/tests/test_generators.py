import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'materials' / 'liam-learning-app' / 'data' / 'course-data.json'


def test_regenerate_and_no_duplicate_prompts():
    # regenerate course data
    res = subprocess.run(['python3', 'scripts/add_math_course.py'], cwd=ROOT, capture_output=True, text=True)
    assert res.returncode == 0
    assert DATA.exists()
    data = json.loads(DATA.read_text(encoding='utf-8'))
    math = data.get('math', {})
    chapters = math.get('chapters', [])
    all_prompts = set()
    for ch in chapters:
        prompts = [q.get('prompt','') for q in ch.get('worksheet',[])]
        # ensure no exact duplicates within chapter
        assert len(prompts) == len(set(prompts))
        # ensure prompts are not trivial
        for p in prompts:
            assert len(p) > 3
        # ensure cross-chapter near-duplicates are limited (simple check for identical prompts across chapters)
        for p in prompts:
            assert p not in all_prompts
            all_prompts.add(p)
