// Optimized main JavaScript - minified and performance-focused
(function(){'use strict';
// Performance mark
window.__perf={start:Date.now(),loaded:false};

// Phone tracking
function initPhoneTracking(){
  document.addEventListener('click',function(e){
    const link=e.target.closest('a[href^="tel:"]');
    if(!link||!window.gtag)return;
    const num=link.href.replace('tel:',''),
          src=link.className||link.closest('div')?.className||'unknown',
          loc=location.pathname;
    try{
      gtag('event','click_to_call',{
        event_category:'Phone_Conversion',
        event_label:'Phone Call - '+src+' - '+num,
        phone_source:src,
        phone_number:num,
        page_location:loc,
        value:10
      });
      gtag('event','conversion',{
        send_to:'AW-17217204638/phone_call_conversion',
        value:25.0,
        currency:'USD'
      });
      // Track source-specific events
      if(src.includes('floating'))
        gtag('event','floating_phone_click',{event_category:'High_Intent_Conversion',value:15});
      else if(src.includes('banner'))
        gtag('event','banner_phone_click',{event_category:'Top_Banner_Conversion',value:12});
      else if(src.includes('footer'))
        gtag('event','footer_phone_click',{event_category:'Footer_Conversion',value:8});
    }catch(e){}
  });
}

// Scroll depth tracking
function initScrollTracking(){
  let depths={25:false,50:false,75:false,100:false},
      maxScroll=0,
      scrollTimer;
  function track(){
    const pct=Math.round((scrollY+innerHeight)/document.documentElement.scrollHeight*100);
    if(pct>maxScroll){
      maxScroll=pct;
      Object.keys(depths).forEach(d=>{
        if(pct>=d&&!depths[d]&&window.gtag){
          depths[d]=true;
          try{gtag('event','scroll',{event_category:'Engagement',event_label:d+'%',value:+d});}catch(e){}
        }
      });
    }
  }
  addEventListener('scroll',()=>{
    clearTimeout(scrollTimer);
    scrollTimer=setTimeout(track,100);
  },{passive:true});
}

// Engagement time tracking
function initEngagement(){
  let start=Date.now(),
      total=0,
      engaged=true,
      timer;
  function track(){
    if(engaged){
      total+=Date.now()-start;
      if(total>0&&total%30000<1000&&window.gtag){
        try{
          gtag('event','page_engagement',{
            event_category:'Engagement',
            event_label:'Time on Page',
            value:Math.round(total/1000),
            engagement_time_seconds:Math.round(total/1000)
          });
        }catch(e){}
      }
    }
    start=Date.now();
  }
  document.addEventListener('visibilitychange',()=>{
    engaged=!document.hidden;
    if(engaged){
      start=Date.now();
      timer=setInterval(track,1000);
    }else{
      clearInterval(timer);
      track();
    }
  });
  timer=setInterval(track,1000);
}

// CTA tracking
function initCTATracking(){
  document.addEventListener('click',function(e){
    const btn=e.target.closest('.btn,.cta-button,button[type="submit"]');
    if(btn&&window.gtag){
      const txt=btn.textContent.trim(),
            cls=btn.className;
      try{
        gtag('event','cta_click',{
          event_category:'Engagement',
          event_label:txt,
          button_class:cls,
          page_location:location.pathname
        });
        if(/call|contact|book|schedule/i.test(txt)){
          gtag('event','conversion',{
            send_to:'AW-17217204638/cta_high_intent',
            value:5.0,
            currency:'USD'
          });
        }
      }catch(e){}
    }
  });
}

// Outbound link tracking
function initOutboundTracking(){
  document.addEventListener('click',function(e){
    const link=e.target.closest('a');
    if(link&&link.hostname!==location.hostname&&
       !link.href.startsWith('tel:')&&!link.href.startsWith('mailto:')&&window.gtag){
      try{
        gtag('event','click',{
          event_category:'Outbound Link',
          event_label:link.href,
          transport_type:'beacon'
        });
      }catch(e){}
    }
  });
}

// Prefetch internal links
function initPrefetch(){
  const prefetched=new Set();
  document.addEventListener('mouseover',function(e){
    const link=e.target.closest('a');
    if(link&&link.hostname===location.hostname&&!prefetched.has(link.href)){
      const pre=document.createElement('link');
      pre.rel='prefetch';
      pre.href=link.href;
      document.head.appendChild(pre);
      prefetched.add(link.href);
    }
  },{passive:true});
}

// Lazy load images
function initLazyImages(){
  if('loading' in HTMLImageElement.prototype){
    const imgs=document.querySelectorAll('img[loading="lazy"]');
    imgs.forEach(img=>{
      img.addEventListener('load',()=>img.classList.add('loaded'));
      if(img.complete)img.classList.add('loaded');
    });
  }
}

// Initialize when ready
function init(){
  // Mark as loaded for CSS
  document.documentElement.classList.add('loaded');
  
  // Initialize features
  initPrefetch();
  initLazyImages();
  
  // Wait for analytics before tracking
  const checkAnalytics=()=>{
    if(window.gtag){
      initPhoneTracking();
      initScrollTracking();
      initEngagement();
      initCTATracking();
      initOutboundTracking();
    }else{
      setTimeout(checkAnalytics,1000);
    }
  };
  setTimeout(checkAnalytics,2000);
  
  // Performance reporting
  if(window.performance?.timing){
    setTimeout(()=>{
      const t=performance.timing,
            load=t.loadEventEnd-t.navigationStart,
            dom=t.domContentLoadedEventEnd-t.navigationStart,
            fp=performance.getEntriesByType('paint')[0]?.startTime||0;
      console.log('Perf:',{load:load+'ms',dom:dom+'ms',fp:Math.round(fp)+'ms'});
      if(window.gtag){
        try{gtag('event','timing_complete',{name:'load',value:load,event_category:'Performance'});}catch(e){}
      }
    },0);
  }
  
  // Optimize scroll
  let ticking=false;
  function scrollTick(){
    if(!ticking){
      requestAnimationFrame(()=>ticking=false);
      ticking=true;
    }
  }
  addEventListener('scroll',scrollTick,{passive:true});
}

// Start when DOM ready
if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',init);
else
  init();

// Register Service Worker for caching
if('serviceWorker' in navigator){
  window.addEventListener('load',()=>{
    navigator.serviceWorker.register('/sw.js')
      .then(reg=>console.log('SW registered'))
      .catch(err=>console.log('SW registration failed'));
  });
}
})();