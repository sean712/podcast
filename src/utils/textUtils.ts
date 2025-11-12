export function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

export function decodeHtmlEntities(text: string): string {
  const tmp = document.createElement('textarea');
  tmp.innerHTML = text;
  return tmp.value;
}
