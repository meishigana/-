# suancai_soup 静态博客

这是一个零构建依赖的个人博客框架。当前已收录文章 `NCTF比赛记录`。

## 目录

- `index.html`：首页
- `archive.html`：文章归档
- `about.html`：关于页
- `posts/`：文章目录
- `assets/css/styles.css`：全站样式
- `assets/js/main.js`：移动端导航和代码复制按钮
- `assets/img/avatar.svg`：头像/站点视觉标识
- `rss.xml`：RSS 示例

## 日常维护

新增文章时：

1. 在 `posts/` 目录新增文章 HTML 文件。
2. 修改标题、日期、分类、摘要和正文。
3. 在 `index.html` 的最新文章区增加入口。
4. 在 `archive.html` 增加归档记录。
5. 在 `rss.xml` 增加 RSS 条目。

## 上线前需要替换的信息

- 站点名称：当前为 `suancai_soup`
- 作者邮箱：待补充
- GitHub 链接：待补充
- RSS 域名：待补充正式域名
- 头像或 Logo：当前为 `assets/img/avatar.svg`

## GitHub Pages 部署

需要你提供或确认：

- GitHub 用户名
- 目标仓库名，例如 `blog` 或 `<username>.github.io`
- 已提供 SSH key 指纹：`SHA256:LZD4EGHzjKlxM4dCr8cVXBNTYYLEyp2rmp+PeTxELc0`
- 是否使用自定义域名

本地初始化命令示例：

```powershell
git init
git add .
git commit -m "Initial security blog"
git branch -M main
git remote add origin git@github.com:<username>/<repo>.git
git push -u origin main
```

推送后在 GitHub 仓库的 `Settings -> Pages` 中选择 `Deploy from a branch`，分支选择 `main`，目录选择 `/root`。

## 自定义域名

如果有域名，需要提供域名值，例如 `blog.example.com`。GitHub Pages 通常需要：

- 仓库根目录添加 `CNAME` 文件，内容为你的域名。
- DNS 添加 CNAME 记录，指向 `<username>.github.io`。
