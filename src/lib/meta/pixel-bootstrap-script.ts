import { FB_PIXEL_ID } from "@/lib/fbpixel";
import {
  META_PAGE_CONTENT_NAMES,
  PUBLIC_META_PAGE_PATHS,
} from "@/lib/meta/public-pages";

/**
 * Inline script for Next.js `beforeInteractive` (injected into <head>).
 * Runs as early as possible: _fbc → Pixel init → PageView → CAPI (same event_id).
 */
export function getMetaPixelBootstrapScript(): string {
  const pixelId = FB_PIXEL_ID.replace(/[^0-9]/g, "");
  if (!pixelId) {
    return "";
  }

  const pathsJson = JSON.stringify(PUBLIC_META_PAGE_PATHS);
  const namesJson = JSON.stringify(META_PAGE_CONTENT_NAMES);

  // Keep this self-contained — no imports at runtime.
  // PageView key must match getMetaPageViewKey() in meta-pixel.tsx (path, or path?query).
  return `(function(){try{
var paths=${pathsJson};
var names=${namesJson};
var path=location.pathname||"/";
if(path.indexOf("/embed")===0||path.indexOf("/auth")===0||path.indexOf("/dashboard")===0)return;
var allowed=false;
for(var i=0;i<paths.length;i++){if(paths[i]===path){allowed=true;break;}}
if(!allowed)return;
var rawSearch=location.search||"";
var query=rawSearch.charAt(0)==="?"?rawSearch.slice(1):rawSearch;
var key=query?path+"?"+query:path;
var eventId=(typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():("evt_"+Date.now()+"_"+Math.random().toString(36).slice(2,11));
var contentName=names[path]||null;
var customData=contentName?{content_name:contentName}:{};
window.__LEADCX_META__={initialPageViewKey:key,initialPageViewEventId:eventId,pixelBootstrapped:true};
try{
var m=/(?:^|[?&#])fbclid=([^&#]+)/i.exec(location.href);
var fbclid=m&&m[1]?decodeURIComponent(String(m[1]).replace(/\\+/g," ")).trim():"";
if(fbclid){
var existing="";
var parts=document.cookie.split(";");
for(var c=0;c<parts.length;c++){
var t=parts[c].trim();
if(t.indexOf("_fbc=")===0){existing=decodeURIComponent(t.slice(5));break;}
}
var fbc="fb.1."+Date.now()+"."+fbclid;
if(!existing||existing.indexOf("."+fbclid)<0){
var secure=location.protocol==="https:"?"; Secure":"";
document.cookie="_fbc="+encodeURIComponent(fbc)+"; Path=/; Max-Age=7776000; SameSite=Lax"+secure;
}
}
}catch(e){}
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${pixelId}');
fbq('track','PageView',customData,{eventID:eventId});
try{
fetch('/api/meta/events',{
method:'POST',
headers:{'Content-Type':'application/json'},
body:JSON.stringify({
eventName:'PageView',
eventId:eventId,
eventSourceUrl:location.href,
customData:customData
}),
keepalive:true,
credentials:'same-origin'
});
}catch(e){}
}catch(e){}})();`;
}
