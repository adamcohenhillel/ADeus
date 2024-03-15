import React from 'react';

export default function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`
        prose dark:prose-invert

        prose-headings:mt-4 prose-headings:mb-2 prose-headings:font-bold prose-headings:text-foreground

        prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl

        prose-p:my-2

        prose-ol:mb-6 prose-ol:pl-5 prose-ol:list-decimal

        prose-ul:mb-6 prose-ul:pl-5 prose-ul:list-disc

        prose-li:mb-4 prose-li:marker:text-foreground

        prose-pre:bg-black prose-pre:rounded prose-pre:px-4 prose-pre:py-3 prose-pre:line-numbers prose-pre:line-numbers-override prose-pre:line-numbers-override-2 prose-pre:font-mono prose-pre:text-sm prose-pre:my-2

        prose-table:my-4 prose-table:border-separate prose-table:border-spacing-0 prose-table:rounded prose-table:overflow-hidden

        prose-th:border prose-th:border-muted prose-th:dark:border-border prose-th:p-2 prose-th:dark:bg-border prose-th:bg-muted prose-th:text-card-foreground prose-th:font-bold first:prose-th:rounded-tl last:prose-th:rounded-tr prose-th:first:prose-tr:border-t-2

        first:prose-th:border-l-2 last:prose-th:border-r-2

        prose-td:border prose-td:border-muted prose-td:dark:border-border prose-td:p-2 first:prose-td:border-l-2 last:prose-td:border-r-2 first:prose-td:last:prose-tr:rounded-bl

        last:prose-td:last:prose-tr:rounded-br prose-td:last:prose-tr:border-b-2

        prose-a:text-foreground

        prose-blockquote:text-foreground prose-blockquote:border-l-foreground

        text-foreground overflow-x-auto
      `}
    >
      {children}
    </div>
  );
}
