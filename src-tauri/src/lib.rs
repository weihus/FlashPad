use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    App, AppHandle, Emitter, Manager, WindowEvent,
};
use tauri_plugin_autostart::{MacosLauncher, ManagerExt};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

const MAIN_WINDOW: &str = "main";

#[derive(Default)]
struct PendingOpen(AtomicBool);

struct ShortcutUnavailable(bool);

#[tauri::command]
fn shortcut_unavailable(state: tauri::State<'_, ShortcutUnavailable>) -> bool {
    state.0
}

fn show_editor(app: &AppHandle, toggle: bool) -> tauri::Result<()> {
    let Some(window) = app.get_webview_window(MAIN_WINDOW) else {
        return Ok(());
    };

    if window.is_visible()? && !window.is_minimized()? {
        if toggle {
            return window.hide();
        }
    } else {
        window.center()?;
        window.show()?;
        if window.is_minimized()? {
            window.unminimize()?;
        }
    }
    window.set_focus()?;
    window.emit("editor-opened", ())
}

fn request_editor(app: &AppHandle, toggle: bool) {
    let handle = app.clone();
    if let Err(error) = app.run_on_main_thread(move || {
        // The single-instance listener can receive a launch before setup completes.
        if handle.try_state::<ShortcutUnavailable>().is_none() {
            handle
                .state::<PendingOpen>()
                .0
                .store(true, Ordering::Relaxed);
            return;
        }
        if let Err(error) = show_editor(&handle, toggle) {
            eprintln!("FlashPad window: {error}");
        }
    }) {
        eprintln!("FlashPad window: {error}");
    }
}

fn setup_tray(app: &App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "打开瞬笺", true, None::<&str>)?;
    let startup_status = app.autolaunch().is_enabled();
    if let Err(error) = &startup_status {
        eprintln!("FlashPad autostart: {error}");
    }
    let startup = CheckMenuItem::with_id(
        app,
        "autostart",
        "开机自启",
        true,
        startup_status.unwrap_or(false),
        None::<&str>,
    )?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&open, &startup, &quit])?;

    #[cfg(target_os = "macos")]
    let icon = include_bytes!("../icons/tray-template.png");
    #[cfg(not(target_os = "macos"))]
    let icon = include_bytes!("../icons/32x32.png");

    TrayIconBuilder::with_id("flashpad")
        .icon(Image::from_bytes(icon)?)
        .icon_as_template(cfg!(target_os = "macos"))
        .tooltip("FlashPad · 瞬笺")
        .menu(&menu)
        .show_menu_on_left_click(cfg!(target_os = "macos"))
        .on_menu_event(move |app, event| match event.id().as_ref() {
            "open" => request_editor(app, false),
            "autostart" => {
                let autolaunch = app.autolaunch();
                let result = autolaunch.is_enabled().and_then(|enabled| {
                    if enabled {
                        autolaunch.disable()
                    } else {
                        autolaunch.enable()
                    }
                });
                if let Err(error) = result {
                    eprintln!("FlashPad autostart: {error}");
                    request_editor(app, false);
                    let _ = app.emit_to(MAIN_WINDOW, "desktop-notice", "无法更新开机自启设置");
                }
                if let Ok(enabled) = autolaunch.is_enabled() {
                    let _ = startup.set_checked(enabled);
                }
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if cfg!(target_os = "windows")
                && matches!(
                    event,
                    TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    }
                )
            {
                request_editor(tray.app_handle(), false);
            }
        })
        .build(app)?;
    Ok(())
}

pub fn run() {
    let shortcut = Shortcut::new(Some(Modifiers::ALT), Code::Space);
    let shortcut_id = shortcut.id();

    tauri::Builder::default()
        .manage(PendingOpen::default())
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            request_editor(app, false);
        }))
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(move |app, shortcut, event| {
                    if shortcut.id() == shortcut_id && event.state() == ShortcutState::Pressed {
                        request_editor(app, true);
                    }
                })
                .build(),
        )
        .invoke_handler(tauri::generate_handler![shortcut_unavailable])
        .setup(move |app| {
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            setup_tray(app)?;
            let unavailable = app
                .global_shortcut()
                .register(shortcut)
                .is_err_and(|error| {
                    eprintln!("FlashPad Alt+Space: {error}");
                    true
                });
            app.manage(ShortcutUnavailable(unavailable));
            if app.state::<PendingOpen>().0.swap(false, Ordering::Relaxed) {
                request_editor(app.handle(), false);
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() == MAIN_WINDOW {
                if let WindowEvent::CloseRequested { api, .. } = event {
                    api.prevent_close();
                    if let Err(error) = window.hide() {
                        eprintln!("FlashPad window: {error}");
                    }
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("failed to run FlashPad");
}
