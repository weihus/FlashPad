import '@fontsource/inter/latin-400.css';
import './styles.css';
import {
  copyText,
  hideWindow,
  onDesktopNotice,
  onEditorOpened,
  setPinned,
  shortcutUnavailable,
} from './desktop';

const editor = document.querySelector<HTMLTextAreaElement>('#editor')!;
const count = document.querySelector<HTMLSpanElement>('#word-count')!;
const feedback = document.querySelector<HTMLDivElement>('#feedback')!;
const cleanup = document.querySelector<HTMLButtonElement>('#cleanup')!;
const restore = document.querySelector<HTMLButtonElement>('#history')!;
const theme = document.querySelector<HTMLButtonElement>('#theme')!;
const copy = document.querySelector<HTMLButtonElement>('#copy')!;
const pin = document.querySelector<HTMLButtonElement>('#pin')!;
const hide = document.querySelector<HTMLButtonElement>('#hide')!;

const defaultSize = 18;
const maxHistory = 5;
const themeKey = 'flashpad.theme';
const history: string[] = [];
const words = new Intl.Segmenter('zh', { granularity: 'word' });
const han = /\p{Script=Han}/gu;
let fontSize = defaultSize;
let copying = false;
let pinned = false;
let feedbackTimer: number | undefined;
let checkedShortcut = false;

function showFeedback(message: string, duration = 950) {
  window.clearTimeout(feedbackTimer);
  feedback.textContent = message;
  feedback.dataset.visible = 'true';
  feedbackTimer = window.setTimeout(() => {
    feedback.dataset.visible = 'false';
  }, duration);
}

function focusAtEnd() {
  editor.focus({ preventScroll: true });
  const end = editor.value.length;
  editor.setSelectionRange(end, end);
  editor.scrollTop = editor.scrollHeight;
}

function updateToolbar() {
  let total = 0;
  for (const { segment, isWordLike } of words.segment(editor.value)) {
    if (isWordLike) total += segment.match(han)?.length ?? 1;
  }
  count.textContent = `${total} 字`;
  const empty = editor.value === '';
  copy.disabled = copying || empty;
  cleanup.disabled = copying || empty;
  restore.disabled = copying || !empty || history.length === 0;
}

function applyTheme(dark: boolean) {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  theme.setAttribute('aria-pressed', String(dark));
}

function adjustSize(size: number) {
  fontSize = Math.min(48, Math.max(14, size));
  document.documentElement.style.setProperty('--editor-size', `${fontSize}px`);
  showFeedback(`${Math.round(fontSize * 10) / 10}px`);
}

async function hideEditor() {
  try {
    await hideWindow();
  } catch (error) {
    console.error(error);
    showFeedback('无法隐藏窗口', 3000);
  }
}

async function copyAndClear() {
  if (copying || editor.value === '') return;
  const draft = editor.value;
  copying = true;
  editor.readOnly = true;
  updateToolbar();

  try {
    await copyText(draft);
    history.push(draft);
    if (history.length > maxHistory) history.shift();
    editor.value = '';
    await hideEditor();
  } catch (error) {
    console.error(error);
    showFeedback('剪贴板写入失败，草稿已保留', 3500);
  } finally {
    copying = false;
    editor.readOnly = false;
    updateToolbar();
  }
}

function restoreDraft() {
  if (copying || editor.value !== '') return;
  const draft = history.pop();
  if (draft === undefined) return;
  editor.value = draft;
  updateToolbar();
  focusAtEnd();
}

function cleanBlankLines() {
  const text = editor.value;
  editor.value = text.trim() === '' ? '' : text
    .replace(/^(?:[^\S\n]*\n)+|(?:\n[^\S\n]*)+$/g, '')
    .replace(/\n(?:[^\S\n]*\n){2,}/g, '\n\n');
  updateToolbar();
  focusAtEnd();
}

function onOpen() {
  focusAtEnd();
  if (checkedShortcut) return;
  checkedShortcut = true;
  void shortcutUnavailable().then((unavailable) => {
    if (unavailable) showFeedback('Alt / Option + Space 不可用，请从托盘打开', 5200);
  }).catch(console.error);
}

try {
  applyTheme(localStorage.getItem(themeKey) === 'dark');
} catch (error) {
  console.error(error);
}
updateToolbar();
focusAtEnd();
void onEditorOpened(onOpen).catch(console.error);
void onDesktopNotice((message) => showFeedback(message, 3500)).catch(console.error);
window.addEventListener('focus', () => {
  if (!checkedShortcut) onOpen();
});

editor.addEventListener('input', updateToolbar);
copy.addEventListener('click', () => void copyAndClear());
restore.addEventListener('click', restoreDraft);
cleanup.addEventListener('click', cleanBlankLines);
hide.addEventListener('click', () => void hideEditor());

theme.addEventListener('click', () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  applyTheme(dark);
  try {
    localStorage.setItem(themeKey, dark ? 'dark' : 'light');
  } catch (error) {
    console.error(error);
    showFeedback('无法记住主题偏好', 3000);
  }
});

pin.addEventListener('click', async () => {
  pin.disabled = true;
  try {
    await setPinned(!pinned);
    pinned = !pinned;
    pin.setAttribute('aria-pressed', String(pinned));
    pin.title = pinned ? '取消置顶' : '窗口置顶';
  } catch (error) {
    console.error(error);
    showFeedback('无法更改置顶状态', 3000);
  } finally {
    pin.disabled = false;
  }
});

window.addEventListener('keydown', (event) => {
  if (event.isComposing || event.keyCode === 229) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    if (!copying && !event.repeat) void hideEditor();
    return;
  }
  if (!(event.ctrlKey || event.metaKey) || event.altKey) return;

  switch (event.key.toLowerCase()) {
    case '=':
    case '+':
      event.preventDefault();
      adjustSize(fontSize + 1);
      break;
    case '-':
      event.preventDefault();
      adjustSize(fontSize - 1);
      break;
    case '0':
      event.preventDefault();
      adjustSize(defaultSize);
      break;
    case 'enter':
      event.preventDefault();
      if (!event.repeat) void copyAndClear();
      break;
    case 'z':
      if (!event.shiftKey && editor.value === '' && history.length > 0) {
        event.preventDefault();
        if (!event.repeat) restoreDraft();
      }
      break;
  }
});

window.addEventListener('wheel', (event) => {
  if (!(event.ctrlKey || event.metaKey) || event.deltaY === 0) return;
  event.preventDefault();
  const unit = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 :
    event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? window.innerHeight : 1;
  const change = Math.max(-3, Math.min(3, -event.deltaY * unit * 0.02));
  adjustSize(fontSize + change);
}, { passive: false });
