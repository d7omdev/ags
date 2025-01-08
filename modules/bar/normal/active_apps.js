import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";

const { exec, execAsync } = Utils;
const { Box, Button, Icon } = Widget;

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
    className: "bar-util-btn bar-active-app margin-right-5",
    tooltipText: tooltipText,
    child: Icon({
      icon: icon,
      size: 20,
    }),
    onClicked: () => {
      exec(`hyprctl dispatch focuswindow address:${client.address}`);
    },
    setup: (self) =>
      self.hook(Hyprland, (self) => {
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

        // Sort the displays by their monitor ID and sort clients within displays by workspace number
        const sortedDisplayGroups = Array.from(displayGroups.entries()).sort(
          ([monitorA], [monitorB]) => monitorA - monitorB,
        );

        const children = [];
        sortedDisplayGroups.forEach(([display, clients], index) => {
          // Sort the apps within each display by their workspace number
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
                className: "margin-right-10",
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
