(function (root) {
  'use strict';
  // Explicitly curated against the existing bank. Re-importing data.js does not rewrite these lessons.
  const lessons = [
    {
      id:'praise', title:'别人夸你，先接住好意', category:'交际用语', minutes:5,
      mnemonic:'别人夸我说谢谢，夸我做饭说高兴。',
      rule:'听到 beautiful、great、excellent 等赞美，通常先感谢对方；如果夸你招待得好，也可以说“很高兴你喜欢”。',
      pitfall:'先判断是谁在感谢谁。Thank you 是“谢谢你”；You’re welcome 是“不客气”，通常用于回应感谢。不要用贬低自己来回应赞美。',
      exampleMeaning:'你今天戴的帽子真漂亮！——谢谢，你这么说真好。',
      items:[
        ['q-c9f3d55decbeda12','beautiful hat：对方在夸你的帽子。','Thanks 接受赞美；Not at all 常用于回应感谢，Never mind 常用于安慰或回应道歉，Oh, no 在这里不合适。'],
        ['q-69288c5976767e2e','won the first prize：对方在祝贺你获奖。','先用 Thank you very much 感谢祝贺，再说自己仍有不足。You are welcome 用于别人向你道谢。'],
        ['q-fc14b98e58f8bfc2','wonderful dinner：客人在夸主人准备的晚餐。','I’m glad you enjoyed it 表示“你们喜欢，我很高兴”；不用否认自己做得好。'],
        ['q-f8ffa9fbdae6c3c0','Well done 和 writing is good：对方在夸你的写作。','Thank you 自然接受赞美；其余选项在回避或否认赞美。'],
        ['q-dad093ca53e1c65d','beautiful necklace：对方在夸你的项链。','先 Thank you，再介绍礼物来源。Not at all 和 You’re welcome 都不是这里的感谢。'],
        ['q-44982adc85168372','look really smart：对方在夸你穿西装很好看。','Thanks. I’m glad you like it 礼貌接住赞美；其余选项显得冷淡、怀疑或否认。'],
        ['q-7bef3ba3ba951f91','so talented：对方在夸女儿有绘画天赋。','Thank you. She really loves painting 先感谢，再补充她喜欢画画，和后文每天练习相接。'],
        ['q-ce542f2e81a054b7','speech ... excellent：对方在赞美你的演讲。','Thank you for saying so 表示感谢夸奖；No problem、Never mind、That’s all right 都没有接住这份赞美。'],
        ['q-3da5ff00202d49a1','sweet voice 和 sing really well：对方在夸你唱歌。','Oh, thank you 礼貌回应。后面谈上声乐课，适合自然接受赞美后再说明。']
      ]
    },
    {
      id:'thanks', title:'别人谢你，回答不客气', category:'交际用语', minutes:5,
      mnemonic:'别人谢我不客气，乐意帮忙也可以。',
      rule:'先认出 Thank you / Thanks。常用回应有 You’re welcome（不客气）、My pleasure（乐意效劳）、Don’t mention it（别客气）。',
      pitfall:'No, thanks 是“不了，谢谢”，用于婉拒；Never mind 常回应道歉或让人别介意。这道题要回应的是感谢。',
      exampleMeaning:'感谢你所有的辛勤付出！——不客气！',
      items:[
        ['q-d333608dfef63d27','Thank you for ...：别人感谢你付出的劳动。','You’re welcome 正好回应感谢；No, thanks 是拒绝好意，不是“不客气”。'],
        ['q-fdad54238300afd7','Thank you for the beautiful gift：对方感谢你的礼物。','My pleasure 表示乐意为对方做这件事。That’s right 表示“没错”，All right 表示“好的”，都不如它切合感谢。'],
        ['q-889910f1cba266f8','It’s very kind of you：虽没有 thank you，也是感谢你送机。','No trouble at all 表示“一点也不麻烦”，和顺路的解释相接。其他选项带有责怪或拒绝。'],
        ['q-334e68e6454479f9','Thank you ... polishing my resume：对方感谢你润色简历。','My pleasure 回应感谢，和后面“有需要再找我”一致；Never mind 常用于让人别介意。'],
        ['q-bd4199615e6b86f1','Thank you for lending ...：对方感谢你借伞。','You’re welcome 表示不客气。催还、索要人情和 What a shame（真遗憾）都不合此处。'],
        ['q-8a356089185939e6','Thanks ... helping me move：对方感谢你帮忙搬家。','Don’t mention it 意为“不用客气”，和“朋友就是这样”相接，不要按字面理解成禁止提起。'],
        ['q-e84d475edcf86312','Thanks for correcting ...：对方感谢你改报告。','Glad to help 表示乐意帮忙。后文愿意继续帮忙，排除责怪、推卸和不耐烦的回应。'],
        ['q-8f41a4176664b078','Thank you ... putting me up：对方感谢你留宿招待。','It was a pleasure having you 表示“很高兴你来做客”，和欢迎再来一致；其余选项显得不情愿或索要费用。']
      ]
    },
    {
      id:'ing', title:'先认搭配，再选 -ing', category:'词汇与语法', minutes:7,
      mnemonic:'避免介意忍不住，习惯盼望做事难，后接动作常用 ing。',
      rule:'这句口诀对应 avoid / mind / can’t help doing；be used to / look forward to doing；have trouble (in) doing。doing 指动词的 -ing 形式，如 taking、eating。介词后接动作，也通常用 -ing。',
      pitfall:'要认完整搭配：be used to doing 是“习惯做”；used to do 是“过去常做”。look forward to 里的 to 是介词，不能把所有 to 都当成后接原形的标志。',
      exampleMeaning:'医生建议老人避免在日常饮食中摄入过多盐。',
      items:[
        ['q-02c1be67d115fa8b','空格紧跟 avoid，意思是“避免做某事”。','avoid 后用 taking；不是 to take、take 或 taken。句首 advised 不直接管这个空，要看紧挨空格的搭配。'],
        ['q-2fe077c4d56c7b81','have trouble 后说“还清债务有困难”。','have trouble (in) doing 对应 paying off；这里是自己还债，不用被动形式 being paid off。'],
        ['q-beaa985795d24959','were not used to：不习惯用筷子吃饭。','be used to doing 对应 eating。别和 used to eat（过去常吃）混淆；这里有 were，且描述习惯。'],
        ['q-aa169e4014813e31','looking forward to：一直盼望收到你的回复。','to 是这个搭配里的介词，后接 receiving。主语主动收到回复，不用 being received（被收到）。'],
        ['q-68f1db8dff8d082c','mind 后接“我叫你 Jenny 这件事”。','mind doing；my calling 把“我叫你”看成一件事，my 表示动作发出者。不是 mind to call。'],
        ['q-c67348fc5776270e','forgot about：忘了“我邀请他”这件事。','介词 about 后接 my asking。my 标明是谁邀请；不能直接接 me to ask 或 me ask。'],
        ['q-99adea20f892bcf6','can’t help：看搞笑节目时“忍不住”笑。','can’t help doing 对应 laughing。这里不是“不能帮忙”，所以不要按 help 后接原形的另一种用法选。']
      ]
    },
    {
      id:'request', title:'建议、要求、命令：找原形', category:'虚拟语气', minutes:8,
      mnemonic:'建议要求和命令，that 从句用原形；否定前加 not，被动还要 be。',
      rule:'当 suggest / require / insist / demand / order 等表达建议、要求或命令时，that 后的动作可写成“should + 动词原形”，should 可以省略。原形就是 take、have、be 这样的基本形式。若表示“被修改”等被动意思，用 (should) be + 过去分词，如 be revised。',
      pitfall:'必须看意思。suggest 表示“暗示、表明”，或 insist 表示“坚持说某个事实”时，不能直接套本口诀。主句是过去时，也不代表空格就用过去式。',
      exampleMeaning:'他的医生建议他去国外短途旅行。',
      items:[
        ['q-019e0f795ee6daff','doctor suggested that：医生是在提出建议。','从句用 (should) take，故选 take。will take、would take、took 都不符合这里的建议句式。'],
        ['q-a4f4ea82b12a651d','suggested that 后，空格后面已经有原形 use。','这里缺的是可保留的 should，组合成 should use；不要再填另一个时态助动词。'],
        ['q-f38e14b30742c1ed','医生建议“不要去那里”：建议句的否定形式。','用 (should) not go，省略 should 后是 not go。not went、won’t go、not to go 都不是这个结构。'],
        ['q-8f7a1899382b898c','The law requires that：法律要求每个人检查车辆。','用 (should) have。即使主语 everyone 是单数，也不把 have 改成 has。'],
        ['q-26e3dba88e93d7c3','insists that ... no more books：图书管理员要求先还书再借书。','表达要求，用 (should) take，故选 take。别因 John 是单数就选 takes。'],
        ['q-aac121b92c3d5e2c','insisted that：他要求大家一点钟到办公室。','be 是原形，结构是 we all (should) be。不能在 that 从句里用 to be 代替谓语。'],
        ['q-d3eec4c7a23864ea','teacher suggested that：老师建议学生写作文。','that 从句用 write；their 对应复数 students。选带 write 和 their 的完整表达。'],
        ['q-feeea5f9f30781c5','insisting that every applicant：要求每个申请人提供文凭。','should have 是 should + 原形 have。这里 have 表示“有”，后面接 diplomas，不是完成时。'],
        ['q-9a43aad91b55d6a4','committee suggested that：委员会建议预算在财年结束前被修改。','先用建议句式 (should) + 原形，再看预算是“被修改”，所以用 be revised。is revised、was revised、has been revised 都不符合此处句式。'],
        ['q-6a59eee58fce1945','principal demanded that：校长要求学生道歉。','用 (should) apologize。主句 demanded 是过去式，从句的原形不随它变成 apologized。'],
        ['q-fede6f829c8c93da','doctor insisted that：医生要求病人接受全面检查。','用 (should) undergo。病人“接受检查”在英语里可主动说 undergo an examination，不需要为它加过去式或第三人称 -s。'],
        ['q-2410f884c9a8a6b6','officer ordered that：军官命令士兵离村。','用 (should) leave。left 是过去式，leaving 是 -ing 形式，would leave 也不是这里的命令句式。']
      ]
    },
    {
      id:'wish-now', title:'wish：现在想变，往后退一格', category:'虚拟语气', minutes:5,
      mnemonic:'wish 想改现在，动词退到过去。',
      rule:'wish 后说与现在事实相反的愿望，用过去式表达“但愿现在……”。例如 have 变 had；本题库的正式虚拟表达中，be 用 were。过去式在这里不表示发生在过去。',
      pitfall:'先看愿望指向什么时间。现在的遗憾用过去式；已经发生的过去遗憾用 had + 过去分词。不要看到 wish 就一律选 had done。',
      exampleMeaning:'我希望我现在能和她在一起（实际没有）。',
      items:[
        ['q-f73b06d36f701279','wish 和 now：希望“现在”在她身边。','现在的非真实愿望，本题正式考试句式选 were。am 是普通现在陈述；would be 不用于这里单纯表达当前状态的愿望。口语里也能见到 was，本题按正式虚拟表达选择。'],
        ['q-514044947a272820','right now：希望“现在”是百万富翁。','正式虚拟句式用 were。had been 指向过去；would be 不是本题表达当前身份愿望的形式。'],
        ['q-4d3106885aab13c2','wish ... in the countryside rather than ... city：希望当前生活地点不同。','用 lived 表示与现在相反的愿望。had lived 会把遗憾推向过去；live 是普通现在式。'],
        ['q-8d68f9cc34a531fd','deadline is ... away：眼下时间不够，希望现在多一点时间。','have 的过去式 had 表达当前愿望。这里的 had 后面直接接 time，是“有”，不是 had + 过去分词的过去完成结构。']
      ]
    },
    {
      id:'wish-past', title:'wish：过去后悔，认 had done', category:'虚拟语气', minutes:8,
      mnemonic:'wish 后悔已过去，had 加过去分词记。',
      rule:'后悔过去已经发生或没发生的事，用 had + 过去分词。例如 had read（早就读过）、had gone（当时去了）；否定用 hadn’t + 过去分词。过去分词有规则变化和不规则变化，不能一律加 -ed。',
      pitfall:'先判断“当时做了没有、希望做了没有”，再判断肯定或否定。had had 也可以正确：第一个 had 构成结构，第二个是 have（有）的过去分词。',
      exampleMeaning:'我很喜欢这部电影，真希望之前读过它改编自的那本书。',
      items:[
        ['q-9d7a2dd1c3be76b8','已经看了电影，遗憾之前没有读原著。','用 had read 表示“但愿当时读过”。have read 是现在完成式，不符合这份对过去的遗憾。'],
        ['q-2589edbf9aa9eb1d','left ... last night：昨晚确实早走了，现在希望当时没早走。','用否定的 hadn’t left。didn’t leave 是一般过去式；haven’t left 是现在完成式。'],
        ['q-108e2c9a1ad616fe','would have enjoyed the concert：遗憾当时头痛，没能好好欣赏。','希望当时“没有头痛”：hadn’t had a headache。第二个 had 是 have 的过去分词，不能省掉。'],
        ['q-41bad4d1d2a5509f','last night：后悔昨晚没有参加音乐会。','用 had attended。只写 attended 少了表达过去遗憾的 had；have attended 不是这里的结构。'],
        ['q-0a2a1d90e666ac0d','展览已经把我无聊坏了：希望当时没有去。','用 had not gone。先确定“没去”的否定意义，再找 had + 过去分词，排除其他时态。'],
        ['q-bd75ba6aa3f9be76','have found ... wish：已经见过生父母，有些人后悔那次经历。','希望当时没有那段经历，用 hadn’t had the experience。只有 hadn’t 会缺少表示“有过”的动词。'],
        ['q-5de395ee0dbd7328','last Friday 和 reckless decision：后悔上周五做了鲁莽决定。','希望当时没做，用 hadn’t made。didn’t make 不能表达这里 wish 后的过去遗憾。'],
        ['q-5efb683f2c384dc2','when I was younger：遗憾年轻时没有留学机会。','用 had had the chance。前一个 had 是结构，后一个 had 表示“有”的过去分词。'],
        ['q-367774ce6f4f849e','forgot to make the call：已经忘了打电话，希望当时记得警告他。','用 had remembered。remembered 单独是一般过去式；have remembered 是现在完成式。'],
        ['q-cb70924d22af5880','burning them：信已烧掉，现在希望当时保留下来。','用 had kept。kept 是 keep 的过去分词，和 had 一起表达过去的遗憾。'],
        ['q-1e8f3d55ea15b72e','last Monday：后悔上周一把演讲交给实习生。','希望当时自己做了演讲，用 had delivered。delivered 单独不够，would deliver 指向的也不是这种过去遗憾。']
      ]
    },
    {
      id:'if-past', title:'如果当时……本来就会……', category:'虚拟语气', minutes:8,
      mnemonic:'如果当时 had done，本来会做 would have done。',
      rule:'当条件和结果都与过去事实相反：if 这半句用 had + 过去分词；结果这半句用 would / could / might + have + 过去分词。could 偏“能够”，might 偏“可能”。先认空格在哪半句。',
      pitfall:'只适用于条件与结果都指过去的情形。如果题目是“要是当时……现在就……”，属于混合时间，不能整句照搬。had had 表示“当时有过”，不是重复写错。',
      exampleMeaning:'如果他当时听了我的建议，就不会失去工作了。',
      items:[
        ['q-566613a0cdc1efe6','结果是 wouldn’t have lost；空格在 if 条件句里。','条件指过去，用 had followed。would follow 不该放在本题 if 条件句里。'],
        ['q-5e77726e4172c97e','早来几分钟、见到他，都说的是刚才未发生的过去。','if 里用 had come，结果用 would have met。两半句都要表达过去，不能只退一半。'],
        ['q-cfc22928ea360d1d','If you had told me：条件已经用了 had told，空格在结果句。','结果用 would have met。have 后要过去分词 met，不能写 would had met 或 would have meet。'],
        ['q-891204195f55245f','结果 would have been called off：比赛当时本会取消。','if 里用 had rained 表示过去的假设。would have rained 不适合本题条件句。'],
        ['q-010fb57ebb9f32bc','would have gone：本来会去开会；空格在 if 后说当时有没有时间。','用 had had time。第一个 had 构成过去假设，第二个 had 是 have（有）的过去分词。'],
        ['q-38bb62378f42c9fb','Why didn’t ... / would have bought：当时没有买车。','if 后用 had had enough money，表达假如当时有足够的钱。只用 had 不能对应此处的过去条件。'],
        ['q-9e6edca6be32cb7c','they’d ... let us know earlier：假如他们当时早告诉我们。','结果用 we’d have met，即 we would have met。we’d meet 缺少表达过去结果的 have + 过去分词。'],
        ['q-38b94268ed2da03b','might have failed：当时可能失败；实际你帮了我们。','假设“当时没帮”，if 里用 had not given；given 是 give 的过去分词。'],
        ['q-7389cdb2a7cd70f1','would have bought：本来会买更大的车，条件是当时有钱。','if 后用 had had the money。had、owned、possessed 单独都是过去式，未构成这里的过去假设。'],
        ['q-375968f49a2191b9','couldn’t go ... / would have enjoyed：遗憾当时没去法国。','if 后用 she’d gone，即 she had gone。she’d go 是 she would go，与这里过去条件不符。'],
        ['q-a725fc097649f812','would not have survived：救助和获救都发生在过去。','if it had not been for ... 表示“要不是当时有……”。were not 常用于现在的非真实条件。'],
        ['q-a1673272b1c85d49','could have dived：假设当时本来能够跳入水中。','if 后用 had been。been 是 be 的过去分词；were 单独不能对应这个过去条件。'],
        ['q-c78fdf6baf771e2e','yesterday 和 would have been：昨天赶车和准时到达都未实现。','if 后用 had caught。caught 是 catch 的过去分词；has caught 是现在完成式。'],
        ['q-b127b3bde9edcad3','If ... had been lighter yesterday：条件指昨天，空格在结果句。','用 would have arrived。would arrive 少了 have，不能表达这里本会发生的过去结果。']
      ]
    }
  ].map(lesson => ({...lesson, items:lesson.items.map(([id,clue,reason])=>({id,clue,reason}))}));
  const stages = Object.assign(Object.create(null), {guided:'带提示练',solo:'独立做',mixed:'混合练',review:'错题复习'});
  const lessonById = Object.assign(Object.create(null), Object.fromEntries(lessons.map(l=>[l.id,l])));
  const guideById = Object.assign(Object.create(null), Object.fromEntries(lessons.flatMap(l=>l.items.map(item=>[item.id,{...item,lessonId:l.id}]))));
  function batch(lesson, shuffle) {
    const pool=shuffle(lesson.items.slice(1).map(item=>item.id));
    const n=Math.min(5,pool.length-1);
    return {guided:pool.slice(0,n),solo:pool.slice(n,n+5)};
  }
  function nextDay(now = new Date()) {
    const date=new Date(now);date.setDate(date.getDate()+1);
    return root.StudyCore.dateKey(date);
  }
  function dueIds(progress, today = root.StudyCore.dateKey()) {
    return Object.entries(progress.beginner?.review || {}).filter(([id,date])=>guideById[id] && date<=today).map(([id])=>id);
  }
  function learnedIds(progress) {
    return lessons.filter(l=>progress.beginner?.lessons[l.id]?.solo).flatMap(l=>l.items.slice(1).map(i=>i.id));
  }
  function record(progress,s,id,correct,now = new Date()) {
    const b=progress.beginner ||= {lessons:{},review:{}};
    if(!correct)b.review[id]=nextDay(now);
    else if(s.stage!=='guided' && b.review[id] <= root.StudyCore.dateKey(now))delete b.review[id];
  }
  function finish(progress,s) {
    if(!lessonById[s.lessonId] || !['guided','solo'].includes(s.stage) || s.ids.some(id=>!s.answers[id]?.graded))return;
    const lesson=progress.beginner.lessons[s.lessonId] ||= {};
    lesson[s.stage]=s.finishedAt;
  }
  function validState(value) {
    const clean={lessons:{},review:{}};
    for(const [id,state] of Object.entries(value?.lessons || {})) {
      if(!lessonById[id] || !state || typeof state!=='object')continue;
      clean.lessons[id]={};
      for(const stage of ['guided','solo'])if(typeof state[stage]==='string' && !Number.isNaN(Date.parse(state[stage])))clean.lessons[id][stage]=state[stage];
    }
    for(const [id,date] of Object.entries(value?.review || {}))if(guideById[id] && typeof date==='string' && /^\d{4}-\d{2}-\d{2}$/.test(date))clean.review[id]=date;
    return clean;
  }
  function validSession(s) {
    if(!stages[s.stage] || !s.ids.every(id=>guideById[id]))return false;
    if(['mixed','review'].includes(s.stage))return true;
    const lesson=lessonById[s.lessonId];
    const allowed=new Set(lesson?.items.slice(1).map(i=>i.id));
    if(!lesson || !s.ids.every(id=>allowed.has(id)))return false;
    return s.stage==='solo' || Array.isArray(s.soloIds) && s.soloIds.length>0 && new Set(s.soloIds).size===s.soloIds.length && s.soloIds.every(id=>allowed.has(id) && !s.ids.includes(id));
  }
  const api={lessons,lessonById,guideById,stages,batch,nextDay,dueIds,learnedIds,record,finish,validState,validSession};
  if(typeof module!=='undefined')module.exports=api;
  root.StudyBeginner=api;
})(typeof window==='undefined'?globalThis:window);
