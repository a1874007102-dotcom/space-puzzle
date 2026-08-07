# 发布到 GitHub Pages

1. 在 GitHub 新建仓库（如 `space-puzzle`）。
2. 推送：`git remote add origin https://github.com/<用户名>/<仓库名>.git`，然后 `git push -u origin main`。
3. 仓库 Settings → Pages → Source 选 `Deploy from a branch`，分支选 `main`、目录选 `/ (root)` → Save。
4. 等待约 1 分钟，访问 `https://<用户名>.github.io/<仓库名>/`。

注意：项目内全部使用相对路径，子路径部署无需额外配置。
