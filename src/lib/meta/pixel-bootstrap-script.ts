import { FB_PIXEL_ID } from "@/lib/fbpixel";
import {
  getMetaPageContentName,
  META_PAGE_CONTENT_NAMES,
  PUBLIC_META_PAGE_PATHS,
} from "@/lib/meta/public-pages";
import { getStoreProductPath, storeProducts } from "@/lib/store/products";

/** Registered /store/product/<slug> pages (live ads product is already in the list). */
function getStoreSlugPagePaths(): string[] {
  return storeProducts
    .map((product) => getStoreProductPath(product))
    .filter(
      (pagePath) =>
        !(PUBLIC_META_PAGE_PATHS as readonly string[]).includes(pagePath),
    );
}

/**
 * Tiny `beforeInteractive` script (page head).
 * Keeps ad attribution early without loading Facebook’s heavy script yet:
 * _fbc cookie → fbq stub → init + PageView queued (same event_id for later CAPI).
 * `fbevents.js` loads with `afterInteractive` in the root layout.
 */
export function getMetaPixelBootstrapScript(): string {
  const pixelId = FB_PIXEL_ID.replace(/[^0-9]/g, "");
  if (!pixelId) {
    return "";
  }

  const slugPaths = getStoreSlugPagePaths();
  const names: Record<string, string> = { ...META_PAGE_CONTENT_NAMES };
  for (const pagePath of slugPaths) {
    const name = getMetaPageContentName(pagePath);
    if (name) {
      names[pagePath] = name;
    }
  }

  const pathsJson = JSON.stringify([...PUBLIC_META_PAGE_PATHS, ...slugPaths]);
  const namesJson = JSON.stringify(names);

  // Keep this self-contained — no imports at runtime.
  // PageView key must match getMetaPageViewKey() in meta-pixel.tsx (path, or path?query).
  return `(function(){try{
var paths=${pathsJson};
var names=${namesJson};
var path=location.pathname||"/";
if(path.indexOf("/embed")===0||path.indexOf("/auth")===0||path.indexOf("/dashboard")===0||path.indexOf("/products")===0||path.indexOf("/location-leads")===0||path.indexOf("/complete-profile")===0)return;
var allowed=false;
for(var i=0;i<paths.length;i++){if(paths[i]===path){allowed=true;break;}}
if(!allowed)return;
var rawSearch=location.search||"";
var query=rawSearch.charAt(0)==="?"?rawSearch.slice(1):rawSearch;
var key=query?path+"?"+query:path;
var eventId=(typeof crypto!=="undefined"&&crypto.randomUUID)?crypto.randomUUID():("evt_"+Date.now()+"_"+Math.random().toString(36).slice(2,11));
var contentName=names[path]||null;
var customData=contentName?{content_name:contentName}:{};
window.__LEADCX_META__={initialPageViewKey:key,initialPageViewEventId:eventId,pixelBootstrapped:true,pixelPageViewQueued:true,capiPageViewSent:false};
try{
var m=/(?:^|[?&#])fbclid=([^&#]+)/i.exec(location.href);
var fbclid=m&&m[1]?String(m[1]).trim():"";
while(fbclid.indexOf("%25")>=0){
try{var fd=decodeURIComponent(fbclid);if(fd===fbclid)break;fbclid=fd;}catch(e){break;}
}
if(fbclid&&fbclid.indexOf(";")<0){
var raw="";
var parts=document.cookie.split(";");
for(var c=0;c<parts.length;c++){
var t=parts[c].trim();
if(t.indexOf("_fbc=")===0){raw=t.slice(5);break;}
}
var existing=raw;
while(existing.indexOf("%25")>=0){
try{var d=decodeURIComponent(existing);if(d===existing||d.indexOf("fb.")!==0)break;existing=d;}catch(e){break;}
}
var fbc="fb.1."+Date.now()+"."+fbclid;
if(!existing||existing.indexOf("."+fbclid)<0||raw!==existing){
var secure=location.protocol==="https:"?"; Secure":"";
if(existing&&existing.indexOf("."+fbclid)>=0){fbc=existing;}
document.cookie="_fbc="+fbc+"; Path=/; Max-Age=7776000; SameSite=Lax"+secure;
}
}
}catch(e){}
!function(f,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];}(window);
fbq('init','${pixelId}');
fbq('track','PageView',customData,{eventID:eventId});
}catch(e){}})();`;
}
