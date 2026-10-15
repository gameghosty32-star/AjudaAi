'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

// Lightweight, safe markdown renderer (no external deps, no dangerouslySetInnerHTML)
// Supports: # headings, **bold**, *italic*, `inline code`, - bullet lists, > blockquotes,
// [text](url) links, --- horizontal rule, and paragraph breaks.

type Inline =
  | { type: 'text'; value: string }
  | { type: 'bold'; value: Inline[] }
  | { type: 'italic'; value: Inline[] }
  | { type: 'code'; value: string }
  | { type: 'link'; href: string; value: Inline[] }

function parseInline(text: string): Inline[] {
  const result: Inline[] = []
  let i = 0
  let buffer = ''
  const flush = () => {
    if (buffer) {
      result.push({ type: 'text', value: buffer })
      buffer = ''
    }
  }
  while (i < text.length) {
    const rest = text.slice(i)
    // bold
    const boldMatch = rest.match(/^\*\*(.+?)\*\*/)
    if (boldMatch) {
      flush()
      result.push({ type: 'bold', value: parseInline(boldMatch[1]) })
      i += boldMatch[0].length
      continue
    }
    // italic (single * not followed by *)
    const italicMatch = rest.match(/^\*(.+?)\*/)
    if (italicMatch) {
      flush()
      result.push({ type: 'italic', value: parseInline(italicMatch[1]) })
      i += italicMatch[0].length
      continue
    }
    // inline code
    const codeMatch = rest.match(/^`([^`]+)`/)
    if (codeMatch) {
      flush()
      result.push({ type: 'code', value: codeMatch[1] })
      i += codeMatch[0].length
      continue
    }
    // link [text](url)
    const linkMatch = rest.match(/^\[([^\]]+)\]\(([^)\s]+)\)/)
    if (linkMatch) {
      flush()
      const href = sanitizeUrl(linkMatch[2])
      if (href) {
        result.push({ type: 'link', href, value: parseInline(linkMatch[1]) })
      } else {
        result.push({ type: 'text', value: linkMatch[1] })
      }
      i += linkMatch[0].length
      continue
    }
    buffer += text[i]
    i++
  }
  flush()
  return result
}

function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (/^(https?:\/\/|mailto:|\/)/i.test(trimmed)) {
    return trimmed
  }
  return null
}

function renderInline(nodes: Inline[]): React.ReactNode[] {
  return nodes.map((node, idx) => {
    switch (node.type) {
      case 'text':
        return <span key={idx}>{node.value}</span>
      case 'bold':
        return <strong key={idx} className="font-semibold text-foreground">{renderInline(node.value)}</strong>
      case 'italic':
        return <em key={idx}>{renderInline(node.value)}</em>
      case 'code':
        return (
          <code key={idx} className="rounded bg-muted px-1 py-0.5 text-[0.875em] font-mono text-foreground">
            {node.value}
          </code>
        )
      case 'link':
        return (
          <a key={idx} href={node.href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
            {renderInline(node.value)}
          </a>
        )
      default:
        return null
    }
  })
}

type Block =
  | { type: 'heading'; level: 1 | 2 | 3; inline: Inline[] }
  | { type: 'paragraph'; inline: Inline[] }
  | { type: 'quote'; inline: Inline[] }
  | { type: 'list'; items: Inline[][]; ordered: boolean }
  | { type: 'hr' }
  | { type: 'codeblock'; value: string }
  | { type: 'empty' }

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let i = 0
  let paragraph: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null
  let codeblock: string[] | null = null

  const flushParagraph = () => {
    if (paragraph.length) {
      const text = paragraph.join(' ').trim()
      if (text) blocks.push({ type: 'paragraph', inline: parseInline(text) })
      paragraph = []
    }
  }
  const flushList = () => {
    if (list) {
      blocks.push({ type: 'list', items: list.items.map((it) => parseInline(it)), ordered: list!.ordered })
      list = null
    }
  }
  const flushCodeblock = () => {
    if (codeblock) {
      blocks.push({ type: 'codeblock', value: codeblock.join('\n') })
      codeblock = null
    }
  }
  const flushAll = () => {
    flushParagraph()
    flushList()
    flushCodeblock()
  }

  while (i < lines.length) {
    const line = lines[i]
    // code block fence
    if (line.trim().startsWith('```')) {
      flushAll()
      codeblock = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeblock!.push(lines[i])
        i++
      }
      i++ // skip closing fence
      flushCodeblock()
      continue
    }
    if (codeblock) {
      codeblock.push(line)
      i++
      continue
    }
    // horizontal rule
    if (/^\s*---+\s*$/.test(line) || /^\s*\*\*\*+\s*$/.test(line)) {
      flushAll()
      blocks.push({ type: 'hr' })
      i++
      continue
    }
    // heading
    const h = line.match(/^(#{1,3})\s+(.+)$/)
    if (h) {
      flushAll()
      blocks.push({ type: 'heading', level: h[1].length as 1 | 2 | 3, inline: parseInline(h[2].trim()) })
      i++
      continue
    }
    // blockquote
    if (/^\s*>\s?/.test(line)) {
      flushAll()
      const content = line.replace(/^\s*>\s?/, '')
      blocks.push({ type: 'quote', inline: parseInline(content) })
      i++
      continue
    }
    // ordered list
    const ol = line.match(/^\s*\d+\.\s+(.+)$/)
    if (ol) {
      flushParagraph()
      if (!list || !list.ordered) {
        flushList()
        list = { ordered: true, items: [] }
      }
      list!.items.push(ol[1])
      i++
      continue
    }
    // unordered list
    const ul = line.match(/^\s*[-*]\s+(.+)$/)
    if (ul) {
      flushParagraph()
      if (!list || list.ordered) {
        flushList()
        list = { ordered: false, items: [] }
      }
      list!.items.push(ul[1])
      i++
      continue
    }
    // empty line
    if (line.trim() === '') {
      flushAll()
      i++
      continue
    }
    // paragraph line
    if (list) flushList()
    paragraph.push(line.trim())
    i++
  }
  flushAll()
  return blocks
}

export function MarkdownContent({ content, className }: { content: string; className?: string }) {
  const blocks = useMemo(() => parseBlocks(content || ''), [content])
  return (
    <div className={cn('space-y-3 break-words', className)}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) return <h2 key={idx} className="text-xl font-bold tracking-tight">{renderInline(block.inline)}</h2>
            if (block.level === 2) return <h3 key={idx} className="text-lg font-bold tracking-tight">{renderInline(block.inline)}</h3>
            return <h4 key={idx} className="text-base font-semibold">{renderInline(block.inline)}</h4>
          }
          case 'paragraph':
            return <p key={idx}>{renderInline(block.inline)}</p>
          case 'quote':
            return (
              <blockquote key={idx} className="border-l-4 border-primary/40 pl-3 italic text-muted-foreground">
                {renderInline(block.inline)}
              </blockquote>
            )
          case 'list': {
            const items = block.items.map((it, i) => <li key={i} className="ml-1">{renderInline(it)}</li>)
            return block.ordered ? (
              <ol key={idx} className="ml-5 list-decimal space-y-1">{items}</ol>
            ) : (
              <ul key={idx} className="ml-5 list-disc space-y-1">{items}</ul>
            )
          }
          case 'hr':
            return <hr key={idx} className="border-border" />
          case 'codeblock':
            return (
              <pre key={idx} className="overflow-x-auto rounded-lg bg-muted p-3 text-sm">
                <code className="font-mono">{block.value}</code>
              </pre>
            )
          case 'empty':
            return null
          default:
            return null
        }
      })}
    </div>
  )
}
