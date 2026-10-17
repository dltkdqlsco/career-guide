'use strict';
let pendingBackup=null;
let backupReadToken=0;
const recoveryKey='one-step-career-workbook-v1-before-import';

function clearBackupPreview(){pendingBackup=null;backupReadToken++;}
function downloadLocalFile(text,name,type){
  const url=URL.createObjectURL(new Blob([text],{type}));
  const link=document.createElement('a');
  link.href=url;link.download=name;link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function downloadFullBackup(){
  try{
    const text=RecordBackup.serialize(state);
    downloadLocalFile(text,`한걸음-전체기록-${new Date().toISOString().replace(/[:.]/g,'-')}.json`,'application/json;charset=utf-8');
    notify('전체 기록 백업을 내려받았습니다. 개인 정보가 포함될 수 있으니 안전하게 보관하세요.');
  }catch(error){notify(error.message);}
}
function downloadRecoveryBackup(){
  try{
    const text=localStorage.getItem(recoveryKey);
    if(!text){notify('아직 불러오기 직전 보호본이 없습니다.');return;}
    RecordBackup.parse(text);
    downloadLocalFile(text,'한걸음-불러오기직전-보호본.json','application/json;charset=utf-8');
    notify('불러오기 직전 기록을 내려받았습니다. 필요하면 이 파일을 다시 불러오세요.');
  }catch{notify('보호본을 읽을 수 없습니다. 현재 기록은 변경하지 않았습니다.');}
}
function backupPage(){
  nav('backup');$('#breadcrumb').innerHTML='나의 워크스페이스 <span>/</span> 백업·복원';
  const totals=RecordBackup.counts(state);
  $('#main').innerHTML=`<div class="page-heading"><div><div class="eyebrow">KEEP YOUR PROGRESS</div><h1>내 기록, 안전하게 보관하기.</h1><p class="sub">기기를 바꾸거나 브라우저 기록을 지우기 전에, 내 작성 내용을 파일로 남겨두세요.</p></div><span class="badge">내 기기에서만 처리</span></div>
  <div class="backup-summary" aria-label="현재 보관 중인 기록"><div><strong>${totals.notes}</strong><span>자유 메모</span></div><div><strong>${totals.worksheets}</strong><span>작성한 양식</span></div><div><strong>${totals.done}</strong><span>완료한 단계</span></div></div>
  <div class="backup-grid"><section class="panel backup-card"><span class="eyebrow">01 · SAVE</span><h2>전체 기록 백업</h2><p>메모, 작성 양식, 직접 고친 프롬프트, 완료 표시와 마지막 작성 위치를 JSON 파일 하나에 담습니다.</p><button class="primary" id="export-backup" type="button">전체 기록 백업 (.json) ↓</button><div class="fine-divider"></div><p>글만 읽거나 다른 문서에 옮기려면 Markdown으로 내려받으세요. Markdown은 복원용 파일이 아닙니다.</p><button class="secondary" id="export-markdown" type="button">메모 문서 내려받기 (.md)</button></section>
  <section class="panel backup-card"><span class="eyebrow">02 · RESTORE</span><h2>백업 파일 불러오기</h2><p>파일을 선택하면 먼저 내용을 비교합니다. 확인 버튼을 누르기 전에는 현재 기록이 바뀌지 않습니다.</p><label class="note-label" for="backup-file">이 웹에서 내려받은 전체 기록 백업</label><input id="backup-file" type="file" accept=".json,application/json" aria-describedby="backup-file-help"><p id="backup-file-help" class="tiny">10MB 이하의 .json 파일 · 서버 업로드 없음</p><p id="backup-file-status" class="backup-feedback" role="status" aria-live="polite"></p><div class="fine-divider"></div><p>불러오기를 적용하기 직전의 기록 1개를 이 브라우저에 보호본으로 보관합니다. 다음 불러오기 때 이전 보호본은 교체됩니다.</p><button class="secondary" id="export-recovery" type="button">불러오기 직전 보호본 내려받기</button></section></div>
  <section id="restore-preview" aria-label="불러오기 미리보기"></section>
  <div class="review-banner"><span>ⓘ</span><div>백업 파일은 암호화되지 않은 개인 기록입니다. 공용 기기나 공개 폴더에 보관하지 마세요. 브라우저 데이터 삭제 시 보호본도 사라지므로 중요한 기록은 파일로 내려받아 두세요.</div></div>`;
  $('#export-backup').onclick=downloadFullBackup;
  $('#export-markdown').onclick=download;
  $('#export-recovery').onclick=downloadRecoveryBackup;
  $('#backup-file').onchange=event=>readBackupFile(event.target.files?.[0]);
}
async function readBackupFile(file){
  clearBackupPreview();
  const token=backupReadToken;
  Viewport.keep(()=>{$('#restore-preview').innerHTML='';$('#backup-file-status').textContent='';});
  if(!file)return;
  $('#backup-file-status').textContent='파일을 확인하고 있습니다…';
  try{
    if(file.size>RecordBackup.maxBytes)throw new Error('파일이 너무 큽니다. 10MB 이하의 백업 파일을 선택하세요.');
    const data=RecordBackup.parse(await file.text());
    if(token!==backupReadToken||location.hash!=='#backup')return;
    const stored=localStorage.getItem(storageKey);
    if(stored!==persistedSnapshot)throw new Error('다른 탭에서 저장한 기록이 있습니다. 새로고침해 최신 기록을 확인한 뒤 다시 불러오세요.');
    pendingBackup={data,name:file.name,baseline:JSON.stringify(state),stored,choices:{},useLast:!state.last&&Boolean(data.data.last)};
    renderRestorePreview();
    $('#backup-file-status').textContent='파일을 확인했습니다. 아래 미리보기를 검토해 주세요. 아직 적용되지 않았습니다.';
  }catch(error){
    if(token!==backupReadToken||location.hash!=='#backup')return;
    pendingBackup=null;
    $('#backup-file-status').textContent=`${error.message} 현재 기록은 변경하지 않았습니다.`;
  }
}
function backupStepText(item,id){
  const pieces=[`완료 표시: ${item.done===true?'완료':'미완료'}`];
  if(item.note!==null)pieces.push(`[자유 메모]\n${item.note||'(빈 메모)'}`);
  const sheet=Workbook.exportText(id,item.worksheet);
  if(sheet)pieces.push(sheet);
  if(Workbook.isPrompt(id)&&item.worksheet.custom==='')pieces.push('[완성 프롬프트]\n(직접 비워 둔 상태)');
  return pieces.join('\n\n');
}
function renderRestorePreview(){
  return Viewport.keep(updateRestorePreview);
}
function updateRestorePreview(){
  if(!pendingBackup)return;
  const {data,name,choices,useLast}=pendingBackup;
  const plan=RecordBackup.merge(state,data.data,choices,useLast);
  const count=status=>plan.rows.filter(row=>row.status===status).length;
  const warning=data.warnings.map(id=>allSteps.find(step=>step.id===id).title);
  $('#restore-preview').innerHTML=`<section class="restore-panel"><div class="eyebrow">REVIEW BEFORE RESTORING</div><h2>어떤 기록을 가져올까요?</h2><p class="backup-filename">${esc(name)}</p><p class="tiny">백업 생성 시각: ${esc(new Date(data.exportedAt).toLocaleString('ko-KR'))}</p><div class="restore-counts"><span>새 기록 ${count('new')}개</span><span>다른 내용 ${count('conflict')}개</span><span>동일한 기록 ${count('same')}개</span></div>
  <p>백업에만 있는 단계는 추가하고, 같은 단계에 다른 내용이 있으면 <strong>현재 기록 유지</strong>가 기본입니다. 파일에 없는 단계는 건드리지 않습니다.</p>
  ${warning.length?`<div class="review-banner"><span>ⓘ</span><div>작성 항목 또는 최종 점검이 부족해 다음 단계의 백업 완료 표시를 해제했습니다: ${esc(warning.join(', '))}. 내용은 보존됩니다.</div></div>`:''}
  <div class="restore-records">${plan.rows.map(row=>`<details class="restore-record" ${row.status==='conflict'?'open':''}><summary><span class="badge ${row.status==='conflict'?'pending':''}">${{new:'새 기록',conflict:'선택 필요',same:'동일'}[row.status]}</span>${esc(row.title)}</summary><div class="restore-record-body">${row.status==='conflict'?`<fieldset><legend>이 단계의 기록 선택</legend><label><input type="radio" name="restore-${row.id}" data-restore-id="${row.id}" value="current" ${choices[row.id]!=='incoming'?'checked':''}>현재 기록 유지</label><label><input type="radio" name="restore-${row.id}" data-restore-id="${row.id}" value="incoming" ${choices[row.id]==='incoming'?'checked':''}>이 단계만 백업 내용으로 교체</label><p class="tiny">교체하면 이 단계의 메모·작성 양식·완료 표시가 모두 파일 내용으로 바뀝니다. 백업에 없는 작성칸도 비워질 수 있으니 양쪽 내용을 확인하세요.</p></fieldset>`:''}<div class="restore-comparison">${row.status==='conflict'?`<section><h3>현재 기록</h3><pre>${esc(backupStepText(row.before,row.id))}</pre></section>`:''}<section><h3>백업 파일의 기록</h3><pre>${esc(backupStepText(row.after,row.id))}</pre></section></div></div></details>`).join('')||'<p>이 파일에는 메모·작성 양식·완료 기록이 없습니다.</p>'}</div>
  <label class="restore-location"><input id="restore-last" type="checkbox" ${useLast?'checked':''} ${data.data.last?'':'disabled'}>백업의 마지막 작성 위치도 가져오기${data.data.last?` <span class="tiny">${esc(backupLocationLabel(data.data.last))}</span>`:' (저장된 위치 없음)'}</label>
  <div class="output-actions"><button id="apply-restore" class="primary" type="button" ${plan.changed?'':'disabled'}>${plan.applied.length}개 단계 반영${useLast&&state.last!==data.data.last?' + 작성 위치':''}</button><button id="cancel-restore" class="secondary" type="button">불러오기 취소</button></div><p id="restore-result" class="backup-feedback" role="status" aria-live="polite"></p><p class="tiny">기존 기록을 교체하는 경우 한 번 더 확인합니다. 저장에 실패하면 현재 기록을 유지합니다.</p></section>`;
  document.querySelectorAll('[data-restore-id]').forEach(input=>input.onchange=event=>{
    pendingBackup.choices[event.target.dataset.restoreId]=event.target.value;
    updateRestoreButton();
  });
  $('#restore-last').onchange=event=>{pendingBackup.useLast=event.target.checked;updateRestoreButton();};
  $('#apply-restore').onclick=applyRestore;
  $('#cancel-restore').onclick=()=>Viewport.keep(()=>{
    clearBackupPreview();$('#restore-preview').innerHTML='';$('#backup-file').value='';
    $('#backup-file-status').textContent='불러오기를 취소했습니다. 현재 기록은 그대로입니다.';
  });
}
function backupLocationLabel(route){
  const parts=route.split('/'),course=courses.find(item=>item.id===parts[1]);
  return `${course.name} · ${course.steps[Number(parts[2])].title} · ${{guide:'설명',example:'예시',write:'작성'}[parts[3]||'guide']}`;
}
function updateRestoreButton(){
  const plan=RecordBackup.merge(state,pendingBackup.data.data,pendingBackup.choices,pendingBackup.useLast);
  const button=$('#apply-restore');button.disabled=!plan.changed;
  button.textContent=`${plan.applied.length}개 단계 반영${pendingBackup.useLast&&state.last!==pendingBackup.data.data.last?' + 작성 위치':''}`;
}
function applyRestore(){
  return Viewport.keep(commitRestore);
}
function commitRestore(){
  if(!pendingBackup)return;
  try{
    if(JSON.stringify(state)!==pendingBackup.baseline||localStorage.getItem(storageKey)!==pendingBackup.stored){
      throw new Error('미리보기 후 현재 기록이 바뀌었습니다. 다른 탭의 작업을 확인하고 새로고침한 뒤 파일을 다시 선택하세요.');
    }
    const plan=RecordBackup.merge(state,pendingBackup.data.data,pendingBackup.choices,pendingBackup.useLast);
    if(!plan.changed){notify('반영할 변경 사항이 없습니다.');return;}
    const replacements=plan.rows.filter(row=>row.status==='conflict'&&pendingBackup.choices[row.id]==='incoming');
    if(replacements.length&&!window.confirm(`${replacements.length}개 단계의 현재 메모·작성 양식·완료 표시를 백업 내용으로 교체할까요?\n\n${replacements.map(row=>row.title).join('\n')}\n\n변경 직전 기록은 이 브라우저의 보호본으로 보관합니다.`))return;
    if(localStorage.getItem(storageKey)!==pendingBackup.stored)throw new Error('확인 중 다른 탭의 기록이 바뀌었습니다. 새로고침한 뒤 다시 확인하세요.');
    // Commit to storage before changing live state. If either write fails,
    // the currently displayed state and the primary stored record are intact.
    localStorage.setItem(recoveryKey,RecordBackup.serialize(state));
    const nextText=JSON.stringify(plan.next);
    localStorage.setItem(storageKey,nextText);
    persistedSnapshot=nextText;
    state=plan.next;storageOK=true;
    clearBackupPreview();backupPage();
    $('#save-status').textContent='● 이 기기에 저장됨';
    $('#backup-file-status').textContent=`${plan.applied.length}개 단계의 기록을 반영했습니다. 변경 전 기록은 ‘불러오기 직전 보호본’에서 내려받을 수 있습니다.`;
    $('#restore-preview').innerHTML=`<div class="next-action"><a class="primary" href="${esc(validLast())}">저장한 위치에서 이어쓰기 →</a><a class="secondary" href="#notes">내 메모 확인하기</a></div>`;
  }catch(error){
    const message=error.name==='QuotaExceededError'?'브라우저 저장 공간이 부족합니다. 전체 기록을 파일로 백업한 뒤 저장 공간을 확인하세요.':error.message;
    $('#restore-result').textContent=`${message} 불러오기는 적용되지 않았습니다.`;
  }
}
