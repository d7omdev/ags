import Widget from "resource:///com/github/Aylur/ags/widget.js";
import SystemTray from "resource:///com/github/Aylur/ags/service/systemtray.js";
const { Box, Icon, Button, Revealer } = Widget;
const { Gravity } = imports.gi.Gdk;

const SysTrayItem = (item) =>
  Button({
    className: "bar-systray-item",
    child: Icon({ hpack: "center" }).bind("icon", item, "icon"),
    setup: (self) =>
      self.hook(item, (self) => (self.tooltipMarkup = item["tooltip-markup"])),
    onPrimaryClick: (_, event) => item.activate(event),
    onSecondaryClick: (btn, event) =>
      item.menu.popup_at_widget(btn, Gravity.SOUTH, Gravity.NORTH, null),
  });

export const Tray = (props = {}) => {
  const trayContent = Box({
    className: "margin-right-5 spacing-h-15",
    setup: (self) =>
      self.hook(SystemTray, (self) => {
        const sortedItems = SystemTray.items.sort((a, b) => {
          if (a.id === "Fcitx") return 1;
          if (b.id === "Fcitx") return -1;
          return 0;
        });
        self.children = sortedItems.map(SysTrayItem);
        self.show_all();
      }),
  });
  const trayRevealer = Widget.Revealer({
    revealChild: true,
    transition: "slide_left",
    transitionDuration: userOptions.animations.durationLarge,
    child: trayContent,
  });
  return Box({
    ...props,
    children: [trayRevealer],
  });
};
