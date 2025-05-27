# DeepSeek Balance Checker

SillyTavern扩展，用于查询DeepSeek API使用余额。

## 安装方法
1. 下载本扩展
2. 将文件夹放入SillyTavern的`public/extensions`目录
3. 重启SillyTavern

## 使用方法
1. 点击侧边栏 ➕ 按钮选择扩展
2. 在设置菜单配置API密钥
3. 通过标签页查看实时余额

## 注意事项
❗ API密钥会以Base64编码存储（非完全安全）
❗ 高频查询可能产生费用，建议刷新间隔≥900秒

## 开发构建
```bash
npm install
npm run build
```