---
name: FileManage拖拽上传
overview: 在文件管理页的文件列表区域增加“拖拽上传”交互：拖入时出现覆盖蒙层，高亮提示，松手后对拖入的多个文件依次上传；复用现有上传逻辑与错误提示，以最少改动实现顺畅体验。
todos:
  - id: ui-dropzone
    content: 在文件列表区域外包裹 dropzone 容器，添加拖拽蒙层 UI 与状态管理（isDragActive/dragCounter）
    status: in_progress
  - id: upload-queue
    content: 实现 drop 事件的多文件队列上传（串行），复用 validateUpload/customUpload 的校验与错误文案
    status: pending
  - id: simplify-entry
    content: 调整/弱化旧“上传文件”入口（必要时移除），确保整体交互简单顺畅
    status: pending
  - id: polish-and-verify
    content: 补齐边界（导览禁用、目录未就绪、文件夹拖入提示），并做基本手动验证
    status: pending
isProject: false
---

## 目标与约束

- **目标**：`FileManage.vue` 文件管理支持拖拽上传（核心追求简单顺畅），并与现有上传逻辑集成/复用。
- **约束**：
  - 拖拽区域：**文件列表 `el-table` 区域**。
  - 拖拽内容：**仅文件**（不支持文件夹）。
  - 支持多文件：一次拖入多个文件，逐个上传并提示结果。
  - 复用现有：继续使用 `validateUpload()`、`customUpload()`、`uploadProgress`、`loadDirectoryContent()`、同名冲突文案。

## 现状要点（用于复用）

- 现有上传入口在工具栏“新建→上传文件”，通过隐藏的 `el-upload` 触发，并走 `customUpload()`：

```322:405:/home/daihaorui/桌面/GitHub/Beancount-Trans/Beancount-Trans-Frontend/src/components/file/FileManage.vue
async function customUpload(options: any) {
  // ... FormData + directoryId ...
  const response = await axios.post('/files/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => { ... uploadProgress ... }
  });
  // 成功后 loadDirectoryContent()
}
```

- 上传前校验集中在 `validateUpload(file)`（100MB、目录就绪）。

## 交互原型（拖拽蒙层）

- **默认态**：文件列表正常显示；不额外占用工具栏空间。
- **拖入可投放态**：当用户把文件拖进表格区域（`dragenter/dragover`）时，显示一个覆盖表格的半透明蒙层：
  - 文案：`拖拽文件到此处上传` / 次文案 `支持多文件，最大 100MB/个`
  - 视觉：虚线边框 + 轻微高亮；鼠标指针显示可投放。
- **拖入不可投放态**：
  - 拖入文件夹或无文件：蒙层提示 `仅支持文件拖拽上传`（不开始上传）。
  - 若目录尚未加载：提示 `请先等待目录加载完成`（复用现有校验信息）。
- **松手上传**：`drop` 事件中读取 `DataTransfer.files`，过滤后进入上传队列：
  - **逐个上传（串行）**：确保进度条语义清晰（当前文件进度），避免并行导致进度混乱。
  - 每个文件上传结束后：成功 `ElMessage.success(…文件名…)`，失败复用 `customUpload` 的错误处理文案。
  - 全部完成后：刷新一次目录内容（如果 `customUpload` 已逐次刷新，可改为“队列结束时刷新一次”以减少请求）。
- **与导览/禁用态兼容**：若导览步骤要求禁用操作（如 `isTourStep2`），拖拽上传应直接提示并拒绝。

## 组件结构与实现要点

- 在 `el-table` 外包一层容器（例如 `div.file-table-dropzone`），作为拖拽监听目标；蒙层用绝对定位覆盖该容器。
- 新增响应式状态：
  - `isDragActive`：是否正在拖入表格区域
  - `dragCounter`：处理 `dragenter/dragleave` 嵌套抖动（避免闪烁）
  - `isUploadingQueue` / `uploadQueueTotal` / `uploadQueueDone`（可选，用于显示“已上传 x/y”）
- 事件处理：`onDragEnter`、`onDragOver`（`preventDefault` 以允许 drop）、`onDragLeave`、`onDrop`。
- 上传队列：把 `customUpload` 抽成更易复用的底层函数，例如 `uploadSingleFile(file: File): Promise<void>`，由拖拽与原按钮上传共同调用。
- 旧上传入口策略（保持简单）：
  - 默认先**保留**“新建→上传文件”，但弱化：文案可改为 `选择文件上传`；拖拽成为主路径。
  - 若你更激进追求极简，可在实现后提供一个开关式删改：移除下拉项中的“上传文件”，仅保留拖拽+（可选）一个小的“选择文件”按钮。

## 样式（最少覆盖）

- 在 `FileManage.vue` 的 `<style scoped>` 增加：
  - `.file-table-dropzone { position: relative; }`
  - `.drop-overlay { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; ... }`
  - hover/active 状态用 Element Plus CSS 变量（如 `--ep-color-primary`、`--ep-fill-color-light`）保证深浅色兼容。

## 验收清单（按用户体验）

- 拖一个或多个文件到列表区域：出现蒙层 → 松手开始上传 → 进度条展示 → 成功/失败提示清晰。
- 拖入文件夹：明确提示不支持，不产生上传请求。
- 目录未加载/导览禁用时：提示原因，不产生上传请求。
- 上传完成后列表刷新，能看到新文件。

## 影响文件

- 主要修改：`[Beancount-Trans-Frontend/src/components/file/FileManage.vue](Beancount-Trans-Frontend/src/components/file/FileManage.vue)`
- 视需要抽公共上传逻辑（可选）：新增 `src/composables/useFileUpload.ts` 或 `src/utils/fileUpload.ts`（若 `FileManage.vue` 过大，建议抽离；否则保持单文件改动最小）。

