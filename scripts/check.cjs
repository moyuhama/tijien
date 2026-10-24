'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const C = require('../dist/core.js');
const context = {window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/data.js'),'utf8'),context);
const {questions,articles,stats,questionAliases} = JSON.parse(JSON.stringify(context.window.STUDY_DATA));
const p = C.emptyProgress();
assert.equal(questions.length,887);
assert.equal(articles.length,128);
assert.equal(new Set(questions.map(q=>q.id)).size,questions.length);
assert.equal(new Set(articles.map(q=>q.id)).size,articles.length);
assert.equal(questions.flatMap(q=>q.sources).length,1294);
assert.equal(questions.flatMap(q=>q.sources).filter(s=>s.bank==='essential').length,394);
assert.equal(questions.filter(q=>q.options.length).length,707);
const norm=text=>text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]/g,'');
const contentKey=q=>norm(q.stem)+'|'+q.options.map(o=>norm(o.text)).sort().join('|');
assert.equal(new Set(questions.map(contentKey)).size,questions.length,'reordering options must not create a second question');
assert.equal(stats.mergedDuplicates,407);
for(let day=1;day<=30;day++) {
  const sources=questions.flatMap(q=>q.sources).filter(s=>s.day===day);
  assert.equal(sources.length,30,`Day ${day} must contain 30 original records`);
  assert.equal(new Set(sources.map(s=>s.number)).size,30);
  assert.equal(C.filterQuestions(questions,{bank:'daily',day},p).length,30);
}
for(const q of questions) {
  assert.ok(q.stem && q.answer && q.explanation && q.point && q.category && q.topics.length, q.id);
  if(q.options.length) {
    assert.deepEqual(q.options.map(o=>o.key),['A','B','C','D']);
    assert.ok(q.options.every(o=>o.text));
    assert.ok(q.options.some(o=>o.key===q.answer));
  }
  assert.ok(!/本次查看|我的作答|页面正确答案/.test(q.stem));
}
for(const a of articles) {
  assert.ok(a.title && a.unit>=1 && a.unit<=8 && [1,2].includes(a.reading));
  assert.ok(a.paragraphs.some(p=>p.lang==='en'));
  assert.ok(a.paragraphs.some(p=>p.lang==='zh'));
}
for(const book of new Set(articles.map(a=>a.book)))assert.equal(articles.filter(a=>a.book===book).length,16);
for(const [category,total] of Object.entries(stats.categories))assert.equal(C.filterQuestions(questions,{categories:[category]},p).length,total);
assert.equal(C.filterQuestions(questions,{bank:'essential',day:30},p).length,0,'day and source must apply to the same source record');
assert.equal(C.filterQuestions(questions,{query:'a_nonexistent_question_92839'},p).length,0);
assert.equal(C.filterQuestions(questions,{status:'wrong'},p).length,0);
const first=questions[0];
p.questions[first.id]={starred:true};
C.recordAnswer(p,first.id,false);
assert.equal(C.filterQuestions(questions,{status:'wrong'},p)[0].id,first.id);
assert.equal(C.filterQuestions(questions,{status:'new'},p).length,questions.length-1);
C.recordAnswer(p,first.id,true);
assert.equal(C.filterQuestions(questions,{status:'wrong'},p).length,0);
assert.equal(C.filterQuestions(questions,{status:'mastered'},p).length,1);
assert.equal(C.filterQuestions(questions,{status:'starred'},p).length,1,'answering must preserve bookmarks');
assert.equal(p.questions[first.id].attempts,2);
assert.equal(p.questions[first.id].correct,1);
for(let i=0;i<30;i++) {
  const selected=C.shuffle(questions).slice(0,50);
  assert.equal(new Set(selected.map(q=>q.id)).size,50);
}
assert.equal(questions[0].id,first.id,'shuffle must not mutate source order');
assert.deepEqual(C.validProgress(JSON.parse(JSON.stringify(p)),questions,articles),p);
assert.throws(()=>C.validProgress({version:2},questions,articles));
const imported=C.validProgress({...p,history:[{id:'s1',mode:'exam',total:10,correct:1,finishedAt:'2026-10-23T00:00:00Z',pending:'<img onerror=alert(1)>'}]},questions,articles);
assert.equal(imported.history[0].pending,0,'imported history must discard nonnumeric counts');
console.log(`PASS: ${questions.length} questions, ${articles.length} articles; all 31 question sources / 8 reading sources, filters, non-repeating random selection, wrong-question recovery, bookmarks, backup validation.`);

