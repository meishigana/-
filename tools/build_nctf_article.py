from pathlib import Path
import html
import re


ROOT = Path(r"E:\ctf\NCTF")
OUT = Path("posts/nctf-record.html")


def read_text(path):
    try:
        return path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return path.read_text(encoding="utf-8", errors="replace")


def find_wp_files():
    files = []
    for path in ROOT.rglob("*.md"):
        parts = {part.lower() for part in path.parts}
        if "node_modules" in parts:
            continue
        name = path.name.lower()
        if not ("wp" in name or "writeup" in name or "write-up" in name):
            continue
        text = read_text(path)
        h1 = next((line[2:].strip() for line in text.splitlines() if line.startswith("# ")), None)
        title = h1 or path.parent.name or path.stem
        files.append((title, path, text))
    return files


def sort_key(item):
    order = ["ezheap", "horse", "openshell", "what another mess", "server 47768", "鸡爪流高手"]
    haystack = f"{item[0]} {item[1]}".lower()
    for idx, token in enumerate(order):
        if token in haystack:
            return idx
    return 99


def dedupe_by_title(files):
    seen = set()
    unique = []
    for title, path, text in sorted(files, key=sort_key):
        key = title.strip().lower()
        if key in seen:
            continue
        seen.add(key)
        unique.append((title, path, text))
    return unique


used_slugs = set()


def slugify(text):
    base = re.sub(r"[^a-zA-Z0-9\u4e00-\u9fff]+", "-", text).strip("-").lower() or "section"
    slug = base
    suffix = 2
    while slug in used_slugs:
        slug = f"{base}-{suffix}"
        suffix += 1
    used_slugs.add(slug)
    return slug


def inline_md(text):
    text = html.escape(text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    return re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda match: f"<span>{match.group(1)}</span> <code>{html.escape(match.group(2))}</code>",
        text,
    )


def convert_md(md):
    out = []
    in_code = False
    code_lines = []
    in_ul = False
    in_ol = False
    para = []

    def flush_para():
        nonlocal para
        if para:
            out.append("<p>" + inline_md(" ".join(para)) + "</p>")
            para = []

    def close_lists():
        nonlocal in_ul, in_ol
        if in_ul:
            out.append("</ul>")
            in_ul = False
        if in_ol:
            out.append("</ol>")
            in_ol = False

    for raw in md.splitlines():
        line = raw.rstrip()
        if line.startswith("```"):
            if in_code:
                out.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
                code_lines = []
                in_code = False
            else:
                flush_para()
                close_lists()
                in_code = True
                code_lines = []
            continue
        if in_code:
            code_lines.append(line)
            continue
        if not line.strip():
            flush_para()
            close_lists()
            continue
        heading = re.match(r"^(#{1,6})\s+(.*)$", line)
        if heading:
            flush_para()
            close_lists()
            level = min(len(heading.group(1)) + 1, 5)
            text = heading.group(2).strip()
            out.append(f'<h{level} id="{slugify(text)}">{inline_md(text)}</h{level}>')
            continue
        if re.match(r"^[-*]\s+", line):
            flush_para()
            if in_ol:
                out.append("</ol>")
                in_ol = False
            if not in_ul:
                out.append("<ul>")
                in_ul = True
            out.append("<li>" + inline_md(re.sub(r"^[-*]\s+", "", line)) + "</li>")
            continue
        if re.match(r"^\d+\.\s+", line):
            flush_para()
            if in_ul:
                out.append("</ul>")
                in_ul = False
            if not in_ol:
                out.append("<ol>")
                in_ol = True
            out.append("<li>" + inline_md(re.sub(r"^\d+\.\s+", "", line)) + "</li>")
            continue
        if line.startswith(">"):
            flush_para()
            close_lists()
            out.append("<blockquote>" + inline_md(line.lstrip("> ").strip()) + "</blockquote>")
            continue
        if re.match(r"^-{3,}\s*$", line):
            flush_para()
            close_lists()
            out.append("<hr>")
            continue
        para.append(line.strip())

    if in_code:
        out.append("<pre><code>" + html.escape("\n".join(code_lines)) + "</code></pre>")
    flush_para()
    close_lists()
    return "\n".join(out)


def build():
    files = dedupe_by_title(find_wp_files())
    source_items = []
    sections = []
    links = []
    char_count = 0

    for title, path, text in files:
        char_count += len(text)
        sid = slugify(title)
        links.append(f'          <a href="#{sid}">{html.escape(title)}</a>')
        source_items.append(f"            <li>{html.escape(title)}：<code>{html.escape(path.name)}</code></li>")
        body = convert_md(text)
        first_heading = re.escape(f'<h2 id="{sid}-2">{inline_md(title)}</h2>')
        body = re.sub(first_heading + r"\n?", "", body, count=1)
        sections.append(f'        <section class="wp-section">\n          <h2 id="{sid}">{html.escape(title)}</h2>\n{body}\n        </section>')

    read_min = max(1, round(char_count / 900))
    page = f'''<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="NCTF 比赛 write up 整合记录。">
    <title>NCTF比赛记录 | suancai_soup</title>
    <link rel="stylesheet" href="../assets/css/styles.css">
  </head>
  <body>
    <header class="site-header">
      <a class="brand" href="../index.html">
        <span class="brand-mark">SS</span>
        <span><strong>suancai_soup</strong><small>Security & Notes</small></span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span></button>
      <nav class="site-nav" id="site-nav"><a href="../index.html">首页</a><a href="../archive.html">归档</a><a href="../about.html">关于</a><a href="../rss.xml">RSS</a></nav>
    </header>

    <main class="article-shell">
      <article class="article">
        <header class="article-header">
          <div class="post-meta"><span>NCTF比赛记录</span><time datetime="2026-05-07">2026-05-07 · {char_count:,} chars · {read_min} mins.</time></div>
          <h1>NCTF比赛记录</h1>
          <p>本文整合自 <code>E:\\ctf\\NCTF</code> 下明确标记为 write up 的 Markdown 文件，按题目分节保留真实解题过程、关键 payload、脚本思路和结果记录；标题完全相同的文件只保留一份。</p>
        </header>

        <div class="article-toc">
{chr(10).join(links)}
        </div>

        <section>
          <h2>整合来源</h2>
          <ul>
{chr(10).join(source_items)}
          </ul>
        </section>

{chr(10).join(sections)}
      </article>
    </main>

    <footer class="site-footer"><span>© 2026 suancai_soup</span><a href="../archive.html">返回归档</a></footer>
    <script src="../assets/js/main.js"></script>
  </body>
</html>
'''
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(page, encoding="utf-8", newline="\n")
    print(f"built {OUT} from {len(files)} files")


if __name__ == "__main__":
    build()
