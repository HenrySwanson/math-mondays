(()=>{"use strict";var t={557:function(t,n,e){var i=this&&this.__read||function(t,n){var e="function"==typeof Symbol&&t[Symbol.iterator];if(!e)return t;var i,r,s=e.call(t),a=[];try{for(;(void 0===n||n-- >0)&&!(i=s.next()).done;)a.push(i.value)}catch(t){r={error:t}}finally{try{i&&!i.done&&(e=s.return)&&e.call(s)}finally{if(r)throw r.error}}return a};n.__esModule=!0;var r=e(146),s="#ffff00",a="#808080",o="#000000",u=20,c=function(){function t(t,n,e){this.graphics=new h(t,e),this.state=n,this.name=e}return t.prototype.draw=function(t){this.graphics.drawState(this.state,t),this.graphics.drawSwitch(this.state.willFlip())},t}(),h=function(){function t(t,n){this.group=t.group(),this.circle=this.group.circle(40),this.name=this.group.text(n),this.number=this.group.text(""),this.coin=this.group.circle(10).hide(),this.candidate=this.group.circle(10).hide(),this.switch=this.group.polygon([0,0,0,30,15,15]);var e=this.circle.cx(),i=this.circle.cy();this.name.center(e,i),this.coin.center(e+u,i+u),this.candidate.center(e+u,i-u),this.switch.center(e+40,i),this.circle.fill(a).stroke(o),this.coin.stroke(o),this.candidate.fill("#00ffff").stroke(o),this.switch.fill(a).stroke(o),this.circle.back()}return t.prototype.drawState=function(t,n){var e,i,r,o,c,h,d,p;switch(t.phase){case"upper-bound":c="waxing"==t.inner.phase?t.inner.active||null!=n&&n?s:a:t.inner.active||null==n||n?"#ffcc00":a,h=null,d=null,p=!1;break;case"unnumbered-announce":c=t.announcement.active||null!=n&&n?s:a,h=null!==(e=t.context.myNumber)&&void 0!==e?e:null,d=null,p=!1;break;case"coin-flip":c=a,h=null!==(i=t.context.myNumber)&&void 0!==i?i:null,d=null!==t.context.myNumber?t.coinFlip:null,p=null!=n&&n;break;case"coin-announce":c=t.announcement.active||null!=n&&n?s:a,h=null!==(r=t.context.myNumber)&&void 0!==r?r:null,d=null!==t.context.myNumber?t.coinFlip:null,p=t.isCandidate;break;case"candidate-announce":c=t.announcement.active||null!=n&&n?s:a,h=null!==(o=t.context.myNumber)&&void 0!==o?o:null,d=null,p=t.isCandidate;break;case"final":c=a,h=null,d=null,p=!1;break;default:return t}this.circle.fill(c),null!==h?this.number.show().text(h.toString()):this.number.hide(),null!==d?this.coin.show().fill(d?s:a):this.coin.hide(),p?this.candidate.show():this.candidate.hide(),this.number.center(this.circle.cx()-u,this.circle.cy()+u)},t.prototype.drawSwitch=function(t){this.switch.fill(t?s:a)},t}(),d=function(){function t(t,n){this.prisoners=Array.from(Array(n).keys()).map((function(n){var e=0==n,i=String.fromCharCode(65+n);return new c(t,(0,r.startState)(e),i)})),this.state={state:"A"},this.numDays=1,this.historyStack=[],t.viewbox(0,0,80*n+10,60)}return t.prototype.advance=function(){var t=this,n=this.prisoners.length;switch(this.state.state){case"A":var e=new Map(this.prisoners.map((function(e,i){return[e,t.prisoners[(i+n-1)%n].state.willFlip()]})));this.state={state:"B",lights:e};break;case"B":var r=this.prisoners.map((function(t){return[t,t.state]}));this.historyStack.push(r),function(t){for(var n,e=t.length-1;e>0;e--){var r=Math.floor(Math.random()*(e+1));n=i([t[r],t[e]],2),t[e]=n[0],t[r]=n[1]}}(this.prisoners);var s=this.state.lights;this.prisoners.forEach((function(t){return t.state=t.state.next(s.get(t))})),this.state={state:"A"},this.numDays+=1}},t.prototype.undo=function(){switch(this.state.state){case"A":var t=this.historyStack.pop();if(void 0===t)return;this.prisoners=t.map((function(t){var n=i(t,2),e=n[0],r=n[1];return e.state=r,e})),this.numDays-=1,this.advance();break;case"B":this.state={state:"A"}}},t.prototype.startOver=function(){this.prisoners.sort((function(t,n){return t.name.localeCompare(n.name)})),this.prisoners.forEach((function(t,n){return t.state=(0,r.startState)(0==n)})),this.state={state:"A"},this.numDays=1,this.historyStack=[]},t.prototype.draw=function(){switch(this.prisoners.forEach((function(t,n){t.graphics.group.move(10+80*n,10)})),this.state.state){case"A":this.prisoners.forEach((function(t){return t.draw(null)}));break;case"B":var t=this.state.lights;this.prisoners.forEach((function(n){return n.draw(t.get(n))}))}},t.prototype.currentState=function(){var t=this.prisoners[0].state;switch(t.phase){case"upper-bound":if("waxing"==t.inner.phase){var n=t.inner.round;return"Upper Bound Phase: Round ".concat(t.inner.round,", Waxing ").concat(t.inner.day,"/").concat(n)}return n=Math.pow(2,t.inner.round),"Upper Bound Phase: Round ".concat(t.inner.round,", Waning ").concat(t.inner.day,"/").concat(n);case"unnumbered-announce":return"Announcement: Anyone Unnumbered? Step ".concat(t.announcement.day,"/").concat(t.context.upperBound);case"coin-flip":return"Numbered Prisoners Flip Coin";case"coin-announce":return"Announcement: Results of ".concat(t.round,"'s flip. Step ").concat(t.announcement.day,"/").concat(t.context.upperBound);case"candidate-announce":return"Announcement: Unnumbered Candidate? Step ".concat(t.announcement.day,"/").concat(t.context.upperBound);case"final":return"Puzzle Complete";default:return t}},t}();new(function(){function t(t,n){var e=this;this.experiment=new d(SVG("prison-interactive-"+n),t),this.nextButton=document.getElementById("next-button-"+n),this.undoButton=document.getElementById("undo-button-"+n),this.finishPhaseButton=document.getElementById("finish-phase-button-"+n),this.startOverButton=document.getElementById("start-over-button-"+n),this.dayCounter=document.getElementById("day-counter-"+n),this.stateText=document.getElementById("state-description-"+n),this.nextButton.addEventListener("click",(function(t){"final"!=e.experiment.prisoners[0].state.phase&&(e.experiment.advance(),e.drawEverything())})),this.finishPhaseButton.addEventListener("click",(function(t){var n=e.experiment.prisoners[0].state.phase;if("final"!=n)for(;e.experiment.prisoners[0].state.phase==n;)e.experiment.advance(),e.drawEverything()})),this.undoButton.addEventListener("click",(function(t){e.experiment.undo(),e.drawEverything()})),this.startOverButton.addEventListener("click",(function(t){e.experiment.startOver(),e.drawEverything()}))}return t.prototype.drawEverything=function(){this.experiment.draw();var t="A"==this.experiment.state.state?"Day":"Night";this.dayCounter.textContent="".concat(t," ").concat(this.experiment.numDays),this.stateText.textContent=this.experiment.currentState()},t}())(5,"1").drawEverything()},581:(t,n)=>{n.__esModule=!0,n.Announcement=n.WaningPhase=n.WaxingPhase=void 0;var e=function(){function t(t,n,e,i){this.phase="waxing",this.captain=t,this.round=n,this.day=e,this.active=i}return t.prototype.next=function(n){var e=this.active||n;return this.day<this.round?{done:!1,value:new t(this.captain,this.round,this.day+1,e)}:{done:!1,value:new i(this.captain,this.round,1,e)}},t}();n.WaxingPhase=e;var i=function(){function t(t,n,e,i){this.phase="waning",this.captain=t,this.round=n,this.day=e,this.active=i}return t.prototype.next=function(n){var i=this.active&&n;return this.day<Math.pow(2,this.round)?{done:!1,value:new t(this.captain,this.round,this.day+1,i)}:i?{done:!0,value:Math.pow(2,this.round)}:{done:!1,value:new e(this.captain,this.round+1,1,this.captain)}},t}();n.WaningPhase=i;var r=function(){function t(t,n,e){this.active=t,this.numDays=n,this.day=e}return t.prototype.next=function(n){var e=this.active||n;return this.day<this.numDays?{done:!1,value:new t(e,this.numDays,this.day+1)}:{done:!0,value:e}},t}();n.Announcement=r},146:(t,n,e)=>{n.__esModule=!0,n.startState=void 0;var i=e(581);n.startState=function(t){return r.start(t)};var r=function(){function t(t){this.phase="upper-bound",this.inner=t}return t.start=function(n){return new t(new i.WaxingPhase(n,1,1,n))},t.prototype.next=function(n){var e=this.inner.next(n);return e.done?s.start({myNumber:this.inner.captain?1:null,numNumbered:1,upperBound:e.value}):new t(e.value)},t.prototype.willFlip=function(){return this.inner.active},t}(),s=function(){function t(t,n){this.phase="unnumbered-announce",this.context=t,this.announcement=n}return t.start=function(n){return new t(n,new i.Announcement(null===n.myNumber,n.upperBound,1))},t.prototype.next=function(n){var e=this.announcement.next(n);if(!e.done)return new t(this.context,e.value);if(e.value){var i=1/this.context.numNumbered,r=null!==this.context.myNumber&&Math.random()<i;return new o(this.context,r)}return new a(this.context.numNumbered)},t.prototype.willFlip=function(){return this.announcement.active},t}(),a=function(){function t(t){this.phase="final",this.answer=t}return t.prototype.next=function(t){return this},t.prototype.willFlip=function(){return!1},t}(),o=function(){function t(t,n){this.phase="coin-flip",this.context=t,this.coinFlip=n}return t.prototype.next=function(t){return u.start(this.context,this.coinFlip,t)},t.prototype.willFlip=function(){return this.coinFlip},t}(),u=function(){function t(t,n,e,i,r,s){this.phase="coin-announce",this.context=t,this.coinFlip=n,this.isCandidate=e,this.numHeads=i,this.round=r,this.announcement=s}return t.start=function(n,e,i){return t.startOfRound(n,e,i,0,1)},t.startOfRound=function(n,e,r,s,a){return new t(n,e,r,s,a,new i.Announcement(a==n.myNumber&&e,n.upperBound,1))},t.prototype.next=function(n){var e=this.announcement.next(n);if(!e.done)return new t(this.context,this.coinFlip,this.isCandidate,this.numHeads,this.round,e.value);var i=this.numHeads+(e.value?1:0);return this.round<this.context.numNumbered?t.startOfRound(this.context,this.coinFlip,this.isCandidate,i,this.round+1):c.start(this.context,this.isCandidate,i)},t.prototype.willFlip=function(){return this.announcement.active},t}(),c=function(){function t(t,n,e,i){this.phase="candidate-announce",this.context=t,this.isCandidate=n,this.numHeads=e,this.announcement=i}return t.start=function(n,e,r){return new t(n,e,r,new i.Announcement(null===n.myNumber&&e,n.upperBound,1))},t.prototype.next=function(n){var e=this.announcement.next(n);if(e.done){var i=e.value,r=this.context.numNumbered,a=this.context.myNumber;return i&&1==this.numHeads&&(r+=1,this.isCandidate&&(a=r)),s.start({myNumber:a,numNumbered:r,upperBound:this.context.upperBound})}return new t(this.context,this.isCandidate,this.numHeads,e.value)},t.prototype.willFlip=function(){return this.announcement.active},t}()}},n={};!function e(i){var r=n[i];if(void 0!==r)return r.exports;var s=n[i]={exports:{}};return t[i].call(s.exports,s,s.exports,e),s.exports}(557)})();