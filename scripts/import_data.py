#!/usr/bin/env python3
"""Import the user's original Markdown and Word documents. No network required."""
import collections
import hashlib
import json
import re
import subprocess
from pathlib import Path

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
OUT = PROJECT / 'dist'
CN = {'一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9}


def day_number(text):
    value = re.search(r'第(.+?)天', text)[1]
    if '十' not in value:
        return CN[value]
    a, b = value.split('十')
    return CN.get(a, 1) * 10 + CN.get(b, 0)


def clean(text):
    return re.sub(r'\s+', ' ', text.replace('**', '').replace('`', '')).strip()


def norm(text):
    return re.sub(r'[^a-z0-9\u4e00-\u9fff]', '', text.lower())


LABEL = r'题目(?:（[^）]+）)?|页面正确答案|正确答案|页面参考答案|本次填写／参考答案|参考译文|参考答案|页面答案|我的作答|我的答案|我的翻译|我的译文|本次查看时填写|本次填写|本次译文|本次选择|本次查看时点击|本次作答|页面解析|解析|考点|题目备注|复习提醒|复习提示|复习备注|语言提示|掌握标记|掌握情况|句意'
FIELD = re.compile(r'(?:^|\n|　|；)\s*(' + LABEL + r')\s*[：:]\s*')
TOPICS = [
    ('虚拟语气', r'虚拟|would rather|if only|wish|It is (?:high |about )?time'),
    ('非谓语动词', r'非谓语|动名词|不定式|分词'),
    ('定语从句', r'定语从句|关系代词|关系副词'),
    ('名词性从句', r'主语从句|宾语从句|表语从句|同位语从句|名词性从句'),
    ('状语从句', r'状语从句'), ('倒装句', r'倒装'),
    ('时态与语态', r'时态|语态|完成时|过去时|现在时|进行时|将来时'),
    ('词汇与搭配', r'词汇|词组|搭配|辨析|短语|介词|形容词|副词|名词'),
    ('比较结构', r'比较|最高级|倍数'), ('主谓一致', r'主谓一致'),
    ('代词与限定词', r'代词|冠词|限定词'), ('强调句', r'强调句'),
]
DIALOG = r'交际|对话|情景|回应|感谢|赞美|祝贺|祝愿|道歉|邀请|问候|告别|购物|点餐|用餐|询问|问路|电话|安慰|求助|请求|建议用语|提供帮助|征询|表达.*(?:意见|同意|遗憾|偏好|意愿)|礼貌|选择疑问句'


def parse_file(path, day=None):
    text = path.read_text()
    matches = list(re.finditer(r'^#{2,4} 第\s*(\d+)\s*题[^\n]*', text, re.M))
    questions = []
    for i, match in enumerate(matches):
        body = text[match.end():matches[i + 1].start() if i + 1 < len(matches) else len(text)]
        # A section boundary belongs to the next question group, not this answer.
        body = re.split(r'\n#{1,3} ', body)[0].replace('**', '')
        fields = list(FIELD.finditer(body))
        values = {m[1]: body[m.end():fields[j + 1].start() if j + 1 < len(fields) else len(body)].strip() for j, m in enumerate(fields)}
        title_key = next((k for k in values if k.startswith('题目') and k != '题目备注'), None)
        if not title_key:
            raise ValueError(f'Missing stem: {path.name} {match[1]}')
        title_block = values[title_key]
        first_option = re.search(r'(?:^|\n)\s*(?:-\s*)?A[.．、]\s*', title_block)
        options_block = title_block[first_option.start():] if first_option else ''
        opts = list(re.finditer(r'(?:^|\n|[　 ]+)(?:-\s*)?([A-D])[.．、]\s*', options_block))
        stem = clean(title_block[:first_option.start()] if first_option else title_block)
        options = [{'key': m[1], 'text': clean(options_block[m.end():opts[j+1].start() if j+1 < len(opts) else len(options_block)])} for j,m in enumerate(opts)]
        answer = next((values[k] for k in ['页面正确答案', '页面参考答案', '页面答案', '正确答案', '参考答案', '参考译文', '本次填写／参考答案'] if k in values), '')
        answer = clean(answer)
        if options:
            if not re.match(r'^[A-D](?:\b|[.．、。；（])', answer):
                raise ValueError(f'Invalid answer: {path.name} {match[1]} {answer}')
            answer = answer[0]
            if [o['key'] for o in options] != list('ABCD'):
                raise ValueError(f'Invalid options: {path.name} {match[1]} {options}')
        if not answer:
            raise ValueError(f'Missing answer: {path.name} {match[1]}')
        point = clean(values.get('考点', ''))
        explanation = clean(values.get('解析', values.get('页面解析', '')))
        meaning = clean(values.get('句意', ''))
        if meaning:
            explanation += '\n句意：' + meaning
        groups = re.findall(r'^### ([^\n]+)', text[:match.start()], re.M)
        group = re.sub(r'（.*', '', groups[-1]) if groups and day is None else ''
        if not options:
            category = '汉译英' if re.search(r'[\u4e00-\u9fff]', stem[:15]) else '英译汉'
        elif group:
            category = {'词语用法与语法结构': '词汇与语法'}.get(group, group)
        elif re.search('虚拟', point):
            category = '虚拟语气'
        elif re.search(DIALOG, point) or re.search(r'——|对方|回答.*问|礼貌.*应', explanation):
            category = '交际用语'
        else:
            category = '词汇与语法'
        topics = [label for label, pattern in TOPICS if re.search(pattern, point, re.I)]
        if category == '交际用语':
            topics = ['交际用语']
        if category == '虚拟语气' and '虚拟语气' not in topics:
            topics.insert(0, '虚拟语气')
        if not topics:
            topics = ['翻译技巧' if not options else '其他考点']
        notes = [clean(values[k]) for k in ['题目备注', '复习提醒', '复习提示', '复习备注', '语言提示'] if k in values]
        questions.append(dict(stem=stem, options=options, answer=answer, explanation=explanation,
            point=point, category=category, topics=topics, notes=notes,
            sources=[dict(bank='daily' if day else 'essential', day=day, number=int(match[1]), group=group, file=path.name)]))
    assert len(questions) == (30 if day else 394), (path, len(questions))
    return questions


def import_questions():
    raw = parse_file(ROOT / '英语刷题/英语必刷题复习整理.md')
    paths = sorted((ROOT / '英语刷题').glob('英语刷题打卡*.md'), key=lambda p: day_number(p.name))
    assert len(paths) == 30
    for path in paths:
        raw.extend(parse_file(path, day_number(path.name)))
    return merge_questions(raw)


def merge_questions(raw):
    result = {}
    conflicts = []
    aliases = {}
    for q in raw:
        option_texts = [norm(o['text']) for o in q['options']]
        # Keep the original ID of the first occurrence so existing progress survives.
        legacy_key = norm(q['stem']) + '|' + '|'.join(option_texts)
        q['id'] = 'q-' + hashlib.sha256(legacy_key.encode()).hexdigest()[:16]
        key = norm(q['stem']) + '|' + '|'.join(sorted(option_texts))
        if key in result:
            old = result[key]
            available = collections.defaultdict(list)
            for option in old['options']:
                available[norm(option['text'])].append(option['key'])
            option_map = {o['key']: available[norm(o['text'])].pop(0) for o in q['options']}
            if q['id'] != old['id']:
                aliases[q['id']] = {'id': old['id'], 'options': option_map}
            old['sources'].extend(q['sources'])
            old['topics'] = list(dict.fromkeys(old['topics'] + q['topics']))
            old['notes'] = list(dict.fromkeys(old['notes'] + q['notes']))
            if q['options'] and old['answer'] != option_map[q['answer']]:
                note = f"资料答案不一致：{q['sources'][0]['file']} 第 {q['sources'][0]['number']} 题给出的答案为 {q['answer']}（对应当前选项 {option_map[q['answer']]}）。本题保留首个来源答案 {old['answer']}，请结合解析核对。"
                old['notes'].append(note)
                conflicts.append({'id':old['id'], 'note':note})
            elif not q['options'] and norm(old['answer']) != norm(q['answer']):
                old.setdefault('alternativeAnswers', [])
                if q['answer'] not in old['alternativeAnswers']:
                    old['alternativeAnswers'].append(q['answer'])
        else:
            result[key] = q
    return list(result.values()), len(raw), conflicts, aliases


def import_articles():
    articles = []
    for path in sorted((ROOT / '阅读理解128文章').glob('*')):
        if path.suffix not in ['.doc', '.docx']:
            continue
        text = subprocess.check_output(['textutil', '-convert', 'txt', '-stdout', str(path)], text=True)
        lines = text.replace('\u2028', '\n').replace('\u2029', '\n').splitlines()
        book = path.name.split('（')[0]
        unit = 0
        current = None
        sections = []
        for line in lines:
            line = clean(line)
            u = re.search(r'Unit[e]?[\s-]*(\d+)', line, re.I)
            r = re.search(r'Reading[\s-]*(\d+)', line, re.I)
            if u:
                unit = int(u[1])
            if r:
                current = {'unit': unit, 'reading': int(r[1]), 'lines': []}
                sections.append(current)
            elif line and not u and current is not None and not re.fullmatch(r'[-—_\d\s]+',line):
                current['lines'].append(line)
        assert len(sections) == 16, (book, len(sections))
        for section in sections:
            body = section['lines']
            title = body.pop(0)
            zh = ''
            m = re.search(r'[（(]?[\u4e00-\u9fff]', title)
            if m:
                title, zh = title[:m.start()].strip(), title[m.start():].strip('（）() ')
            elif body and len(body[0]) < 75 and re.search(r'[\u4e00-\u9fff]', body[0]) and len(re.findall('[a-zA-Z]', body[0])) < 8:
                zh = body.pop(0)
            # Use the site's general English-study naming for source title labels.
            zh = zh.replace('国开学位英语', '英语').replace('学位英语', '英语')
            paragraphs = []
            for line in body:
                chinese = len(re.findall(r'[\u4e00-\u9fff]', line))
                english = len(re.findall(r'[a-zA-Z]', line))
                paragraphs.append({'lang': 'zh' if chinese > english / 3 else 'en', 'text':line})
            assert paragraphs and any(p['lang']=='en' for p in paragraphs)
            articles.append(dict(id=f"r-{book}-{section['unit']}-{section['reading']}", book=book,
                unit=section['unit'], reading=section['reading'], title=title or zh,
                subtitle=zh, paragraphs=paragraphs, source=path.name,
                words=sum(len(re.findall(r"[a-zA-Z]+(?:'[a-zA-Z]+)?",p['text'])) for p in paragraphs if p['lang']=='en')))
    assert len(articles) == 128
    return articles


def main():
    questions, raw_count, conflicts, aliases = import_questions()
    articles = import_articles()
    stats = dict(rawQuestions=raw_count, uniqueQuestions=len(questions), mergedDuplicates=raw_count-len(questions),
        articles=len(articles), dailyQuestions=900, essentialQuestions=394,
        categories=dict(collections.Counter(q['category'] for q in questions)), answerConflicts=conflicts,
        questionSources=31, readingSources=8)
    data = {'version':1, 'questions':questions, 'articles':articles, 'stats':stats, 'questionAliases':aliases}
    OUT.mkdir(exist_ok=True)
    # Classic script also works via file:// without a local server or fetch permissions.
    (OUT/'data.js').write_text('window.STUDY_DATA = ' + json.dumps(data,ensure_ascii=False,separators=(',',':')) + ';\n')
    (PROJECT/'data-report.json').write_text(json.dumps(stats,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(stats,ensure_ascii=False,indent=2))


if __name__ == '__main__':
    main()
