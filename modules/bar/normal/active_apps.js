import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
const { Gravity } = imports.gi.Gdk;

const { exec, execAsync } = Utils;
const { Box, Button, Icon, Menu, MenuItem, Label } = Widget;

const createContextMenu = (client) =>
  Menu({
    className: "menu",
    children: [
      MenuItem({
        child: Box({
          hpack: "start",
          children: [
            Icon({ icon: "window-maximize-symbolic", size: 16 }),
            Label({ label: "Maximize", className: "margin-left-5" }),
          ],
        }),
        onActivate: () => execAsync(`hyprctl dispatch fullscreen 1`),
      }),
      MenuItem({
        child: Box({
          hpack: "start",
          children: [
            Icon({ icon: "window-minimize-symbolic", size: 16 }),
            Label({ label: "Minimize", className: "margin-left-5" }),
          ],
        }),
        onActivate: () =>
          execAsync(`hyprctl dispatch movetoworkspacesilent special`),
      }),
      MenuItem({
        child: Box({
          hpack: "start",
          children: [
            Icon({ icon: "window-close-symbolic", size: 16 }),
            Label({ label: "Close", className: "margin-left-5" }),
          ],
        }),
        onActivate: () =>
          execAsync(`hyprctl dispatch closewindow address:${client.address}`),
      }),
      MenuItem({
        child: Box({
          hpack: "start",
          children: [
            Icon({ icon: "view-fullscreen-symbolic", size: 16 }),
            Label({ label: "Toggle Floating", className: "margin-left-5" }),
          ],
        }),
        onActivate: () =>
          execAsync(
            `hyprctl dispatch togglefloating address:${client.address}`,
          ),
      }),
      MenuItem({
        child: Box({
          hpack: "start",
          children: [
            Icon({ icon: "view-pin-symbolic", size: 16 }),
            Label({ label: "Toggle Pin", className: "margin-left-5" }),
          ],
        }),
        onActivate: () => {
          console.log(client.floating);
          client.floating == true
            ? execAsync(`hyprctl dispatch pin active`)
            : execAsync(
                `notify-send "Error" "This window is not floating" -u critical -a ${client.class}`,
              );
        },
      }),
    ],
    setup: (self) => {
      self.rect_anchor_dy = 6;
    },
  });

const activeAppClass = await execAsync(["hyprctl", "activewindow"]).then(
  (out) => {
    const regex = /initialClass:\s*(\S+)/;
    const match = out.match(regex);
    if (match) {
      return match[1];
    } else {
      return "initialClass not found";
    }
  },
);

const AppButton = (client) => {
  const icon = client.class.toLowerCase();
  const tooltipText =
    client.class +
    " • " +
    (client.title.length > 10
      ? client.title.slice(0, 10) + "..."
      : client.title);

  return Button({
    className: "bar-util-btn bar-active-app",
    tooltipText: tooltipText,
    child: Icon({
      icon: icon,
      size: 20,
    }),
    css: `margin-left: 2px; margin-right: 2px;`,
    onClicked: () => {
      exec(`hyprctl dispatch focuswindow address:${client.address}`);
    },
    onSecondaryClick: (button) => {
      const menu = createContextMenu(client);
      menu.popup_at_widget(button, Gravity.SOUTH, Gravity.NORTH, null);
    },
    setup: (self) =>
      self.hook(Hyprland.active, (self) => {
        self.toggleClassName(
          "focused-app",
          client.address === Hyprland.active.client.address,
        );
      }),
  });
};

export const ActiveApps = (props = {}) => {
  const appsBox = Box({
    vpack: "center",
    setup: async (self) => {
      self.hook(Hyprland.active, (box) => {
        const displayGroups = new Map();
        Hyprland.clients.forEach((client) => {
          if (!displayGroups.has(client.monitor)) {
            displayGroups.set(client.monitor, new Map());
          }
          const displayGroup = displayGroups.get(client.monitor);
          if (!displayGroup.has(client.class)) {
            displayGroup.set(client.class, client);
          }
        });

        const sortedDisplayGroups = Array.from(displayGroups.entries()).sort(
          ([monitorA], [monitorB]) => monitorA - monitorB,
        );

        const children = [];
        sortedDisplayGroups.forEach(([display, clients], index) => {
          const sortedClients = Array.from(clients.values()).sort(
            (clientA, clientB) => clientA.workspace.id - clientB.workspace.id,
          );
          const displayButtons = sortedClients.map((client) =>
            AppButton(client),
          );
          children.push(...displayButtons);
          if (index < sortedDisplayGroups.length - 1) {
            children.push(
              Box({
                className: "margin-right-5 margin-left-5",
              }),
            );
          }
        });
        box.children = children;
      });
    },
  });

  return Box({
    className: "bar-group-margin bar-sides",
    children: [
      Box({
        className: "bar-group bar-group-standalone bar-group-pad-system",
        children: [appsBox],
      }),
    ],
  });
};
