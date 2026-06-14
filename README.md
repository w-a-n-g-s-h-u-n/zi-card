# 识字小练习

纯静态的幼儿认字练习网页。每次打开后录入本次字表，在浏览器内完成练习、复习和统计，不依赖后端服务。

## 开发

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## GitHub Pages

项目已支持 GitHub Pages。

### 自动部署

仓库推送到 `main` 或 `master` 后，`.github/workflows/deploy-pages.yml` 会自动：

1. 安装依赖
2. 构建静态文件
3. 上传 `dist`
4. 发布到 GitHub Pages

首次使用时，在 GitHub 仓库中打开：

```txt
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

然后推送代码即可。

### 路径说明

`vite.config.ts` 使用 `base: "./"`，因此同一份构建产物可以部署在：

- `https://用户名.github.io/仓库名/`
- 自定义域名根路径

无需根据仓库名手动修改 `base`。
