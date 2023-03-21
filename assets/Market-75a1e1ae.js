import{j as i,r as u,a as x}from"./index-36a9ef7e.js";import{v as j,l as M,q as R,x as w,_ as g,z as P,g as z,j as C,k as N,H as y,I as m,G as T}from"./utils-57d51a10.js";const E=j(i("path",{d:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"}),"Person");function F(t){return M("MuiAvatar",t)}R("MuiAvatar",["root","colorDefault","circular","rounded","square","img","fallback"]);const U=["alt","children","className","component","imgProps","sizes","src","srcSet","variant"],O=t=>{const{classes:s,variant:r,colorDefault:o}=t;return N({root:["root",r,o&&"colorDefault"],img:["img"],fallback:["fallback"]},F,s)},q=w("div",{name:"MuiAvatar",slot:"Root",overridesResolver:(t,s)=>{const{ownerState:r}=t;return[s.root,s[r.variant],r.colorDefault&&s.colorDefault]}})(({theme:t,ownerState:s})=>g({position:"relative",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,width:40,height:40,fontFamily:t.typography.fontFamily,fontSize:t.typography.pxToRem(20),lineHeight:1,borderRadius:"50%",overflow:"hidden",userSelect:"none"},s.variant==="rounded"&&{borderRadius:(t.vars||t).shape.borderRadius},s.variant==="square"&&{borderRadius:0},s.colorDefault&&g({color:(t.vars||t).palette.background.default},t.vars?{backgroundColor:t.vars.palette.Avatar.defaultBg}:{backgroundColor:t.palette.mode==="light"?t.palette.grey[400]:t.palette.grey[600]}))),W=w("img",{name:"MuiAvatar",slot:"Img",overridesResolver:(t,s)=>s.img})({width:"100%",height:"100%",textAlign:"center",objectFit:"cover",color:"transparent",textIndent:1e4}),_=w(E,{name:"MuiAvatar",slot:"Fallback",overridesResolver:(t,s)=>s.fallback})({width:"75%",height:"75%"});function L({crossOrigin:t,referrerPolicy:s,src:r,srcSet:o}){const[e,n]=u.useState(!1);return u.useEffect(()=>{if(!r&&!o)return;n(!1);let c=!0;const l=new Image;return l.onload=()=>{c&&n("loaded")},l.onerror=()=>{c&&n("error")},l.crossOrigin=t,l.referrerPolicy=s,l.src=r,o&&(l.srcset=o),()=>{c=!1}},[t,s,r,o]),e}const B=u.forwardRef(function(s,r){const o=P({props:s,name:"MuiAvatar"}),{alt:e,children:n,className:c,component:l="div",imgProps:f,sizes:p,src:a,srcSet:d,variant:S="circular"}=o,I=z(o,U);let h=null;const D=L(g({},f,{src:a,srcSet:d})),k=a||d,A=k&&D!=="error",v=g({},o,{colorDefault:!A,component:l,variant:S}),b=O(v);return A?h=i(W,g({alt:e,src:a,srcSet:d,sizes:p,ownerState:v,className:b.img},f)):n!=null?h=n:k&&e?h=e[0]:h=i(_,{ownerState:v,className:b.fallback}),i(q,g({as:l,ownerState:v,className:C(b.root,c),ref:r},I,{children:h}))}),H=B;function J(){const[t,s]=u.useState(new Map),r=async()=>{const e=await(await fetch("https://www.binance.com/bapi/composite/v1/public/marketing/symbol/list")).json(),n=new Map;e.data.forEach(c=>{n.set(c.symbol,c.logo)}),s(n)};return u.useEffect(()=>{r()},[]),t}function K(){const[t,s]=u.useState([]),r=J(),o=e=>{const n=e.replace("1000","").replace("DOM","");return r.get(n)};return u.useEffect(()=>{const e=new WebSocket("wss://fstream.binance.com/ws/!ticker@arr");return e.onopen=()=>{console.log("socket open")},e.onmessage=n=>{try{const c=JSON.parse(n.data);c.ping?e.send(JSON.stringify({pong:Date.now()})):c.length&&s(l=>{const f=[],p=l.reduce((a,d)=>(a[d.s]=d,a),{});return c.filter(a=>/USDT$/.test(a.s)).forEach(a=>{p[a.s]?(Object.assign(p[a.s],a),f.push(p[a.s]),delete p[a.s]):f.push(a)}),[...f,...Object.values(p)].sort((a,d)=>+d.P-+a.P)})}catch{}},()=>{e.close()}},[]),i(y,{sx:{display:"flex",gap:"24px",flexWrap:"wrap",justifyContent:"space-evenly"},children:t.map(e=>x(y,{sx:{display:"flex",flexDirection:"column",alignItems:"center",gap:"8px",width:220,border:"dashed 1px #ccc",padding:"8px 0"},children:[x(y,{sx:{display:"flex",alignItems:"center",gap:"8px"},children:[i(H,{src:o(e.s),sx:{width:32,height:32},alt:e.s.charAt(0),children:e.s.charAt(0)}),i(m,{children:e.s.replace("USDT","")})]}),i(m,{fontSize:24,children:+e.c}),x(m,{fontSize:18,fontWeight:"bold",color:+e.p>0?"#82ca9d":"#E04A59",children:[+e.p,"(",+e.P,"%)"]}),x(m,{children:[+e.l," - ",+e.w," - ",+e.h]}),i(m,{color:"gray",children:T(+e.q)})]},e.s))})}export{K as default};
