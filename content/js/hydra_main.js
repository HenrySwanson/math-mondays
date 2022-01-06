(()=>{"use strict";var e={536:(e,t,r)=>{t.__esModule=!0,t.SvgHydra=t.SvgHeadData=t.TreeLayout=t.HydraSkeleton=t.CLONE_COLOR=t.NECK_WIDTH=t.LEVEL_SPACING=t.NODE_SPACING=t.NODE_DIAM=void 0,t.NODE_DIAM=.5,t.NODE_SPACING=1,t.LEVEL_SPACING=2,t.NECK_WIDTH=.1,t.CLONE_COLOR="#422aa8";var n=r(347);t.HydraSkeleton=function(e){this.tree=new n.Tree(null,e.map((function(e){return e.tree})))};var o=function(){function e(e,t,r){this.tree=new n.Tree({x:e,y:t},r.map((function(e){return e.tree})))}return e.fromTree=function(t){if(0===t.children.length)return new e(0,0,[]);for(var r=t.children.map((function(t,r){var n=e.fromTree(t);return n.shift(r,1),n})),n=0;n<r.length;n++)for(var o=n-1;o>=0;o--){for(var i=r[n].leftContour(),a=r[o].rightContour(),l=Math.min(i.length,a.length),u=1,h=0;h<l;h++)u=Math.min(u,i[h]-a[h]);if(!(u>=1)){var c=1-u,p=n-o;for(h=1;h<=p;h++)r[o+h].shift(c*h/p,0)}}var d=(r[0].tree.payload.x+r[r.length-1].tree.payload.x)/2;return r.forEach((function(e){return e.shift(-d,0)})),new e(0,0,r)},e.prototype.shift=function(e,t){this.tree.forEachPreorder((function(r){r.x+=e,r.y+=t}))},e.prototype._contour=function(e){var t=[];return this.tree.forEachPreorder((function(r,n){var o=r.x;if(n<t.length){var i=t[n];("left"==e&&o<i||"right"==e&&o>i)&&(t[n]=o)}else t.push(o)})),t},e.prototype.leftContour=function(){return this._contour("left")},e.prototype.rightContour=function(){return this._contour("right")},e.prototype.getMinX=function(){return Math.min.apply(Math,this.leftContour())},e.prototype.getMaxX=function(){return Math.max.apply(Math,this.rightContour())},e.prototype.getWidth=function(){return this.getMaxX()-this.getMinX()},e}();t.TreeLayout=o;var i=function(e,r){this.head=e.circle(t.NODE_DIAM),r?(this.neck=e.line([0,0,0,0]).stroke({width:t.NECK_WIDTH}),this.neck.back()):this.neck=null};t.SvgHeadData=i;var a=function(){function e(e,t){this.svgGroup=e.group(),this.svgTree=this.createSvgHeads(t.tree)}return e.prototype.createSvgHeads=function(e){var t=this;return e.mapX((function(e){return new i(t.svgGroup,null!==e.parent)}))},e.prototype.repositionNodes=function(){var e=o.fromTree(this.svgTree);e.shift(-e.getMinX(),0),this.svgTree.zip(e.tree).forEachPreorderX((function(e){var r,n=e.parent,o=e.payload,i=o[0],a=o[1];if(i.head.center(a.y*t.LEVEL_SPACING,a.x*t.NODE_SPACING),null!==n){var l=n.payload[1];null===(r=i.neck)||void 0===r||r.plot(a.y*t.LEVEL_SPACING,a.x*t.NODE_SPACING,l.y*t.LEVEL_SPACING,l.x*t.NODE_SPACING)}}))},e.prototype.index=function(){for(var e,t,r,n=[],o=0;o<arguments.length;o++)n[o]=arguments[o];return null!==(r=null===(t=(e=this.svgTree).index.apply(e,n))||void 0===t?void 0:t.payload)&&void 0!==r?r:null},e.prototype.root=function(){return this.svgTree.payload},e}();t.SvgHydra=a},347:(e,t)=>{t.__esModule=!0,t.Tree=void 0;var r=function(){function e(e,t){var r=this;this.parent=null,this.children=t,this.payload=e,t.forEach((function(e){return e.parent=r}))}return e.prototype.index=function(){for(var e,t=[],r=0;r<arguments.length;r++)t[r]=arguments[r];if(0===t.length)return this;var n=t[0];return n<this.children.length?(e=this.children[n]).index.apply(e,t.slice(1)):null},e.prototype.makeCopy=function(){return new e(this.payload,this.children.map((function(e){return e.makeCopy()})))},e.prototype.insertSubtree=function(e,t){this.children.splice(e,0,t),t.parent=this},e.prototype.appendChild=function(t){var r=new e(t,[]);return r.parent=this,this.children.push(r),r},e.prototype.remove=function(){var e=this.parent;if(null!==e){var t=e.children.indexOf(this);e.children.splice(t,1),this.parent=null}},e.prototype.forEachPreorder=function(e,t){void 0===t&&(t=0),e(this.payload,t),this.children.forEach((function(r){return r.forEachPreorder(e,t+1)}))},e.prototype.forEachPreorderX=function(e,t){void 0===t&&(t=0),e(this,t),this.children.forEach((function(r){return r.forEachPreorderX(e,t+1)}))},e.prototype.zip=function(t){for(var r=[],n=Math.min(this.children.length,t.children.length),o=0;o<n;o++)r.push(this.children[o].zip(t.children[o]));return new e([this.payload,t.payload],r)},e.prototype.zipX=function(t){for(var r=[],n=Math.min(this.children.length,t.children.length),o=0;o<n;o++)r.push(this.children[o].zipX(t.children[o]));return new e([this,t],r)},e.prototype.map=function(t){return new e(t(this.payload),this.children.map((function(e){return e.map(t)})))},e.prototype.mapX=function(t){return new e(t(this),this.children.map((function(e){return e.mapX(t)})))},e}();t.Tree=r}},t={};function r(n){var o=t[n];if(void 0!==o)return o.exports;var i=t[n]={exports:{}};return e[n](i,i.exports,r),i.exports}(()=>{var e=r(536),t=document.getElementById("reset-button"),n=document.getElementById("click-counter"),o=SVG("hydra-interactive"),i=0;function a(){n.textContent="Clicks: "+i,i+=1}function l(){o.clear(),i=0,a();var t=new e.HydraSkeleton([]),r=t.tree.appendChild(null).appendChild(null);r.appendChild(null),r.appendChild(null);var n=new e.SvgHydra(o,t);n.repositionNodes(),u(o,e.TreeLayout.fromTree(n.svgTree)),h(o,n,n.svgTree,a)}function u(t,r){var n=3*e.LEVEL_SPACING,o=r.getWidth()*e.NODE_SPACING;t.viewbox(-(.5+e.NODE_DIAM/2),-(.7+e.NODE_DIAM/2),n+1+e.NODE_DIAM,o+1.4+e.NODE_DIAM)}function h(t,r,n,o){var i,a=n.payload;function l(){var a=n.parent;i.remove(),n.remove();var l=a.parent;if(null!==l){for(var u=l.children.indexOf(a),d=[],f=0;f<2;f++){var s=r.createSvgHeads(a.map((function(e){return null})));s.payload.neck=r.svgGroup.line([0,0,0,0]).stroke({width:e.NECK_WIDTH}),l.insertSubtree(u+1,s),h(t,r,s,o),a.zip(s).forEachPreorder((function(e){var t,r=e[0],n=e[1];n.head.move(r.head.x(),r.head.y()),null===(t=n.neck)||void 0===t||t.plot(r.neck.array())})),d.push(s)}d.forEach((function(e){return p(e)})),p(a).afterAll(c)}else c()}function c(){var n=e.TreeLayout.fromTree(r.svgTree);n.shift(-n.getMinX(),0),r.svgTree.zip(n.tree).forEachPreorderX((function(t){var r,n=t.payload[0],o=t.payload[1];if(n.head.animate(700,"<",0).center(o.y*e.LEVEL_SPACING,o.x*e.NODE_SPACING).fill("#000"),null!==t.parent){var i=t.parent.payload[1];(null===(r=n.neck)||void 0===r?void 0:r.animate(700,"<",0)).plot(o.y*e.LEVEL_SPACING,o.x*e.NODE_SPACING,i.y*e.LEVEL_SPACING,i.x*e.NODE_SPACING).stroke("#000")}})),u(t.animate(700,"<",0),n),0===r.svgTree.children.length&&alert("Wow... I can't believe you actually did it!\nSorry I didn't write anything cool for you yet. Perhaps I'll add something later.")}function p(t){t.children.forEach((function(e){return p(e)}));var r=t.payload;return null!==r.neck&&r.neck.animate(200,"<",0).stroke(e.CLONE_COLOR),r.head.animate(200,"<",0).fill(e.CLONE_COLOR)}a.head.click((function(){null!==n.parent&&0===n.children.length&&(o(),(i=t.group().add(a.neck).add(a.head)).animate(500,">",0).opacity(0).afterAll(l))})),n.children.forEach((function(e){return h(t,r,e,o)}))}l(),t.addEventListener("click",l)})()})();