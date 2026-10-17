'use strict';
// Preserve the viewport, not a focused element or a percentage of page height.
// A shorter replacement needs enough page space to retain the old scroll offset.
window.Viewport=(()=>{
  let depth=0;
  let reservedMain=null;
  let naturalBottom=0;
  const capture=()=>({x:window.scrollX,y:window.scrollY});
  const pageHeight=()=>document.scrollingElement.scrollHeight;
  function keep(change,position=capture()){
    if(depth)return change();
    const main=document.querySelector('#main');
    if(!main)return change();
    depth++;
    // Keep the page from temporarily collapsing while nodes are exchanged.
    main.style.minHeight=Math.ceil(main.getBoundingClientRect().height)+'px';
    try{return change();}
    finally{
      try{
        main.style.minHeight='';
        const naturalHeight=pageHeight();
        naturalBottom=Math.max(0,naturalHeight-window.innerHeight);
        const missing=Math.max(0,position.y+window.innerHeight-naturalHeight);
        reservedMain=missing>0?main:null;
        if(missing>0){
          let height=Math.ceil(main.getBoundingClientRect().height+missing);
          main.style.minHeight=height+'px';
          // scrollHeight is at least one viewport even when the content is much
          // shorter. Account for that floor before restoring a deep position.
          const remainder=Math.max(0,position.y+window.innerHeight-pageHeight());
          if(remainder>0)main.style.minHeight=Math.ceil(height+remainder)+'px';
        }
        // Restore in the same task, before paint; no delayed timer can pull the
        // user back after they have started scrolling themselves.
        if(window.scrollX!==position.x||window.scrollY!==position.y){
          window.scrollTo({left:position.x,top:position.y,behavior:'instant'});
        }
      }finally{depth--;}
    }
  }
  window.addEventListener('scroll',()=>{
    // Once the user returns to the real content range, spare space is no longer
    // needed. Re-measure instead of retaining the tallest page indefinitely.
    if(!depth&&reservedMain&&window.scrollY<=naturalBottom)keep(()=>{});
  },{passive:true});
  window.addEventListener('resize',()=>{if(!depth&&reservedMain)keep(()=>{});});
  return {capture,keep};
})();
