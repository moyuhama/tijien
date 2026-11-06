(function(root) {
  'use strict';
  const emptyState = () => ({ attempts:{}, activeId:null, mode:'practice', section:0 });
  const blankAttempt = () => ({ answers:{}, selfScores:{}, submittedAt:null, startedAt:null });
  const object = x => x && typeof x === 'object' && !Array.isArray(x);
  function validState(value, papers = root.STUDY_PAPERS?.papers || []) {
    const clean=emptyState();
    if (!object(value)) return clean;
    if (papers.some(p=>p.id===value.activeId)) clean.activeId=value.activeId;
    if (value.mode==='memory') clean.mode='memory';
    if (Number.isInteger(value.section) && value.section>=0 && value.section<5) clean.section=value.section;
    for (const paper of papers) {
      const a=value.attempts?.[paper.id];
      if (!object(a)) continue;
      const next=blankAttempt();
      for (const q of paper.questions) {
        const v=a.answers?.[q.number];
        if (typeof v==='string' && (q.options.length ? q.options.some(o=>o.key===v) : v.length<=20000)) next.answers[q.number]=v;
        const score=a.selfScores?.[q.number];
        if ((!q.options.length || q.reviewRequired) && Number.isInteger(score) && score>=0 && score<=q.points) next.selfScores[q.number]=score;
      }
      for (const k of ['submittedAt','startedAt']) if (typeof a[k]==='string' && Number.isFinite(Date.parse(a[k]))) next[k]=a[k];
      if (!next.submittedAt) next.selfScores={};
      clean.attempts[paper.id]=next;
    }
    return clean;
  }
  const attempt = (state,paper) => state.attempts[paper.id] || blankAttempt();
  const answered = (paper,a) => paper.questions.filter(q=>(a.answers[q.number]||'').trim()).length;
  function select(state,paper,number,value) {
    if (state.mode!=='practice' || attempt(state,paper).submittedAt) return false;
    const q=paper.questions.find(q=>q.number===number);
    if (!q || typeof value!=='string' || value.length>20000 || q.options.length && !q.options.some(o=>o.key===value)) return false;
    const a=state.attempts[paper.id] ||= blankAttempt();
    a.startedAt ||= new Date().toISOString();
    a.answers[number]=value;
    return true;
  }
  function displayedAnswer(state,paper,q) {
    return state.mode==='memory' ? q.answer : (attempt(state,paper).answers[q.number]||'');
  }
  function submit(state,paper) {
    if (state.mode!=='practice') return false;
    const a=state.attempts[paper.id] ||= blankAttempt();
    if (a.submittedAt) return false;
    a.startedAt ||= new Date().toISOString();
    a.submittedAt=new Date().toISOString();
    return true;
  }
  function selfGrade(state,paper,number,points) {
    const q=paper.questions.find(q=>q.number===number),a=attempt(state,paper);
    if(state.mode!=='practice' || !a.submittedAt || !q || q.options.length && !q.reviewRequired || !Number.isInteger(points) || points<0 || points>q.points)return false;
    a.selfScores[number]=points;
    return true;
  }
  function score(paper,a) {
    let earned=0, assessed=0, pending=0, correct=0, wrong=0, skipped=0;
    for(const q of paper.questions) {
      const answer=a.answers[q.number];
      if(!answer?.trim()) skipped++;
      if (!q.options.length || q.reviewRequired) {
        if(Number.isInteger(a.selfScores[q.number])) { earned+=a.selfScores[q.number]; assessed+=q.points; }
        else pending++;
      } else {
        assessed+=q.points;
        if(answer===q.answer) {earned+=q.points;correct++;}
        else if(answer) wrong++;
      }
    }
    return { earned,assessed,pending,correct,wrong,skipped,answered:answered(paper,a) };
  }
  const api={emptyState,validState,blankAttempt,attempt,answered,select,displayedAnswer,submit,selfGrade,score};
  root.StudyPapersCore=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
