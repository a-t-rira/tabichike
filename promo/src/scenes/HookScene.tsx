import React from 'react';
import { AbsoluteFill, useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { C, fonts } from '../theme';
import { COPY } from '../copy';
import { Avatar, FadeWord, Logo, Texture } from '../components/Art';

const cards = [{text:'メモ',angle:-17,x:-340,y:-80,c:C.sky},{text:'持ち物\nリスト',angle:12,x:310,y:-65,c:C.mint},{text:'家計簿',angle:14,x:-290,y:245,c:C.rose},{text:'手書きの\nしおり',angle:-12,x:315,y:230,c:C.gold}];
export const HookScene: React.FC = () => {const f=useCurrentFrame();const {fps}=useVideoConfig();const p=spring({frame:f,fps,config:{damping:9,stiffness:160,mass:.65}});const q=spring({frame:f-18,fps,config:{damping:13,stiffness:190}});const shake=f>18&&f<27?Math.sin(f*2.6)*5:0;return <Texture style={{transform:`translateX(${shake}px)`}}><div style={{position:'absolute',top:300,left:70,right:70,textAlign:'center'}}><FadeWord from={0} size={72}>{COPY.reel.hook1}</FadeWord><div style={{opacity:q,transform:`translateX(${interpolate(q,[0,1],[850,0])}px) rotate(${interpolate(q,[0,1],[3,0])}deg)`,marginTop:22}}><div style={{fontFamily:fonts.ja,fontWeight:900,fontSize:71,lineHeight:1.25}}>{COPY.reel.hook2}</div></div></div>
 {cards.map((c,i)=>{const k=spring({frame:f-i*2,fps,config:{damping:11,stiffness:120,mass:.7}});return <div key={c.text} style={{position:'absolute',left:'50%',top:'50%',width:220,height:166,marginLeft:c.x-110,marginTop:c.y-83,borderRadius:24,background:C.white,boxShadow:'0 18px 50px rgba(27,42,74,.18)',borderTop:`12px solid ${c.c}`,display:'grid',placeItems:'center',textAlign:'center',fontSize:32,fontWeight:900,whiteSpace:'pre-line',transform:`translate(${interpolate(k,[0,1],[-800,0])}px,${interpolate(k,[0,1],[-600,0])}px) rotate(${interpolate(k,[0,1],[c.angle*4,c.angle])}deg) scale(${interpolate(k,[0,1],[.55,1])})`,opacity:k}}>{c.text}</div>})}
 <div style={{position:'absolute',bottom:500,left:'50%',transform:'translateX(-50%)'}}><Logo size={72}/></div></Texture>};

