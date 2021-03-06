import { getTheme } from './theme';
import Color from 'color';
import { Elem } from '../../shared/elem';
import { getAPI } from './api';

const cache = new Map(); 

const colorStyleTag = document.createElement('style');
document.head.appendChild(colorStyleTag);

export function getClassFromDisplay(display: Elem['display'], forceRecalculate?: boolean): string {
  const key = `${display.color}:::${display.image}`;
  if (!forceRecalculate && cache.has(key)) return cache.get(key);

  const c = cache.get(key) || 'p' + cache.size;
  cache.set(key, c);

  const rule = `.${c}{${getCSSFromDisplay(display)};}`;
  colorStyleTag.sheet.insertRule(rule, colorStyleTag.sheet.cssRules.length);

  return c;
}

export function reloadElementCssColors() {
  const rules = colorStyleTag.sheet.cssRules.length;
  for (let i = 0; i < rules; i++) {
    colorStyleTag.sheet.deleteRule(0);
  }
  cache.forEach((val, key) => {
    const [color, image] = key.split(':::')
    getClassFromDisplay({
      text: 'Element',
      color,
      image,
    }, true)
  })
}

export function getCSSFromDisplay(display: Elem['display']): string {
  const theme = getTheme();
  const colorConfig = theme.colors[display.color];

  let outputColor: Color;

  const paletteApi = getAPI('customPalette');
  if(paletteApi) {
    outputColor = paletteApi.lookupCustomPaletteColor(theme.colors, display.color);
  } else {
    outputColor = colorConfig.color;
  }

  return `background-color:rgb(${outputColor.red()},${outputColor.green()},${outputColor.blue()});`
    + `color:${outputColor.isLight() ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)'}`;
}
