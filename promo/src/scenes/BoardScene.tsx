import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { C } from '../theme';
import { Board, Texture } from '../components/Art';

export const BoardScene: React.FC = () => {const f=useCurrentFrame();const {fps}=useVideoConfig();const p=spring({frame:f-4,fps,config:{damping:16,stiffness:140}});return <Texture color={C.board} dark><div style={{position:'absolute',top:475,left:110,right:110,transform:`translateY(${interpolate(p,[0,1],[80,0])}px) scale(${p})`,opacity:p}}><Board scale={1.03} countdown/></div><div style={{position:'absolute',bottom:490,left:85,right:85,textAlign:'center',fontFamily:'Zen Kaku Gothic New',fontSize:54,fontWeight:900,color:C.white}}>開くと空港の案内板に。</div></Texture>};
