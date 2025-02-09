import Widget from "resource:///com/github/Aylur/ags/widget.js";
import Indicator from "../../services/indicator.js";
import { currentLang } from "../../variables.js";

export default () => {
  const langWidget = Widget.Label({
    className: "osd-value-txt",
    label: currentLang.bind(),
    // setup: (self) => self.hook(currentLang, () => {}),
  });

  // Create the popup revealer
  return Widget.Revealer({
    transition: "slide_down",
    transitionDuration: userOptions.animations.durationLarge,
    child: Widget.Box({
      vertical: true,
      className: "osd-bg osd-value osd-language",
      children: [
        Widget.Label({ label: "Language", className: "osd-label-big" }),
        langWidget,
      ],
    }),
    setup: (self) =>
      self.hook(
        Indicator,
        (revealer, value) => {
          if (value === 2)
            revealer.revealChild = true; // Show only for value 2
          else revealer.revealChild = false;
        },
        "popup",
      ),
  });
};
