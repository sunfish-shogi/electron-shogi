import{g as m,d as i,c as f}from"./index-AZ6psDYo.js";function u(n,l){for(var o=0;o<l.length;o++){const e=l[o];if(typeof e!="string"&&!Array.isArray(e)){for(const r in e)if(r!=="default"&&!(r in n)){const _=Object.getOwnPropertyDescriptor(e,r);_&&Object.defineProperty(n,r,_.get?_:{enumerable:!0,get:()=>e[r]})}}}return Object.freeze(Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}))}var d={exports:{}};(function(n,l){(function(o,e){n.exports=e(i)})(f,function(o){function e(t){return t&&typeof t=="object"&&"default"in t?t:{default:t}}var r=e(o),_={name:"zh-tw",weekdays:"星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),weekdaysShort:"週日_週一_週二_週三_週四_週五_週六".split("_"),weekdaysMin:"日_一_二_三_四_五_六".split("_"),months:"一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),ordinal:function(t,a){return a==="W"?t+"週":t+"日"},formats:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY/MM/DD",LL:"YYYY年M月D日",LLL:"YYYY年M月D日 HH:mm",LLLL:"YYYY年M月D日dddd HH:mm",l:"YYYY/M/D",ll:"YYYY年M月D日",lll:"YYYY年M月D日 HH:mm",llll:"YYYY年M月D日dddd HH:mm"},relativeTime:{future:"%s內",past:"%s前",s:"幾秒",m:"1 分鐘",mm:"%d 分鐘",h:"1 小時",hh:"%d 小時",d:"1 天",dd:"%d 天",M:"1 個月",MM:"%d 個月",y:"1 年",yy:"%d 年"},meridiem:function(t,a){var s=100*t+a;return s<600?"凌晨":s<900?"早上":s<1100?"上午":s<1300?"中午":s<1800?"下午":"晚上"}};return r.default.locale(_,null,!0),_})})(d);var Y=d.exports;const p=m(Y),y=u({__proto__:null,default:p},[Y]);export{y as z};
