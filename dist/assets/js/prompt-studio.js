'use strict';
// Pure data operations for shared information, editable prompt snapshots and backups.
window.PromptStudio=(()=>{
  const clone=value=>JSON.parse(JSON.stringify(value));
  const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
  const validId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);
  const courseIds=['company','essay','portfolio','interview'];
  const sources=['profile','rule','category','custom'];
  const kinds=['profile','role','format','tone','language','length','rules','custom','task','input'];
  const newId=()=>`p${Date.now().toString(36)}${Math.random().toString(36).slice(2,10)}`;
  const field=(key,label,type='text',options=[],group='education')=>({key,label,type,options,group});
  const fields=[
    field('major','전공 분야','select',[],'basic'),field('jobs','희망 직무','multi',[],'basic'),field('industries','관심 산업','multi',[],'basic'),field('stacks','기술 스택','multi',[],'basic'),
    field('school','학교명'),field('additionalMajor','복수전공·부전공'),field('degree','최종 학력','select',['고등학교','전문학사','학사','석사','박사','기타']),field('graduation','졸업 여부','select',['재학','휴학','졸업 예정','졸업','수료','중퇴']),field('graduationDate','졸업·졸업 예정일','date'),field('gpa','학점·만점 기준'),field('majorGpa','전공 학점·만점 기준'),field('training','직무 교육·이수 과정','textarea'),
    field('languages','사용 가능한 언어','multi',[],'skills'),field('frameworks','프레임워크·라이브러리','multi',[],'skills'),field('tools','개발·협업 도구','multi',['Git','GitHub','GitLab','Jira','Notion','Slack','Figma','Postman','VS Code','IntelliJ IDEA'],'skills'),field('databases','데이터베이스','multi',['MySQL','PostgreSQL','Oracle','SQL Server','MongoDB','Redis','SQLite','Elasticsearch'],'skills'),field('cloud','클라우드','multi',['AWS','Azure','Google Cloud','Naver Cloud','Cloudflare'],'skills'),field('os','운영체제','multi',['Linux','Windows','macOS','Android','iOS'],'skills'),field('technicalExperience','기술별 사용 범위·확인 자료','textarea',[],'skills'),
    field('companies','희망·관심 기업','text',[],'career'),field('regions','희망 근무 지역','multi',['서울','경기','인천','대전','세종','부산','대구','광주','울산','강원','충북','충남','전북','전남','경북','경남','제주','해외','원격 근무','지역 무관'],'career'),field('seniority','신입·경력','select',['신입','경력','인턴','무관'],'career'),field('years','경력 연차','text',[],'career'),field('specialty','관심 직무의 세부 분야','text',[],'career'),field('stage','현재 준비 단계','select',['진로 탐색','기업·직무 조사','서류 준비','지원 중','면접 준비','최종 결정'],'career'),
    field('internships','인턴십·현장실습 경험','textarea',[],'experience'),field('collaboration','팀 프로젝트·협업 경험','textarea',[],'experience'),
    field('certificates','보유 자격증','textarea',[],'activities'),field('plannedCertificates','취득 예정 자격증','textarea',[],'activities'),field('languageScores','어학 능력·공인 성적','textarea',[],'activities'),field('awards','수상 경력','textarea',[],'activities'),field('activities','대외활동·공모전·해커톤·연구','textarea',[],'activities'),field('other','기타 취업 정보','textarea',[],'activities'),
    field('strengths','강점','textarea',[],'personal'),field('weaknesses','보완할 점','textarea',[],'personal'),field('problemSolving','문제 해결 경험','textarea',[],'personal'),field('conflicts','갈등 해결 경험','textarea',[],'personal'),field('motivation','직무 선택 계기','textarea',[],'personal'),field('goals','입사 후 목표·커리어 방향','textarea',[],'personal')
  ];
  function empty(){return {profile:{},rules:[],folders:[],prompts:[],drafts:{},preferences:{}};}
  function assert(ok,message='공통 정보·프롬프트 보관함 형식이 올바르지 않습니다.'){if(!ok)throw new Error(message);}
  function keys(value,allowed){assert(record(value));assert(Object.keys(value).every(key=>allowed.includes(key)));}
  function text(value){return typeof value==='string'&&value.length<=10*1024*1024;}
  function strings(value){return Array.isArray(value)&&value.length<=200&&value.every(text);}
  function validateBlock(block){
    keys(block,['id','source','ref','kind','title','body','enabled']);
    assert(validId(block.id)&&sources.includes(block.source)&&text(block.ref)&&kinds.includes(block.kind)&&text(block.title)&&text(block.body)&&typeof block.enabled==='boolean');
  }
  function validateDraft(draft){
    keys(draft,['courseId','stepId','blocks','manual','name','folderId','sourcePromptId']);
    assert(courseIds.includes(draft.courseId)&&typeof draft.stepId==='string'&&window.COURSES.some(c=>c.id===draft.courseId&&c.steps.some(step=>step.id===draft.stepId)));
    assert(Array.isArray(draft.blocks)&&draft.blocks.length<=200);draft.blocks.forEach(validateBlock);
    assert(new Set(draft.blocks.map(block=>block.id)).size===draft.blocks.length);
    assert(draft.manual===null||text(draft.manual));assert(text(draft.name)&&text(draft.folderId)&&(draft.sourcePromptId===null||validId(draft.sourcePromptId)));
  }
  function validate(data){
    keys(data,['profile','rules','folders','prompts','drafts','preferences']);
    keys(data.profile,[...fields.map(f=>f.key),'levels','projects']);
    for(const f of fields)if(f.key in data.profile)assert(f.type==='multi'?strings(data.profile[f.key]):text(data.profile[f.key]));
    if(data.profile.levels!==undefined){assert(record(data.profile.levels));assert(Object.entries(data.profile.levels).length<=400);for(const [name,value] of Object.entries(data.profile.levels))assert(text(name)&&['상','중','하','미평가'].includes(value));}
    if(data.profile.projects!==undefined){assert(Array.isArray(data.profile.projects)&&data.profile.projects.length<=100);for(const project of data.profile.projects){keys(project,['id','name','period','role','technologies','results','evidence']);assert(validId(project.id));for(const key of ['name','period','role','technologies','results','evidence'])assert(text(project[key]));}assert(new Set(data.profile.projects.map(p=>p.id)).size===data.profile.projects.length);}
    assert(Array.isArray(data.rules)&&data.rules.length<=200);for(const rule of data.rules){keys(rule,['id','title','body','kind','categories','origin']);assert(validId(rule.id)&&text(rule.title)&&text(rule.body)&&kinds.includes(rule.kind)&&Array.isArray(rule.categories)&&rule.categories.every(c=>courseIds.includes(c))&&['custom','ai'].includes(rule.origin));}
    assert(Array.isArray(data.folders)&&data.folders.length<=200);for(const folder of data.folders){keys(folder,['id','name']);assert(validId(folder.id)&&text(folder.name)&&folder.name.trim());}
    assert(Array.isArray(data.prompts)&&data.prompts.length<=2000);for(const prompt of data.prompts){keys(prompt,['id','name','folderId','courseId','stepId','blocks','manual','sourcePromptId','createdAt','updatedAt']);assert(validId(prompt.id)&&text(prompt.createdAt)&&text(prompt.updatedAt));const draft={...prompt};delete draft.id;delete draft.createdAt;delete draft.updatedAt;validateDraft(draft);}
    for(const list of [data.rules,data.folders,data.prompts])assert(new Set(list.map(item=>item.id)).size===list.length);
    for(const prompt of data.prompts)assert(prompt.folderId===''||data.folders.some(f=>f.id===prompt.folderId),'존재하지 않는 폴더를 참조한 프롬프트가 있습니다.');
    assert(record(data.drafts)&&Object.keys(data.drafts).length<=300);for(const [id,draft] of Object.entries(data.drafts)){assert(validId(id));validateDraft(draft);assert(draft.folderId===''||data.folders.some(f=>f.id===draft.folderId));}
    assert(record(data.preferences));for(const [course,pref] of Object.entries(data.preferences)){assert(courseIds.includes(course));keys(pref,['profileKeys','ruleIds']);assert(strings(pref.profileKeys)&&strings(pref.ruleIds));}
    return data;
  }
  function clean(data){return clone(validate(data));}
  function profileEntries(profile){
    const entries=fields.flatMap(f=>{
      const value=profile[f.key],body=Array.isArray(value)?value.join(', '):value;
      if(typeof body!=='string'||!body.trim())return [];
      const levels=f.key==='languages'||f.key==='stacks'?(value||[]).filter(name=>typeof profile.levels?.[name]==='string'&&profile.levels[name]!=='미평가').map(name=>`${name}: ${profile.levels[name]} (자기평가)`).join('\n'):'';
      return [{ref:f.key,title:f.label,body:body+(levels?'\n'+levels:''),group:f.group}];
    });
    for(const p of profile.projects||[])if([p.name,p.role,p.results].some(v=>v.trim()))entries.push({ref:'project:'+p.id,title:p.name||'프로젝트',group:'experience',body:[['프로젝트',p.name],['수행 기간',p.period],['내 역할',p.role],['사용 기술·환경',p.technologies],['주요 성과',p.results],['확인 자료·한계',p.evidence]].filter(([,v])=>v.trim()).map(([k,v])=>`${k}: ${v}`).join('\n')});
    return entries;
  }
  function recommended(course,entry){
    const common=['major','jobs','industries','stacks','languages','companies','seniority','specialty'];
    if(common.includes(entry.ref))return true;
    if(entry.ref.startsWith('project:'))return course!=='company';
    return ({company:['career','skills'],essay:['personal','experience'],portfolio:['skills','experience'],interview:['personal','experience','skills']}[course]||[]).includes(entry.group);
  }
  function block(source,ref,title,body,kind='input',enabled=true){return {id:newId(),source,ref,title,body,kind,enabled};}
  function defaults(courseId,stepId,worksheet={}){
    const catalog=window.PDFContent?.lessons[stepId],lesson=window.CareerLessons?.lessons[stepId],all=window.Workbook.fields(stepId);
    const inputKeys=lesson?.inputs||(stepId==='1-4'?['target','sources']:stepId==='1-7'?['target','posting','experience','comparison']:all.filter(f=>!['review','original','verdict'].includes(f[0])&&!window.PDFContent?.hidden(stepId,f[0])).map(f=>f[0]));
    const blocks=[block('category','task','작업 요청',catalog?.request||lesson?.task||'제공한 자료로 이 단계의 작업을 도와주세요.','task')];
    if(stepId==='1-3'||stepId==='1-5'){
      const cards=stepId==='1-3'?Workbook.sourceCards(worksheet):Workbook.verificationCards(worksheet);
      for(const [index,card] of cards.entries())for(const [key,label] of all)if(typeof card[key]==='string'&&card[key].trim()&&!window.PDFContent?.hidden(stepId,key))blocks.push(block('category',`card-${index}-${key}`,`${index+1}. ${label}`,card[key]));
      if(!cards.length)blocks.push(block('category','materials','이번에 사용할 자료','','input'));
    }else for(const key of inputKeys){const f=all.find(f=>f[0]===key);if(f&&!window.PDFContent?.hidden(stepId,key))blocks.push(block('category',key,f[1],worksheet[key]||'',key==='format'?'format':'input'));}
    if(catalog?.output)blocks.push(block('category','output','출력 방법',catalog.output.map((v,i)=>`${i+1}. ${v}`).join('\n'),'format'));
    if(catalog?.checks)blocks.push(block('category','checks','검토 기준',catalog.checks.map(v=>'- '+v).join('\n'),'rules'));
    return {courseId,stepId,blocks,manual:typeof worksheet.custom==='string'?worksheet.custom:null,name:'',folderId:'',sourcePromptId:null};
  }
  function fromSource(source,entry){return block(source,entry.ref||entry.id,entry.title,entry.body,source==='profile'?'profile':entry.kind||'custom');}
  function newDraft(data,courseId,stepId,worksheet={}){
    const draft=defaults(courseId,stepId,worksheet),pref=data.preferences[courseId];
    if(pref){
      const selected=profileEntries(data.profile).filter(e=>pref.profileKeys.includes(e.ref)).map(e=>fromSource('profile',e));
      selected.push(...data.rules.filter(rule=>pref.ruleIds.includes(rule.id)&&rule.body.trim()&&(!rule.categories.length||rule.categories.includes(courseId))).map(rule=>fromSource('rule',rule)));
      draft.blocks.splice(1,0,...selected.slice(0,Math.max(0,200-draft.blocks.length)));
    }
    return draft;
  }
  function compose(draft){return draft.blocks.filter(b=>b.enabled&&b.body.trim()).map(b=>`[${b.title.trim()||'항목'}]\n${b.body}`).join('\n\n');}
  function output(draft){return typeof draft.manual==='string'?draft.manual:compose(draft);}
  function savedDraft(prompt){const {courseId,stepId,blocks,manual,name,folderId,id}=prompt;return clone({courseId,stepId,blocks,manual,name,folderId,sourcePromptId:id});}
  function store(data,draft,replace=false,now=new Date().toISOString()){
    validateDraft(draft);assert(draft.name.trim(),'프롬프트 이름을 입력해 주세요.');assert(output(draft).trim(),'저장할 프롬프트 내용을 입력하거나 항목을 선택해 주세요.');
    assert(draft.folderId===''||data.folders.some(f=>f.id===draft.folderId),'저장할 폴더를 다시 선택해 주세요.');
    const old=replace?data.prompts.find(p=>p.id===draft.sourcePromptId):null;if(replace)assert(old,'원본이 삭제되었습니다. 새 프롬프트로 저장해 주세요.');
    const prompt={...clone(draft),id:old?.id||newId(),name:draft.name.trim(),sourcePromptId:null,createdAt:old?.createdAt||now,updatedAt:now};
    if(old)data.prompts[data.prompts.indexOf(old)]=prompt;else{assert(data.prompts.length<2000,'보관 가능한 프롬프트 수를 초과했습니다.');data.prompts.push(prompt);}
    return prompt;
  }
  function duplicate(data,id){const original=data.prompts.find(p=>p.id===id);assert(original,'프롬프트를 찾을 수 없습니다.');const draft=savedDraft(original);draft.name+=' 복사';return store(data,draft);}
  function removeFolder(data,id){data.folders=data.folders.filter(f=>f.id!==id);for(const prompt of data.prompts)if(prompt.folderId===id)prompt.folderId='';for(const draft of Object.values(data.drafts))if(draft.folderId===id)draft.folderId='';}
  function diagnostics(draft,data){
    const enabled=draft.blocks.filter(b=>b.enabled&&b.body.trim()),messages=[],seen=new Map();
    for(const b of enabled){const key=b.body.replace(/\s+/g,' ').trim();if(seen.has(key))messages.push(`‘${seen.get(key)}’와 ‘${b.title}’의 내용이 같습니다. 하나를 제외할 수 있어요.`);else seen.set(key,b.title);}
    for(const kind of ['format','tone','language','length']){const matches=enabled.filter(b=>b.kind===kind);if(new Set(matches.map(b=>b.body.trim())).size>1)messages.push(`${{format:'출력 형식',tone:'문체',language:'응답 언어',length:'분량'}[kind]} 조건이 여러 개입니다. 함께 적용할 수 있는지 확인하세요.`);}
    const current=new Map(profileEntries(data.profile).map(e=>['profile:'+e.ref,e]));for(const r of data.rules)current.set('rule:'+r.id,r);
    const updates=draft.blocks.filter(b=>['profile','rule'].includes(b.source)).flatMap(b=>{const now=current.get(b.source+':'+b.ref);return !now?[{id:b.id,missing:true,title:b.title}]:now.body!==b.body||now.title!==b.title?[{id:b.id,missing:false,title:b.title,entry:now}]:[];});
    return {messages,updates};
  }
  function describe(data){if(!data)return '공통 정보·프롬프트 보관함 기록 없음';return [
    '[공통 프로필]',...profileEntries(data.profile).map(e=>`${e.title}\n${e.body}`),'[공통 AI 설정]',...data.rules.map(r=>`${r.title}\n${r.body}`),'[폴더]',...data.folders.map(f=>f.name),'[저장한 프롬프트]',...data.prompts.map(p=>`${p.name}\n${output(p)}`),`작성 중인 프롬프트: ${Object.keys(data.drafts).length}개`
  ].join('\n\n');}
  return {clone,newId,courseIds,fields,empty,validate,clean,profileEntries,recommended,block,fromSource,defaults,newDraft,compose,output,savedDraft,store,duplicate,removeFolder,diagnostics,describe};
})();
