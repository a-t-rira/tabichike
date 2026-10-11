import React from 'react';
import { Composition, Still, Sequence, registerRoot, delayRender, continueRender } from 'remotion';
import { COPY } from './copy';
import { waitForFonts } from './theme';
import { HookScene } from './scenes/HookScene';
import { TicketScene } from './scenes/TicketScene';
import { BoardScene } from './scenes/BoardScene';
import { VisitedScene } from './scenes/VisitedScene';
import { PassportScene } from './scenes/PassportScene';
import { CollabScene } from './scenes/CollabScene';
import { BrandScene } from './scenes/BrandScene';
import { PromoPost, ReelCover } from './stills/PromoPost';

const fontHandle = delayRender('Loading promo fonts');
waitForFonts().then(() => continueRender(fontHandle)).catch((error) => { console.error(error); continueRender(fontHandle); });
const scenes=[HookScene,TicketScene,BoardScene,VisitedScene,PassportScene,CollabScene,BrandScene];
const Reel: React.FC = () => <>{COPY.scenes.map((s,i)=>{const Component=scenes[i];return <Sequence key={s.id} from={s.from} durationInFrames={s.duration} premountFor={10}><Component/></Sequence>})}</>;
const Root: React.FC = () => <><Composition id="TabichikeReel" component={Reel} width={1080} height={1920} fps={COPY.fps} durationInFrames={COPY.seconds*COPY.fps}/><Still id="ReelCover" component={ReelCover} width={1080} height={1920}/>{COPY.posts.map((_,i)=><Still key={i} id={`Post0${i+1}`} component={()=><PromoPost index={i}/>} width={1080} height={1350}/>)}</>;
registerRoot(Root);
