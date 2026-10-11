import React from 'react';
import { AbsoluteFill, Img, staticFile, interpolate } from 'remotion';
import { C, fonts } from '../theme';
import { COPY } from '../copy';
import { Avatar, Board, Logo, Passport, Schedule, Stamp, Ticket } from '../components/Art';

const rays = 'repeating-conic-gradient(from 0deg at 50% 50%, rgba(255,201,60,.45) 0deg 3deg, transparent 3deg 12deg)';
const Art: React.FC<{type:string}> = ({type}) => {
 if(type==='ticket'||type==='brand') return <div style={{position:'absolute',top:'52%',left:'50%',transform:'translate(-50%,-50%) rotate(-4deg) scale(.67)'}}><Ticket scale={1.17}/>{type==='ticket'&&<div style={{position:'absolute',top:8,right:5,transform:'rotate(13deg)'}}><Stamp size={116} text="NEW"/></div>}</div>;
 if(type==='board') return <div style={{position:'absolute',top:'49%',left:'50%',transform:'translate(-50%,-50%) scale(.74)'}}><Board scale={1.2}/></div>;
 if(type==='visited') return <div style={{position:'absolute',top:'49%',left:'50%',transform:'translate(-50%,-50%) scale(.59)'}}><div style={{width:610,height:650,borderRadius:38,background:C.paper,boxShadow:'0 20px 55px rgba(27,42,74,.2)',overflow:'hidden'}}><div style={{padding:28,fontSize:32,fontWeight:900}}>京都 紅葉さんぽ</div><Schedule stamped={2}/></div><div style={{position:'absolute',right:-42,top:200,transform:'rotate(15deg)'}}><Stamp size={140}/></div><div style={{position:'absolute',left:-32,bottom:25,transform:'rotate(-12deg)',fontFamily:fonts.en,fontWeight:700,fontSize:42,color:C.stamp,border:`5px solid ${C.stamp}`,padding:'10px 16px',background:'#fff'}}>DAY COMPLETE</div></div>;
 if(type==='passport') return <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) scale(.78)'}}><Passport scale={.8} opened/></div>;
 if(type==='collab') return <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) scale(.7)'}}><div style={{width:730,height:530,background:C.white,borderRadius:34,boxShadow:'0 20px 55px rgba(27,42,74,.2)',overflow:'hidden'}}><div style={{padding:32,fontWeight:900,fontSize:29}}>京都 紅葉さんぽ</div><Schedule/></div><div style={{position:'absolute',top:-60,left:115,display:'flex'}}>{COPY.sample.avatars.map((letter,i)=><div key={letter} style={{marginLeft:i?-8:0}}><Avatar letter={letter} color={[C.sunset,C.sky,C.mint][i]} size={80}/></div>)}</div></div>;
 return <div style={{position:'absolute',left:'50%',top:'55%',transform:'translate(-50%,-50%)'}}><Logo size={180}/></div>;
};

export const PromoPost: React.FC<{index:number}> = ({index}) => {const item=COPY.posts[index];const p=1;const isFirst=index===0;const bg=isFirst?'linear-gradient(145deg,#FF6B3D 0%,#FF875A 100%)':index===1?C.board:C.paper;const textColor=index===1?C.white:C.navy;return <AbsoluteFill style={{background:bg,color:textColor,fontFamily:fonts.ja,overflow:'hidden'}}>
 {isFirst&&<div style={{position:'absolute',inset:-250,backgroundImage:rays,opacity:.75}}/>}
 {index===1&&<div style={{position:'absolute',inset:0,backgroundImage:'radial-gradient(rgba(255,201,60,.11) 1px,transparent 1px)',backgroundSize:'24px 24px'}}/>}
 {!isFirst&&<div style={{position:'absolute',top:-90,left:-90,width:400,height:400,borderRadius:'50%',background:item.accent,opacity:.1}}/>}
 <div style={{position:'absolute',top:75,left:72,right:72,fontSize:isFirst?68:58,fontWeight:900,lineHeight:1.34,letterSpacing:-1,zIndex:2,transform:`translateY(${interpolate(p,[0,1],[40,0])}px)`,opacity:p}}>{item.title.map((line,i)=><div key={line}>{line}</div>)}</div>
 <div style={{position:'absolute',top:270,left:75,right:75,fontSize:27,fontWeight:700,lineHeight:1.65,opacity:.92,zIndex:2}}>{item.body}</div>
 <div style={{position:'absolute',left:0,right:0,top:410,bottom:160}}><Art type={item.art}/></div>
 {index===5&&<div style={{position:'absolute',right:80,bottom:185,fontFamily:fonts.en,fontSize:24,color:C.white,letterSpacing:4,opacity:.8}}>TABICHike</div>}
 <div style={{position:'absolute',left:72,bottom:42,display:'flex',alignItems:'center',gap:11,fontSize:21,fontWeight:900}}><Img src={staticFile('tabichike-icon.png')} style={{height:38,width:38,borderRadius:10}}/>たびチケ</div>
 <div style={{position:'absolute',right:70,bottom:49,fontFamily:fonts.mono,fontSize:23,fontWeight:700}}>{index+1}/6</div>
 </AbsoluteFill>};

export const ReelCover: React.FC = () => <AbsoluteFill style={{background:C.sunset,color:C.white,fontFamily:fonts.ja,overflow:'hidden',backgroundImage:'radial-gradient(rgba(255,255,255,.17) 1px,transparent 1px)',backgroundSize:'28px 28px'}}>
 <div style={{position:'absolute',inset:0,backgroundImage:rays,opacity:.3}}/><div style={{position:'absolute',top:445,left:65,right:65,textAlign:'center',fontSize:78,fontWeight:900,lineHeight:1.35}}>旅行アプリ、<br/>発券しました</div>
 <div style={{position:'absolute',left:'50%',top:'53%',transform:'translate(-50%,-50%) rotate(-4deg) scale(.73)'}}><Ticket scale={1.2}/><div style={{position:'absolute',left:245,bottom:-55,transform:'rotate(-15deg)'}}><Stamp size={158}/></div></div>
 <div style={{position:'absolute',bottom:540,left:0,right:0,textAlign:'center',fontFamily:fonts.en,fontSize:48,letterSpacing:8}}>VISITED YOUR TRIP</div><div style={{position:'absolute',bottom:455,left:0,right:0,textAlign:'center',fontSize:38,fontWeight:900}}>旅のすべてを1枚のチケットに</div>
 </AbsoluteFill>;





