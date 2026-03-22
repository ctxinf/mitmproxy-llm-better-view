import type { TokenizerAndRendererExtension, Tokens } from 'marked';

const TAG_NAME_PATTERN = '[A-Za-z][A-Za-z0-9:_.-]*';
const OPEN_TAG_RE = new RegExp(`^<\\s*(${TAG_NAME_PATTERN})(?=[\\s/>])[^>]*>`);
const CLOSE_TAG_RE = new RegExp(`^<\\s*\\/\\s*(${TAG_NAME_PATTERN})\\s*>`);

// 常见 HTML 标签白名单：命中时保持 marked 默认 HTML 渲染行为。
const KNOWN_HTML_TAGS = new Set([
  'a', 'abbr', 'address', 'article', 'aside', 'audio', 'b', 'bdi', 'bdo', 'blockquote',
  'br', 'button', 'caption', 'cite', 'code', 'col', 'colgroup', 'data', 'datalist', 'dd',
  'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'i', 'iframe', 'img', 'input', 'ins',
  'kbd', 'label', 'li', 'main', 'mark', 'menu', 'meter', 'nav', 'ol', 'optgroup', 'option',
  'output', 'p', 'picture', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp',
  'section', 'select', 'small', 'source', 'span', 'strong', 'sub', 'summary', 'sup', 'table',
  'tbody', 'td', 'template', 'textarea', 'tfoot', 'th', 'thead', 'time', 'tr', 'u', 'ul',
  'var', 'video', 'wbr', 'svg', 'path', 'g', 'circle', 'rect', 'line', 'polyline', 'polygon',
  'ellipse', 'text', 'tspan', 'use', 'defs', 'symbol', 'lineargradient', 'radialgradient',
  'stop', 'clippath', 'mask', 'foreignobject'
]);

const isKnownTag = (tagName: string): boolean => KNOWN_HTML_TAGS.has(tagName.toLowerCase());

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const escapeHtmlLiteral = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const highlightXmlLikeLiteral = (raw: string): string => {
  const escaped = escapeHtmlLiteral(raw);
  return escaped.replace(/(&lt;\/?)([\w-:]+)(.*?)(&gt;)/g, (_, open, tag, attrs, close) => {
    const highlightedAttrs = String(attrs).replace(
      /([\w-:]+)(=)(".*?"|'.*?')/g,
      '<span class="xv-attr-name">$1</span><span class="xv-equals">$2</span><span class="xv-attr-value">$3</span>'
    );
    return `<span class="xv-bracket">${open}</span><span class="xv-tag">${tag}</span>${highlightedAttrs}<span class="xv-bracket">${close}</span>`;
  });
};

const buildLiteralToken = (type: string, raw: string): Tokens.Generic => ({
  type,
  raw,
  text: raw
});

const matchUnknownTagSegment = (source: string): string | null => {
  if (!source.startsWith('<')) return null;

  // 注释/声明/处理指令交由 marked 默认逻辑处理。
  if (/^<\s*[!?]/.test(source)) return null;

  const closeMatch = source.match(CLOSE_TAG_RE);
  if (closeMatch) {
    return isKnownTag(closeMatch[1]) ? null : closeMatch[0];
  }

  const openMatch = source.match(OPEN_TAG_RE);
  if (!openMatch) return null;

  const tagName = openMatch[1];
  if (isKnownTag(tagName)) return null;

  const openingRaw = openMatch[0];
  if (/\/\s*>$/.test(openingRaw)) return openingRaw;

  const closingTagRe = new RegExp(`<\\s*\\/\\s*${escapeRegExp(tagName)}\\s*>`, 'i');
  const rest = source.slice(openingRaw.length);
  const closingMatch = closingTagRe.exec(rest);
  if (!closingMatch) return openingRaw;

  const endIndex = openingRaw.length + closingMatch.index + closingMatch[0].length;
  return source.slice(0, endIndex);
};

const renderLiteralToken = (token: Tokens.Generic): string => {
  const raw = typeof token.text === 'string' ? token.text : token.raw;
  // 文本化未知标签时，按 XML 视图风格高亮并保留原始换行。
  return highlightXmlLikeLiteral(raw).replace(/\n/g, '<br>\n');
};

const unknownTagBlockExtension: TokenizerAndRendererExtension = {
  name: 'unknownTagBlockLiteral',
  level: 'block',
  start(src) {
    const index = src.indexOf('<');
    return index >= 0 ? index : undefined;
  },
  tokenizer(src) {
    // 兼容 markdown block html 的前导缩进。
    const leadingSpaces = src.match(/^( {0,3})/)?.[0] ?? '';
    const rawSource = src.slice(leadingSpaces.length);
    if (!rawSource.startsWith('<')) return undefined;

    const matched = matchUnknownTagSegment(rawSource);
    if (!matched) return undefined;

    return buildLiteralToken('unknownTagBlockLiteral', `${leadingSpaces}${matched}`);
  },
  renderer(token) {
    return renderLiteralToken(token);
  }
};

const unknownTagInlineExtension: TokenizerAndRendererExtension = {
  name: 'unknownTagInlineLiteral',
  level: 'inline',
  start(src) {
    const index = src.indexOf('<');
    return index >= 0 ? index : undefined;
  },
  tokenizer(src) {
    const matched = matchUnknownTagSegment(src);
    if (!matched) return undefined;

    return buildLiteralToken('unknownTagInlineLiteral', matched);
  },
  renderer(token) {
    return renderLiteralToken(token);
  }
};

export const unknownTagLiteralExtensions: TokenizerAndRendererExtension[] = [
  unknownTagBlockExtension,
  unknownTagInlineExtension
];
