(function(root) {
  'use strict';
  const C=root.StudyPapersCore, papers=root.STUDY_PAPERS.papers;
  const sections=['交际用语','词汇与语法','阅读理解','完形填空','翻译'];
  const ranges=['1-10','11-40','41-55','56-65','66-75'];
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function create({state,save,render,dialog}) {
    const current=()=>papers.find(p=>p.id===state().activeId);
    const btn=(action,label,extra='',style='btn-secondary')=>'<button class="btn '+style+'" data-paper-action="'+action+'" '+extra+'>'+label+'</button>';
    function redraw(focus,top=false) {
      const y=window.scrollY;
      render();
      if(top)window.scrollTo(0,0);else window.scrollTo(0,y);
      if(focus)document.getElementById(focus)?.focus({preventScroll:true});
    }
    function history() {
      const rows=papers.filter(p=>state().attempts[p.id]);
      if(!rows.length)return '';
      return '<section class="paper-history"><h2>整卷练习记录</h2><p class="data-caption">整卷成绩单独统计；背题不计分，记录随学习进度一同备份。</p>'+rows.map(p=>{
        const a=C.attempt(state(),p),r=C.score(p,a);
        return '<div class="resume"><div><strong>'+esc(p.title)+'</strong><p class="small muted">'+(a.submittedAt?'已得 '+r.earned+' 分 · 已评 '+r.assessed+'/100 分'+(r.pending?' · '+r.pending+' 题待自评':''):'已填写 '+C.answered(p,a)+'/75 题')+'</p></div>'+btn('open',a.submittedAt?'查看答卷':'继续做题','data-paper-id="'+p.id+'" data-paper-mode="practice"')+'</div>';
      }).join('')+'</section>';
    }
    function catalog() {
      return '<div class="page-heading"><div><div class="eyebrow">ONE PAPER, TWO WAYS</div><h1>整卷练习</h1><p class="heading-description">三套完整试卷，选择做题或背题，按自己的节奏来。</p></div><span class="date-tag">3 套 · 225 题</span></div>'+
      '<div class="paper-catalog">'+papers.map((p,i)=>{
        const a=C.attempt(state(),p),done=C.answered(p,a),r=C.score(p,a);
        return '<article class="paper-cover"><div class="paper-cover-top"><span class="paper-volume">0'+(i+1)+'</span><span class="badge">'+(i<2?'参考模拟卷':'综合练习卷')+'</span></div><h2>'+esc(p.title)+'</h2><p class="paper-subtitle">'+esc(p.subtitle)+'</p><p>'+esc(p.description)+'</p><div class="paper-spec"><span>75 题</span><span>100 分</span><span>建议 120 分钟</span></div><div class="paper-cover-status">'+(a.submittedAt?'已交卷 · 已得 '+r.earned+' 分'+(r.pending?' · '+r.pending+' 题待自评':''):done?'已填写 '+done+'/75 题':'还没有开始做题')+'</div><div class="paper-cover-actions">'+btn('open',a.submittedAt?'查看答卷':done?'继续做题':'做题','data-paper-id="'+p.id+'" data-paper-mode="practice"','btn-primary')+btn('open','背题','data-paper-id="'+p.id+'" data-paper-mode="memory"','btn-soft')+'</div></article>';
      }).join('')+'</div><div class="paper-mode-guide"><div><h3>做题模式</h3><p>先独立选择或填写译文，交卷后查看答案与解析。刷新、离开再回来，可以接着做。</p></div><div><h3>背题模式</h3><p>默认选好每道选择题的参考答案，直接展示解析和翻译。切换模式会保留你的独立作答。</p></div></div><p class="data-caption">这三套资料是两套参考模拟卷与一套综合练习卷。原卷的存疑题已标注，并保留来源说明。</p>';
    }
    function explanation(q,p) {
      return '<div class="paper-explanation"><strong>'+ (q.reviewRequired?'参考选择（非唯一确定答案）':'参考答案')+'：'+esc(q.answer)+(q.options.length?' · '+esc(q.options.find(o=>o.key===q.answer).text):'')+'</strong><p>'+esc(q.explanation)+'</p>'+
      (q.notes?.length?'<div class="question-note">'+q.notes.map(esc).join('<br>')+'</div>':'')+
      '<details class="source-note"><summary>查看来源</summary><p>'+esc(q.source)+'</p></details></div>';
    }
    function question(p,q) {
      const s=state(),a=C.attempt(s,p),memory=s.mode==='memory',show=memory||!!a.submittedAt;
      const chosen=C.displayedAnswer(s,p,q),manual=!q.options.length||q.reviewRequired;
      let tag=q.options.length?'单项选择':'翻译 · 自评';
      if(show&&q.reviewRequired)tag='原题存疑 · 需自评';
      let result='';
      if(!memory && a.submittedAt) {
        result=manual?(Number.isInteger(a.selfScores[q.number])?'自评 '+a.selfScores[q.number]+' / '+q.points+' 分':'待自评'):!chosen?'未作答':chosen===q.answer?'答对':'需复习';
      }
      return '<article class="paper-question" id="paper-q-'+q.number+'" data-paper-number="'+q.number+'"><div class="question-meta"><span class="badge">'+tag+'</span><span>'+q.points+' 分</span><span class="paper-result">'+result+'</span></div>'+
      '<fieldset class="paper-fieldset"><legend><span class="paper-q-number">'+q.number+'.</span> <span lang="'+(q.number>=71?'zh-CN':'en')+'">'+esc(q.stem)+'</span></legend>'+
      (q.options.length?'<div class="paper-options">'+q.options.map(o=>{
        const correct=show&&o.key===q.answer,wrong=show&&!memory&&!manual&&chosen===o.key&&!correct;
        return '<label class="paper-option '+(correct?'paper-correct':'')+' '+(wrong?'paper-wrong':'')+'"><input type="radio" name="paper-q-'+q.number+'" value="'+o.key+'" data-paper-choice="'+q.number+'" '+(chosen===o.key?'checked ':'')+(show?'disabled ':'')+'><span class="paper-option-letter">'+o.key+'</span><span lang="en">'+esc(o.text)+'</span>'+(correct?'<span class="paper-option-mark" aria-label="参考答案">✓</span>':'')+'</label>';
      }).join('')+'</div>':
      (memory?'':'<label class="sr-only" for="paper-translation-'+q.number+'">第 '+q.number+' 题译文</label><textarea id="paper-translation-'+q.number+'" class="translation-input" data-paper-translation="'+q.number+'" maxlength="20000" rows="3" placeholder="写下你的译文…" '+(a.submittedAt?'readonly':'')+'>'+esc(chosen)+'</textarea>'))+'</fieldset>'+
      (show?explanation(q,p):'')+
      (!memory&&a.submittedAt&&manual?'<div class="paper-self-grade"><span>'+ (q.reviewRequired?'原题有歧义，请结合解析自评：':'对照译文自评：')+'</span>'+Array.from({length:q.points+1},(_,i)=>btn('grade',i+' 分','data-paper-number="'+q.number+'" data-paper-score="'+i+'" aria-pressed="'+(a.selfScores[q.number]===i)+'"',a.selfScores[q.number]===i?'btn-primary':'btn-secondary')).join('')+'</div>':'')+'</article>';
    }
    function passage(p,article) {
      return '<div class="paper-reading-block"><details class="paper-passage" open><summary>'+esc(article.id==='cloze'?'完形短文':'Passage '+article.id.slice(1))+' · '+esc(article.title)+'</summary><div class="paper-passage-text" tabindex="0" aria-label="'+esc(article.title)+' 原文">'+article.paragraphs.map((text,i)=>'<p lang="en"><span class="paper-paragraph-number">'+(i+1)+'</span>'+esc(text).replace(/\[(\d+)\]/g,'<b class="paper-blank">[$1] ______</b>')+'</p>').join('')+'</div></details><div>'+article.questionNumbers.map(n=>question(p,p.questions.find(q=>q.number===n))).join('')+'</div></div>';
    }
    function view() {
      const p=current();if(!p)return catalog();
      const s=state(),a=C.attempt(s,p),r=C.score(p,a),memory=s.mode==='memory';
      const sectionQuestions=p.questions.filter(q=>q.section===s.section);
      return '<div class="paper-reader"><div class="progress-header">'+btn('catalog','← 全部试卷')+'<span class="small muted">75 题 · 100 分 · 建议 120 分钟</span></div>'+
      '<div class="page-heading paper-heading"><div><div class="eyebrow">COMPLETE PAPER</div><h1>'+esc(p.title)+'</h1><p class="heading-description">'+esc(p.subtitle)+'</p></div><div class="paper-mode-switch" role="group" aria-label="整卷模式">'+['practice','memory'].map(m=>'<button id="paper-mode-'+m+'" data-paper-action="mode" data-paper-mode="'+m+'" aria-pressed="'+(s.mode===m)+'" class="'+(s.mode===m?'active':'')+'">'+(m==='practice'?'做题模式':'背题模式')+'</button>').join('')+'</div></div>'+
      '<div class="paper-status '+(memory?'is-memory':'')+'" role="status">'+
      (memory?'<div><strong>答案已选好，直接背题。</strong><p>选择题显示参考选项与解析，翻译题显示参考译文。背题不计入做题成绩。</p></div>':
      a.submittedAt?'<div><strong>已得 '+r.earned+' 分'+(r.pending?' · 已评 '+r.assessed+' / 100 分':' / 100 分')+'</strong><p>'+ (r.pending?r.pending+' 题待自评（翻译或原题存疑）。':'已完成全部评价。')+' 未作答 '+r.skipped+' 题。</p></div>'+btn('restart','重新做本卷'):
      '<div><strong data-paper-count>已填写 '+r.answered+' / 75 题</strong><p>作答实时保存；交卷前隐藏答案与解析。</p></div>'+btn('submit','交卷看答案','','btn-primary'))+'</div>'+
      '<nav class="paper-section-tabs" aria-label="试卷题型">'+sections.map((title,i)=>'<button data-paper-action="section" data-paper-section="'+i+'" aria-current="'+(s.section===i?'step':'false')+'" class="'+(s.section===i?'active':'')+'">'+title+'<span>'+ranges[i]+' 题</span></button>').join('')+'</nav>'+
      '<details class="paper-sheet"><summary>答题卡 · 点击题号跳转</summary><div class="paper-answer-grid">'+p.questions.map(q=>'<button data-paper-action="jump" data-paper-number="'+q.number+'" class="'+(!memory&&a.answers[q.number]?.trim()?'filled':'')+'" aria-label="第 '+q.number+' 题'+(!memory&&a.answers[q.number]?.trim()?'，已填写':'')+'">'+q.number+'</button>').join('')+'</div></details>'+
      '<h2 id="paper-section-title" tabindex="-1" class="paper-section-title">'+sections[s.section]+'<span>'+ranges[s.section]+' 题 · 共 '+sectionQuestions.reduce((n,q)=>n+q.points,0)+' 分</span></h2>'+
      (s.section===2?p.passages.filter(x=>x.id!=='cloze').map(x=>passage(p,x)).join(''):s.section===3?passage(p,p.passages.find(x=>x.id==='cloze')):sectionQuestions.map(q=>question(p,q)).join(''))+
      '<div class="paper-bottom-nav">'+btn('section','上一部分','data-paper-section="'+(s.section-1)+'" '+(s.section===0?'disabled':''))+
      (s.section<4?btn('section','下一部分 →','data-paper-section="'+(s.section+1)+'"','btn-primary'):!memory&&!a.submittedAt?btn('submit','交卷看答案','','btn-primary'):btn('catalog','返回试卷列表','','btn-primary'))+'</div>'+
      '<details class="paper-source"><summary>试卷来源与答案说明</summary><p>'+esc(p.sourceNote)+'</p>'+p.references.map(ref=>'<p><a href="'+esc(ref.url)+'" target="_blank" rel="noopener noreferrer">'+esc(ref.title)+'</a></p>').join('')+'</details></div>';
    }
    function handleClick(e) {
      const b=e.target.closest('[data-paper-action]');
      if(!b || b.disabled)return false;
      const action=b.dataset.paperAction,s=state(),p=current();
      if(action==='open') {
        const id=b.dataset.paperId;if(!papers.some(p=>p.id===id))return true;
        const same=s.activeId===id;
        s.activeId=id;s.mode=b.dataset.paperMode==='memory'?'memory':'practice';if(!same)s.section=0;save();return 'open';
      }
      if(!p)return true;
      if(action==='catalog') {s.activeId=null;save();redraw(null,true);}
      if(action==='mode') {s.mode=b.dataset.paperMode==='memory'?'memory':'practice';save();redraw('paper-mode-'+s.mode);}
      if(action==='section') {const i=Number(b.dataset.paperSection);if(i>=0&&i<5){s.section=i;save();redraw('paper-section-title',true);}}
      if(action==='jump') {
        const q=p.questions.find(q=>q.number===Number(b.dataset.paperNumber));if(q){s.section=q.section;save();redraw();const target=document.getElementById('paper-q-'+q.number);target?.scrollIntoView({block:'start'});target?.querySelector('input:not(:disabled),textarea:not([readonly])')?.focus({preventScroll:true});}
      }
      if(action==='submit' && s.mode==='practice'&&!C.attempt(s,p).submittedAt) dialog('提交这份答卷？','已填写 '+C.answered(p,C.attempt(s,p))+'/75 题。交卷后显示答案，未答的客观题计 0 分，翻译与存疑题由你自评。','交卷',()=>{C.submit(state(),p);save();redraw(null,true);});
      if(action==='restart') dialog('重新做这套卷子？','只清除本卷的作答与评分，其他试卷和题库记录保留。','重新做题',()=>{delete state().attempts[p.id];state().mode='practice';state().section=0;save();redraw(null,true);});
      if(action==='grade'&&C.selfGrade(s,p,Number(b.dataset.paperNumber),Number(b.dataset.paperScore))){save();redraw();document.querySelector('[data-paper-action="grade"][data-paper-number="'+b.dataset.paperNumber+'"][data-paper-score="'+b.dataset.paperScore+'"]')?.focus({preventScroll:true});}
      return true;
    }
    function handleInput(e) {
      const t=e.target,p=current();
      if(!p || !t.matches('[data-paper-choice],[data-paper-translation]'))return false;
      if(C.select(state(),p,Number(t.dataset.paperChoice||t.dataset.paperTranslation),t.value)){
        save();
        const a=C.attempt(state(),p);
        document.querySelectorAll('[data-paper-count]').forEach(x=>x.textContent='已填写 '+C.answered(p,a)+' / 75 题');
        document.querySelectorAll('[data-paper-action="jump"]').forEach(x=>{const n=x.dataset.paperNumber,filled=!!a.answers[n]?.trim();x.classList.toggle('filled',filled);x.setAttribute('aria-label','第 '+n+' 题'+(filled?'，已填写':''));});
      }
      return true;
    }
    return {view,history,handleClick,handleInput};
  }
  root.StudyPapersUI={create};
})(window);
