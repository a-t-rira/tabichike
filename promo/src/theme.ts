import { loadFont as loadZen } from '@remotion/google-fonts/ZenKakuGothicNew';
import { loadFont as loadBebas } from '@remotion/google-fonts/BebasNeue';
import { loadFont as loadSpace } from '@remotion/google-fonts/SpaceMono';

const zen = loadZen('normal', { weights: ['700', '900'], subsets: ['japanese'] });
const bebas = loadBebas('normal', { weights: ['400'], subsets: ['latin'] });
const space = loadSpace('normal', { weights: ['700'], subsets: ['latin'] });
export const fonts = { ja: zen.fontFamily, en: bebas.fontFamily, mono: space.fontFamily };
export const waitForFonts = () => Promise.all([zen.waitUntilDone(), bebas.waitUntilDone(), space.waitUntilDone()]);
export const C = { board: '#10192E', boardText: '#FFC93C', navy: '#1B2A4A', paper: '#FBF7EE', white: '#FFFFFF', sunset: '#FF6B3D', stamp: '#D7263D', gold: '#C9A227', mint: '#2EC4A6', sky: '#3BA7E0', rose: '#F2668B', line: '#E3DCCB', gray: '#7A7F8C', yellow: '#FFC93C' };
