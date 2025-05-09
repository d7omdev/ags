import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
const { Gravity } = imports.gi.Gdk;
const { exec, execAsync } = Utils;
const { Box, Button, Icon, Menu, MenuItem, Label, Overlay, EventBox } = Widget;

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
          client.floating === true
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
    return match ? match[1] : "initialClass not found";
  },
);

const AppButton = (client) => {
  const iconName = client.class.toLowerCase();
  const workspaceID = client.workspace.id.toString();
  const tooltipText =
    client.class +
    " • " +
    (client.title.length > 10
      ? client.title.slice(0, 30) + "..."
      : client.title);

  return EventBox({
    child: Box({
      children: [
        Button({
          className: "bar-util-btn bar-active-app",
          // Notice we use "tooltip-text" (with a hyphen) here
          "tooltip-text": tooltipText,
          child: Icon({
            icon: iconName,
            size: 20,
            // Also update the icon tooltip property
            "tooltip-text": tooltipText,
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
              );
            }),
        }),
        Overlay({
          passThrough: true,
          child: Label({
            label: workspaceID === "-99" ? "S" : workspaceID,
            css: workspaceID === "-99" ? "color: teal;" : "color: white;",
            className: "txt-smaller txt active-app-label",
          }),
        }),
      ],
    }),
  });
};

export const ActiveApps = (props = {}) => {
  const appsBox = Box({
    vpack: "center",
    setup: (self) => {
      const updateAppList = () => {
        const displayGroups = new Map();

        // Group clients by monitor and address
        Hyprland.clients.forEach((client) => {
          if (!displayGroups.has(client.monitor)) {
            displayGroups.set(client.monitor, new Map());
          }
          const group = displayGroups.get(client.monitor);
          if (!group.has(client.address)) {
            group.set(client.address, client);
          }
        });

        // Sort groups by monitor and workspace id
        const children = [];
        Array.from(displayGroups.entries())
          .sort(([a], [b]) => a - b)
          .forEach(([_, clients], index, arr) => {
            const sortedClients = Array.from(clients.values()).sort(
              (a, b) => a.workspace.id - b.workspace.id,
            );
            const buttons = sortedClients.map((client) => AppButton(client));
            children.push(...buttons);
            if (index < arr.length - 1) {
              children.push(Box({ className: "margin-right-5 margin-left-5" }));
            }
          });

        // Update the container's children
        self.children = children;
      };

      // Update app list when clients are added or removed
      self.hook(Hyprland, updateAppList, "client-added");
      self.hook(Hyprland, updateAppList, "client-removed");

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
      self.hook(Hyprland, (self) => {
        self.visible = Hyprland.clients.length !== 0;
      });
    },
  });
};
