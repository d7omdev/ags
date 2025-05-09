"use strict";

// ==============================================
// Imports
// ==============================================
import Gdk from "gi://Gdk";
import GLib from "gi://GLib";
import App from "resource:///com/github/Aylur/ags/app.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

// Custom Imports
import userOptions from "./modules/.configuration/user_options.js";
import {
  firstRunWelcome,
  startBatteryWarningService,
} from "./services/messages.js";
import { startAutoDarkModeService } from "./services/darkmode.js";
import {
  Bar,
  BarCornerTopleft,
  BarCornerTopright,
} from "./modules/bar/main.js";
import Cheatsheet from "./modules/cheatsheet/main.js";
import Dock from "./modules/dock/main.js";
import Corner from "./modules/screencorners/main.js";
import Crosshair from "./modules/crosshair/main.js";
import Indicators from "./modules/indicators/main.js";
import Overview from "./modules/overview/main.js";
import Session from "./modules/session/main.js";
import SideLeft from "./modules/sideleft/main.js";
import SideRight from "./modules/sideright/main.js";
import { COMPILED_STYLE_DIR } from "./init.js";

// ==============================================
// Configuration
// ==============================================
// WARNING: PLease change this to false if you are not using a multi monitor setup or if you are on a laptop
const useTopMonitor = true; // NOTE: Set to true for top monitor only, false for all monitors

const primaryMonitor = Gdk.Display.get_default()?.get_primary_monitor() || 0;

// ==============================================
// Helper Functions
// ==============================================
const range = (length, start = 1) =>
  Array.from({ length }, (_, i) => i + start);

/**
 * Applies a widget to all monitors.
 * @param {Function} widget - The widget function to apply.
 * @returns {Array} - Array of widget instances for all monitors.
 */
function forMonitors(widget) {
  const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
  return range(n, 0).map(widget).flat(1);
}

/**
 * Applies a widget to all monitors asynchronously.
 * @param {Function} widget - The widget function to apply.
 */

function forMonitorsAsync(widget) {
  const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
  return range(n, 0).forEach((n) => widget(n).catch(print));
}

/**
 * Applies a widget to the top monitor only.
 * @param {Function} widget - The widget function to apply.
 * @returns {Array} - Array containing the widget instance for the top monitor.
 */
function forTopMonitor(widget) {
  const n = Gdk.Display.get_default()?.get_n_monitors() || primaryMonitor;
  return n > 0 ? [widget(1)] : []; // Use monitor ID 1 (primary monitor)
}

/**
 * Applies a widget to the top monitor asynchronously.
 * @param {Function} widget - The widget function to apply.
 */
function forTopMonitorAsync(widget) {
  const n = Gdk.Display.get_default()?.get_n_monitors() || primaryMonitor;
  if (n > 0) {
    widget(1).catch(print);
  }
}

/**
 * Centralized monitor handler to toggle between top monitor and all monitors.
 * @param {Function} widget - The widget function to apply.
 * @returns {Array} - Array of widget instances based on the `useTopMonitor` setting.
 */
const monitorHandler = (widget) => {
  return useTopMonitor ? forTopMonitor(widget) : forMonitors(widget);
};

// ==============================================
// Initialization
// ==============================================
// Start services
handleStyles(true);
startAutoDarkModeService().catch(print);
firstRunWelcome().catch(print);
startBatteryWarningService().catch(print);

// ==============================================
// Indicator Definitions
// ==============================================
Indicators.map((indicator) => monitorHandler(indicator));
// Language Indicator
forMonitors(Indicators[2]);

// ==============================================
// Window Definitions
// ==============================================
const Windows = () => [
  // Crosshair
  monitorHandler(Crosshair),

  // Overview
  Overview(),

  // monitorHandler(KeyVis),

  // Cheatsheet
  forMonitors(Cheatsheet),

  // Side Panels
  SideLeft(),
  SideRight(),

  // Session
  forMonitors(Session),

  // Dock (if enabled)
  ...(userOptions.dock.enabled ? [monitorHandler(Dock)] : []),

  // Screen Corners (if enabled)
  ...(userOptions.appearance.fakeScreenRounding !== 0
    ? [
        monitorHandler((id) => Corner(id, "bottom left", true)),
        monitorHandler((id) => Corner(id, "bottom right", true)),
      ]
    : []),

  // Bar Corners (if enabled)
  ...(userOptions.appearance.barRoundCorners
    ? [monitorHandler(BarCornerTopleft), monitorHandler(BarCornerTopright)]
    : []),
];

// ==============================================
// App Configuration
// ==============================================
const CLOSE_ANIM_TIME = 210; // Longer than actual anim time to ensure widgets animate fully
const closeWindowDelays = {}; // For animations

// Populate closeWindowDelays for animations
for (let i = 0; i < (Gdk.Display.get_default()?.get_n_monitors() || 1); i++) {
  closeWindowDelays[`osk${i}`] = CLOSE_ANIM_TIME;
}

App.config({
  css: `${COMPILED_STYLE_DIR}/style.css`,
  stackTraceOnError: true,
  closeWindowDelay: closeWindowDelays,
  windows: Windows().flat(1),
});

// ==============================================
// Bar Initialization
// ==============================================
// Initialize bars based on monitor mode
if (useTopMonitor) {
  forTopMonitorAsync(Bar);
} else {
  forMonitorsAsync(Bar);
}