// A removed duplicate must preserve progress and the meaning of an in-flight answer.
const oldId='q-425f77f52c485638', canonicalId='q-26bc662c5bf43b64';
assert.deepEqual(questionAliases,{[oldId]:{id:canonicalId,options:{A:'A',B:'C',C:'B',D:'D'}}});
assert.equal(questions.find(q=>q.id===canonicalId).sources.length,4);
assert.ok(!questions.some(q=>q.id===oldId));
const legacy=C.emptyProgress();
legacy.questions[canonicalId]={attempts:2,correct:2,lastResult:true,mastered:true,starred:false,updatedAt:'2026-10-23T08:00:00Z'};
legacy.questions[oldId]={attempts:3,correct:1,lastResult:false,mastered:false,starred:true,updatedAt:'2026-10-24T08:00:00Z'};
legacy.days={'2026-10-23':{attempts:2,correct:2},'2026-10-24':{attempts:3,correct:1}};
legacy.history=[{id:'old-exam',mode:'exam',total:2,correct:1,wrong:1,pending:0,skipped:0,startedAt:'2026-10-24T07:00:00Z',finishedAt:'2026-10-24T08:00:00Z'}];
legacy.session={id:'unfinished',mode:'exam',ids:[first.id,oldId,canonicalId],index:1,answers:{[oldId]:{selected:'B'},[canonicalId]:{}}};
const snapshot=JSON.stringify(legacy), migrated=C.migrateQuestionIds(legacy,questionAliases);
assert.equal(JSON.stringify(legacy),snapshot,'migration must not mutate its input');
assert.deepEqual(migrated.questions[canonicalId],{attempts:5,correct:3,lastResult:false,mastered:false,starred:true,updatedAt:'2026-10-24T08:00:00Z'});
assert.equal(migrated.questions[oldId],undefined);
assert.deepEqual(migrated.session.ids,[first.id,canonicalId]);
assert.equal(migrated.session.index,1);
assert.equal(migrated.session.answers[canonicalId].selected,'C','the previous B means have gone, now C');
assert.deepEqual(migrated.days,legacy.days);
assert.deepEqual(migrated.history,legacy.history,'historical attempts must not be deleted or counted again');
assert.deepEqual(C.migrateQuestionIds(migrated,questionAliases),migrated,'migration must be idempotent');
const restored=C.validProgress(migrated,questions,articles);
assert.deepEqual(restored.questions,migrated.questions,'old backups must retain the removed question’s progress');
assert.equal(C.filterQuestions(questions,{status:'wrong'},restored)[0].id,canonicalId);
assert.equal(C.filterQuestions(questions,{status:'starred'},restored)[0].id,canonicalId);
assert.equal(C.filterQuestions(questions,{status:'new',query:'I wish that I ____ with you last night.'},restored).length,0);
assert.equal(C.filterQuestions(questions,{query:'I wish that I ____ with you last night.'},p).length,1);
assert.deepEqual(C.migrateQuestionIds(null,questionAliases),null);
assert.deepEqual(C.migrateQuestionIds(p,questionAliases),p);
const lone=JSON.parse(snapshot);
delete lone.questions[canonicalId];
lone.session.ids=[oldId];lone.session.index=0;
assert.deepEqual(C.migrateQuestionIds(lone,questionAliases).questions[canonicalId],legacy.questions[oldId]);
assert.equal(C.migrateQuestionIds(lone,questionAliases).session.answers[canonicalId].selected,'C');
const finishedAttempt=JSON.parse(snapshot);
finishedAttempt.session.answers[canonicalId]={selected:'D',graded:true,correct:true,revealed:true};
assert.equal(C.migrateQuestionIds(finishedAttempt,questionAliases).session.answers[canonicalId].graded,true,'an already graded attempt must not be graded again');
finishedAttempt.questions[canonicalId].updatedAt='2026-10-25T08:00:00Z';
assert.equal(C.migrateQuestionIds(finishedAttempt,questionAliases).questions[canonicalId].lastResult,true,'latest result wins regardless of which ID it used');
console.log('PASS: option-order deduplication, merged sources, legacy bookmarks/wrong answers/counts, backup import, session answer remapping and repeat-safe migration.');

