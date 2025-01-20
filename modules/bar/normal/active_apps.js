import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
const { Gravity } = imports.gi.Gdk;

const { exec, execAsync } = Utils;
const { Box, Button, Icon, Menu, MenuItem, Label, Overlay } = Widget;

const createContextMenu = (client) =>
  Menu({
    className: "menu",
    children: [
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

  return Box({
    children: [
      Button({
        className: "bar-util-btn bar-active-app",
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
          self.hook(Hyprland, (self) => {
            self.toggleClassName(
              "focused-app",
              client.address === Hyprland.active.client.address,
              (self.tooltipText = tooltipText),
            );
          }),
      }),
      Overlay({
        passThrough: true,
        child: Label({
          label: client.workspace.id.toString(),
          className: "txt-smaller txt active-app-label",
        }),
      }),
    ],
  });
};

export const ActiveApps = (props = {}) => {
  const appsBox = Box({
    vpack: "center",
    setup: (self) => {
      const updateAppList = () => {
        const displayGroups = new Map();

        // Group clients by monitor and class
        Hyprland.clients.forEach((client) => {
          if (!displayGroups.has(client.monitor)) {
            displayGroups.set(client.monitor, new Map());
          }
          const displayGroup = displayGroups.get(client.monitor);
          if (!displayGroup.has(client.class)) {
            displayGroup.set(client.class, client);
          }
        });

        // Sort groups and generate buttons
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

        // Update the children of the appsBox
        self.children = children;
      };

      // Hook into Hyprland events to update the app list dynamically
      self
        .hook(Hyprland.active.workspace, updateAppList) // Update on workspace changes
        .hook(Hyprland.active.client, updateAppList) // Update on client changes
        .hook(Hyprland, updateAppList, "client-added") // Update when a client is added
        .hook(Hyprland, updateAppList, "client-removed"); // Update when a client is removed

      // Initial population of the app list
      updateAppList();
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
    setup: (self) => {
      self.hook(Hyprland.active, (self) => {
        Hyprland.clients.length === 0
          ? (self.visible = false)
          : (self.visible = true);
      });
    },
  });
};
