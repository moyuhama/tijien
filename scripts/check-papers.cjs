'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=JSON.parse(fs.readFileSync(path.join(__dirname,'../content/papers.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/papers-data.js'),'utf8'),context);
assert.deepEqual(JSON.parse(JSON.stringify(context.window.STUDY_PAPERS)),source,'rebuild paper data after edits');
const {papers}=source,PC=require('../dist/papers-core.js');
assert.equal(papers.length,3);
assert.equal(new Set(papers.map(p=>p.id)).size,3);
for(const p of papers){
  assert.equal(p.questions.length,75);
  assert.deepEqual(p.questions.map(q=>q.number),Array.from({length:75},(_,i)=>i+1));
  assert.equal(new Set(p.questions.map(q=>q.stem+'|'+JSON.stringify(q.options))).size,75);
  assert.equal(p.questions.reduce((sum,q)=>sum+q.points,0),100);
  assert.deepEqual([0,1,2,3,4].map(i=>p.questions.filter(q=>q.section===i).length),[10,30,15,10,10]);
  for(const q of p.questions){
    assert.ok(q.stem && q.answer && q.explanation && q.source);
    assert.equal(q.options.length,q.number<=65?4:0);
    if(q.options.length){assert.deepEqual(q.options.map(o=>o.key),['A','B','C','D']);assert.ok(q.options.some(o=>o.key===q.answer));}
    if(q.number>=41&&q.number<=65)assert.ok(p.passages.some(a=>a.id===q.passageId&&a.questionNumbers.includes(q.number)));
  }
  assert.equal(p.passages.length,4);
  assert.deepEqual(p.passages.flatMap(a=>a.questionNumbers),Array.from({length:25},(_,i)=>i+41));
  for(const a of p.passages){
    assert.ok(a.title && a.paragraphs.every(x=>typeof x==='string' && x.length>25));
    assert.ok(a.paragraphs.every(x=>/[.!?:”"]$/.test(x.trim())),'truncated paragraph: '+a.title);
    assert.ok(!/IAE|Ф|##/.test(a.paragraphs.join(' ')),'remove OCR noise');
  }
  assert.deepEqual([...p.passages.find(a=>a.id==='cloze').paragraphs.join(' ').matchAll(/\[(\d+)\]/g)].map(x=>+x[1]),Array.from({length:10},(_,i)=>i+56));
  const s=PC.emptyState();s.activeId=p.id;
  assert.equal(PC.displayedAnswer(s,p,p.questions[0]),'');
  PC.select(s,p,1,'D');PC.select(s,p,66,'My own translation.');
  const original=JSON.stringify(s.attempts);
  s.mode='memory';
  for(const q of p.questions)assert.equal(PC.displayedAnswer(s,p,q),q.answer);
  assert.equal(PC.select(s,p,1,'A'),false);assert.equal(PC.submit(s,p),false);
  assert.equal(PC.selfGrade(s,p,66,2),false);
  assert.equal(JSON.stringify(s.attempts),original,'memory must not write answers or scores');
  s.mode='practice';assert.equal(PC.displayedAnswer(s,p,p.questions[0]),'D');
  assert.equal(PC.displayedAnswer(s,p,p.questions[65]),'My own translation.');
  assert.equal(PC.select(s,p,1,'Z'),false);
  for(const q of p.questions)PC.select(s,p,q.number,q.options.length?q.answer:'My own translation.');
  assert.equal(PC.submit(s,p),true);assert.equal(PC.submit(s,p),false);
  assert.equal(PC.select(s,p,2,'A'),false,'submitted answers are locked');
  const a=PC.attempt(s,p),pending=p.questions.filter(q=>!q.options.length||q.reviewRequired);
  assert.equal(PC.score(p,a).pending,pending.length);
  for(const q of pending){
    assert.equal(PC.selfGrade(s,p,q.number,q.points+1),false);
    assert.equal(PC.selfGrade(s,p,q.number,q.points),true);
  }
  assert.equal(PC.score(p,a).earned,100);assert.equal(PC.score(p,a).assessed,100);assert.equal(PC.score(p,a).pending,0);
  s.section=4;
  assert.deepEqual(PC.validState(JSON.parse(JSON.stringify(s)),papers),s,'refresh/import must retain answers, position and self-assessments');
}
assert.equal(papers[0].questions[43].answer,'C');
assert.equal(papers[1].questions[24].reviewRequired,true);
assert.equal(papers[1].questions[33].reviewRequired,true);
assert.equal(papers[0].questions[57].reviewRequired,true);
const empty=PC.emptyState(),s=PC.emptyState(),one=papers[0],two=papers[1];
PC.select(s,one,1,'A');PC.select(s,two,1,'C');
assert.equal(PC.attempt(s,one).answers[1],'A');assert.equal(PC.attempt(s,two).answers[1],'C');
s.mode='memory';s.activeId=two.id;s.section=2;
globalThis.STUDY_PAPERS=source;
const C=require('../dist/core.js'),progress=C.emptyProgress();progress.papers=s;
assert.deepEqual(C.validProgress(JSON.parse(JSON.stringify(progress)),[],[]).papers,s,'paper progress must survive the existing backup flow');
assert.deepEqual(C.validProgress({...progress,papers:undefined},[],[]).papers,empty,'legacy backup compatibility');
const invalid=PC.validState({mode:'evil',activeId:'unknown',section:99,attempts:{[one.id]:{answers:{1:'Z',66:12},selfScores:{1:999},submittedAt:'x'},unknown:{answers:{}}}},papers);
assert.equal(invalid.activeId,null);assert.equal(invalid.mode,'practice');assert.equal(invalid.section,0);
assert.deepEqual(invalid.attempts[one.id],PC.blankAttempt());assert.equal(invalid.attempts.unknown,undefined);
const missing=PC.blankAttempt(),r=PC.score(one,missing);
assert.equal(r.earned,0);assert.equal(r.skipped,75);assert.equal(r.pending,21);
PC.select(s,one,1,'B'); // Memory guard remains in force.
assert.equal(PC.attempt(s,one).answers[1],'A');
// Validate rendered controls for every section of every paper without replacing browser QA.
context.window.StudyPapersCore=PC;
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../dist/papers-ui.js'),'utf8'),context);
let state=PC.emptyState();
const ui=context.window.StudyPapersUI.create({state:()=>state,save(){},render(){},dialog(){}});
for(const paper of papers){
  state.activeId=paper.id;
  for(let section=0;section<5;section++){
    state.section=section;state.mode='practice';
    const practice=ui.view();
    assert.equal((practice.match(/class="paper-explanation"/g)||[]).length,0,'answers must be hidden before submission');
    assert.equal((practice.match(/<input[^>]*\bchecked\b/g)||[]).length,0);
    state.mode='memory';
    const memory=ui.view(),qs=paper.questions.filter(q=>q.section===section);
    assert.equal((memory.match(/<input[^>]*\bchecked\b/g)||[]).length,qs.filter(q=>q.options.length).length);
    assert.equal((memory.match(/class="paper-explanation"/g)||[]).length,qs.length);
    assert.ok(!memory.includes('data-paper-action="submit"'));
    assert.ok(!memory.includes('data-paper-action="grade"'));
  }
}
console.log('PASS: 3 complete papers / 225 questions; article/cloze integrity, isolated attempts, default-selected memory answers, hidden practice answers, grading, self-assessment, reload/backup validation and rendered controls.');
