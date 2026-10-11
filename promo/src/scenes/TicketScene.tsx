import React from 'react';
import { useCurrentFrame, spring, useVideoConfig, interpolate } from 'remotion';
import { C, fonts } from '../theme';
import { COPY } from '../copy';
import { FadeWord, Ticket, Texture } from '../components/Art';
export const TicketScene: React.FC = () => {const f=useCurrentFrame();const {fps}=useVideoConfig();const p=spring({frame:f-4,fps,config:{damping:11,stiffness:185}});const flash=f>18&&f<25?interpolate(f,[18,20,25],[0,.8,0]):0;return <Texture><div style={{position:'absolute',top:325,left:0,right:0,textAlign:'center'}}><FadeWord size={68}>{COPY.reel.merge}</FadeWord></div><div style={{position:'absolute',left:'50%',top:'52%',transform:`translate(-50%,-50%) scale(${interpolate(p,[0,1],[.08,1])}) rotate(${interpolate(p,[0,1],[-15,0])}deg)`,opacity:p}}><Ticket scale={1.05}/></div><div style={{position:'absolute',inset:0,background:'#fff',opacity:flash,pointerEvents:'none'}}/></Texture>};
