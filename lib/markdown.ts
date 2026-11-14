// Văn bản từ LLM (trợ lý, bản tin) hay có markdown: **đậm**, # tiêu đề, * gạch đầu dòng, `mã`.
// App không hiện markdown thô: chữ đậm vẫn đậm, các ký hiệu còn lại được bỏ hoặc đổi sang dạng dễ đọc.

export interface Span {
  text: string;
  bold: boolean;
}

/** Bỏ ký hiệu markdown theo từng dòng: tiêu đề (#), gạch đầu dòng (* / -) → "•", dấu ` và *nghiêng*. */
export function cleanMarkdown(src: string): string {
  return src
    .split('\n')
    .map((line) =>
      line
        .replace(/^\s{0,3}#{1,6}\s+/, '') // # Tiêu đề
        .replace(/^(\s*)[*+-]\s+/, '$1• ') // * mục  /  - mục
        .replace(/`([^`]*)`/g, '$1') // `mã`
        .replace(/(^|[^*\w])\*(?!\s)([^*\n]+?)\*(?!\w)/g, '$1$2'), // *nghiêng* (không đụng **đậm**)
    )
    .join('\n');
}

/** Tách văn bản thành các đoạn thường / đậm theo **...** hoặc __...__ (sau khi đã cleanMarkdown). */
export function parseInline(src: string): Span[] {
  const text = cleanMarkdown(src);
  const out: Span[] = [];
  const re = /\*\*([^*]+?)\*\*|__([^_]+?)__/g;
  let last = 0;
  for (let m = re.exec(text); m; m = re.exec(text)) {
    if (m.index > last) out.push({ text: text.slice(last, m.index), bold: false });
    out.push({ text: m[1] ?? m[2], bold: true });
    last = re.lastIndex;
  }
  if (last < text.length) out.push({ text: text.slice(last), bold: false });
  // Dấu ** lẻ (LLM viết thiếu cặp) thì bỏ luôn.
  return out.map((s) => (s.bold ? s : { ...s, text: s.text.replace(/\*\*/g, '') })).filter((s) => s.text.length > 0);
}
