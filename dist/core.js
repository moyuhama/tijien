(function (root) {
  'use strict';
  const emptyProgress = () => ({ version: 1, questions: {}, days: {}, history: [], articles: {}, beginner: { lessons: {}, review: {} }, session: null });
  function normalizeSearch(value) {
    return String(value || '').normalize('NFKC').toLowerCase()
      .replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
  }
  function filterArticles(articles, { book = '', query = '' } = {}) {
    const terms = normalizeSearch(query).split(' ').filter(Boolean);
    return articles.filter(article => {
      if (book && article.book !== book) return false;
      const text = normalizeSearch([article.title, article.subtitle, article.book,
        ...article.paragraphs.map(p => p.text)].join(' '));
      return terms.every(term => text.includes(term));
    });
  }
  function articleExcerpt(article, query) {
    const terms = normalizeSearch(query).split(' ').filter(Boolean);
    if (!terms.length) return '';
    // Prefer a paragraph containing every term, then one containing any term.
    const candidates = article.paragraphs.map(p => {
      const text = p.text.normalize('NFKC').replace(/\s+/g, ' ').trim();
      const normalized = normalizeSearch(text);
      const positions = terms.map(term => normalized.indexOf(term)).filter(i => i >= 0);
      return { text, positions };
    }).filter(p => p.positions.length).sort((a,b) => b.positions.length-a.positions.length);
    if (!candidates.length) return '';
    const { text, positions } = candidates[0];
    const firstMatch = Math.min(...positions);
    let start = Math.max(0, firstMatch-35);
    if (start && /[a-z]/i.test(text[start-1]) && /[a-z]/i.test(text[start])) {
      const nextSpace = text.indexOf(' ',start);
      if (nextSpace>=0 && nextSpace<firstMatch) start = nextSpace+1;
    }
    const end = Math.min(text.length, start+180);
    return (start ? '…' : '') + text.slice(start,end) + (end<text.length ? '…' : '');
  }
  function filterQuestions(questions, filters, progress) {
    return questions.filter(q => {
      const p = progress.questions[q.id] || {};
      const sources = q.sources.filter(s => (!filters.bank || s.bank === filters.bank) && (!filters.day || s.day === Number(filters.day)));
      if (!sources.length) return false;
      if (filters.categories?.length && !filters.categories.includes(q.category)) return false;
      if (filters.topic && !q.topics.includes(filters.topic)) return false;
      if (filters.status === 'new' && p.attempts) return false;
      if (filters.status === 'wrong' && p.lastResult !== false) return false;
      if (filters.status === 'starred' && !p.starred) return false;
      if (filters.status === 'mastered' && !p.mastered) return false;
      if (filters.query) {
        const value = [q.stem, q.point, q.category, ...q.options.map(o => o.text)].join(' ').toLowerCase();
        if (!value.includes(filters.query.trim().toLowerCase())) return false;
      }
      return true;
    });
  }
  function shuffle(items, random = Math.random) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
  function dateKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }
  function recordAnswer(progress, id, correct, { assisted = false } = {}) {
    const p = progress.questions[id] ||= {};
    p.attempts = (p.attempts || 0) + 1;
    p.correct = (p.correct || 0) + (correct ? 1 : 0);
    // A hinted success counts as practice but cannot erase an independent mistake.
    if (!assisted || !correct) {
      p.lastResult = correct;
      p.mastered = correct;
    } else {
      p.lastResult ??= null;
      p.mastered ??= false;
    }
    p.updatedAt = new Date().toISOString();
    const day = progress.days[dateKey()] ||= { attempts: 0, correct: 0 };
    day.attempts++;
    day.correct += correct ? 1 : 0;
  }
  function cleanQuestionProgress(q) {
    const attempts = Number.isSafeInteger(q.attempts) && q.attempts >= 0 ? q.attempts : 0;
    return {
      attempts,
      correct: Number.isSafeInteger(q.correct) && q.correct >= 0 ? Math.min(q.correct, attempts) : 0,
      lastResult: typeof q.lastResult === 'boolean' ? q.lastResult : null,
      mastered: q.mastered === true, starred: q.starred === true,
      updatedAt: typeof q.updatedAt === 'string' ? q.updatedAt : ''
    };
  }
  function migrateQuestionIds(value, aliases = {}) {
    if (!value || typeof value !== 'object') return value;
    const migrated = JSON.parse(JSON.stringify(value));
    for (const [oldId, alias] of Object.entries(aliases)) {
      const old = migrated.questions?.[oldId];
      if (!old || typeof old !== 'object') continue;
      const a = cleanQuestionProgress(migrated.questions[alias.id] || {});
      const b = cleanQuestionProgress(old);
      const latest = (Date.parse(b.updatedAt) || 0) > (Date.parse(a.updatedAt) || 0) ? b : a;
      const result = typeof latest.lastResult === 'boolean' ? latest : latest === a ? b : a;
      migrated.questions[alias.id] = {
        attempts: a.attempts + b.attempts, correct: a.correct + b.correct,
        lastResult: result.lastResult, mastered: result.mastered,
        starred: a.starred || b.starred, updatedAt: latest.updatedAt
      };
      delete migrated.questions[oldId];
    }
    const s = migrated.session;
    if (s && Array.isArray(s.ids) && s.ids.some(id => Object.hasOwn(aliases,id)) && s.answers && typeof s.answers === 'object') {
      const canonical = id => Object.hasOwn(aliases,id) ? aliases[id].id : id;
      const currentId = s.ids[s.index];
      const answers = {};
      const rank = a => a?.graded ? 2 : a?.selected || a?.draft || a?.revealed ? 1 : 0;
      for (const id of s.ids) {
        const target = canonical(id), answer = s.answers[id];
        if (!answer || typeof answer !== 'object') continue;
        const mapped = { ...answer };
        if (Object.hasOwn(aliases,id) && mapped.selected) mapped.selected = aliases[id].options[mapped.selected] || mapped.selected;
        // Keep an already graded attempt; otherwise retain the current answer on a tie.
        if (!answers[target] || rank(mapped) > rank(answers[target]) || rank(mapped) === rank(answers[target]) && id === currentId) answers[target] = mapped;
      }
      s.ids = [...new Set(s.ids.map(canonical))];
      s.index = s.ids.indexOf(canonical(currentId));
      s.answers = answers;
    }
    return migrated;
  }
  function validProgress(value, questions, articles) {
    if (!value || value.version !== 1 || typeof value.questions !== 'object' || !value.questions || typeof value.days !== 'object' || !value.days || !Array.isArray(value.history)) throw Error('备份文件格式不正确');
    const ids = new Set(questions.map(q => q.id));
    const clean = emptyProgress();
    for (const [id, q] of Object.entries(value.questions)) {
      if (!ids.has(id) || !q || typeof q !== 'object') continue;
      clean.questions[id] = cleanQuestionProgress(q);
    }
    for (const [date, day] of Object.entries(value.days)) {
      if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isSafeInteger(day?.attempts) && day.attempts >= 0 && Number.isSafeInteger(day.correct) && day.correct >= 0 && day.correct <= day.attempts) clean.days[date] = { attempts: day.attempts, correct: day.correct };
    }
    const articleIds = new Set(articles.map(a => a.id));
    for (const [id, read] of Object.entries(value.articles || {})) if (articleIds.has(id) && read === true) clean.articles[id] = true;
    clean.history = value.history.filter(h => h && typeof h.id === 'string' && ['practice','memory','exam','beginner'].includes(h.mode) && Number.isInteger(h.total) && h.total >= 0 && Number.isInteger(h.correct) && h.correct >= 0 && h.correct <= h.total && typeof h.finishedAt === 'string' && !Number.isNaN(Date.parse(h.finishedAt))).slice(0,100).map(h => ({
      id: h.id, mode: h.mode, total: h.total, correct: h.correct,
      ...(h.mode === 'beginner' ? { stage: root.StudyBeginner?.stages[h.stage] ? h.stage : 'mixed' } : {}),
      wrong: Number.isInteger(h.wrong) && h.wrong >= 0 ? Math.min(h.wrong,h.total) : 0,
      pending: Number.isInteger(h.pending) && h.pending >= 0 ? Math.min(h.pending,h.total) : 0,
      skipped: Number.isInteger(h.skipped) && h.skipped >= 0 ? Math.min(h.skipped,h.total) : 0,
      finishedAt: h.finishedAt, startedAt: typeof h.startedAt === 'string' ? h.startedAt : h.finishedAt
    }));
    if (root.StudyBeginner) clean.beginner = root.StudyBeginner.validState(value.beginner);
    return clean;
  }
  const api = { emptyProgress, filterQuestions, filterArticles, articleExcerpt, shuffle, recordAnswer, dateKey, migrateQuestionIds, validProgress };
  if (typeof module !== 'undefined') module.exports = api;
  root.StudyCore = api;
})(typeof window === 'undefined' ? globalThis : window);
