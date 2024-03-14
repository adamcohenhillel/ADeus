import { AnimatePresence, motion } from 'framer-motion';
import ChatDots from './ChatDots';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import renderMathInElement from 'katex/contrib/auto-render';

export interface Message {
  role: string;
  content: string;
}

const md = new MarkdownIt({
  highlight: function (str, lang, attrs) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const highlightedCode = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
        const modifiedCode = highlightedCode.replace(/<span class="hljs-strong">/g, '<span class="hljs-strong-custom">');
        return '<pre class="code-block"><code>' + modifiedCode + '</code></pre>';
      } catch (__) {}
    }
    return '';
  },
  html: true,
  xhtmlOut: true,
  typographer: true,
});

if (typeof document !== 'undefined') {
  const customCss = document.createElement('style');
  customCss.innerHTML = `
    .hljs-strong-custom {
      color: white;
      font-weight: normal;
    }
  `;
  document.head.appendChild(customCss);
}

export default function ChatLog({
  messages,
  waitingForResponse,
}: {
  messages: Message[];
  waitingForResponse: boolean;
}) {
  const renderMessageContent = (content: string) => {
    const html = md.render(content);
    return (
      <div
        ref={(el) =>
          el &&
          renderMathInElement(el, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false },
              { left: '\\(', right: '\\)', display: true },
              { left: '\\[', right: '\\]', display: false },
            ],
          })
        }
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  };

  return (
    <AnimatePresence initial={false}>
      {messages ? (
        <ol className="pb-4">
          {messages.map((chat, index) => (
            <div
              key={index}
              className={
                chat['role'] === 'user'
                  ? 'flex w-full items-end justify-end'
                  : ''
              }
            >
              <motion.div
                className={
                  chat['role'] === 'user'
                    ? 'bg-primary mb-2 w-fit rounded-xl rounded-br-none px-4 py-3 shadow-sm'
                    : 'bg-muted/20 mb-2 w-fit rounded-xl rounded-bl-none px-4 py-3 shadow-sm'
                }
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 1 } }}
              >
                {renderMessageContent(chat['content'])}
              </motion.div>
            </div>
          ))}
          {waitingForResponse ? (
            <motion.div
              className="bg-muted/20 mb-2 w-fit rounded-xl rounded-bl-none px-4 py-3 shadow-sm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 1 } }}
            >
              <ChatDots />
            </motion.div>
          ) : null}
        </ol>
      ) : null}
    </AnimatePresence>
  );
}