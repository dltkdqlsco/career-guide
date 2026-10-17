'use strict';
// Apply the saved appearance before styles render; workbook records use a separate key.
window.WorkbookTheme = (() => {
  const key='one-step-career-theme-v1';
  const root=document.documentElement;
  let current='light';
  try{if(localStorage.getItem(key)==='dark')current='dark';}catch{/* Appearance still works when storage is unavailable. */}
  function apply(theme){
    current=theme==='dark'?'dark':'light';
    root.dataset.theme=current;
    const meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',current==='dark'?'#101923':'#4aa9df');
    const select=document.querySelector('#theme-select');
    if(select)select.value=current;
  }
  function choose(theme){
    apply(theme);
    try{localStorage.setItem(key,current);}catch{/* Keep the chosen appearance for this page. */}
  }
  function bind(){
    const select=document.querySelector('#theme-select');
    if(select){select.value=current;select.onchange=event=>choose(event.target.value);}
  }
  apply(current);
  document.addEventListener('DOMContentLoaded',bind);
  window.addEventListener('storage',event=>{if(event.key===key)apply(event.newValue);});
  return {choose};
})();
