(function(){var f=void 0,g=null,i=!1,j,m=this;function n(a){for(var a=a.split("."),b=m,c;c=a.shift();)if(b[c]!=g)b=b[c];else return g;return b}
function aa(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function o(a){return"string"==typeof a}var p="closure_uid_"+Math.floor(2147483648*Math.random()).toString(36),ba=0;function ca(a,b,c){return a.call.apply(a.bind,arguments)}
function da(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var c=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c,d);return a.apply(b,c)}}return function(){return a.apply(b,arguments)}}function s(a,b,c){s=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ca:da;return s.apply(g,arguments)}var ea=Date.now||function(){return+new Date};
function t(a,b){var c=a.split("."),d=m;!(c[0]in d)&&d.execScript&&d.execScript("var "+c[0]);for(var e;c.length&&(e=c.shift());)!c.length&&b!==f?d[e]=b:d=d[e]?d[e]:d[e]={}}function u(a,b){function c(){}c.prototype=b.prototype;a.n=b.prototype;a.prototype=new c}Function.prototype.bind=Function.prototype.bind||function(a,b){if(1<arguments.length){var c=Array.prototype.slice.call(arguments,1);c.unshift(this,a);return s.apply(g,c)}return s(this,a)};var v=Array.prototype,w=v.indexOf?function(a,b,c){return v.indexOf.call(a,b,c)}:function(a,b,c){c=c==g?0:0>c?Math.max(0,a.length+c):c;if(o(a))return!o(b)||1!=b.length?-1:a.indexOf(b,c);for(;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},y=v.forEach?function(a,b,c){v.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=o(a)?a.split(""):a,h=0;h<d;h++)h in e&&b.call(c,e[h],h,a)};function fa(a,b,c){return 2>=arguments.length?v.slice.call(a,b):v.slice.call(a,b,c)};function ga(a){var b=z,c;for(c in b)if(a.call(f,b[c],c,b))return c};var A,B,C,D;function E(){return m.navigator?m.navigator.userAgent:g}D=C=B=A=i;var F;if(F=E()){var ha=m.navigator;A=0==F.indexOf("Opera");B=!A&&-1!=F.indexOf("MSIE");C=!A&&-1!=F.indexOf("WebKit");D=!A&&!C&&"Gecko"==ha.product}var G=B,H=D,I=C,J;
a:{var K="",L;if(A&&m.opera)var M=m.opera.version,K="function"==typeof M?M():M;else if(H?L=/rv\:([^\);]+)(\)|;)/:G?L=/MSIE\s+([^\);]+)(\)|;)/:I&&(L=/WebKit\/(\S+)/),L)var ia=L.exec(E()),K=ia?ia[1]:"";if(G){var N,ja=m.document;N=ja?ja.documentMode:f;if(N>parseFloat(K)){J=""+N;break a}}J=K}var ka=J,la={};
function ma(a){if(!la[a]){for(var b=0,c=(""+ka).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),d=(""+a).replace(/^[\s\xa0]+|[\s\xa0]+$/g,"").split("."),e=Math.max(c.length,d.length),h=0;0==b&&h<e;h++){var l=c[h]||"",k=d[h]||"",x=RegExp("(\\d*)(\\D*)","g"),ya=RegExp("(\\d*)(\\D*)","g");do{var q=x.exec(l)||["","",""],r=ya.exec(k)||["","",""];if(0==q[0].length&&0==r[0].length)break;b=((0==q[1].length?0:parseInt(q[1],10))<(0==r[1].length?0:parseInt(r[1],10))?-1:(0==q[1].length?0:parseInt(q[1],10))>(0==
r[1].length?0:parseInt(r[1],10))?1:0)||((0==q[2].length)<(0==r[2].length)?-1:(0==q[2].length)>(0==r[2].length)?1:0)||(q[2]<r[2]?-1:q[2]>r[2]?1:0)}while(0==b)}la[a]=0<=b}}var na={};function oa(){return na[9]||(na[9]=G&&!!document.documentMode&&9<=document.documentMode)};!G||oa();!H&&!G||G&&oa()||H&&ma("1.9.1");G&&ma("9");function pa(){};function O(){this.a=[];this.e={}}u(O,pa);O.prototype.m=1;O.prototype.c=0;function qa(a,b,c){var d=a.e[b];d||(d=a.e[b]=[]);var e=a.m;a.a[e]=b;a.a[e+1]=c;a.a[e+2]=f;a.m=e+3;d.push(e)}
O.prototype.p=function(a,b){var c=this.e[a];if(c){this.c++;for(var d=fa(arguments,1),e=0,h=c.length;e<h;e++){var l=c[e];this.a[l+1].apply(this.a[l+2],d)}this.c--;if(this.b&&0==this.c)for(;c=this.b.pop();)if(0!=this.c)this.b||(this.b=[]),this.b.push(c);else if(d=this.a[c]){if(d=this.e[d])e=w(d,c),0<=e&&v.splice.call(d,e,1);delete this.a[c];delete this.a[c+1];delete this.a[c+2]}}};var ra=RegExp("^(?:([^:/?#.]+):)?(?://(?:([^/?#]*)@)?([\\w\\d\\-\\u0100-\\uffff.%]*)(?::([0-9]+))?)?([^?#]+)?(?:\\?([^#]*))?(?:#(.*))?$");function sa(a){if(P){P=i;var b=m.location;if(b){var c=b.href;if(c&&(c=(c=sa(c)[3]||g)&&decodeURIComponent(c))&&c!=b.hostname)throw P=!0,Error();}}return a.match(ra)}var P=I;function ta(a,b,c){if("array"==aa(b))for(var d=0;d<b.length;d++)ta(a,""+b[d],c);else b!=g&&c.push("&",a,""===b?"":"=",encodeURIComponent(""+b))};var Q=n("yt.dom.getNextId_");if(!Q){Q=function(){return++ua};t("yt.dom.getNextId_",Q);var ua=0};function va(a){if(a=a||n("window.event")){for(var b in a)0<=w(wa,b)||(this[b]=a[b]);if((b=a.target||a.srcElement)&&3==b.nodeType)b=b.parentNode;this.target=b;if(b=a.relatedTarget)try{b=b.nodeName&&b}catch(c){b=g}else"mouseover"==this.type?b=a.fromElement:"mouseout"==this.type&&(b=a.toElement);this.relatedTarget=b;this.clientX=a.clientX!==f?a.clientX:a.pageX;this.clientY=a.clientY!==f?a.clientY:a.pageY;if((a.clientX||a.clientY)&&document.body&&document.documentElement)this.pageX=a.clientX+document.body.scrollLeft+
document.documentElement.scrollLeft,this.pageY=a.clientY+document.body.scrollTop+document.documentElement.scrollTop;this.keyCode=a.keyCode?a.keyCode:a.which;this.charCode=a.charCode||("keypress"==this.type?this.keyCode:0);this.altKey=a.altKey;this.ctrlKey=a.ctrlKey;this.shiftKey=a.shiftKey}}var wa="stopPropagation preventMouseEvent preventManipulation preventDefault layerX layerY".split(" ");j=va.prototype;j.type="";j.target=g;j.relatedTarget=g;j.currentTarget=g;j.data=g;j.origin=g;j.keyCode=0;
j.charCode=0;j.altKey=i;j.ctrlKey=i;j.shiftKey=i;j.clientX=0;j.clientY=0;j.pageX=0;j.pageY=0;var z=n("yt.events.listeners_")||{};t("yt.events.listeners_",z);var xa=n("yt.events.counter_")||{count:0};t("yt.events.counter_",xa);function za(a,b,c){return ga(function(d){return d[0]==a&&d[1]==b&&d[2]==c&&d[4]==i})}function Aa(a,b,c){if(a&&(a.addEventListener||a.attachEvent)){var d=za(a,b,c);if(!d){var d=++xa.count+"",e=function(b){b=new va(b);b.currentTarget=a;return c.call(a,b)};z[d]=[a,b,c,e,i];a.addEventListener?a.addEventListener(b,e,i):a.attachEvent("on"+b,e)}}};t("yt.config_",window.yt&&window.yt.config_||{});t("yt.tokens_",window.yt&&window.yt.tokens_||{});t("yt.globals_",window.yt&&window.yt.globals_||{});t("yt.msgs_",window.yt&&window.yt.msgs_||{});t("yt.timeouts_",window.yt&&window.yt.timeouts_||[]);var Ba=window.yt&&window.yt.intervals_||[];t("yt.intervals_",Ba);function Ca(a){a=window.setInterval(a,250);Ba.push(a);return a}eval("/*@cc_on!@*/false");var Da=window.YTConfig||{};function R(a){this.b=a||{};this.a={};this.a.width=640;this.a.height=390;this.a.title="";this.a.host=("https:"==document.location.protocol?"https:":"http:")+"//www.youtube.com"}var S=g;function T(a,b){return a.b[b]||Da[b]||a.a[b]}function Ea(a,b,c){S||(S={},Aa(window,"message",s(a.c,a)));S[c]=b}R.prototype.c=function(a){a.origin==T(this,"host")&&(a=JSON.parse(a.data),S[a.id].i(a))};
function U(a,b){this.b=b;this.c=this.a=g;this.h=this.id=0;this.e=g;var c=o(a)?document.getElementById(a):a;if(c){if("iframe"!=c.tagName.toLowerCase()){var d=document.createElement("div");d.innerHTML+=n("YT.embed_template");var e=document,d=d||e;d.querySelectorAll&&d.querySelector?d=d.querySelectorAll("IFRAME"):d=d.getElementsByTagName("IFRAME");for(var d=d.length?d[0]:g,e=0,h=c.attributes.length;e<h;e++)d.setAttribute(c.attributes[e].name,c.attributes[e].value);d.removeAttribute("width");d.removeAttribute("height");
d.removeAttribute("src");d.setAttribute("title","YouTube "+T(this.b,"title"));d.height=T(this.b,"height");d.width=T(this.b,"width");e=this.j();e.enablejsapi=window.postMessage?1:0;window.location.host&&(e.origin=window.location.protocol+"//"+window.location.host);var h=T(this.b,"host")+this.k()+"?",l=[],k;for(k in e)ta(k,e[k],l);l[0]="";d.src=h+l.join("");this.c=c;(k=c.parentNode)&&k.replaceChild(d,c);c=d}this.a=c;this.id=this[p]||(this[p]=++ba);if(window.JSON&&window.postMessage){this.e=new O;Fa(this);
var c=T(this.b,"events"),x;for(x in c)c.hasOwnProperty(x)&&this.addEventListener(x,c[x])}}}j=U.prototype;j.u=function(){if(this.c){var a=this.a,b=a.parentNode;b&&b.replaceChild(this.c,a)}else(a=this.a)&&a.parentNode&&a.parentNode.removeChild(a)};function Fa(a){Ea(a.b,a,a.id);a.h=Ca(s(a.l,a));Aa(a.a,"load",s(function(){window.clearInterval(this.h);this.h=Ca(s(this.l,this))},a))}j.j=function(){return{}};j.l=function(){this.a&&this.a.contentWindow?Ga(this,{event:"listening"}):window.clearInterval(this.h)};
j.i=function(a){this.d(a.event,a)};j.addEventListener=function(a,b){var c=b;"string"==typeof b&&(c=function(){window[b].apply(window,arguments)});qa(this.e,a,c);return this};j.d=function(a,b){this.e.p(a,{target:this,data:b})};function V(a,b,c){c=c||[];c=Array.prototype.slice.call(c);Ga(a,{event:"command",func:b,args:c})}
function Ga(a,b){b.id=a.id;var c=JSON.stringify(b),d=sa(a.a.src),e=d[1],h=d[2],l=d[3],d=d[4],k=[];e&&k.push(e,":");l&&(k.push("//"),h&&k.push(h,"@"),k.push(l),d&&k.push(":",d));a.a.contentWindow.postMessage(c,k.join(""))}j.v=function(a,b){this.a.width=a;this.a.height=b;return this};j.q=function(){return this.a};new function(){ea()};var Ha={"0":"onEnded",1:"onPlaying",2:"onPaused",3:"onBuffering",5:"onVideoCued"};function W(a){R.call(this,a);this.a.title="video player";this.a.apiReady="onYouTubePlayerAPIReady";this.a.videoId=""}u(W,R);function X(a,b){U.call(this,a,new W(b));this.g={};this.f={}}u(X,U);j=X.prototype;j.k=function(){return"/embed/"+T(this.b,"videoId")};j.j=function(){return T(this.b,"playerVars")||{}};
j.i=function(a){switch(a.event){case "onReady":window.clearInterval(this.h);this.d("onReady");break;case "onStateChange":var b=a.info.playerState;Y(this,a);this.d("onStateChange",b);-1!=b&&this.d(Ha[b]);break;case "onPlaybackQualityChange":Y(this,a);this.d("onPlaybackQualityChange",this.g.playbackQuality);break;case "onError":this.d("onError",a.error);break;case "onApiChange":a=a.info||{};for(b in a)this.f[b]=a[b];this.d("onApiChange");break;case "infoDelivery":Y(this,a);break;case "initialDelivery":this.g=
{},this.f={},Ia(this,a.apiInterface),Y(this,a)}};function Y(a,b){var c=b.info||{},d;for(d in c)a.g[d]=c[d]}function Ia(a,b){y(b,function(a){this[a]||(this[a]=0==a.search("cue")||0==a.search("load")?function(){this.g={};this.f={};V(this,a,arguments);return this}:0==a.search("get")||0==a.search("is")?function(){var b=this.g,e=0;0==a.search("get")?e=3:0==a.search("is")&&(e=2);return b[a.charAt(e).toLowerCase()+a.substr(e+1)]}:function(){V(this,a,arguments);return this})},a)}
j.t=function(){var a=this.a.cloneNode(i),b=this.g.videoData,c=T(this.b,"host");a.src=b&&b.video_id?c+"/embed/"+b.video_id:a.src;b=document.createElement("div");b.appendChild(a);return b.innerHTML};j.s=function(a){return!this.f.namespaces?[]:!a?this.f.namespaces||[]:this.f[a].options||[]};j.r=function(a,b){if(this.f.namespaces&&a&&b)return this.f[a][b]};function Z(a){R.call(this,a);this.a.host="https://www.youtube.com";this.a.title="upload widget";this.a.apiReady="onYouTubeUploadWidgetReady";this.b.height=0.66*T(this,"width")}u(Z,R);function $(a,b){U.call(this,a,new Z(b))}u($,U);j=$.prototype;j.o=function(a){this[a]||(this[a]=function(){V(this,a,arguments)})};j.k=function(){return"/upload_embed"};j.j=function(){return{action_widget:1}};j.i=function(a){"onApiReady"==a.event&&y(a.apiMethods,s(this.o,this));$.n.i.call(this,a)};
j.d=function(a,b){$.n.d.call(this,a,b);"onApiReady"==a&&V(this,"hostWindowReady")};t("YT.PlayerState.ENDED",0);t("YT.PlayerState.PLAYING",1);t("YT.PlayerState.PAUSED",2);t("YT.PlayerState.BUFFERING",3);t("YT.PlayerState.CUED",5);t("YT.UploadWidgetEvent.API_READY","onApiReady");t("YT.UploadWidgetEvent.UPLOAD_SUCCESS","onUploadSuccess");t("YT.UploadWidgetEvent.PROCESSING_COMPLETE","onProcessingComplete");t("YT.UploadWidgetEvent.STATE_CHANGE","onStateChange");t("YT.UploadWidgetState.IDLE",0);t("YT.UploadWidgetState.PENDING",1);t("YT.UploadWidgetState.ERROR",2);
t("YT.UploadWidgetState.PLAYBACK",3);t("YT.UploadWidgetState.RECORDING",4);t("YT.Player",X);t("YT.UploadWidget",$);X.prototype.destroy=X.prototype.u;X.prototype.setSize=X.prototype.v;X.prototype.getVideoEmbedCode=X.prototype.t;X.prototype.getIframe=X.prototype.q;X.prototype.addEventListener=X.prototype.addEventListener;X.prototype.getOptions=X.prototype.s;X.prototype.getOption=X.prototype.r;function Ja(a){(a=n(T(a,"apiReady")))&&a()}Ja(new W);Ja(new Z);})();
