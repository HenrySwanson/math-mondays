(()=>{"use strict";var t={536:function(t,n){var e=this&&this.__spreadArray||function(t,n,e){if(e||2===arguments.length)for(var r,i=0,a=n.length;i<a;i++)!r&&i in n||(r||(r=Array.prototype.slice.call(n,0,i)),r[i]=n[i]);return t.concat(r||Array.prototype.slice.call(n))};n.__esModule=!0,n.setListeners=n.resizeViewbox=n.SvgHydra=n.SvgHeadData=n.HydraSkeleton=n.CLONE_COLOR=void 0;n.CLONE_COLOR="#422aa8";var r=function(){function t(t){var n=this;this.parent=null,this.children=t,t.forEach((function(t){return t.parent=n}))}return t.prototype.deepcopy=function(){return new t(this.children.map((function(t){return t.deepcopy()})))},t.prototype.index=function(){for(var t,n=[],e=0;e<arguments.length;e++)n[e]=arguments[e];if(0===n.length)return this;var r=n[0];return r<this.children.length?(t=this.children[r]).index.apply(t,n.slice(1)):null},t.prototype.appendChild=function(){var n=new t([]);return n.parent=this,this.children.push(n),n},t.prototype.die=function(){if(null===this.parent)throw"Can't kill root!";var t=this.parent.children.indexOf(this);this.parent.children.splice(t,1)},t.prototype.generate_siblings=function(t){var n;if(null===this.parent)throw"Can't clone root!";for(var r=[],i=0;i<t;i++){var a=this.deepcopy();a.parent=this.parent,r.push(a)}var o=this.parent.children.indexOf(this);return(n=this.parent.children).splice.apply(n,e([o+1,0],r,!1)),r},t}();n.HydraSkeleton=r;var i=function(){function t(t,n,e){this.x=t,this.y=n,this.children=e}return t.fromHydra=function(n){if(0==n.children.length)return new t(0,0,[]);var e=n.children.map((function(n){return t.fromHydra(n)}));e.forEach((function(t,n){return t.shift(n,1)}));for(var r=0;r<e.length;r++)for(var i=r-1;i>=0;i--){for(var a=e[r].leftContour(),o=e[i].rightContour(),l=Math.min(a.length,o.length),h=1,c=0;c<l;c++)h=Math.min(h,a[c]-o[c]);if(!(h>=1)){var u=1-h,s=r-i;for(c=1;c<=s;c++)e[i+c].shift(u*c/s,0)}}var d=(e[0].x+e[e.length-1].x)/2;return e.forEach((function(t){return t.shift(-d,0)})),new t(0,0,e)},t.prototype.shift=function(t,n){this.x+=t,this.y+=n,this.children.forEach((function(e){return e.shift(t,n)}))},t.prototype._contour=function(t){var n=[];return function e(r,i){var a=r.x;if(i<n.length){var o=n[i];("left"==t&&a<o||"right"==t&&a>o)&&(n[i]=a)}else n.push(a);r.children.forEach((function(t){return e(t,i+1)}))}(this,0),n},t.prototype.leftContour=function(){return this._contour("left")},t.prototype.rightContour=function(){return this._contour("right")},t}(),a=function(t,n){this.head=t.circle(.5),n?(this.neck=t.line([0,0,0,0]).stroke({width:.1}),this.neck.back()):this.neck=null};n.SvgHeadData=a;var o=function(){function t(t,n){this.skeleton=n,this.svg_group=t.group(),this.svg_data_map=new Map,this.createSvgHead(n,!0)}return t.prototype.createSvgHead=function(t,n){var e=this;void 0===n&&(n=!1),this.svg_data_map.set(t,new a(this.svg_group,!n)),t.children.forEach((function(t){return e.createSvgHead(t,!1)}))},t.prototype.repositionNodes=function(){var t=i.fromHydra(this.skeleton),n=Math.min.apply(Math,t.leftContour()),e=this;!function t(r,i,a){var o,l=e.svg_data_map.get(r);l.head.center(2*i.y,1*i.x-n),null!==a&&(null===(o=l.neck)||void 0===o||o.plot(2*i.y,1*i.x-n,2*a.y,1*a.x-n));for(var h=0;h<r.children.length;h++)t(r.children[h],i.children[h],i)}(this.skeleton,t,null)},t.prototype.index=function(){for(var t,n=[],e=0;e<arguments.length;e++)n[e]=arguments[e];var r=(t=this.skeleton).index.apply(t,n);return null===r?null:this.svg_data_map.get(r)},t.prototype.root=function(){return this.svg_data_map.get(this.skeleton)},t}();function l(t,n){var e=function(t){var n=i.fromHydra(t.skeleton),e=Math.min.apply(Math,n.leftContour());return Math.max.apply(Math,n.rightContour())-e}(n),r=1*e;t.viewbox(-.75,-.95,7.5,r+1.4+.5)}n.SvgHydra=o,n.resizeViewbox=l,n.setListeners=function t(e,r,a,o){var h,c=r.svg_data_map.get(a);function u(){var n=a.parent;h.remove(),a.die(),r.svg_data_map.delete(a),null===n.parent&&s();var i=n.generate_siblings(2);function l(t,n){var e=r.svg_data_map.get(t),i=r.svg_data_map.get(n);i.head.move(e.head.x(),e.head.y()),i.neck.plot(e.neck.array()),t.children.forEach((function(t,e){return l(t,n.children[e])}))}i.forEach((function(t){return r.createSvgHead(t)})),i.forEach((function(n){return t(e,r,n,o)})),i.forEach((function(t){return l(n,t)})),i.forEach((function(t){return d(t)})),d(n).afterAll(s)}function s(){var t=i.fromHydra(r.skeleton),n=Math.min.apply(Math,t.leftContour());console.log(r.svg_data_map.size),function t(e,i,a){var o;console.log("AAAA %d (%f, %f)",e.children.length,i.x,i.y);var l=r.svg_data_map.get(e);l.head.animate(700,"<",0).center(2*i.y,1*i.x-n).fill("#000"),null!==a&&(null===(o=l.neck)||void 0===o?void 0:o.animate(700,"<",0)).plot(2*i.y,1*i.x-n,2*a.y,1*a.x-n).stroke("#000");for(var h=0;h<e.children.length;h++)t(e.children[h],i.children[h],i)}(r.skeleton,t,null),l(e.animate(700,"<",0),r),0===r.skeleton.children.length&&alert("Wow... I can't believe you actually did it!\nSorry I didn't write anything cool for you yet. Perhaps I'll add something later.")}function d(t){t.children.forEach((function(t){return d(t)}));var e=r.svg_data_map.get(t);return null!==e.neck&&e.neck.animate(200,"<",0).stroke(n.CLONE_COLOR),e.head.animate(200,"<",0).fill(n.CLONE_COLOR)}c.head.click((function(){null!==a.parent&&0===a.children.length&&(o(),(h=e.group().add(c.neck).add(c.head)).animate(500,">",0).opacity(0).afterAll(u))})),a.children.forEach((function(n){return t(e,r,n,o)}))}}},n={};function e(r){var i=n[r];if(void 0!==i)return i.exports;var a=n[r]={exports:{}};return t[r].call(a.exports,a,a.exports,e),a.exports}(()=>{var t=e(536),n=document.getElementById("reset-button"),r=document.getElementById("click-counter"),i=SVG("hydra-interactive"),a=0;function o(){r.textContent="Clicks: "+a,a+=1}function l(){i.clear(),a=0,o();var n=new t.HydraSkeleton([]),e=n.appendChild();e.appendChild(),e.appendChild();var r=new t.SvgHydra(i,n);r.repositionNodes(),(0,t.resizeViewbox)(i,r),(0,t.setListeners)(i,r,r.skeleton,o)}l(),n.addEventListener("click",l)})()})();