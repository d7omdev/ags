"use strict";
// Import
import Gdk from 'gi://Gdk';
import GLib from 'gi://GLib';
import App from 'resource:///com/github/Aylur/ags/app.js'
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js'
// Stuff
import userOptions from './modules/.configuration/user_options.js';
import { firstRunWelcome, startBatteryWarningService } from './services/messages.js';
import { startAutoDarkModeService } from './services/darkmode.js';
// Widgets
import { Bar, BarCornerTopleft, BarCornerTopright } from './modules/bar/main.js';
import Cheatsheet from './modules/cheatsheet/main.js';
// import DesktopBackground from './modules/desktopbackground/main.js';
import Dock from './modules/dock/main.js';
import Corner from './modules/screencorners/main.js';
import Crosshair from './modules/crosshair/main.js';
import Indicator, { PopupNotifications } from './modules/indicators/main.js';
import KeyVis from './modules/indicators/keyVis.js';
// import Osk from './modules/onscreenkeyboard/main.js';
import Overview from './modules/overview/main.js';
import Session from './modules/session/main.js';
import SideLeft from './modules/sideleft/main.js';
import SideRight from './modules/sideright/main.js';
import { COMPILED_STYLE_DIR } from './init.js';


// NOTE: This is disabled, only the top monitor is used.

const range = (length, start = 1) => Array.from({ length }, (_, i) => i + start);
function forMonitors(widget) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    return range(n, 0).map(widget).flat(1);
}
function forMonitorsAsync(widget) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    return range(n, 0).forEach((n) => widget(n).catch(print))
}

function forTopMonitor(widget) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    return n > 0 ? [widget(1)] : [];
}

function forTopMonitorAsync(widget) {
    const n = Gdk.Display.get_default()?.get_n_monitors() || 1;
    if (n > 0) {
        widget(1).catch(print);
    }
}

// Start stuff
handleStyles(true);
startAutoDarkModeService().catch(print);
firstRunWelcome().catch(print);
startBatteryWarningService().catch(print)

const Windows = () => [
    // forTopMonitor(DesktopBackground),
    forTopMonitor(Crosshair),
    Overview(),
    forTopMonitor(Indicator),
    forTopMonitor(PopupNotifications),
    forTopMonitor(KeyVis),
    forTopMonitor(Cheatsheet),
    SideLeft(),
    SideRight(),
    // forTopMonitor(Osk),
    // forTopMonitor(Session),
    forMonitors(Session),
    ...(userOptions.dock.enabled ? [forTopMonitor(Dock)] : []),
    ...(userOptions.appearance.fakeScreenRounding !== 0 ? [
        // forTopMonitor((id) => Corner(id, 'top left', true)),
        // forTopMonitor((id) => Corner(id, 'top right', true)),
        forTopMonitor((id) => Corner(id, 'bottom left', true)),
        forTopMonitor((id) => Corner(id, 'bottom right', true)),
    ] : []),
    ...(userOptions.appearance.barRoundCorners ? [
        forTopMonitor(BarCornerTopleft),
        forTopMonitor(BarCornerTopright),
    ] : []),
];

const CLOSE_ANIM_TIME = 210; // Longer than actual anim time to make sure widgets animate fully
const closeWindowDelays = {}; // For animations
for (let i = 0; i < (Gdk.Display.get_default()?.get_n_monitors() || 1); i++) {
    closeWindowDelays[`osk${i}`] = CLOSE_ANIM_TIME;
}

App.config({
    css: `${COMPILED_STYLE_DIR}/style.css`,
    stackTraceOnError: true,
    closeWindowDelay: closeWindowDelays,
    windows: Windows().flat(1),
});

// Stuff that don't need to be toggled. And they're async so ugh...
forTopMonitorAsync(Bar);
// Bar().catch(print); // Use this to debug the bar. Single monitor only.
