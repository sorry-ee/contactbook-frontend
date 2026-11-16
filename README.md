# Soul 通讯录 · 前端

联系人管理页面，支持收藏、搜索、多联系方式和 Excel 导入导出。

- [在线应用](https://soul.hmlin-2028.workers.dev/)
- [前端源码](frontend/)
- [代码规范](frontend/CODING_STANDARDS.md)
- [后端及本地运行说明](https://github.com/sorry-ee/contactbook-backend)

## 运行

前端通过同源 API 调用后端，不能直接双击 HTML 使用。运行后端仓库中的集成版本即可；更新前端时，将 frontend/ 内的 HTML、CSS、JavaScript 文件复制到后端的 backend/public/，重新构建并启动。

## 功能

- 新建、编辑、删除和搜索联系人。
- 收藏标记与收藏列表。
- 同一联系人保存多个手机号、邮箱、社交账号及地址。
- 下载 Excel 模板，导入和导出真实 .xlsx 文件。

当前浏览器的通讯录由 Cookie 标识，清除 Cookie 或换浏览器后无法访问原有数据，请先导出备份。
