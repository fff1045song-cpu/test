// 인라인 SVG 아이콘 모음 (이모지 대신 사용)
// icon('home') 처럼 쓰면 <svg> 문자열을 돌려준다. 색은 currentColor를 따른다.

const P = {
  home: '<path d="M4 11l8-7 8 7"/><path d="M6 10v9h12v-9"/>',
  ranking: '<path d="M6 20v-6M12 20V6M18 20v-10"/>',
  friends: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14c2.2.2 3.7 1.8 4 4.5"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="2"/><path d="M3.5 13h17M12 9v11"/><path d="M12 9c-2-4-6-4-6-1.5S10 9 12 9zM12 9c2-4 6-4 6-1.5S14 9 12 9z"/>',
  grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>',
  back: '<path d="M14.5 5l-7 7 7 7"/>',
  chevron: '<path d="M9.5 5l7 7-7 7"/>',
  share: '<path d="M12 15V4M7.5 8.5L12 4l4.5 4.5"/><path d="M5 12v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  addHome: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  thumbUp: '<path d="M7.5 10.5V20H4.5v-9.5z"/><path d="M7.5 10.5l3.6-6.3c1.3 0 2.3 1.1 2.1 2.4l-.6 3.4h5.1c1.2 0 2.1 1.1 1.8 2.3l-1.6 6.3a2.4 2.4 0 0 1-2.3 1.4H7.5"/>',
  thumbDown: '<path d="M7.5 13.5V4H4.5v9.5z"/><path d="M7.5 13.5l3.6 6.3c1.3 0 2.3-1.1 2.1-2.4l-.6-3.4h5.1c1.2 0 2.1-1.1 1.8-2.3l-1.6-6.3A2.4 2.4 0 0 0 15.6 4H7.5"/>',
  pencil: '<path d="M4.5 19.5l1-4.5L15.5 5l3.5 3.5-10 10z"/><path d="M13 7.5l3.5 3.5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  userPlus: '<circle cx="10" cy="8" r="3.5"/><path d="M3.5 20c.6-3.5 3-5.5 6.5-5.5s5.9 2 6.5 5.5"/><path d="M18.5 7v6M15.5 10h6"/>',
  mic: '<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
  micOff: '<path d="M15 10V6.5a3 3 0 0 0-5.6-1.5M9 9v2.5a3 3 0 0 0 4.6 2.5"/><path d="M5.5 11.5a6.5 6.5 0 0 0 10.8 4.9M18.5 11.5c0 .7-.1 1.4-.3 2M12 18v2.5M4 4l16 16"/>',
  chat: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/>',
  chatOff: '<path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 17h-8l-4.5 3.5V17H5a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 5 5z"/><path d="M9 10.5h6"/>',
  send: '<path d="M4.5 12L20 4.5 15 20l-3-6.5z"/><path d="M12 13.5l8-9"/>',
  check: '<path d="M5.5 12.5l4 4 9-9"/>',
  chest: '<rect x="4" y="9" width="16" height="10.5" rx="2"/><path d="M4 9.5a8 4.5 0 0 1 16 0"/><path d="M4 13h16"/><rect x="10.5" y="11.5" width="3" height="3.5" rx="1" fill="currentColor"/>',
  trophy: '<path d="M8 4.5h8v5a4 4 0 0 1-8 0z"/><path d="M8 6.5H5v1.5a3 3 0 0 0 3 3M16 6.5h3v1.5a3 3 0 0 1-3 3"/><path d="M12 13.5v3.5M8.5 20h7M9.5 20l.5-3h4l.5 3"/>',
  flame: '<path d="M12 21c-3.9 0-6.5-2.6-6.5-6.2 0-3.4 2.4-5.2 3.7-8.3.4 1.7 1.3 2.8 2.4 3.4C12 7 13 4.5 15 3c-.2 2.8 3.5 5.7 3.5 11.2 0 3.9-2.7 6.8-6.5 6.8z" fill="currentColor"/>',
  coin: '<circle cx="12" cy="12" r="8.5" fill="currentColor"/><path d="M9.5 8.5h3.2a2 2 0 0 1 0 4H9.5V8.5zM9.5 12.5v3.5M8 10.5h7" stroke="#1A1033"/>',
  puzzle: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  bolt: '<path d="M13.5 3L5.5 13.5h6L10.5 21l8-10.5h-6z" stroke-linejoin="round"/>',
  shop: '<path d="M4 9.5L5.5 4.5h13L20 9.5"/><path d="M4 9.5c0 1.6 1.3 2.5 2.7 2.5S9.3 11 9.3 9.5c0 1.5 1.2 2.5 2.7 2.5s2.7-1 2.7-2.5c0 1.5 1.2 2.5 2.6 2.5S20 11.1 20 9.5"/><path d="M5.5 12v7.5h13V12"/><path d="M10 19.5v-4.5h4v4.5"/>',
  sparkle: '<path d="M12 3.5c.6 4.2 2.3 6.1 6.5 6.8-4.2.7-5.9 2.6-6.5 6.7-.6-4.1-2.3-6-6.5-6.7 4.2-.7 5.9-2.6 6.5-6.8z" fill="currentColor" stroke-linejoin="round"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  lock: '<rect x="5.5" y="10.5" width="13" height="9.5" rx="2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  dots: '<circle cx="6" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="18" cy="12" r="1.4" fill="currentColor"/>',
  plusSquare: '<rect x="4" y="4" width="16" height="16" rx="3.5"/><path d="M12 8.5v7M8.5 12h7"/>',
  arrowUp: '<path d="M12 6l6 8H6z" fill="currentColor" stroke="none"/>',
  arrowDown: '<path d="M12 18l6-8H6z" fill="currentColor" stroke="none"/>',
  replay: '<path d="M5 12a7 7 0 1 0 2.2-5.1"/><path d="M5 4.5v4h4"/>',
};

export function icon(name, size = 24, extra = '') {
  const body = P[name] || '';
  return `<svg class="ic" ${extra} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}
