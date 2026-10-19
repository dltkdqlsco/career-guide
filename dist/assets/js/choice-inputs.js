'use strict';
// Keep the existing string fields and backup format. Only this explicit envelope
// is parsed: old prose remains intact in the details editor until the user edits it.
window.ChoiceInputs=(()=>{
  const catalogs={
    industry:['IT·소프트웨어','인터넷·플랫폼','게임','금융·핀테크','제조·전자','반도체','자동차·모빌리티','유통·커머스','물류·운송','의료·바이오','교육','미디어·콘텐츠','건설·부동산','에너지·환경','공공·비영리'],
    job:['백엔드 개발','프론트엔드 개발','풀스택 개발','모바일 앱 개발','게임 개발','데이터 분석','데이터 엔지니어링','AI·머신러닝','클라우드·DevOps','정보보안','QA·테스트','임베디드·펌웨어','서비스 기획·PM','디자인·UX/UI','마케팅','영업·사업개발','인사·총무','재무·회계','고객 운영'],
    level:['신입','경력','인턴','무관'],
    major:['컴퓨터공학·소프트웨어','인공지능·데이터사이언스','정보통신','전기·전자공학','수학·통계학','기계·로봇공학','산업공학','경영·경제','디자인','인문·사회','자연과학','전공 없음·비전공'],
    language:['Java','Python','JavaScript','TypeScript','Kotlin','Swift','C','C++','C#','Go','Rust','Dart','PHP','Ruby','R','SQL','아직 정하지 않음'],
    stack:['Java','Python','JavaScript','TypeScript','Kotlin','Swift','C','C++','C#','Go','Rust','Dart','PHP','Ruby','R','SQL','HTML/CSS','Spring Boot','Django','FastAPI','Flask','Node.js','Express','NestJS','React','Next.js','Vue','Nuxt','Svelte','Angular','Flutter','React Native','Unity','Unreal Engine','MySQL','PostgreSQL','Oracle','SQL Server','MongoDB','Redis','Elasticsearch','AWS','Azure','Google Cloud','Docker','Kubernetes','Linux','Git','GitHub Actions','Jenkins','Terraform','Kafka','RabbitMQ','TensorFlow','PyTorch','Figma'],
    tool:['ChatGPT','Claude','Gemini','Perplexity','아직 선택하지 않음'],
    task:['최신 기업·산업 정보 조사','확보한 자료 요약','공고와 내 경험 비교','기업 분석 결과 정리'],
    format:['개요','항목별 목록','비교표','완성 문단','질문과 답변'],
    portfolio:['PPT·PDF','Notion','웹사이트','영상']
  };
  const pick=(name,label,type,multiple=false)=>({name,label,options:catalogs[type],multiple});
  function config(id,key){
    if(id.startsWith('0-'))return null;
    if(id.startsWith('2-')&&key==='question')return {items:[pick('job','희망 직종','job')],detail:'지원 기업·문항 원문·분량·추가 조건'};
    if(key==='target'){
      const items=[pick('job','희망 직종','job')];
      if(['1-0','1-2','1-4','1-6','1-7','1-8','3-0','4-0','4-3'].includes(id))items.unshift(pick('industry','업종','industry'));
      if(['1-0','1-6','1-7','4-0'].includes(id))items.push(pick('level','채용 수준','level'));
      return {items,detail:'기업명·프로젝트·추가 조건'};
    }
    if(key==='experience'&&['1-2','1-8','3-0'].includes(id))return {items:[pick('major','전공 분야','major'),pick('language','주 언어','language'),pick('stack','기술 스택','stack',true)],detail:'실제 경험·역할·사용 범위와 근거'};
    if(id==='3-2'&&key==='inventory')return {items:[pick('stack','기술 스택','stack',true),pick('language','주 언어','language')],detail:'기술별 분류·직접 사용 범위와 확인 자료'};
    if(id==='1-6'&&key==='technologies')return {items:[pick('stack','공고에 명시된 기술','stack',true)],detail:'공고 원문·기술이 사용되는 맥락·미확인 내용'};
    if(id==='1-1'&&key==='tool')return {items:[pick('tool','사용할 도구','tool')],detail:'선택 이유·확인한 기능'};
    if(id==='1-1'&&key==='task')return {items:[pick('task','이번에 할 작업','task')],detail:'작업 범위·추가 요청'};
    if(id==='1-2'&&key==='format')return {items:[pick('format','결과 형식','format')],detail:'구성 순서·분량·언어·문체'};
    if(id==='3-7'&&key==='choice')return {items:[pick('portfolio','주 양식','portfolio')],detail:'보조 자료·선택 이유'};
    return null;
  }
  const opening='[선택 정보]\n',divider='\n[상세 내용]\n';
  function decode(value,definition){
    const empty={values:{},detail:value};
    if(!value.startsWith(opening))return empty;
    const cut=value.indexOf(divider,opening.length);if(cut<0)return empty;
    const values={};let current=null;
    for(const line of value.slice(opening.length,cut).split('\n')){
      if(line.startsWith('- ')){
        if(!current||!line.slice(2).trim()||(!current.multiple&&values[current.name].length))return empty;
        values[current.name].push(line.slice(2));
      }else{
        if(current&&!values[current.name].length)return empty;
        current=definition.items.find(item=>line===item.label+':');
        if(!current||values[current.name])return empty;
        values[current.name]=[];
      }
    }
    if(!current||!values[current.name].length)return empty;
    return {values,detail:value.slice(cut+divider.length)};
  }
  function encode(data,definition){
    const lines=definition.items.filter(item=>data.values[item.name]?.length).map(item=>`${item.label}:\n${data.values[item.name].map(value=>'- '+value).join('\n')}`);
    return lines.length?opening+lines.join('\n')+divider+data.detail:data.detail;
  }
  function render(id,field,index,required,value,exampleHTML){
    const [key,label,help,example]=field,definition=config(id,key),data=decode(value,definition);
    return `<div class="field-block choice-field"><div class="choice-heading" id="label-${key}"><span class="field-number">${String(index+1).padStart(2,'0')}</span>${esc(label)} <span class="required-text">${required?'필수':'선택'}</span></div><p id="help-${key}">${esc(help)}</p><div role="group" aria-labelledby="label-${key}" aria-describedby="help-${key}"><div class="choice-grid">${definition.items.map(item=>{
      const selected=data.values[item.name]||[],custom=!item.multiple&&selected.length&&!item.options.includes(selected[0]),base=`choice-${key}-${item.name}`;
      return `<div class="choice-control"><label for="${base}">${esc(item.label)}${item.multiple?' · 여러 개 선택':''}</label><select id="${base}" data-choice-select="${key}" data-choice-name="${item.name}"><option value="">${item.multiple?'선택해서 추가':'선택하지 않음'}</option>${item.options.map(option=>`<option value="${esc(option)}" ${!item.multiple&&selected[0]===option?'selected':''}>${esc(option)}</option>`).join('')}<option value="__custom__" ${custom?'selected':''}>직접 입력</option></select><div class="choice-custom" id="${base}-custom" ${custom?'':'hidden'}><label class="sr-only" for="${base}-text">${esc(item.label)} 직접 입력</label><input type="text" id="${base}-text" data-choice-custom="${key}" data-choice-name="${item.name}" value="${esc(custom?selected[0]:'')}" placeholder="목록에 없는 ${esc(item.label)}">${item.multiple?`<button class="secondary" type="button" data-choice-add="${key}" data-choice-name="${item.name}">추가</button>`:''}</div>${item.multiple?`<ul class="choice-tags" id="${base}-tags" aria-label="선택한 ${esc(item.label)}"></ul><span id="${base}-status" class="sr-only" role="status"></span>`:''}</div>`;
    }).join('')}</div><label class="choice-detail-label" for="detail-${key}">${esc(definition.detail)}</label><textarea id="detail-${key}" data-choice-detail="${key}" rows="4" placeholder="예: ${esc(example)}">${esc(data.detail)}</textarea></div><textarea id="field-${key}" data-field="${key}" hidden aria-hidden="true" tabindex="-1">${esc(value)}</textarea>${exampleHTML}</div>`;
  }
  function bind(id,refresh){
    const editors=new Map();
    document.querySelectorAll('[data-choice-detail]').forEach(detail=>{
      const key=detail.dataset.choiceDetail,definition=config(id,key),canonical=document.querySelector(`#field-${key}`),data=decode(worksheetData(id)[key]||'',definition);
      const commit=()=>{const value=encode(data,definition);canonical.value=value;saveWorksheet(id,key,value);refresh();};
      editors.set(key,{data,definition,commit});
      detail.oninput=()=>{data.detail=detail.value;commit();};
      // No UI replacement during Korean composition. Saving is independent of rendering.
      for(const item of definition.items)if(item.multiple)renderTags(key,item,data,commit);
    });
    function renderTags(key,item,data,commit){
      const list=document.querySelector(`#choice-${key}-${item.name}-tags`);
      list.innerHTML=(data.values[item.name]||[]).map((value,index)=>`<li><span>${esc(value)}</span><button type="button" data-remove-choice="${index}" aria-label="${esc(value)} 선택 해제">×</button></li>`).join('');
      list.querySelectorAll('[data-remove-choice]').forEach(button=>button.onclick=()=>{
        const index=Number(button.dataset.removeChoice);data.values[item.name].splice(index,1);renderTags(key,item,data,commit);commit();
        document.querySelector(`#choice-${key}-${item.name}`).focus({preventScroll:true});
      });
    }
    function add(key,item,value){
      const editor=editors.get(key),text=value.trim();if(!text)return false;
      const values=editor.data.values[item.name]||[];
      if(values.includes(text)){setText(`#choice-${key}-${item.name}-status`,`${text}은 이미 선택했습니다.`);return false;}
      editor.data.values[item.name]=[...values,text];renderTags(key,item,editor.data,editor.commit);editor.commit();
      setText(`#choice-${key}-${item.name}-status`,`${text} 추가됨`);return true;
    }
    document.querySelectorAll('[data-choice-select]').forEach(select=>{
      const key=select.dataset.choiceSelect,{data,definition,commit}=editors.get(key),item=definition.items.find(item=>item.name===select.dataset.choiceName);
      select.onchange=()=>{
        const custom=select.value==='__custom__',box=document.querySelector(`#${select.id}-custom`),input=document.querySelector(`#${select.id}-text`);box.hidden=!custom;
        if(custom){if(!item.multiple){data.values[item.name]=input.value.trim()?[input.value.trim()]:[];commit();}input.focus({preventScroll:true});return;}
        if(item.multiple){add(key,item,select.value);select.value='';}
        else{data.values[item.name]=select.value?[select.value]:[];commit();}
      };
    });
    document.querySelectorAll('[data-choice-custom]').forEach(input=>{
      const key=input.dataset.choiceCustom,{data,definition,commit}=editors.get(key),item=definition.items.find(item=>item.name===input.dataset.choiceName);
      if(!item.multiple)input.oninput=()=>{data.values[item.name]=input.value.trim()?[input.value.trim()]:[];commit();};
      else{
        const button=document.querySelector(`[data-choice-add="${key}"][data-choice-name="${item.name}"]`);
        button.onclick=()=>{if(add(key,item,input.value))input.value='';input.focus({preventScroll:true});};
        input.onkeydown=event=>{if(event.key==='Enter'&&!event.isComposing){event.preventDefault();button.onclick();}};
      }
    });
  }
  return {catalogs,config,decode,encode,render,bind};
})();
