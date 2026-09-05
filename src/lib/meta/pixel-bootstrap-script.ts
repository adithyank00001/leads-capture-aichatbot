import { FB_PIXEL_ID } from "@/lib/fbpixel";

/** Paths that get early head PageView (Pixel + CAPI). Keep in sync with public-pages. */
const BOOTSTRAP_PUBLIC_PATHS = [
  "/",
  "/landing-b",
  "/login",
  "/signup",
  "/checkout",
  "/checkout/cancel",
  "/checkout/success",
  "/thank-you",
  "/privacy-policy",
  "/terms-of-service",
  "/refund-policy",
] as const;

const BOOTSTRAP_CONTENT_NAMES: Record<string, string> = {
  "/": "Home",
  "/landing-b": "Landing B",
  "/login": "Login",
  "/signup": "Signup",
  "/checkout": "Checkout",
  "/checkout/cancel": "Checkout Cancel",
  "/checkout/success": "Checkout Success",
  "/thank-you": "Thank You",
  "/privacy-policy": "Privacy Policy",
  "/terms-of-service": "Terms of Service",
  "/refund-policy": "Refund Policy",
};

/**
 * Inline script for Next.js `beforeInteractive` (injected into <head>).
 * Runs as early as possible: _fbc → Pixel init → PageView → CAPI (same event_id).
 */
export function getMetaPixelBootstrapScript(): string {
  const pixelId = FB_PIXEL_ID.replace(/[^0-9]/g, "");
  if (!pixelId) {
    return "";
  }

  const pathsJson = JSON.stringify(BOOTSTRAP_PUBLIC_PATHS);
  const namesJson = JSON.stringify(BOOTSTRAP_CONTENT_NAMES);

  // Keep this self-contained — no imports at runtime.
  return `(function(){try{
var paths=${pathsJson};
var names=${namesJson};
var path=location.pathname||"/";
if(path.indexOf("/embed")===0||path.indexOf("/auth")===0||path.indexOf("/dashboard")===0)return;
var allowed=false;
for(var i=0;i<paths.length;i++){if(paths[i]===path){allowed=true;break;}}
if(!allowed)return;
var search=location.search||"";
var key=path+search;
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
