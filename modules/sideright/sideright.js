import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import { ExpandingIconTabContainer } from "../.commonwidgets/tabcontainer.js";
import { getDistroIcon } from "../.miscutils/system.js";
import { checkKeybind } from "../.widgetutils/keybind.js";
import { ModuleCalendar } from "./calendar.js";
import ModuleAudioControls from "./centermodules/audiocontrols.js";
import ModuleBluetooth from "./centermodules/bluetooth.js";
import ModuleConfigure from "./centermodules/configure.js";
import ModuleNotificationList from "./centermodules/notificationlist.js";
import ModuleVPN from "./centermodules/vpn.js";
import ModuleWifiNetworks from "./centermodules/wifinetworks.js";
import {
  HyprToggleIcon,
  ModuleCloudflareWarp,
  ModuleGameMode,
  ModuleIdleInhibitor,
  ModuleInvertColors,
  ModuleNightLight,
  ModulePowerIcon,
  ModuleRawInput,
  ModuleReloadIcon,
  ModuleSettingsIcon,
  ToggleIconBluetooth,
  ToggleIconWifi,
} from "./quicktoggles.js";
const { execAsync, exec } = Utils;
const { Box, EventBox } = Widget;

const QUICK_TOGGLES = {
  wifi: ToggleIconWifi(),
  bluetooth: ToggleIconBluetooth(),
  rawinput: await ModuleRawInput(),
  touchpad: await HyprToggleIcon(
    "touchpad_mouse",
    "No touchpad while typing",
    "input:touchpad:disable_while_typing",
    {},
  ),
  nightlight: await ModuleNightLight(),
  invertcolors: await ModuleInvertColors(),
  gamemode: await ModuleGameMode(),
  idleinhibitor: ModuleIdleInhibitor(),
  cloudflarewarp: await ModuleCloudflareWarp(),
};
const centerWidgets = [
  {
    name: "Notifications",
    materialIcon: "notifications",
    contentWidget: ModuleNotificationList,
  },
  {
    name: "Audio controls",
    materialIcon: "volume_up",
    contentWidget: ModuleAudioControls,
  },
  {
    name: "Bluetooth",
    materialIcon: "bluetooth",
    contentWidget: ModuleBluetooth,
  },
  {
    name: "Wifi networks",
    materialIcon: "wifi",
    contentWidget: ModuleWifiNetworks,
    onFocus: () => execAsync("nmcli dev wifi list").catch(print),
  },
  {
    name: "VPN",
    materialIcon: "lock",
    contentWidget: ModuleVPN,
  },
  {
    name: "Live config",
    materialIcon: "tune",
    contentWidget: ModuleConfigure,
  },
];

const timeRow = Box({
  className: "spacing-h-10 sidebar-group-invisible-morehorizpad",
  children: [
    Widget.Icon({
      icon: getDistroIcon(),
      className: "txt txt-larger",
    }),
    Widget.Label({
      hpack: "center",
      className: "txt-small txt",
      setup: (self) => {
        const getUptime = async () => {
          try {
            await execAsync(["bash", "-c", "uptime -p"]);
            return execAsync([
              "bash",
              "-c",
              `uptime -p | sed -e 's/...//;s/ day\\| days/d/;s/ hour\\| hours/h/;s/ minute\\| minutes/m/;s/,[^,]*//2'`,
            ]);
          } catch {
            return execAsync(["bash", "-c", "uptime"]).then((output) => {
              const uptimeRegex = /up\s+((\d+)\s+days?,\s+)?((\d+):(\d+)),/;
              const matches = uptimeRegex.exec(output);

              if (matches) {
                const days = matches[2] ? parseInt(matches[2]) : 0;
                const hours = matches[4] ? parseInt(matches[4]) : 0;
                const minutes = matches[5] ? parseInt(matches[5]) : 0;

                let formattedUptime = "";

                if (days > 0) {
                  formattedUptime += `${days} d `;
                }
                if (hours > 0) {
                  formattedUptime += `${hours} h `;
                }
                formattedUptime += `${minutes} m`;

                return formattedUptime;
              } else {
                throw new Error("Failed to parse uptime output");
              }
            });
          }
        };

        self.poll(5000, (label) => {
          getUptime()
            .then((upTimeString) => {
              label.label = `Uptime: ${upTimeString}`;
            })
            .catch((err) => {
              console.error(`Failed to fetch uptime: ${err}`);
            });
        });
      },
    }),
    Widget.Box({ hexpand: true }),
    // ModuleEditIcon({ hpack: "end" }), // TODO: Make this work
    ModuleReloadIcon({ hpack: "end" }),
    ModuleSettingsIcon({ hpack: "end" }),
    ModulePowerIcon({ hpack: "end" }),
  ],
});

const togglesBox = Widget.Box({
  hpack: "center",
  className: "sidebar-togglesbox spacing-h-5",
  children: userOptions.sidebar.quickToggles.order.map(
    (toggle) => QUICK_TOGGLES[toggle],
  ),
});

export const sidebarOptionsStack = ExpandingIconTabContainer({
  tabsHpack: "center",
  tabSwitcherClassName: "sidebar-icontabswitcher",
  icons: centerWidgets.map((api) => api.materialIcon),
  names: centerWidgets.map((api) => api.name),
  children: centerWidgets.map((api) => api.contentWidget()),
  onChange: (self, id) => {
    self.shown = centerWidgets[id].name;
    if (centerWidgets[id].onFocus) centerWidgets[id].onFocus();
  },
});

export default () =>
  Box({
    vexpand: true,
    hexpand: true,
    css: "min-width: 2px;",
    children: [
      EventBox({
        onPrimaryClick: () => App.closeWindow("sideright"),
        onSecondaryClick: () => App.closeWindow("sideright"),
        onMiddleClick: () => App.closeWindow("sideright"),
      }),
      Box({
        vertical: true,
        vexpand: true,
        className: "sidebar-right spacing-v-15",
        children: [
          Box({
            vertical: true,
            className: "spacing-v-5",
            children: [timeRow, togglesBox],
          }),
          Box({
            className: "sidebar-group",
            children: [sidebarOptionsStack],
          }),
          ModuleCalendar(),
        ],
      }),
    ],
    setup: (self) =>
      self.on("key-press-event", (widget, event) => {
        // Handle keybinds
        if (checkKeybind(event, userOptions.keybinds.sidebar.options.nextTab)) {
          sidebarOptionsStack.nextTab();
        } else if (
          checkKeybind(event, userOptions.keybinds.sidebar.options.prevTab)
        ) {
          sidebarOptionsStack.prevTab();
        }
      }),
  });
