import{g as Y,r as i,c as m}from"./main-BhkbEqYU.js";function d(n,s){for(var _=0;_<s.length;_++){const t=s[_];if(typeof t!="string"&&!Array.isArray(t)){for(const r in t)if(r!=="default"&&!(r in n)){const o=Object.getOwnPropertyDescriptor(t,r);o&&Object.defineProperty(n,r,o.get?o:{enumerable:!0,get:()=>t[r]})}}}return Object.freeze(Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}))}var a={exports:{}};(function(n,s){(function(_,t){n.exports=t(i())})(m,function(_){function t(e){return e&&typeof e=="object"&&"default"in e?e:{default:e}}var r=t(_),o={name:"ja",weekdays:"日曜日_月曜日_火曜日_水曜日_木曜日_金曜日_土曜日".split("_"),weekdaysShort:"日_月_火_水_木_金_土".split("_"),weekdaysMin:"日_月_火_水_木_金_土".split("_"),months:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),monthsShort:"1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),ordinal:function(e){return e+"日"},formats:{LT:"HH:mm",LTS:"HH:mm:ss",L:"YYYY/MM/DD",LL:"YYYY年M月D日",LLL:"YYYY年M月D日 HH:mm",LLLL:"YYYY年M月D日 dddd HH:mm",l:"YYYY/MM/DD",ll:"YYYY年M月D日",lll:"YYYY年M月D日 HH:mm",llll:"YYYY年M月D日(ddd) HH:mm"},meridiem:function(e){return e<12?"午前":"午後"},relativeTime:{future:"%s後",past:"%s前",s:"数秒",m:"1分",mm:"%d分",h:"1時間",hh:"%d時間",d:"1日",dd:"%d日",M:"1ヶ月",MM:"%dヶ月",y:"1年",yy:"%d年"}};return r.default.locale(o,null,!0),o})})(a);var l=a.exports;const u=Y(l),c=d({__proto__:null,default:u},[l]);export{c as j};
