const { Gdk, Gtk } = imports.gi;
import App from "resource:///com/github/Aylur/ags/app.js";
import Variable from "resource:///com/github/Aylur/ags/variable.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const { exec, execAsync } = Utils;

Gtk.IconTheme.get_default().append_search_path(`${App.configDir}/assets/icons`);

// Global vars for external control (through keybinds)
export const showMusicControls = Variable(false, {});
export const currentLang = Variable("");
export const recordingIndicator = Variable(0);
export const recordingState = Variable({
  isRecording: false,
  startTime: null,
  elapsedSeconds: 0,
  formattedTime: "00:00",
  type: "",
});

export const showColorScheme = Variable(false, {});
globalThis["openMusicControls"] = showMusicControls;
globalThis["openColorScheme"] = showColorScheme;
globalThis["mpris"] = Mpris;

export const showAppTitle = Variable(false, {});

// Mode switching
export const currentShellMode = Variable("normal", {}); // normal, focus
globalThis["currentMode"] = currentShellMode;
globalThis["cycleMode"] = (mode) => {
  if (mode) {
    let lastMode = currentShellMode.value;
    if (!mode === lastMode) {
      currentShellMode.value = mode;
    }
  }
  if (currentShellMode.value === "normal") {
    currentShellMode.value = "focus";
  } else if (currentShellMode.value === "focus") {
    currentShellMode.value = "nothing";
  } else {
    currentShellMode.value = "normal";
  }
};

// Window controls
const range = (length, start = 1) =>
  Array.from({ length }, (_, i) => i + start);
globalThis["toggleWindowOnAllMonitors"] = (name) => {
  range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach((id) => {
    App.toggleWindow(`${name}${id}`);
  });
};
globalThis["closeWindowOnAllMonitors"] = (name) => {
  range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach((id) => {
    App.closeWindow(`${name}${id}`);
  });
};
globalThis["openWindowOnAllMonitors"] = (name) => {
  range(Gdk.Display.get_default()?.get_n_monitors() || 1, 0).forEach((id) => {
    App.openWindow(`${name}${id}`);
  });
};

globalThis["closeEverything"] = () => {
  const numMonitors = Gdk.Display.get_default()?.get_n_monitors() || 1;
  for (let i = 0; i < numMonitors; i++) {
    App.closeWindow(`cheatsheet${i}`);
    App.closeWindow(`session${i}`);
  }
  App.closeWindow("sideleft");
  App.closeWindow("sideright");
  App.closeWindow("overview");
};
