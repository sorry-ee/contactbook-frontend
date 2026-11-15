# Soul · 通讯录前端

当前公网应用：https://zhijiao-contactbook-sorryee.equal-cup-7231.chatgpt.site

原生 HTML/CSS/JavaScript，支持联系人 CRUD、收藏、搜索、多联系方式，以及 SheetJS 0.20.3 Excel 导入导出。

后端及可独立运行的集成源码：https://github.com/sorry-ee/contactbook-backend

前端通过同源 /api/contacts 和 /api/import 调用后端，不能直接双击 index.html 使用。按后端 README 运行集成版本；要更新前端，将本仓库的页面及 JS/CSS 文件复制到后端 public/ 目录，再重新构建。

当前部署的数据库是 Cloudflare D1，以浏览器 Cookie 隔离通讯录。清除 Cookie 或换浏览器会失去原访问标识，请定期导出备份。

代码规范见 CODING_STANDARDS.md。公开演示仅使用虚构数据。
