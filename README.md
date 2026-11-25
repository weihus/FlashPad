# FlashPad · 瞬笺

A minimal desktop scratchpad that lives in your system tray. Press **Alt / Option + Space** (Windows / Linux) or **Option + Space** (macOS) from anywhere, jot something down, and **copy it away** with a single keystroke.

一款常驻系统托盘的极简桌面速记本。随时呼出、随手记下、一键复制走人。

## 功能特性

- **全局快捷键呼出** — `Alt + Space`（macOS 为 `Option + Space`），任意应用下随时唤出，再按一次隐藏
- **复制并清空** — `Ctrl / Cmd + Enter` 将草稿复制到剪贴板并自动隐藏窗口，即 copy-and-go
- **恢复上一条** — 清空后按 `Ctrl / Cmd + Z` 或点击工具栏按钮，可找回最近 5 条草稿
- **清理多余空行** — 一键去除首尾空行、合并连续空行
- **字数统计** — 中文按汉字计数，英文按单词计数
- **明暗主题切换** — 偏好自动记住
- **窗口置顶** — 可将瞬笺钉在最上层，边看边写
- **无边框透明窗口** — 轻盈不抢眼，`Esc` 随时隐藏
- **开机自启** — 托盘菜单勾选即可（macOS 使用 LaunchAgent）
- **单实例运行** — 重复启动只会唤出已有窗口

> 草稿仅保存在内存中，不会写入磁盘。退出应用后草稿即消失，适合临时记录，请勿当作正式笔记工具使用。

## 快捷键

| 快捷键 | 功能 |
| --- | --- |
| `Alt / Option + Space` | 显示 / 隐藏窗口（全局） |
| `Ctrl / Cmd + Enter` | 复制并清空 |
| `Ctrl / Cmd + Z` | 恢复上一条草稿（编辑区为空时） |
| `Ctrl / Cmd + +/-` | 放大 / 缩小字号 |
| `Ctrl / Cmd + 0` | 恢复默认字号 |
| `Ctrl / Cmd + 滚轮` | 平滑调整字号 |
| `Esc` | 隐藏窗口 |

## 安装

从 [Releases](https://github.com/weihus/FlashPad/releases) 页面下载对应平台的安装包：

| 平台 | 文件 |
| --- | --- |
| Windows | `FlashPad_x.y.z_x64-setup.exe` |
| macOS (Apple Silicon) | `FlashPad_x.y.z_aarch64.dmg` |
| macOS (Intel) | `FlashPad_x.y.z_x64.dmg` |
| Linux | `FlashPad_x.y.z_amd64.AppImage` / `.deb` / `.rpm` |

### Apple 芯片 Mac 首次启动

macOS 版本未经 Apple 公证。如果首次打开时提示「FlashPad 已损坏，无法打开」，请确认安装包来自上面的 Releases 页面，将 `FlashPad.app` 拖到「应用程序」，然后在 **Mac 自带的终端**中运行：

```bash
xattr -dr com.apple.quarantine "/Applications/FlashPad.app"
open "/Applications/FlashPad.app"
```

## 从源码构建

依赖：[Node.js](https://nodejs.org) ≥ 20.19（或 ≥ 22.12）、[Rust](https://rustup.rs) ≥ 1.90、[Tauri 2 平台依赖](https://v2.tauri.app/start/prerequisites/)。

```bash
git clone https://github.com/weihus/FlashPad.git
cd FlashPad
npm install
npm run tauri dev      # 开发模式
npm run tauri build    # 构建安装包，产物在 src-tauri/target/release/bundle/
```

## 技术栈

[Tauri 2](https://tauri.app) · Rust · TypeScript · Vite · Tailwind CSS 4

## 许可证

[MIT](LICENSE)

---

## English

FlashPad is a tiny scratchpad that sits in your system tray. Hit **Alt / Option + Space** from any app, write something down, press **Ctrl / Cmd + Enter** to copy it to the clipboard — the window clears itself and gets out of your way.

### Features

- Global hotkey to show/hide (`Alt + Space`, `Option + Space` on macOS)
- Copy-and-go: `Ctrl / Cmd + Enter` copies the draft, clears the editor and hides the window
- Restore the last draft with `Ctrl / Cmd + Z` (up to 5 recent entries, in memory)
- Clean up blank lines, live word count (CJK-aware), light/dark theme, always-on-top pin
- Frameless transparent window, tray menu with launch-at-login toggle, single instance
- **Drafts are kept in memory only** — nothing is written to disk. Closing the app discards them.

### Install

Download the installer for your platform from the [Releases](https://github.com/weihus/FlashPad/releases) page.

#### First launch on an Apple Silicon Mac

The macOS build is distributed without Apple notarization. If macOS says “FlashPad is damaged and can’t be opened,” confirm that you downloaded the installer from the Releases page above. Drag `FlashPad.app` into Applications, then run these commands in **Terminal on your Mac**:

```bash
xattr -dr com.apple.quarantine "/Applications/FlashPad.app"
open "/Applications/FlashPad.app"
```

### Build from source

Requires Node.js ≥ 20.19 (or ≥ 22.12), Rust ≥ 1.90 and the [Tauri 2 prerequisites](https://v2.tauri.app/start/prerequisites/).

```bash
git clone https://github.com/weihus/FlashPad.git
cd FlashPad
npm install
npm run tauri dev
npm run tauri build
```

Licensed under the [MIT License](LICENSE).
