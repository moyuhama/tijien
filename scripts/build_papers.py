"""Build the offline-compatible paper data script from reviewed source data."""
from pathlib import Path
import json

root = Path(__file__).resolve().parents[1]
data = json.loads((root / 'content/papers.json').read_text())
(root / 'dist/papers-data.js').write_text('window.STUDY_PAPERS = ' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n')
print(f'Built {len(data["papers"])} papers / {sum(len(p["questions"]) for p in data["papers"])} questions')
