(() => {
  'use strict';
  const { questions, articles, stats, questionAliases = {} } = window.STUDY_DATA;
  const C = window.StudyCore;
  const B = window.StudyBeginner;
  const KEY = 'shiti-study-room-v1';
  const byId = Object.fromEntries(questions.map(q => [q.id, q]));
  const articleById = Object.fromEntries(articles.map(a => [a.id, a]));
  const categories = ['交际用语', '词汇与语法', '虚拟语气', '汉译英', '英译汉'];
  const modeNames = { practice: '分类练习', memory: '背题模式', exam: '随机测验', beginner: '小白带练' };
  const paths = {
    book:'M3 4h6a4 4 0 0 1 3 1 4 4 0 0 1 3-1h6v16h-6a4 4 0 0 0-3 1 4 4 0 0 0-3-1H3zM12 5v16',
    grid:'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
    wrong:'M12 8v5M12 17h.01M10 3 2 18a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 3a2 2 0 0 0-4 0z',
    star:'m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9z',
    chart:'M4 3v18h17M8 16v-5M13 16V7M18 16V4',
    arrow:'M4 12h15m-6-6 6 6-6 6',
    back:'M20 12H5m6-6-6 6 6 6',
    check:'m5 12 4 4L19 6',
    close:'m6 6 12 12M6 18 18 6',
    shuffle:'m3 5 4 0 10 14h4m-4-4 4 4-4 3M3 19h4l3-4M14 9l3-4h4m-4-3 4 3-4 4',
    layers:'m12 3 10 5-10 5L2 8zM2 12l10 5 10-5M2 17l10 5 10-5',
    search:'M10.5 18a7.5 7.5 0 1 0 0-15 7.5 7.5 0 0 0 0 15zm5.5-2 5 5',
    message:'M21 11a9 9 0 0 1-9 9H6l-4 2 1-6a9 9 0 1 1 18-5zM7 10h10M7 14h6',
    type:'M4 4h16M12 4v16M8 20h8M4 4v4M20 4v4',
    leaf:'M20 3c-9-1-17 5-16 12 1 8 17 6 16-12zM4 21l11-12',
    translate:'M3 4h11M8 2v2M5 4c0 6 6 10 9 11M12 4c0 6-6 10-10 12M13 21l4-11 4 11M15 17h4',
    target:'M12 3a9 9 0 1 0 9 9M12 7a5 5 0 1 0 5 5M12 12l9-9M17 3h4v4',
    download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
    upload:'M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5',
    clock:'M12 8v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18',
    lock:'M6 10h12v11H6zM8 10V6a4 4 0 0 1 8 0v4',
  };
  const icon = (name) => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.book}"/></svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  let progress = C.emptyProgress(), storageError = '';
  try {
    const saved = C.migrateQuestionIds(JSON.parse(localStorage.getItem(KEY) || 'null'), questionAliases);
    if (saved) {
      progress = C.validProgress(saved, questions, articles);
      const s = saved.session;
      if (s && ['practice','memory','exam','beginner'].includes(s.mode) && Array.isArray(s.ids) && s.ids.length && s.ids.every(id => byId[id]) && new Set(s.ids).size === s.ids.length && Number.isInteger(s.index) && s.index >= 0 && s.index < s.ids.length && s.answers && typeof s.answers === 'object' && (s.mode !== 'beginner' || B.validSession(s))) progress.session = s;
    }
  } catch { storageError = '浏览器未能读取进度。可在“学习记录”中导入备份，或使用普通浏览窗口重试。'; }
  let view = 'home', mode = 'practice', order = 'sequence', count = '20', collectionPage = 1, articlePage = 1;
  let filters = { categories: [], bank: '', day: '', topic: '', status: '', query: '' };
  let collectionQuery = '', articleQuery = '', bookFilter = '', currentArticle = null, showChinese = true;
  let toastTimer, dialogCallback = null, lessonId = B.lessons[0].id;
  const el = document.getElementById('app');
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(progress)); }
    catch { storageError = '进度未能写入浏览器，请导出备份，避免关闭页面后丢失。'; toast(storageError); }
  }
  function toast(message) {
    const t = document.getElementById('toast');
    t.textContent = message; t.classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('visible'), 3500);
  }
  const questionProgress = q => progress.questions[q.id] || {};
  const collection = status => C.filterQuestions(questions, { status }, progress);
  const matching = () => C.filterQuestions(questions, filters, progress);
  const percent = (n,d) => d ? Math.round(n / d * 100) + '%' : '—';
  const fmtDate = value => new Date(value).toLocaleDateString('zh-CN', { month:'2-digit', day:'2-digit' });
  function navButton(id, label, glyph, countValue) {
    const active = id === view || id === 'home' && ['session','results','beginner','lesson'].includes(view) || id === 'reading' && view === 'reader';
    return `<button class="nav-btn ${active ? 'active' : ''}" data-action="nav" data-view="${id}" ${active ? 'aria-current="page"' : ''}>${icon(glyph)}<span>${label}</span>${countValue !== undefined ? `<span class="nav-count">${countValue}</span>`:''}</button>`;
  }
  function shell(content) {
    const name = {home:'练习中心',beginner:'小白带练',lesson:'口诀与例题',session:'正在练习',results:'练习回顾',wrong:'错题本',starred:'我的收藏',reading:'双语阅读',reader:'双语阅读',history:'学习记录'}[view];
    return `<div class="app-shell"><aside class="sidebar"><div class="brand"><div class="brand-mark">${icon('book')}</div><div><div class="brand-name">拾题</div><div class="brand-sub">STUDY ROOM</div></div></div><div class="nav-label">我的自习室</div><nav class="nav" aria-label="主导航">${navButton('home','练习中心','grid')}${navButton('wrong','错题本','wrong',collection('wrong').length)}${navButton('starred','我的收藏','star',collection('starred').length)}${navButton('reading','双语阅读','book',128)}${navButton('history','学习记录','chart')}</nav><div class="side-note">${icon('leaf')}<p>不必一次学会所有。</p><p>每天一点，就很好。</p></div><div class="side-footer"><span class="dot"></span>英语自习室 · 专注当下</div></aside><main class="main"><header class="topbar"><div class="breadcrumb"><span>英语</span><span>/</span><strong>${name}</strong></div><div class="top-actions"><span>Keep a little progress, every day.</span><div class="profile" aria-label="我的自习室">S</div></div></header><div class="workspace">${storageError?`<div class="question-note" role="alert">${esc(storageError)}</div>`:''}${content}</div></main></div>`;
  }
  function render() {
    const renderers = {home:home,beginner:beginnerHub,lesson:lessonView,session:sessionView,results:resultsView,wrong:collectionView,starred:collectionView,reading:readingView,reader:readerView,history:historyView};
    el.innerHTML = shell(renderers[view]());
  }
  function navigate(to) { view = to; collectionPage = 1; render(); window.scrollTo(0,0); }
  function heading(kicker,title,description,action='') {
    return `<div class="page-heading"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p class="heading-description">${description}</p></div>${action}</div>`;
  }
  const selectOptions = (values, selected, first) => `<option value="">${first}</option>` + values.map(v => `<option value="${esc(typeof v==='object'?v.value:v)}" ${String(typeof v==='object'?v.value:v)===String(selected)?'selected':''}>${esc(typeof v==='object'?v.label:v)}</option>`).join('');
  function home() {
    const today = progress.days[C.dateKey()] || {attempts:0,correct:0};
    const mastered = collection('mastered').length;
    const date = new Date().toLocaleDateString('zh-CN',{month:'long',day:'numeric',weekday:'long'});
    const selected = matching().length;
    const topicValues = [...new Set(questions.flatMap(q=>q.topics))].sort((a,b)=>a.localeCompare(b,'zh-CN'));
    const resume = progress.session;
    const categoryInfo = [['交际用语','message','从容应对每一次对话'],['词汇与语法','type','把基础一点点夯实'],['虚拟语气','leaf','理清假设与愿望'],['汉译英','translate','把想法写成英文'],['英译汉','book','读懂句子里的意思']];
    return heading('A LITTLE BETTER, EVERY DAY','今天，学一点英语。','从一个考点开始，让每一次练习都有收获。',`<span class="date-tag">${date}</span>`) +
      `<section class="hero"><div class="hero-quote"><div><div class="eyebrow" style="color:#8a967b">YOUR DAILY PRACTICE</div><h2>把不会的，慢慢变成会的。</h2><p>选你想练的题，也留一点时间，温习学过的。</p></div><div class="book-art" aria-hidden="true"></div></div><div class="hero-stats"><div class="hero-stat"><strong>${today.attempts}</strong><span>今日练习</span></div><div class="hero-stat"><strong>${mastered}</strong><span>已掌握题目</span></div><div class="hero-stat"><strong>${stats.uniqueQuestions}</strong><span>题库总量</span></div></div></section>` +
      (resume ? `<div class="resume"><div>${icon('clock')} <strong>${progress.session.finished ? (summary(progress.session).pending ? '还有翻译题等待自评' : '上一次练习已经完成') : '还有一组练习等你继续'}</strong> <span class="muted">· ${sessionLabel(progress.session)} · ${Object.values(progress.session.answers).filter(a=>a.graded||a.selected||a.draft).length} / ${progress.session.ids.length} 题</span></div><button data-action="resume">${progress.session.finished ? '查看回顾' : '继续练习'} →</button></div>`:'') +
      beginnerEntry() +
      `<div class="section-title"><div class="label"><h2>按你的节奏练习</h2><span>PRACTICE YOUR WAY</span></div><span class="tiny muted">选择范围，自由组合</span></div><section class="practice-card"><div class="mode-tabs" role="tablist" aria-label="练习模式">${Object.entries(modeNames).filter(([id])=>id!=='beginner').map(([id,label])=>`<button class="mode-tab ${mode===id?'active':''}" role="tab" aria-selected="${mode===id}" data-action="mode" data-mode="${id}">${icon(id==='practice'?'grid':id==='memory'?'layers':'shuffle')}${label}</button>`).join('')}</div><div class="filter-content"><div class="filter-row"><div class="filter-label">练习分类</div><div class="chips"><button class="chip ${!filters.categories.length?'active':''}" aria-pressed="${!filters.categories.length}" data-action="category" data-category="">全部题目<span>${stats.uniqueQuestions}</span></button>${categories.map(c=>`<button class="chip ${filters.categories.includes(c)?'active':''}" aria-pressed="${filters.categories.includes(c)}" data-action="category" data-category="${c}">${c}<span>${stats.categories[c]}</span></button>`).join('')}</div></div><div class="filters-grid"><div class="field"><label for="bank">题目来源</label><select id="bank" data-filter="bank">${selectOptions([{value:'essential',label:'必刷题 · 394 条'},{value:'daily',label:'30 天打卡 · 900 条'}],filters.bank,'全部来源 · 自动合并重复题')}</select></div><div class="field"><label for="day">打卡天数</label><select id="day" data-filter="day" ${filters.bank==='essential'?'disabled':''}>${selectOptions(Array.from({length:30},(_,i)=>({value:i+1,label:`第 ${i+1} 天`})),filters.day,'全部天数')}</select></div><div class="field"><label for="topic">具体考点</label><select id="topic" data-filter="topic">${selectOptions(topicValues,filters.topic,'全部考点')}</select></div><div class="field"><label for="status">学习状态</label><select id="status" data-filter="status">${selectOptions([{value:'new',label:'只刷未做过的'},{value:'wrong',label:'只刷错题'},{value:'starred',label:'只刷收藏'},{value:'mastered',label:'温习已掌握'}],filters.status,'全部状态')}</select></div></div><div class="search-row"><div class="searchbox">${icon('search')}<input type="search" id="question-search" placeholder="搜题目、单词或考点，例如：定语从句" aria-label="搜索题目和考点" value="${esc(filters.query)}"></div><button class="link-button" data-action="reset-filters">重置筛选</button></div><p class="mode-tip">${mode==='practice'?'每题确认后查看解析，答错的题会自动进入错题本。':mode==='memory'?'先回想答案，再翻开核对；用“已掌握 / 还需复习”记录记忆情况。':'随机抽取题目，同一组不重复。交卷后统一看答案，翻译题需自行评价。'}</p></div><div class="start-row"><div class="match-info"><span>本次范围共 <strong id="match-count">${selected}</strong> 道题</span>${mode!=='exam'?`<div class="mode-order"><label><input type="radio" name="order" value="sequence" ${order==='sequence'?'checked':''}>顺序</label><label><input type="radio" name="order" value="random" ${order==='random'?'checked':''}>随机</label></div>`:''}</div><div class="start-controls"><select class="count-select" id="count" aria-label="每组题量">${['10','20','30','50','all'].map(n=>`<option value="${n}" ${count===n?'selected':''}>${n==='all'?'全部题目':n+' 题 / 组'}</option>`).join('')}</select><button class="btn btn-primary" id="start-btn" data-action="start" ${!selected?'disabled':''}>${mode==='memory'?'开始背题':mode==='exam'?'开始随机测验':'开始练习'} ${icon('arrow')}</button></div></div></section><div class="section-title"><div class="label"><h2>从一个专项开始</h2><span>ONE STEP AT A TIME</span></div></div><div class="category-grid">${categoryInfo.map(([c,g,d])=>`<button class="category-card" data-action="quick-category" data-category="${c}"><div class="category-icon">${icon(g)}</div><h3>${c}</h3><div class="description">${d}</div><div class="card-line"><span>${stats.categories[c]} 道题</span>${icon('arrow')}</div></button>`).join('')}</div><div class="reading-banner">${icon('book')}<div><h3>换个节奏，读一篇英语。</h3><p>128 篇中英对照 · 人文 / 商务 / 理工 / 管理</p></div><button class="btn" data-action="nav" data-view="reading">去阅读 ${icon('arrow')}</button></div><div class="footer-note">${icon('lock')}进度保存在当前浏览器 · 无需登录 · 可在学习记录中导出备份</div>`;
  }
  function updateMatch() {
    document.getElementById('match-count').textContent = matching().length;
    document.getElementById('start-btn').disabled = !matching().length;
  }
  function sessionLabel(s) {
    return s.mode==='beginner' ? `小白带练 · ${B.stages[s.stage] || '练习'}` : modeNames[s.mode];
  }
  function beginnerEntry() {
    const due=B.dueIds(progress).length;
    return `<section class="beginner-entry"><div class="beginner-mark">${icon('leaf')}</div><div><span class="eyebrow">START SMALL</span><h2>刚开始学？先跟着练。</h2><p>一句口诀，一个例题。从看懂线索，到自己选出答案。</p></div><div class="beginner-entry-actions">${due?`<span class="beginner-due">今天有 ${due} 道错题待复习</span>`:''}<button class="btn btn-primary" data-action="nav" data-view="beginner">进入小白带练 ${icon('arrow')}</button></div></section>`;
  }
  function beginnerHub() {
    const due=B.dueIds(progress), learned=B.learnedIds(progress);
    const finished=B.lessons.filter(l=>progress.beginner.lessons[l.id]?.solo).length;
    const pending=Object.keys(progress.beginner.review).length-due.length;
    return heading('ONE RULE AT A TIME','先会一种，再学下一种。','7 个入门小课 · 65 道精选原题 · 建议按顺序开始。',`<button class="btn btn-secondary" data-action="nav" data-view="home">返回练习中心</button>`).replace('page-heading','page-heading beginner-heading')+
      `<div class="beginner-path"><span><b>01</b>口诀 + 例题</span><i>→</i><span><b>02</b>带提示练</span><i>→</i><span><b>03</b>独立做</span><i>→</i><span><b>04</b>隔天复习</span></div>
      <div class="beginner-tools"><div><strong>已独立练过 ${finished} / ${B.lessons.length} 课</strong><p>先找线索，再说理由，最后选答案。口诀只在注明的条件下使用。</p></div><button class="btn btn-secondary" data-action="beginner-mixed" ${learned.length?'':'disabled'}>${icon('shuffle')}混合练已学考点</button></div>
      <section class="beginner-review"><div>${icon('clock')}<div><h3>${due.length?`今天复习 ${due.length} 道错题`:'今天还没有到期错题'}</h3><p>${pending?`另有 ${pending} 道错题安排在明天或之后。`: '带练中答错的题，会在次日进入这里。'} 到期后独立答对，才会移出复习清单。</p></div></div><button class="btn btn-soft" data-action="beginner-review" ${due.length?'':'disabled'}>开始复习${due.length>10?'（先练 10 题）':''}</button></section>
      <div class="beginner-grid">${B.lessons.map((l,i)=>{const state=progress.beginner.lessons[l.id]||{};return `<article class="beginner-card"><div class="card-line"><span class="beginner-number">${String(i+1).padStart(2,'0')}</span><span class="tiny muted">${l.category} · 约 ${l.minutes} 分钟</span></div><h2>${esc(l.title)}</h2><p class="beginner-mnemonic">${esc(l.mnemonic)}</p><div class="card-line"><span class="tiny muted">${state.solo?'✓ 已独立练过':state.guided?'已完成带提示练':'1 道例题 + '+(l.items.length-1)+' 道练习题'}</span><button class="btn btn-secondary" data-action="lesson" data-id="${l.id}">${state.solo?'再学一遍':'看口诀与例题'} ${icon('arrow')}</button></div></article>`;}).join('')}</div><p class="data-caption">这些口诀与分步讲解是新增的学习辅助；原题、参考答案和原资料解析均保留。先覆盖这 7 个明确的考点，其他题仍可在分类练习中学习。</p>`;
  }
  function guideSteps(q) {
    const guide=B.guideById[q.id], l=B.lessonById[guide.lessonId];
    return `<ol class="beginner-steps"><li><span>先找线索</span><p>${esc(guide.clue)}</p></li><li><span>套用规则</span><p>${esc(l.rule)}</p></li><li><span>排除干扰</span><p>${esc(guide.reason)}</p></li></ol>`;
  }
  function lessonView() {
    const l=B.lessonById[lessonId], example=byId[l.items[0].id];
    const sizes=B.batch(l,items=>items);
    return `<div class="beginner-lesson"><button class="back-button" data-action="nav" data-view="beginner">${icon('back')}返回小白带练</button>`+
      heading(`${l.category} · 第 ${B.lessons.indexOf(l)+1} 课`,esc(l.title),'先把这一条用明白，不必一次记住所有语法。')+
      `<section class="beginner-rule"><span class="eyebrow">先记一句</span><h2>${esc(l.mnemonic)}</h2><p>${esc(l.rule)}</p><div class="beginner-boundary"><strong>别套错地方</strong><p>${esc(l.pitfall)}</p></div></section>
      <section class="question-card beginner-example"><div class="question-meta"><span class="badge">先看例题</span><span>例题不计入做题成绩</span></div><div class="stem">${esc(example.stem)}</div><p class="beginner-meaning">句意：${esc(l.exampleMeaning)}</p><div class="beginner-example-answer">答案：${esc(answerText(example))}</div>${guideSteps(example)}<details class="beginner-original"><summary>展开原资料解析与来源</summary><p>${esc(example.explanation)}</p>${sources(example)}</details></section>
      <div class="beginner-start"><div><h3>换一道同类题，试试看。</h3><p>先带提示练 ${sizes.guided.length} 题，再独立做 ${sizes.solo.length} 道不同的题。${l.items.length<7?'这个考点题量较少，按实际数量练习。':''}</p></div><button class="btn btn-primary" data-action="beginner-start" data-id="${l.id}">开始带提示练 ${icon('arrow')}</button></div></div>`;
  }
  function beginnerHint(q) {
    const guide=B.guideById[q.id], l=B.lessonById[guide.lessonId];
    return `<aside class="beginner-hint"><strong>${icon('leaf')}先看这里</strong><p>${esc(guide.clue)}</p><div>口诀：${esc(l.mnemonic)}</div></aside>`;
  }
  function beginnerAnswer(q,a,s) {
    const l=B.lessonById[B.guideById[q.id].lessonId];
    return `<div class="answer-panel beginner-answer" role="status"><h3>${a.correct?(s.stage==='guided'?'✓ 带提示答对，下一步试着自己判断':'✓ 这次独立答对了'):'先看错在哪，再练一次就好'}</h3><div class="answer">${esc(answerText(q))}</div>${guideSteps(q)}<div class="beginner-boundary"><strong>容易混淆</strong><p>${esc(l.pitfall)}</p></div><details class="beginner-original"><summary>展开原资料详细解析</summary><p>${esc(q.explanation)}</p><div class="point">考点 · ${esc(q.point)}</div></details></div>${notes(q)}`;
  }
  function beginnerNext(s,r) {
    if(r.skipped)return `<section class="beginner-start"><div><h3>这一组还有 ${r.skipped} 道没完成。</h3><p>本次没有记为完成这一阶段。重新完整练一组，再继续下一步。</p></div><button class="btn btn-primary" data-action="beginner-retry">重新练这一组</button></section>`;
    const l=B.lessonById[s.lessonId];
    const next=B.lessons[B.lessons.indexOf(l)+1];
    return `<section class="beginner-start"><div><h3>${s.stage==='guided'?'现在，收起提示自己做。':'这一组已经练完，继续巩固。'}</h3><p>${s.stage==='guided'?`再换 ${s.soloIds.length} 道同类题，确认后才展示分步讲解。`:'可以再练本组错题，或把练过的考点混在一起判断。'} 答错的题已安排次日复习；当天重做答对也会保留这次复习。</p></div><div class="beginner-next-actions">${s.stage==='guided'?`<button class="btn btn-primary" data-action="beginner-solo">开始独立做 ${icon('arrow')}</button>`:`<button class="btn btn-primary" data-action="nav" data-view="beginner">回到小课目录</button>${s.stage==='solo' && next?`<button class="btn btn-secondary" data-action="lesson" data-id="${next.id}">下一课</button>`:''}`}</div></section>`;
  }
  function newSession(ids, sessionMode = mode, extra = {}) {
    if (!ids.length) return toast('当前范围没有题目，请调整筛选条件。');
    const perform = () => {
      progress.session = { id: 's-' + Date.now(), mode:sessionMode, ids, index:0, answers:{}, startedAt:new Date().toISOString(), finished:false, ...extra };
      save(); navigate('session');
    };
    if (progress.session && !progress.session.finished) return dialog('开始一组新的练习？','未完成的练习位置会被替换，已作答记录和错题仍会保留。','开始新练习',perform);
    perform();
  }
  function start() {
    let pool = matching();
    if (filters.day) pool = [...pool].sort((a,b)=>a.sources.find(s=>s.day===+filters.day).number-b.sources.find(s=>s.day===+filters.day).number);
    if (mode==='exam' || order==='random') pool = C.shuffle(pool);
    const n = count === 'all' ? pool.length : Math.min(+count,pool.length);
    newSession(pool.slice(0,n).map(q=>q.id));
  }
  function favoriteButton(q) {
    const starred = questionProgress(q).starred;
    return `<button class="favorite ${starred?'active':''}" aria-pressed="${!!starred}" data-action="favorite" data-id="${q.id}">${icon('star')}${starred?'已收藏':'收藏'}</button>`;
  }
  function answerText(q) { return q.options.length ? q.answer + '. ' + q.options.find(o=>o.key===q.answer).text : q.answer; }
  function sources(q) {
    return `<div class="source-note"><details><summary>题目来源 · ${q.sources.length} 处记录</summary>${q.sources.map(s=>`<div>${esc(s.file)} · ${s.group?esc(s.group)+' · ':''}第 ${s.number} 题</div>`).join('')}</details></div>`;
  }
  function notes(q) { return q.notes.length ? `<div class="question-note"><strong>原资料备注</strong><br>${q.notes.map(esc).join('<br>')}</div>` : ''; }
  function answerPanel(q, answer, showSelfGrade) {
    return `<div class="answer-panel"><h3>${answer.graded ? answer.correct?'✓ 已答对 / 已掌握':'还需复习，再记一遍' : '参考答案'}</h3><div class="answer">${esc(answerText(q))}</div><p>${esc(q.explanation)}</p>${q.alternativeAnswers?.length ? `<details class="small muted"><summary>其他来源的参考译文</summary>${q.alternativeAnswers.map(a=>`<p>${esc(a)}</p>`).join('')}</details>`:''}<div class="point">考点 · ${esc(q.point)}</div>${showSelfGrade?`<div class="self-grade"><p>对照参考答案与解析，给这次回想做个标记。</p><button class="btn btn-warm" data-action="grade" data-correct="false">还需复习</button><button class="btn btn-soft" data-action="grade" data-correct="true">${icon('check')}已掌握</button></div>`:''}</div>${notes(q)}`;
  }
  function sessionView() {
    const s = progress.session;
    if (!s) return empty('还没有开始练习','选择想练的题目，开始第一组练习。');
    const q = byId[s.ids[s.index]], a = s.answers[q.id] || {}, isExam = s.mode==='exam', isMemory = s.mode==='memory';
    const isBeginner = s.mode==='beginner';
    const revealed = !isExam && (a.revealed || a.graded);
    const answered = Object.values(s.answers).filter(a=>a.graded || (isExam && (a.selected || a.draft?.trim()))).length;
    return `<div class="progress-header"><button class="back-button" data-action="nav" data-view="home">${icon('back')}返回自习室，保留进度</button><div class="session-toolbar"><span class="small muted">${sessionLabel(s)}</span><button class="btn btn-secondary" data-action="finish">${isExam?'交卷':'结束练习'}</button></div></div><h1 class="session-title">${isBeginner ? (s.stage==='guided'?'跟着线索，试着选一次。':'收起提示，自己判断一次。') : isExam?'保持专注，相信你的积累。':isMemory?'慢慢回想，答案就在记忆里。':'认真做好眼前这一题。'}</h1><p class="heading-description">${isBeginner ? (s.stage==='guided'?'先读线索，再选答案。带提示答对记为练习，不直接标记已掌握。':'提交前隐藏口诀和考点提示；确认后仍可看分步讲解。') : isExam?'交卷后查看答案与解析。':'进度实时保存，随时可以回来继续。'}</p><div class="study-layout"><section class="question-card"><div class="question-meta"><span class="badge">${isBeginner && !revealed && s.stage!=='guided' ? '独立判断' : q.category}</span><span>${q.options.length?'单项选择':'翻译题 · 自评'}</span><span class="question-number">${String(s.index+1).padStart(2,'0')} / ${s.ids.length}</span>${favoriteButton(q)}</div><div class="stem">${esc(q.stem)}</div>${isBeginner && !revealed && s.stage==='guided' ? beginnerHint(q) : ''}${q.options.length?`<div class="options">${q.options.map(o=>`<button class="option ${a.selected===o.key?'selected':''} ${revealed&&o.key===q.answer?'correct':''} ${revealed&&a.selected===o.key&&o.key!==q.answer?'wrong':''}" data-action="select-option" data-key="${o.key}" ${revealed||isMemory?'disabled':''} aria-pressed="${a.selected===o.key}"><span class="option-letter">${o.key}</span><span class="option-text">${esc(o.text)}</span>${revealed&&o.key===q.answer?icon('check'):revealed&&a.selected===o.key?icon('close'):''}</button>`).join('')}</div>`:isMemory?'':`<textarea class="translation-input" id="translation" aria-label="填写你的译文" placeholder="在这里写下你的译文…${isExam?'':'也可以先在心里回想，再查看答案。'}" ${a.graded||revealed?'readonly':''}>${esc(a.draft||'')}</textarea><p class="tiny muted" style="margin-top:8px">翻译表达不唯一，对照参考答案自行评价。</p>`}${revealed?(isBeginner?beginnerAnswer(q,a,s):answerPanel(q,a,!a.graded&&(isMemory||!q.options.length))):''}<div class="question-actions"><button class="btn btn-secondary" data-action="prev" ${s.index===0?'disabled':''}>上一题</button>${!isExam&&!revealed?`<button class="btn btn-primary" data-action="${isMemory||!q.options.length?'reveal':'confirm'}" ${!isMemory&&q.options.length&&!a.selected?'disabled':''}>${isMemory?'翻开答案':!q.options.length?'查看参考答案':'确认答案'} ${icon('arrow')}</button>`:`<button class="btn btn-primary" data-action="next">${s.index===s.ids.length-1?'完成本组':'下一题'} ${icon('arrow')}</button>`}</div>${!isExam&&!a.graded&&revealed?'<p class="tiny muted" style="margin-top:10px">标记掌握情况后，才会计入学习记录。</p>':''}${sources(q)}</section><aside class="study-aside"><div class="aside-card"><h3>这一组的小进步</h3><div class="progress-track"><div style="width:${answered/s.ids.length*100}%"></div></div><div class="aside-stats"><span>已${isExam?'填写':'完成'} ${answered} 题</span><span>共 ${s.ids.length} 题</span></div></div><div class="aside-card"><h3>答题卡</h3><div class="answer-sheet">${s.ids.map((id,i)=>{const x=s.answers[id]||{};return `<button class="sheet-btn ${s.index===i?'current':''} ${isExam?(x.selected||x.draft?.trim()?'answered':''):x.graded?(x.correct?'done':'incorrect'):''}" data-action="jump" data-index="${i}" aria-label="第 ${i+1} 题">${i+1}</button>`;}).join('')}</div><p class="tiny muted" style="margin-top:13px">${isExam?'蓝色 · 已填写':isBeginner?'绿色 · 答对　暖色 · 待复习':'绿色 · 掌握　暖色 · 待复习'}</p></div><div class="aside-card keyboard-hint"><h3 style="margin-bottom:10px">让练习更顺手</h3><p><kbd>A</kbd> – <kbd>D</kbd> 选择答案</p><p><kbd>Enter</kbd> 确认 / 下一题</p><p class="tiny" style="margin-top:10px">填写译文时，快捷键暂停。</p></div></aside></div>`;
  }
  function current() { const s=progress.session; return {s,q:byId[s.ids[s.index]],a:s.answers[s.ids[s.index]] ||= {}}; }
  function recordCurrent(correct) {
    const {s,q,a}=current();
    if (a.graded || s.mode==='exam') return;
    a.graded=true; a.correct=correct; a.revealed=true;
    C.recordAnswer(progress,q.id,correct,{assisted:s.mode==='beginner' && s.stage==='guided'});
    if(s.mode==='beginner') B.record(progress,s,q.id,correct);
    save(); render();
  }
  function move(index) { const s=progress.session; s.index=Math.max(0,Math.min(index,s.ids.length-1));save();render();window.scrollTo(0,0); }
  function finishSession() {
    const s=progress.session;
    if (s.finished) return navigate('results');
    const untouched=s.ids.filter(id=>{const a=s.answers[id];return s.mode==='exam'?!(a?.selected||a?.draft?.trim()):!a?.graded;}).length;
    const finish=()=>{
      if (s.mode==='exam') for (const id of s.ids) {
        const q=byId[id],a=s.answers[id];
        if (q.options.length && a?.selected && !a.graded) {
          a.correct=a.selected===q.answer;a.graded=true;C.recordAnswer(progress,id,a.correct);
        }
      }
      s.finished=true;s.finishedAt=new Date().toISOString();if(s.mode==='beginner')B.finish(progress,s);syncHistory();save();navigate('results');
    };
    if (untouched) dialog(s.mode==='exam'?'确定交卷吗？':'结束这一组练习？',`还有 ${untouched} 道题${s.mode==='exam'?'未填写':'未完成评价'}。这些题会标记为未完成，不会记为错题。`,s.mode==='exam'?'确认交卷':'结束练习',finish);
    else finish();
  }
  function summary(s) {
    let correct=0,wrong=0,pending=0,skipped=0;
    for (const id of s.ids) {
      const a=s.answers[id];
      if(a?.graded) a.correct?correct++:wrong++;
      else if(s.mode==='exam'&&!byId[id].options.length&&a?.draft?.trim()) pending++;
      else skipped++;
    }
    return {correct,wrong,pending,skipped};
  }
  function syncHistory() {
    const s=progress.session, sums=summary(s);
    const item={id:s.id,mode:s.mode,...(s.mode==='beginner'?{stage:s.stage}:{}),total:s.ids.length,...sums,startedAt:s.startedAt,finishedAt:s.finishedAt};
    const i=progress.history.findIndex(h=>h.id===s.id);
    if(i>=0) progress.history[i]=item;else progress.history.unshift(item);
    progress.history=progress.history.slice(0,100);
  }
  function resultsView() {
    const s=progress.session;if(!s) return empty('还没有练习记录','去完成一组练习，收获一点进步。');
    const r=summary(s);
    return `<section class="result-hero"><div class="result-icon">${icon('check')}</div><div class="eyebrow" style="margin-top:18px">ANOTHER SMALL STEP FORWARD</div><h1>又向前走了一小步。</h1><p class="small muted">${sessionLabel(s)} · 共 ${s.ids.length} 题 · ${s.mode==='beginner'?'本组正确率':'已评估题目正确 / 掌握率'} ${percent(r.correct,r.correct+r.wrong)}</p><div class="result-stats"><div><strong>${r.correct}</strong><span>${s.mode==='beginner'?(s.stage==='guided'?'带提示答对':'独立答对'):'答对 / 已掌握'}</span></div><div><strong>${r.wrong}</strong><span>还需复习</span></div><div><strong>${r.skipped}</strong><span>未完成</span></div>${r.pending?`<div><strong>${r.pending}</strong><span>翻译待自评</span></div>`:''}</div><p class="tiny muted">未完成和待自评的题目不计入正确率。${s.mode==='beginner' && s.stage==='guided'?'带提示答对不直接标记为已掌握。':''}</p><div class="result-actions"><button class="btn btn-primary" data-action="nav" data-view="home">返回练习中心</button>${r.wrong?`<button class="btn btn-secondary" data-action="retry-wrong">再练本组错题</button>`:''}<button class="btn btn-secondary" data-action="retry-all">再来一组</button></div></section>${s.mode==='beginner'?beginnerNext(s,r):''}<div class="section-title"><h2>这一组的回顾</h2><span class="small muted">${r.pending?'翻译题等待你的自评':'参考答案与解析来自原始资料'}</span></div>${s.ids.map((id,i)=>{const q=byId[id],a=s.answers[id]||{};return `<article class="review-item"><div class="question-meta" style="margin-bottom:4px"><span>${i+1}.</span><span class="badge">${q.category}</span><span>${a.graded?a.correct?(s.mode==='beginner'?(s.stage==='guided'?'✓ 带提示答对':'✓ 独立答对'):'✓ 已掌握'):'需复习':a.draft?.trim()?'待自评':'未完成'}</span>${favoriteButton(q)}</div><h3>${esc(q.stem)}</h3>${q.options.length?`<p class="review-draft">你的答案：${esc(a.selected||'未作答')}${a.selected?' · '+esc(q.options.find(o=>o.key===a.selected)?.text):''}</p>`:`<p class="review-draft">你的译文：${esc(a.draft||'未填写')}</p>`}<p class="review-answer">参考答案：${esc(answerText(q))}</p>${!q.options.length&&!a.graded&&a.draft?.trim()?`<div class="self-grade"><p>翻译题请对照参考答案自行评价。</p><button class="btn btn-warm" data-action="result-grade" data-id="${id}" data-correct="false">还需复习</button><button class="btn btn-soft" data-action="result-grade" data-id="${id}" data-correct="true">已掌握</button></div>`:''}${s.mode==='beginner'?guideSteps(q):''}<details><summary>查看解析与考点</summary><p>${esc(q.explanation)}</p><p>考点：${esc(q.point)}</p>${notes(q)}${sources(q)}</details></article>`;}).join('')}`;
  }
  function empty(title,description) {return `<div class="empty-state">${icon('leaf')}<h3>${title}</h3><p>${description}</p><button class="btn btn-primary" data-action="nav" data-view="home">去练习 ${icon('arrow')}</button></div>`;}
  function collectionView() {
    const wrong=view==='wrong', all=collection(view), pool=all.filter(q=>[q.stem,q.category,q.point].join(' ').toLowerCase().includes(collectionQuery.toLowerCase()));
    const title=wrong?'把错题，再变成加分题。':'值得多看一遍的题。';
    if(!all.length) return heading(wrong?'LEARN FROM EVERY MISTAKE':'KEEP WHAT MATTERS',title,wrong?'每一次答错，都是下一次答对的起点。':'练习时点一下星标，把重点留在这里。')+empty(wrong?'错题本还是空的':'还没有收藏的题目',wrong?'练习中答错或标记“还需复习”的题目会自动收录，再次掌握后会移出。':'看到想反复温习的题，点击“收藏”，下次就能快速找到。');
    const pages=Math.max(1,Math.ceil(pool.length/12));collectionPage=Math.min(collectionPage,pages);
    return heading(wrong?'LEARN FROM EVERY MISTAKE':'KEEP WHAT MATTERS',title,`共 ${all.length} 道题，${wrong?'再次答对或标记已掌握后，将自动移出。':'收藏与做题记录分别保存。'}`,`<button class="btn btn-primary" data-action="practice-collection">${icon('shuffle')}随机练习这些题</button>`) + `<div class="list-toolbar"><div class="searchbox">${icon('search')}<input id="collection-search" type="search" aria-label="搜索${wrong?'错题':'收藏'}" placeholder="搜索题目或考点" value="${esc(collectionQuery)}"></div><span class="small muted">${pool.length} 道</span></div><div class="question-list">${pool.slice((collectionPage-1)*12,collectionPage*12).map(q=>`<article class="question-list-item"><div class="question-list-body"><span class="badge">${q.category}</span><h3>${esc(q.stem)}</h3><p class="tiny muted">${esc(q.point)} · 已练 ${questionProgress(q).attempts||0} 次</p></div><div class="inline-actions">${favoriteButton(q)}<button class="btn btn-secondary" data-action="single-question" data-id="${q.id}">练这道题</button></div></article>`).join('') || '<div class="empty-state"><p>没有匹配的题目，换个关键词试试。</p></div>'}</div>${pager(collectionPage,pages,'collection-page')}`;
  }
  function pager(page,total,action) {return `<div class="pager"><button class="btn btn-secondary" data-action="${action}" data-page="${page-1}" ${page<=1?'disabled':''}>上一页</button><span>${page} / ${total}</span><button class="btn btn-secondary" data-action="${action}" data-page="${page+1}" ${page>=total?'disabled':''}>下一页</button></div>`;}
  function filteredArticles() {return C.filterArticles(articles,{book:bookFilter,query:articleQuery});}
  function readingView() {
    const pool=filteredArticles(),pages=Math.max(1,Math.ceil(pool.length/12));articlePage=Math.min(articlePage,pages);
    return heading('READ A LITTLE, UNDERSTAND MORE','给英语，留一页的时间。','128 篇中英对照阅读，按教材与单元整理。可以隐藏中文，先试着自己读。',`<button class="btn btn-secondary" data-action="random-article" ${!pool.length?'disabled':''}>${icon('shuffle')}随机读一篇</button>`)+`<div class="list-toolbar"><div class="searchbox">${icon('search')}<input id="article-search" type="search" placeholder="搜标题或中英文正文，如 Parenting" aria-label="搜索文章标题和中英文正文" value="${esc(articleQuery)}"></div><select id="book-filter" aria-label="选择阅读教材">${selectOptions([...new Set(articles.map(a=>a.book))],bookFilter,'全部教材')}</select><span class="small muted">${pool.length} 篇 · 已读 ${Object.values(progress.articles).filter(Boolean).length} 篇</span></div><div class="reading-grid">${pool.slice((articlePage-1)*12,articlePage*12).map(a=>{const excerpt=C.articleExcerpt(a,articleQuery);return `<button class="article-card" data-action="article" data-id="${esc(a.id)}"><div class="article-kicker">${a.book} · UNIT ${a.unit} / READING ${a.reading}</div><h3>${esc(a.title)}</h3><p>${esc(a.subtitle)}</p>${excerpt?`<p class="article-excerpt"><span>正文片段</span>${esc(excerpt)}</p>`:''}<div class="card-line"><span>${a.words} 词 · 约 ${Math.max(1,Math.ceil(a.words/140))} 分钟</span>${progress.articles[a.id]?'<span class="read-status">✓ 已读</span>':icon('arrow')}</div></button>`;}).join('')}</div>${!pool.length?'<div class="empty-state"><p>没有匹配的文章，换一个关键词或教材试试。</p></div>':pager(articlePage,pages,'article-page')}`;
  }
  function readerView() {
    const a=articleById[currentArticle];if(!a) return empty('请选择一篇文章','到双语阅读中选择喜欢的内容。');
    const i=articles.findIndex(x=>x.id===a.id), read=!!progress.articles[a.id];
    return `<div class="reader"><button class="back-button" data-action="nav" data-view="reading">${icon('back')}返回文章目录</button><div class="reader-head"><div class="eyebrow">${a.book} · UNIT ${a.unit} / READING ${a.reading}</div><h1>${esc(a.title)}</h1><p>${esc(a.subtitle)}</p></div><div class="reader-controls"><label><input type="checkbox" id="show-chinese" ${showChinese?'checked':''}>显示中文译文</label><span class="spacer"></span><button class="btn ${read?'btn-soft':'btn-secondary'}" data-action="mark-read">${icon('check')}${read?'已读完 · 取消标记':'标记为已读'}</button></div><article class="reader-body ${showChinese?'':'english-only'}">${a.paragraphs.map(p=>`<p class="${p.lang}" lang="${p.lang==='en'?'en':'zh-CN'}">${esc(p.text)}</p>`).join('')}</article><p class="data-caption">来源：${esc(a.source)}。正文保留原资料内容。</p><div class="question-actions"><button class="btn btn-secondary" data-action="article" data-id="${esc(articles[Math.max(0,i-1)].id)}" ${i===0?'disabled':''}>上一篇</button><button class="btn btn-primary" data-action="article" data-id="${esc(articles[Math.min(articles.length-1,i+1)].id)}" ${i===articles.length-1?'disabled':''}>下一篇 ${icon('arrow')}</button></div></div>`;
  }
  function historyView() {
    const values=Object.values(progress.questions), attempts=values.reduce((n,p)=>n+(p.attempts||0),0), correct=values.reduce((n,p)=>n+(p.correct||0),0);
    const days=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-13+i);return {date:C.dateKey(d),count:progress.days[C.dateKey(d)]?.attempts||0};});
    const max=Math.max(1,...days.map(d=>d.count));
    return heading('YOUR PROGRESS, AT YOUR PACE','每一点进步，都有迹可循。','累计正确率包含带提示练习；下方记录区分带提示练和独立做。')+`<div class="stats-grid"><div class="stat-card"><strong>${values.filter(p=>p.attempts).length}</strong><span>练过的题目 / ${stats.uniqueQuestions}</span></div><div class="stat-card"><strong>${attempts}</strong><span>累计练习次数</span></div><div class="stat-card"><strong>${percent(correct,attempts)}</strong><span>累计正确 / 掌握率</span></div><div class="stat-card"><strong>${Object.keys(progress.days).length}</strong><span>累计学习天数</span></div></div><section class="aside-card"><h3>最近 14 天，留下的小脚印</h3><div class="activity-grid" role="img" aria-label="最近14天每日练习量：${days.map(d=>d.date+' '+d.count+'次').join('，')}">${days.map((d,i)=>`<div class="activity-bar ${i===13?'today':''}" title="${d.date} · ${d.count} 次" style="height:${Math.max(4,d.count/max*72)}px"></div>`).join('')}</div><div class="aside-stats" style="margin-top:10px"><span>${days[0].date.slice(5)}</span><span>今天</span></div></section><div class="section-title"><h2>练习记录</h2><span class="tiny muted">保留最近 100 组</span></div><section class="practice-card">${progress.history.length?`<table class="history-list"><thead><tr><th>日期</th><th>练习方式</th><th>题数</th><th>答对 / 掌握</th><th>未完成 / 待评</th></tr></thead><tbody>${progress.history.map(h=>`<tr><td>${esc(fmtDate(h.finishedAt))}</td><td>${sessionLabel(h)}</td><td>${h.total}</td><td>${h.correct}</td><td>${h.skipped||0} / ${h.pending||0}</td></tr>`).join('')}</tbody></table>`:'<p class="muted small" style="padding:35px;text-align:center">完成一组练习后，记录会出现在这里。</p>'}</section><div class="section-title"><h2>我的数据</h2></div><div class="aside-card"><h3>给你的学习进度留一份备份</h3><p class="data-caption">错题、收藏、掌握情况和练习记录保存在当前浏览器。换浏览器或设备前，可以导出备份，再在新浏览器导入。导入会替换当前记录；备份不恢复尚未结束的练习位置。</p><div class="record-controls"><button class="btn btn-secondary" data-action="export">${icon('download')}导出进度</button><button class="btn btn-secondary" data-action="import">${icon('upload')}导入进度</button><input id="import-file" type="file" accept="application/json,.json" hidden><span class="spacer"></span><button class="btn btn-danger" data-action="reset-progress">清空学习记录</button></div></div><p class="data-caption">题库整理：30 天练习 900 条 + 必刷题 394 条 → 合并 ${stats.mergedDuplicates} 条重复记录，得到 ${stats.uniqueQuestions} 道题；另有 128 篇阅读。<br>重复依据为规范化后的题干与选项内容，忽略选项顺序；相近但选项不同的题仍分别保留。答案、解析与存疑备注沿用原资料。</p>`;
  }
  function dialog(title,message,label,callback) {
    dialogCallback=callback;
    const node=document.createElement('div');node.className='dialog-overlay';
    node.innerHTML=`<section class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" aria-describedby="dialog-desc"><h2 id="dialog-title">${esc(title)}</h2><p id="dialog-desc">${esc(message)}</p><div class="dialog-actions"><button class="btn btn-secondary" data-action="cancel-dialog">取消</button><button class="btn btn-primary" data-action="confirm-dialog">${esc(label)}</button></div></section>`;
    el.append(node);node.querySelector('button').focus();
  }
  function closeDialog() { el.querySelector('.dialog-overlay')?.remove();dialogCallback=null; }
  el.addEventListener('click', e => {
    const b=e.target.closest('[data-action]');if(!b||b.disabled)return;
    const action=b.dataset.action;
    if(action==='lesson'){lessonId=b.dataset.id;return navigate('lesson');}
    if(action==='beginner-start'){
      const l=B.lessonById[b.dataset.id], batch=B.batch(l,C.shuffle);
      return newSession(batch.guided,'beginner',{stage:'guided',lessonId:l.id,soloIds:batch.solo});
    }
    if(action==='beginner-solo'){
      const s=progress.session;
      if(s.stage==='guided' && s.finished && s.ids.every(id=>s.answers[id]?.graded))return newSession(s.soloIds,'beginner',{stage:'solo',lessonId:s.lessonId});
      return;
    }
    if(action==='beginner-mixed')return newSession(C.shuffle(B.learnedIds(progress)).slice(0,10),'beginner',{stage:'mixed'});
    if(action==='beginner-review')return newSession(C.shuffle(B.dueIds(progress)).slice(0,10),'beginner',{stage:'review'});
    if(action==='beginner-retry')return newSession(C.shuffle(progress.session.ids),'beginner',{stage:progress.session.stage,lessonId:progress.session.lessonId,soloIds:progress.session.soloIds});
    if(action==='nav') { if(b.dataset.view==='home')collectionQuery='';return navigate(b.dataset.view); }
    if(action==='mode'){mode=b.dataset.mode;render();return;}
    if(action==='category'){const c=b.dataset.category;filters.categories=c?(filters.categories.includes(c)?filters.categories.filter(x=>x!==c):[...filters.categories,c]):[];render();return;}
    if(action==='quick-category'){filters={categories:[b.dataset.category],bank:'',day:'',topic:'',status:'',query:''};mode='practice';render();el.querySelector('.practice-card').scrollIntoView({behavior:'smooth',block:'center'});return;}
    if(action==='reset-filters'){filters={categories:[],bank:'',day:'',topic:'',status:'',query:''};render();return;}
    if(action==='start')return start();
    if(action==='resume')return navigate(progress.session.finished?'results':'session');
    if(action==='favorite'){
      const p=progress.questions[b.dataset.id] ||= {};p.starred=!p.starred;save();
      const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;
    }
    if(action==='select-option'){const {s,a}=current();if(a.graded||s.mode==='memory')return;a.selected=b.dataset.key;save();render();return;}
    if(action==='confirm'){const {q,a}=current();if(a.selected)recordCurrent(a.selected===q.answer);return;}
    if(action==='reveal'){current().a.revealed=true;save();render();return;}
    if(action==='grade')return recordCurrent(b.dataset.correct==='true');
    if(action==='prev')return move(progress.session.index-1);
    if(action==='next'){if(progress.session.index===progress.session.ids.length-1)return finishSession();return move(progress.session.index+1);}
    if(action==='jump')return move(+b.dataset.index);
    if(action==='finish')return finishSession();
    if(action==='result-grade'){
      const a=progress.session.answers[b.dataset.id];if(a.graded)return;
      a.correct=b.dataset.correct==='true';a.graded=true;C.recordAnswer(progress,b.dataset.id,a.correct);syncHistory();save();
      const scroll=window.scrollY;render();window.scrollTo(0,scroll);return;
    }
    if(action==='retry-wrong')return newSession(C.shuffle(progress.session.ids.filter(id=>progress.session.answers[id]?.correct===false)),progress.session.mode==='beginner'?'beginner':'practice',progress.session.mode==='beginner'?{stage:'review'}:{});
    if(action==='retry-all')return newSession(C.shuffle(progress.session.ids),progress.session.mode,progress.session.mode==='beginner'?{stage:progress.session.stage,lessonId:progress.session.lessonId,soloIds:progress.session.soloIds}:{});
    if(action==='practice-collection')return newSession(C.shuffle(collection(view).filter(q=>[q.stem,q.point,q.category].join(' ').toLowerCase().includes(collectionQuery.toLowerCase()))).map(q=>q.id),'practice');
    if(action==='single-question')return newSession([b.dataset.id],'practice');
    if(action==='collection-page'){collectionPage=+b.dataset.page;render();window.scrollTo(0,0);return;}
    if(action==='article-page'){articlePage=+b.dataset.page;render();window.scrollTo(0,0);return;}
    if(action==='article'){currentArticle=b.dataset.id;return navigate('reader');}
    if(action==='random-article'){const pool=filteredArticles();if(pool.length){currentArticle=pool[Math.floor(Math.random()*pool.length)].id;navigate('reader');}return;}
    if(action==='mark-read'){progress.articles[currentArticle]=!progress.articles[currentArticle];save();render();return;}
    if(action==='export'){
      const backup={...progress,session:null,exportedAt:new Date().toISOString()};
      const blob=new Blob([JSON.stringify(backup,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='拾题-学习进度-'+C.dateKey()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('学习进度已导出');return;
    }
    if(action==='import')return document.getElementById('import-file').click();
    if(action==='reset-progress')return dialog('清空全部学习记录？','错题、收藏、阅读标记和做题进度都会清空。建议先导出备份，题库资料不会受到影响。','确认清空',()=>{progress=C.emptyProgress();save();render();toast('学习记录已清空');});
    if(action==='cancel-dialog')return closeDialog();
    if(action==='confirm-dialog'){const cb=dialogCallback;closeDialog();cb?.();}
  });
  el.addEventListener('change', async e=>{
    const t=e.target;
    if(t.dataset.filter){filters[t.dataset.filter]=t.value;if(t.dataset.filter==='bank'&&t.value==='essential')filters.day='';if(t.dataset.filter==='day'&&t.value)filters.bank='daily';render();}
    if(t.id==='count')count=t.value;
    if(t.name==='order')order=t.value;
    if(t.id==='book-filter'){bookFilter=t.value;articlePage=1;render();}
    if(t.id==='show-chinese'){showChinese=t.checked;el.querySelector('.reader-body').classList.toggle('english-only',!showChinese);}
    if(t.id==='import-file'&&t.files[0]){
      try{
        if(t.files[0].size>10000000)throw Error('备份文件过大，请选择拾题导出的 JSON 文件。');
        const imported=C.validProgress(C.migrateQuestionIds(JSON.parse(await t.files[0].text()),questionAliases),questions,articles);
        dialog('导入这份学习进度？',`包含 ${Object.keys(imported.questions).length} 道题目的记录、${imported.history.length} 组练习。导入后将替换当前浏览器的记录。`,'确认导入',()=>{progress=imported;save();render();toast('学习进度已导入');});
      }catch(err){toast('导入失败：'+err.message);}t.value='';
    }
  });
  function rerenderSearch(id,value) {render();const input=document.getElementById(id);input.focus();try{input.setSelectionRange(value.length,value.length);}catch{}}
  function handleInput(e) {
    if(e.isComposing)return;
    const t=e.target;
    if(t.id==='question-search'){filters.query=t.value;updateMatch();}
    if(t.id==='translation'){current().a.draft=t.value;save();}
    if(t.id==='collection-search'){collectionQuery=t.value;collectionPage=1;rerenderSearch(t.id,t.value);}
    if(t.id==='article-search'){articleQuery=t.value;articlePage=1;rerenderSearch(t.id,t.value);}
  }
  el.addEventListener('input',handleInput);
  el.addEventListener('compositionend',handleInput);
  document.addEventListener('keydown',e=>{
    const overlay=el.querySelector('.dialog-overlay');
    if(overlay){
      if(e.key==='Escape')closeDialog();
      if(e.key==='Tab'){const buttons=overlay.querySelectorAll('button'),first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;
    }
    if(view!=='session'||e.ctrlKey||e.altKey||e.metaKey||['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target.tagName))return;
    const {s,q,a}=current();
    if(/^[a-d]$/i.test(e.key)&&q.options.length&&!a.graded&&s.mode!=='memory'){a.selected=e.key.toUpperCase();save();render();e.preventDefault();}
    if(e.key==='Enter'){
      const button=el.querySelector('.question-actions .btn-primary');if(button&&!button.disabled){button.click();e.preventDefault();}
    }
  });
  window.addEventListener('beforeunload',save);
  render();
})();
