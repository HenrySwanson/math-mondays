(()=>{"use strict";var t={536:(t,e)=>{e.__esModule=!0,e.drawHydraImmediately=e.computeHydraLayout=e.HydraNode=e.CLONE_COLOR=void 0;e.CLONE_COLOR="#422aa8";var n=function(){function t(t,e){void 0===e&&(e=null),this.drawing=t,this.svgHead=t.circle(.5),this.svgNeck=null,this.parent=e,this.children=[],this.targetX=null,this.targetY=null,this.offsetX=null,null!==e&&(e.children.push(this),this.svgNeck=t.line([0,0,0,0]).stroke({width:.1}),this.svgNeck.back())}return t.prototype.isRoot=function(){return null===this.parent},t.prototype.isLeaf=function(){return 0===this.children.length},t.prototype.appendChild=function(){return new t(this.drawing,this)},t.prototype.getLeftSiblings=function(){if(this.isRoot())return[];var t=this.parent.children.indexOf(this);return this.parent.children.slice(0,t)},t.prototype.clone=function(){if(this.isRoot())throw"Can't clone root!";var t=this.parent.appendChild();!function t(e,n){n.targetX=e.targetX,n.targetY=e.targetY,n.offsetX=e.offsetX,e.children.forEach((function(e){return t(e,n.appendChild())}))}(this,t);var e=this.parent.children.indexOf(this);return this.parent.children.splice(e,0,t),this.parent.children.pop(),t},t.prototype.die=function(){if(!this.isLeaf())throw"Only leaves can be killed!";if(this.isRoot())throw"Can't die as root!";var t=this.parent.children.indexOf(this);this.parent.children.splice(t,1),this.svgHead.remove(),this.svgNeck.remove()},t}();function r(t){var e=1/0;function n(t,e){var n=[];return function t(e,r,i,a){var o=e.targetX+i;a<n.length?n[a]=r(n[a],o):n.push(o),i+=e.offsetX,e.children.forEach((function(e){return t(e,r,i,a+1)}))}(t,e,0,0),n}!function t(e){e.children.forEach((function(e){return t(e)}));var r=e.getLeftSiblings();if(0!==r.length){var i=r[r.length-1];e.targetX=i.targetX+1}else e.targetX=0;if(!e.isLeaf()){var a=e.children[0],o=e.children[e.children.length-1],c=(a.targetX+o.targetX)/2;e.offsetX=e.targetX-c}for(var u=n(e,Math.min),d=r.length-1;d>=0;d--){for(var s=n(r[d],Math.max),l=1,f=Math.min(s.length,u.length),h=0;h<f;h++)l=Math.min(l,u[h]-s[h]);if(!(l>=1)){var g=r.length-d,p=1-l;for(h=1;h<g;h++)r[d+h].targetX+=p*h/g,r[d+h].offsetX+=p*h/g;e.targetX+=p,e.offsetX+=p,u=u.map((function(t){return t+p}))}}}(t),function t(n,r){void 0===r&&(r=0),n.isRoot()?n.targetY=0:n.targetY=n.parent.targetY+2,n.targetX+=r,e=Math.min(e,n.targetX),r+=n.offsetX,n.children.forEach((function(e){return t(e,r)}))}(t),function t(n){n.targetX-=e,n.children.forEach((function(e){return t(e)}))}(t)}function i(t){return t.children.map((function(t){return i(t)})).reduce((function(t,e){return Math.max(t,e)}),t.targetX)}function a(t,e){return e.center(t.targetY,t.targetX)}function o(t,e){return e.plot(t.targetY,t.targetX,t.parent.targetY,t.parent.targetX)}function c(t,e,n,r,i){return t.children.forEach((function(t){return c(t,e,n,r,i)})),t.isRoot()||i(t,t.svgNeck.animate(e,n,0)),r(t,t.svgHead.animate(e,n,0))}function u(t){t.children.forEach((function(t){return u(t)})),a(t,t.svgHead),t.isRoot()||o(t,t.svgNeck)}function d(t,e){var n=1*i(e);t.viewbox(-.75,-.95,7.5,n+1.4+.5)}function s(t,n,i){var l,f=n.drawing;t.children.forEach((function(t){return s(t,n,i)})),t.svgHead.click((function(){t.isRoot()||!t.isLeaf()||h||(h=!0,i(),(l=f.group().add(t.svgNeck).add(t.svgHead)).animate(500,">",0).opacity(0).afterAll(g))}));var h=!1;function g(){if(l.remove(),t.die(),t.parent.isRoot())p();else{var e=t.parent.clone(),r=t.parent.clone();s(e,n,i),s(r,n,i),u(n),y(t.parent),y(e),y(r).afterAll(p)}}function p(){return r(n),d(f.animate(700,"<",0),n),c(n,700,"<",(function(t,e){return a(t,e.fill("#000"))}),(function(t,e){return o(t,e.stroke("#000"))})).afterAll(v)}function v(){n.isLeaf()&&alert("Wow... I can't believe you actually did it!\nSorry I didn't write anything cool for you yet. Perhaps I'll add something later.")}function y(t){return c(t,200,"<",(function(t,n){return n.fill(e.CLONE_COLOR)}),(function(t,n){return n.stroke(e.CLONE_COLOR)}))}}e.HydraNode=n,e.computeHydraLayout=r,e.drawHydraImmediately=u,function(t){t.NODE_DIAM=.5,t.NODE_SPACING=1,t.LEVEL_SPACING=2,t.CLONE_COLOR=t.CLONE_COLOR,t.HydraNode=n,t.getHydraWidth=i,t.computeHydraLayout=r,t.drawHydraImmediately=u,t.resizeViewbox=d,t.setListeners=s}(e)}},e={};function n(r){var i=e[r];if(void 0!==i)return i.exports;var a=e[r]={exports:{}};return t[r](a,a.exports,n),a.exports}(()=>{var t=n(536),e=document.getElementById("reset-button"),r=document.getElementById("click-counter"),i=SVG("hydra-interactive"),a=0;function o(){r.textContent="Clicks: "+a,a+=1}function c(){i.clear(),a=0,o();var e=new t.HydraNode(i),n=e.appendChild().appendChild();n.appendChild(),n.appendChild(),(0,t.computeHydraLayout)(e),(0,t.drawHydraImmediately)(e),(0,t.resizeViewbox)(i,e),(0,t.setListeners)(e,e,o)}c(),e.addEventListener("click",c)})()})();