// Beginner learning must survive reload/export without turning assisted success into mastery.
const B=require('../dist/beginner.js');
const guides=B.lessons.flatMap(l=>l.items), qById=Object.fromEntries(questions.map(q=>[q.id,q]));
assert.equal(B.lessons.length,7);
assert.equal(guides.length,65);
assert.equal(new Set(guides.map(g=>g.id)).size,guides.length);
for(const lesson of B.lessons){
  assert.ok(lesson.mnemonic && lesson.rule && lesson.pitfall && lesson.exampleMeaning);
  for(const guide of lesson.items){
    assert.ok(qById[guide.id]?.options.length===4,guide.id);
    assert.equal(qById[guide.id].notes.length,0,'flagged original items must not become beginner rules');
    assert.ok(guide.clue && guide.reason);
  }
  for(let i=0;i<10;i++){
    const batch=B.batch(lesson,C.shuffle),ids=[...batch.guided,...batch.solo];
    assert.ok(batch.guided.length>0 && batch.guided.length<=5);
    assert.ok(batch.solo.length>0 && batch.solo.length<=5);
    assert.ok(!ids.includes(lesson.items[0].id),'worked example must not be tested');
    assert.equal(new Set(ids).size,ids.length,'solo questions must differ from guided questions');
    const s={mode:'beginner',stage:'guided',lessonId:lesson.id,ids:batch.guided,soloIds:batch.solo,answers:{},finishedAt:'2026-10-24T08:00:00Z'};
    assert.equal(B.validSession(s),true);
    assert.equal(B.validSession({...s,soloIds:batch.guided}),false);
    const bp=C.emptyProgress();B.finish(bp,s);
    assert.equal(bp.beginner.lessons[lesson.id],undefined,'an incomplete group must not finish a stage');
    s.answers=Object.fromEntries(s.ids.map(id=>[id,{graded:true,correct:true}]));B.finish(bp,s);
    assert.equal(bp.beginner.lessons[lesson.id].guided,s.finishedAt);
  }
}
const bp=C.emptyProgress(), id=guides[1].id, today=new Date(2026,9,24,10);
C.recordAnswer(bp,id,false);B.record(bp,{stage:'guided'},id,false,today);
assert.deepEqual(B.dueIds(bp,'2026-10-24'),[]);
assert.deepEqual(B.dueIds(bp,'2026-10-25'),[id]);
C.recordAnswer(bp,id,true,{assisted:true});B.record(bp,{stage:'guided'},id,true,today);
assert.equal(bp.questions[id].mastered,false);
assert.equal(bp.questions[id].lastResult,false,'hinted correct answer must not remove an earlier wrong answer');
B.record(bp,{stage:'solo'},id,true,today);
assert.deepEqual(B.dueIds(bp,'2026-10-25'),[id],'same-day retry must keep next-day review');
B.record(bp,{stage:'review'},id,true,new Date(2026,9,25,10));
assert.deepEqual(B.dueIds(bp,'2026-10-25'),[]);
C.recordAnswer(bp,id,true);
assert.equal(bp.questions[id].mastered,true);
B.record(bp,{stage:'review'},id,false,new Date(2026,11,31,10));
assert.equal(bp.beginner.review[id],'2027-01-01');
bp.beginner.lessons.praise={guided:'2026-10-24T08:00:00Z',solo:'2026-10-24T08:10:00Z'};
bp.history=[{id:'beginner-1',mode:'beginner',stage:'solo',total:3,correct:2,wrong:1,pending:0,skipped:0,startedAt:'2026-10-24T08:00:00Z',finishedAt:'2026-10-24T08:10:00Z'}];
const clean=C.validProgress(JSON.parse(JSON.stringify(bp)),questions,articles);
assert.deepEqual(clean.beginner,bp.beginner);
assert.deepEqual(clean.history,bp.history);
assert.equal(B.learnedIds(clean).length,8);
assert.deepEqual(B.validState({lessons:{unknown:{solo:'2026-10-24'}},review:{unknown:'2026-10-25',[id]:'invalid'}}),{lessons:{},review:{}});
assert.deepEqual(C.validProgress({...p,beginner:undefined},questions,articles).beginner,{lessons:{},review:{}},'old backups must remain compatible');
console.log('PASS: 7 beginner lessons / 65 curated items; disjoint practice stages, incomplete-stage handling, assisted grading, next-day review, legacy backups and learning progress roundtrip.');

// Regression: words from either language in the article body must be searchable.
const parenting='r-人文英语3-1-2';
const readingIds=query=>C.filterArticles(articles,{query}).map(a=>a.id);
assert.ok(readingIds('Parenting').includes(parenting));
assert.deepEqual(readingIds('  PARENTING  '),readingIds('parenting'));
assert.deepEqual(readingIds('Parenting   is\nhard.'),[parenting]);
assert.deepEqual(readingIds('养儿育女不容易'),[parenting]);
assert.deepEqual(readingIds('If you’re a parent'),readingIds("If you're a parent"));
assert.deepEqual(readingIds('Stop Yelling at Your Kids'),[parenting]);
assert.equal(readingIds('   ').length,articles.length);
assert.equal(readingIds('no_article_92839').length,0);
assert.equal(C.filterArticles(articles,{book:'管理英语3',query:'Parenting'}).length,0,'full text search must respect the selected textbook');
assert.equal(C.filterArticles(articles,{book:'人文英语3',query:'Parenting'}).length,2);
const parentingArticle=articles.find(a=>a.id===parenting);
assert.ok(C.articleExcerpt(parentingArticle,'Parenting').startsWith('Parenting is hard.'));
assert.ok(C.articleExcerpt(parentingArticle,'养儿育女不容易').includes('养儿育女不容易'));
assert.equal(C.articleExcerpt(parentingArticle,' '),'');
assert.ok(C.articleExcerpt(parentingArticle,'Parenting').length<=182);
console.log('PASS: reading full text search in English/Chinese, case/whitespace/quote normalization, multiple keywords, textbook filters, empty results and matching excerpts.');
