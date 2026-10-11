import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { C, fonts } from '../theme';
import { COPY } from '../copy';
import { Passport, Texture } from '../components/Art';
export const PassportScene: React.FC = () => {const f=useCurrentFrame();const {fps}=useVideoConfig();const p=spring({frame:f-5,fps,config:{damping:12,stiffness:155,mass:.65}});const opened=spring({frame:f-36,fps,config:{damping:13,stiffness:150}});return <Texture><div style={{position:'absolute',top:300,left:75,right:75,textAlign:'center',fontSize:62,fontWeight:900}}>{COPY.reel.passportLine}</div><div style={{position:'absolute',left:'50%',top:920,transform:`translate(-50%,-50%) perspective(1000px) rotateY(${interpolate(p,[0,1],[85,0])}deg) scale(${interpolate(p,[0,1],[.75,1])})`,opacity:p}}><Passport opened={f>34} scale={.96}/></div><div style={{position:'absolute',bottom:480,left:0,right:0,textAlign:'center',fontFamily:fonts.en,fontSize:30,letterSpacing:5,color:C.gold}}>ITINERARY · STAMPS · MEMORIES</div></Texture>};
