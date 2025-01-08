import App from "resource:///com/github/Aylur/ags/app.js";
import Brightness from "../../../services/brightness.js";
import Indicator from "../../../services/indicator.js";
import {
  Label,
  Scrollable,
  Box,
  EventBox,
  Overlay,
} from "resource:///com/github/Aylur/ags/widget.js";
import { ActiveApps } from "./active_apps.js";

const WindowTitle = async () => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;
    return Scrollable({
      hexpand: true,
      vexpand: true,
      hscroll: "automatic",
      vscroll: "never",
      child: Widget.Box({
        vertical: true,
        homogeneous: false,
        children: [
          Label({
            xalign: 0,
            truncate: "end",
            maxWidthChars: 1, // Doesn't matter, just needs to be non negative
            className: "txt-smaller bar-wintitle-topdesc txt",
            setup: (self) =>
              self.hook(Hyprland.active.client, (label) => {
                // Hyprland.active.client
                label.label =
                  Hyprland.active.client.class.length === 0
                    ? "Desktop"
                    : Hyprland.active.client.class;
              }),
          }),
          Label({
            xalign: 0,
            truncate: "end",
            maxWidthChars: 1, // Doesn't matter, just needs to be non negative
            className: "txt-smallie bar-wintitle-txt",
            setup: (self) =>
              self.hook(Hyprland.active, (label) => {
                // Hyprland.active.client
                label.label =
                  Hyprland.active.client.title.length === 0
                    ? `Workspace ${Hyprland.active.workspace.id}`
                    : Hyprland.active.client.title;
              }),
          }),
        ],
      }),
    });
  } catch {
    return null;
  }
};

export default async (monitor = 0, showtitle = true) => {
  const optionalWindowTitleInstance = await WindowTitle();
  return EventBox({
    onScrollUp: () => {
      Indicator.popup(1); // Since the brightness and speaker are both on the same window
      Brightness[monitor].screen_value += 0.05;
    },
    onScrollDown: () => {
      Indicator.popup(1); // Since the brightness and speaker are both on the same window
      Brightness[monitor].screen_value -= 0.05;
    },
    onPrimaryClick: () => {
      App.toggleWindow("sideleft");
    },

    child: Overlay({
      overlays: [
        Box({ hexpand: true }),
        Box({
          className: "bar-sidemodule",
          hexpand: false,
          children: showtitle
            ? [
                Widget.Box({ className: "bar-corner-spacing" }),
                // optionalWindowTitleInstance,
                ActiveApps(),
              ]
            : [],
        }),
      ],
    }),
  });
};
