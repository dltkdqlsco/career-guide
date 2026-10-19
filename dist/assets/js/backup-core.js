'use strict';
// Local file validation and merge planning only. No storage writes or network.
window.RecordBackup = (() => {
  const format='one-step-career-workbook';
  const version=1;
  const maxBytes=10*1024*1024;
  const steps=window.COURSES.flatMap(course=>course.steps);
  const ids=steps.map(step=>step.id);
  const own=(obj,key)=>Object.prototype.hasOwnProperty.call(obj,key);
  const clone=obj=>JSON.parse(JSON.stringify(obj));
  const record=obj=>obj!==null&&typeof obj==='object'&&!Array.isArray(obj);
  function fail(message){throw new Error(message);}
  function keys(obj,allowed,label){
    if(!record(obj))fail(`${label} 형식이 올바르지 않습니다.`);
    if(Object.keys(obj).some(key=>!allowed.includes(key)))fail(`${label}에 현재 버전에서 지원하지 않는 항목이 있습니다.`);
  }
  function validRoute(route){
    if(typeof route!=='string')return false;
    const match=route.match(/^#course\/([^/]+)\/(0|[1-9]\d*)(?:\/(guide|example|write))?$/);
    return Boolean(match&&window.COURSES.some(course=>course.id===match[1]&&course.steps[Number(match[2])]));
  }
  function validateState(data){
    keys(data,['notes','worksheets','done','last','studio'],'기록');
    if(own(data,'studio')){if(!window.PromptStudio)fail('공통 정보 기능을 불러오지 못했습니다. 새로고침해 주세요.');PromptStudio.validate(data.studio);}
    keys(data.notes,ids,'메모');
    keys(data.done,ids,'완료 표시');
    keys(data.worksheets,Workbook.worksheetIds,'작성 양식');
    for(const value of Object.values(data.notes))if(typeof value!=='string')fail('메모는 문자열이어야 합니다.');
    for(const value of Object.values(data.done))if(typeof value!=='boolean')fail('완료 표시는 참 또는 거짓이어야 합니다.');
    for(const [id,sheet] of Object.entries(data.worksheets)){
      if(id===Workbook.verificationId){
        keys(sheet,['cards','custom'],'검증 양식');
        if(own(sheet,'custom')&&typeof sheet.custom!=='string')fail('검증 요청문은 문자열이어야 합니다.');
        if(own(sheet,'cards')){
          if(!Array.isArray(sheet.cards)||sheet.cards.length>Workbook.maxVerificationCards)fail(`검증 카드는 ${Workbook.maxVerificationCards}개 이하의 목록이어야 합니다.`);
          for(const card of sheet.cards){
            keys(card,Workbook.verificationFields.map(([key])=>key),'검증 카드');
            if(Object.values(card).some(value=>typeof value!=='string'))fail('검증 카드 내용은 문자열이어야 합니다.');
            if(own(card,'verdict')&&card.verdict!==''&&!Workbook.verdicts.some(([key])=>key===card.verdict))fail('지원하지 않는 검증 판단입니다.');
          }
        }
        continue;
      }
      if(id===Workbook.collectionId){
        keys(sheet,['cards'],'자료 수집 양식');
        if(own(sheet,'cards')){
          if(!Array.isArray(sheet.cards)||sheet.cards.length>Workbook.maxSourceCards)fail(`자료 카드는 ${Workbook.maxSourceCards}개 이하의 목록이어야 합니다.`);
          for(const card of sheet.cards){
            keys(card,Workbook.sourceFields.map(([key])=>key),'자료 카드');
            if(Object.values(card).some(value=>typeof value!=='string'))fail('자료 카드 내용은 문자열이어야 합니다.');
          }
        }
        continue;
      }
      const textKeys=Workbook.fields(id).map(([key])=>key);
      if(Workbook.isPrompt(id))textKeys.push('custom');
      const checkKeys=id==='0-2'?Workbook.checks.map(([key])=>key):[];
      keys(sheet,[...textKeys,...checkKeys],'작성 항목');
      for(const [key,value] of Object.entries(sheet)){
        if(textKeys.includes(key)&&typeof value!=='string')fail('작성 내용은 문자열이어야 합니다.');
        if(checkKeys.includes(key)&&typeof value!=='boolean')fail('최종 점검은 참 또는 거짓이어야 합니다.');
      }
    }
    if(data.last!==null&&!validRoute(data.last))fail('마지막 작성 위치가 올바르지 않습니다.');
    return data;
  }
  function withinSize(text){
    if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>maxBytes)fail('백업 파일은 10MB 이하의 JSON 파일이어야 합니다.');
  }
  function serialize(data,exportedAt=new Date().toISOString()){
    validateState(data);
    if(typeof exportedAt!=='string'||!Number.isFinite(Date.parse(exportedAt)))fail('백업 날짜가 올바르지 않습니다.');
    const text=JSON.stringify({format,version:own(data,'studio')?2:version,exportedAt,data},null,2);
    withinSize(text);
    return text;
  }
  function parse(text){
    withinSize(text);
    let backup;
    try{backup=JSON.parse(text.replace(/^\uFEFF/,''));}catch{fail('파일을 읽을 수 없습니다. 이 웹에서 내려받은 전체 기록 백업(.json)을 선택하세요.');}
    keys(backup,['format','version','exportedAt','data'],'백업 파일');
    if(backup.format!==format)fail('한 걸음 전체 기록 백업 파일이 아닙니다. 메모(.md) 파일은 복원할 수 없습니다.');
    if(backup.version!==version&&backup.version!==2)fail('현재 웹에서 지원하지 않는 백업 버전입니다. 파일을 만든 버전을 확인하세요.');
    if(typeof backup.exportedAt!=='string'||!Number.isFinite(Date.parse(backup.exportedAt)))fail('백업 날짜가 올바르지 않습니다.');
    validateState(backup.data);
    const warnings=[];
    for(const id of Workbook.worksheetIds){
      if(backup.data.done[id]===true&&Workbook.validate(id,backup.data.worksheets[id]||{})){
        backup.data.done[id]=false;
        warnings.push(id);
      }
    }
    return {...backup,warnings};
  }
  function snapshot(data,id){
    if(id==='$studio')return {studio:own(data,'studio')?clone(data.studio):null};
    const worksheet=data.worksheets[id]||{};
    const canonical=value=>Array.isArray(value)?value.map(canonical):record(value)?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
    const sorted=canonical(worksheet);
    return {note:own(data.notes,id)?data.notes[id]:null,worksheet:sorted,done:own(data.done,id)?data.done[id]:null};
  }
  function hasRecord(item){if(own(item,'studio'))return item.studio!==null;return item.note!==null||Object.keys(item.worksheet).length>0||item.done!==null;}
  function inspect(current,incoming){
    validateState(current);validateState(incoming);
    const rows=steps.flatMap(step=>{
      const before=snapshot(current,step.id),after=snapshot(incoming,step.id);
      if(!hasRecord(after))return [];
      const status=JSON.stringify(before)===JSON.stringify(after)?'same':hasRecord(before)?'conflict':'new';
      return [{id:step.id,title:step.title,before,after,status}];
    });
    if(own(incoming,'studio')){const before=snapshot(current,'$studio'),after=snapshot(incoming,'$studio');rows.push({id:'$studio',title:'공통 프로필·AI 설정·프롬프트 보관함 전체',before,after,status:JSON.stringify(before)===JSON.stringify(after)?'same':hasRecord(before)?'conflict':'new'});}
    return rows;
  }
  function merge(current,incoming,choices={},useLast=false){
    const rows=inspect(current,incoming);
    const next=clone(current);
    const applied=[];
    for(const row of rows){
      if(row.status==='same'||(row.status==='conflict'&&choices[row.id]!=='incoming'))continue;
      if(row.id==='$studio'){next.studio=clone(incoming.studio);applied.push(row.id);continue;}
      for(const group of ['notes','worksheets','done']){
        if(own(incoming[group],row.id))next[group][row.id]=clone(incoming[group][row.id]);
        else delete next[group][row.id];
      }
      applied.push(row.id);
    }
    if(useLast&&incoming.last)next.last=incoming.last;
    return {next,rows,applied,changed:JSON.stringify(current)!==JSON.stringify(next)};
  }
  function counts(data){
    return {
      notes:Object.values(data.notes).filter(value=>typeof value==='string'&&value.trim()).length,
      worksheets:Object.entries(data.worksheets).filter(([id,sheet])=>Workbook.exportText(id,sheet).trim()).length,
      done:Object.values(data.done).filter(value=>value===true).length
    };
  }
  return {format,version,maxBytes,validRoute,validateState,serialize,parse,snapshot,inspect,merge,counts};
})();
