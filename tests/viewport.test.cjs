const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// Deterministic geometry model: unlike the general document adapter, this one
// clamps scrollY when page height collapses. It is not a browser/layout engine.
function boot({height=3000,y=1200,viewport=800}={}){
  let contentHeight=height,minHeight='',scrollY=y,scrollX=0;
  const events={},scrolls=[],clamps=[];
  const pageHeight=()=>Math.max(context.innerHeight,240+Math.max(contentHeight,parseFloat(minHeight)||0));
  const clamp=()=>{
    const max=Math.max(0,pageHeight()-context.innerHeight);
    if(scrollY>max){clamps.push([scrollY,max]);scrollY=max;}
  };
  const style={get minHeight(){return minHeight;},set minHeight(value){minHeight=value;clamp();}};
  const main={style,getBoundingClientRect:()=>({height:Math.max(contentHeight,parseFloat(minHeight)||0)})};
  const context={innerHeight:viewport,
    document:{querySelector:()=>main,scrollingElement:{get scrollHeight(){clamp();return pageHeight();}}},
    addEventListener:(name,callback)=>{events[name]=callback;},
    scrollTo(options){scrolls.push(options);scrollX=options.left;scrollY=options.top;clamp();},
    get scrollX(){return scrollX;},get scrollY(){return scrollY;}
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../dist/viewport.js'),'utf8'),context);
  return {api:context.Viewport,context,main,scrolls,clamps,
    setContent(height){contentHeight=height;clamp();},
    nativeScroll(x,y){scrollX=x;scrollY=y;clamp();},
    userScroll(y){scrollY=y;clamp();events.scroll();},
    resize(height){context.innerHeight=height;events.resize();}
  };
}

test('temporary empty DOM cannot clamp the viewport during a long-to-long tab swap',()=>{
  const app=boot();const result=app.api.keep(()=>{
    app.setContent(0);assert.equal(app.context.scrollY,1200);
    app.setContent(3500);return 'rendered';
  });
  assert.equal(result,'rendered');assert.equal(app.context.scrollY,1200);
  assert.equal(app.main.style.minHeight,'');assert.equal(app.scrolls.length,0);
});

test('a short replacement reserves enough space for the exact old offset, including the viewport-height floor',()=>{
  const app=boot({y:2200});
  app.api.keep(()=>app.setContent(200));
  assert.ok(app.clamps.length>0,'the model must exercise native scroll clamping');
  assert.equal(app.context.scrollY,2200);
  assert.ok(parseFloat(app.main.style.minHeight)>=2760);
  assert.equal(app.scrolls.at(-1).top,2200);assert.equal(app.scrolls.at(-1).behavior,'instant');
});

test('native focus or anchor jumps in either direction are restored to the captured coordinates',()=>{
  const app=boot();app.nativeScroll(25,1200);
  for(const destination of [0,2400]){
    app.api.keep(()=>app.nativeScroll(0,destination));
    assert.equal(app.context.scrollY,1200);assert.equal(app.context.scrollX,25);
  }
});

test('expanding content does not scroll to its new bottom',()=>{
  const app=boot();app.api.keep(()=>app.setContent(9000));
  assert.equal(app.context.scrollY,1200);assert.equal(app.scrolls.length,0);
  assert.equal(app.main.style.minHeight,'');
});

test('nested renders use the outer position instead of the temporarily clamped one',()=>{
  const app=boot();
  app.api.keep(()=>{
    app.nativeScroll(0,0);
    app.api.keep(()=>app.setContent(300));
  });
  assert.equal(app.context.scrollY,1200);assert.equal(app.scrolls.length,1);
});

test('repeated short/long changes do not accumulate permanent page height',()=>{
  const app=boot();
  for(let i=0;i<12;i++){
    app.api.keep(()=>app.setContent(150));const first=app.main.style.minHeight;
    app.api.keep(()=>app.setContent(150));assert.equal(app.main.style.minHeight,first);
    app.api.keep(()=>app.setContent(4000));assert.equal(app.main.style.minHeight,'');
    assert.equal(app.context.scrollY,1200);
  }
});

test('user scrolling is never undone, and spare space is released on returning to the natural content range',()=>{
  const app=boot();app.api.keep(()=>app.setContent(1000));
  app.userScroll(700);assert.equal(app.context.scrollY,700);assert.notEqual(app.main.style.minHeight,'');
  app.userScroll(350);assert.equal(app.context.scrollY,350);assert.equal(app.main.style.minHeight,'');
});

test('reserved space adapts to viewport changes without jumping to the top or bottom',()=>{
  const app=boot({y:2200});app.api.keep(()=>app.setContent(200));
  app.resize(1100);assert.equal(app.context.scrollY,2200);
  assert.ok(app.context.document.scrollingElement.scrollHeight>=3300);
});

test('render failures still restore position and release the nesting guard for the next action',()=>{
  const app=boot();
  assert.throws(()=>app.api.keep(()=>{app.setContent(100);throw new Error('render failed');}),/render failed/);
  assert.equal(app.context.scrollY,1200);
  app.api.keep(()=>app.setContent(4000));assert.equal(app.main.style.minHeight,'');
});

test('a position captured before native hash navigation can be restored by the hashchange fallback',()=>{
  const app=boot();const position=app.api.capture();app.nativeScroll(0,0);
  app.api.keep(()=>app.setContent(500),position);
  assert.equal(app.context.scrollY,1200);
});
