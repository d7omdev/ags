// This is for the right pills of the bar.
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
const {
  Box,
  Label,
  Button,
  Overlay,
  Revealer,
  Menu,
  MenuItem,
  Scrollable,
  Stack,
  EventBox,
} = Widget;
const { exec, execAsync } = Utils;
const { GLib, Gdk } = imports.gi;
const { Gravity } = imports.gi.Gdk;
import Battery from "resource:///com/github/Aylur/ags/service/battery.js";
import Hyprland from "resource:///com/github/Aylur/ags/service/hyprland.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import {
  WWO_CODE,
  WEATHER_SYMBOL,
  NIGHT_WEATHER_SYMBOL,
} from "../../.commondata/weather.js";
import { recordingState, recordingIndicator } from "../../../variables.js";

const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`;
Utils.exec(`mkdir -p ${WEATHER_CACHE_FOLDER}`);

const BatBatteryProgress = () => {
  const _updateProgress = (circprog) => {
    // Set circular progress value
    circprog.css = `font-size: ${Math.abs(Battery.percent)}px;`;

    circprog.toggleClassName(
      "bar-batt-circprog-low",
      Battery.percent <= userOptions.battery.low,
    );
    circprog.toggleClassName("bar-batt-circprog-full", Battery.charged);
  };
  return AnimatedCircProg({
    className: "bar-batt-circprog",
    vpack: "center",
    hpack: "center",
    extraSetup: (self) => self.hook(Battery, _updateProgress),
  });
};

const BarClock = () =>
  Widget.Box({
    vpack: "center",
    className: "spacing-h-4 bar-clock-box",
    children: [
      Widget.Label({
        className: "bar-time",
        label: GLib.DateTime.new_now_local().format("%I:%M %p"),
        setup: (self) =>
          self.poll(userOptions.time.interval, (label) => {
            label.label = GLib.DateTime.new_now_local().format("%I:%M %p");
          }),
      }),
      Widget.Label({
        className: "txt-norm txt-onLayer1",
        label: "•",
      }),
      Widget.Label({
        className: "txt-smallie",
        label: GLib.DateTime.new_now_local().format("%a %d/%m"),
        setup: (self) =>
          self.poll(userOptions.time.dateInterval, (label) => {
            label.label = GLib.DateTime.new_now_local().format("%a %d/%m");
          }),
      }),
    ],
  });

const UtilButton = ({ name, icon, onClicked }) =>
  Button({
    vpack: "center",
    tooltipText: name,
    onClicked: onClicked,
    className: "bar-util-btn icon-material txt-norm",
    label: `${icon}`,
  });

const clientsClassesButton = () => {
  const menu = Menu({
    className: "menu",
    setup: (self) => {
      self.rect_anchor_dy = 8;

      self.hook(Hyprland, (menu) => {
        Hyprland.clients.length === 0
          ? (menu.children = [MenuItem({ child: Label("No clients found") })])
          : (menu.children = Hyprland.clients.map((client) => {
              return MenuItem({
                child: Label({
                  vexpand: true,
                  className: "text",
                  label:
                    client.class +
                    " • " +
                    (client.title.length > 10
                      ? client.title.slice(0, 10) + "..."
                      : client.title),
                }),
                onActivate: () => {
                  execAsync(`wl-copy ${client.class}`).catch(print);
                  execAsync(
                    `notify-send --icon=info 'Class copied to clipboard' 'Copied class ${client.class}'`,
                  ).catch(print);
                },
              });
            }));
      });
    },
  });

  return UtilButton({
    name: "Click to copy class",
    icon: "select_window_2",
    onClicked: (button) => {
      menu.popup_at_widget(button, Gravity.SOUTH, Gravity.NORTH, null);
    },
  });
};

// Format time as MM:SS with leading zeros
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${minutes}:${secs}`;
}

let recording = false;

function updateRecordingTimer() {
  let timerId = null;

  const startTimer = () => {
    if (timerId !== null) return;

    recordingState.value = {
      ...recordingState.value,
      isRecording: true,
      startTime: new Date(),
      elapsedSeconds: 0,
      formattedTime: "00:00",
    };

    timerId = Utils.interval(1000, () => {
      const now = new Date();
      const elapsedSeconds = Math.floor(
        (now - recordingState.value.startTime) / 1000,
      );

      recordingState.value = {
        ...recordingState.value,
        elapsedSeconds,
        formattedTime: formatTime(elapsedSeconds),
      };

      return true;
    });
  };

  const stopTimer = () => {
    if (timerId !== null) {
      Utils.timeout(0, () => {
        Utils.timeout.clearInterval(timerId);
        timerId = null;
      });

      recordingState.value = {
        ...recordingState.value,
        isRecording: false,
        formattedTime: "00:00",
      };
    }
  };

  recordingIndicator.connect("changed", () => {
    if (recordingIndicator.value > 0) {
      startTimer();
    } else {
      stopTimer();
    }
  });

  if (recordingIndicator.value > 0) {
    startTimer();
  }

  return {
    start: startTimer,
    stop: stopTimer,
  };
}

const timerController = updateRecordingTimer();

function stopRecording() {
  const command = `~/.config/ags/scripts/record-script.sh --stop`;

  recording = false;
  recordingIndicator.value = 0;
  recordingState.value = {
    ...recordingState.value,
    isRecording: false,
    type: "",
  };

  timerController.stop();

  updateMenuItems();

  execAsync(["bash", "-c", command])
    .then(() => {
      print(`Executed: ${command}`);
    })
    .catch((err) => {
      print(`Error executing ${command}: ${err}`);
      Utils.notify({
        summary: "Recording Error",
        body: `Failed to stop recording: ${err}`,
        urgency: "critical",
      });
    });
}

function startRecording(args, type) {
  const command = `~/.config/ags/scripts/record-script.sh ${args}`;

  recording = true;
  recordingIndicator.value = 1;
  recordingState.value = {
    ...recordingState.value,
    isRecording: true,
    type: type,
  };

  timerController.start();

  updateMenuItems();

  execAsync(["bash", "-c", command])
    .then(() => {
      print(`Executed: ${command}`);
    })
    .catch((err) => {
      print(`Error executing ${command}: ${err}`);

      recording = false;
      recordingIndicator.value = 0;
      recordingState.value = {
        ...recordingState.value,
        isRecording: false,
        type: "",
      };

      Utils.notify({
        summary: "Recording Error",
        body: `Failed to start recording: ${err}`,
        urgency: "critical",
      });
    });
}

let menu = null;
let menuItems = [];

function updateMenuItems() {
  if (!menuItems.length || !menu) return;

  menuItems.forEach((item) => {
    if (recording && recordingState.value.type === item.type) {
      item.element.child.label = `${item.label} ${item.icon ? item.icon : ""}  🔴`;
    } else {
      // Not the active recording
      item.element.child.label = item.icon
        ? `${item.label} ${item.icon}`
        : item.label;
    }
  });
}

const RecIndicator = () =>
  Box({
    className: "recording-indicator",
    visible: recordingIndicator.value > 0,
    setup: (self) => {
      self.hook(recordingIndicator, () => {
        self.visible = recordingIndicator.value > 0;
      });
    },
    children: [
      EventBox({
        onPrimaryClick: () => {
          if (recording && recordingIndicator.value > 0) {
            stopRecording();
          }
        },
        child: Box({
          className: "recording-box",
          children: [
            Box({
              className: "recording-dot",
              vpack: "center",
              hpack: "center",
            }),
            Label({
              className: "recording-indicator-label",
              setup: (self) => {
                self.hook(recordingState, () => {
                  if (recordingState.value.isRecording) {
                    self.label = `${recordingState.value.formattedTime}`;
                  } else {
                    self.label = "Recording";
                  }
                });
              },
            }),
          ],
        }),
      }),
    ],
  });

const screenRecorderButton = () => {
  const createRecordMenuItem = (label, args, icon = "") => {
    const recordingType = label.toLowerCase().replace("record ", "");

    const menuItem = MenuItem({
      child: Label(icon ? `${label} ${icon}` : label),
      onActivate: () => {
        if (recording) {
          stopRecording();
        } else {
          startRecording(args, recordingType);
        }

        if (menu) {
          menu.popdown();
        }
      },
    });

    menuItems.push({
      element: menuItem,
      label: label,
      icon: icon,
      type: recordingType,
    });

    return menuItem;
  };

  const button = UtilButton({
    name: "Screen recorder",
    icon: "screen_record",
    onClicked: (button) => {
      if (!menu) {
        menuItems = [];
        menu = Menu({
          className: "menu",
          children: [
            createRecordMenuItem("Record region", ""),
            createRecordMenuItem("Record full screen ", "--fullscreen", "🔈"),
            createRecordMenuItem(
              "Record full screen ",
              "--fullscreen-sound",
              "🔊",
            ),
          ],
        });
      }

      updateMenuItems();

      try {
        // Position and display menu
        menu.rect_anchor_dy = 8;
        menu.popup_at_widget(
          button,
          Gdk.Gravity.SOUTH,
          Gdk.Gravity.NORTH,
          null,
        );
      } catch (error) {
        print(`Error showing menu: ${error}`);
        Utils.notify({
          summary: "Menu Error",
          body: `Could not show recording menu: ${error}`,
          urgency: "normal",
        });
      }
    },
  });

  return button;
};

const ScreenshotButton = UtilButton({
  name: "Screen snip",
  icon: "screenshot_region",
  onClicked: () => {
    Utils.execAsync(
      `${App.configDir}/scripts/grimblast.sh copysave area`,
    ).catch(print);
  },
});

const Utilities = Revealer({
  revealChild: false,
  transition: "slide_left",
  transitionDuration: 300,
  child: Box({
    hpack: "center",
    className: "spacing-h-4 margin-left-5",
    children: [
      UtilButton({
        name: "Color picker",
        icon: "colorize",
        onClicked: () => {
          Utils.execAsync(["hyprpicker", "-a"]).catch(print);
        },
      }),
      // UtilButton({
      //     name: "Toggle on-screen keyboard",
      //     icon: "keyboard",
      //     onClicked: () => {
      //         toggleWindowOnAllMonitors("osk")
      //     },
      // }),
      screenRecorderButton(),
      clientsClassesButton(),
    ],
  }),
});

const BarBattery = () =>
  Box({
    className: "spacing-h-4 bar-batt-txt",
    children: [
      Revealer({
        transitionDuration: userOptions.animations.durationSmall,
        revealChild: false,
        transition: "slide_right",
        child: MaterialIcon("bolt", "norm", { tooltipText: "Charging" }),
        setup: (self) =>
          self.hook(Battery, (revealer) => {
            self.revealChild = Battery.charging;
          }),
      }),
      Label({
        className: "txt-smallie",
        setup: (self) =>
          self.hook(Battery, (label) => {
            label.label = `${Number.parseFloat(Battery.percent.toFixed(1))}%`;
          }),
      }),
      Overlay({
        child: Widget.Box({
          vpack: "center",
          className: "bar-batt",
          homogeneous: true,
          children: [MaterialIcon("battery_full", "small")],
          setup: (self) =>
            self.hook(Battery, (box) => {
              box.toggleClassName(
                "bar-batt-low",
                Battery.percent <= userOptions.battery.low,
              );
              box.toggleClassName("bar-batt-full", Battery.charged);
            }),
        }),
        overlays: [BatBatteryProgress()],
      }),
    ],
  });

export const BarGroup = ({ child }) =>
  Widget.Box({
    className: "bar-group-margin bar-sides",
    children: [
      Widget.Box({
        className: "bar-group bar-group-standalone bar-group-pad-system",
        children: [child],
      }),
    ],
  });

function isNightTime() {
  const currentHour = new Date().getHours();
  return currentHour < 6 || currentHour > 18;
}
const BatteryModule = () =>
  // Stack({
  //   transition: "slide_up_down",
  //   transitionDuration: userOptions.animations.durationLarge,
  //   children: {
  //     laptop: Box({
  //       className: "spacing-h-4",
  //       children: [
  //         BarGroup({ child: Utilities() }),
  //         BarGroup({ child: BarBattery() }),
  //       ],
  //     }),
  //     desktop: BarGroup({
  Box({
    className: "spacing-h-4",
    children: [
      EventBox({
        child: Widget.Box({
          className: "bar-group-margin bar-sides",
          children: [
            Widget.Box({
              className:
                "bar-group bar-group-standalone bar-group-pad-system margin-right-5",
              children: [ScreenshotButton, Utilities],
            }),
          ],
        }),
        onHover: () => {
          Utilities.revealChild = true;
          setTimeout(() => {
            Utilities.revealChild = false;
          }, 5000);
        },
      }),
      Box({
        child: BarGroup({ child: BarBattery() }),
        setup: (self) =>
          self.hook(Battery, (box) => {
            box.visible = !Battery.charged;
          }),
      }),

      BarGroup({
        child: Box({
          hexpand: false,
          hpack: "center",
          className: "spacing-h-4 txt-onSurfaceVariant",
          children: [
            MaterialIcon("device_thermostat", "small"),
            Label({
              label: "Weather",
            }),
          ],
          setup: (self) =>
            self.poll(900000, async (self) => {
              const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt";
              const updateWeatherForCity = (city) =>
                execAsync(
                  `curl https://wttr.in/${city.replace(/ /g, "%20")}?format=j1`,
                )
                  .then((output) => {
                    const weather = JSON.parse(output);
                    Utils.writeFile(
                      JSON.stringify(weather),
                      WEATHER_CACHE_PATH,
                    ).catch(print);
                    const weatherCode =
                      weather.current_condition[0].weatherCode;
                    const weatherDesc =
                      weather.current_condition[0].weatherDesc[0].value;
                    const temperature =
                      weather.current_condition[0][
                        `temp_${userOptions.weather.preferredUnit}`
                      ];
                    const feelsLike =
                      weather.current_condition[0][
                        `FeelsLike${userOptions.weather.preferredUnit}`
                      ];
                    const weatherSymbol = isNightTime()
                      ? NIGHT_WEATHER_SYMBOL[WWO_CODE[weatherCode]]
                      : WEATHER_SYMBOL[WWO_CODE[weatherCode]];
                    self.children[0].label = weatherSymbol;
                    // self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit} • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`;
                    self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit}`;
                    self.tooltipText =
                      weatherDesc +
                      ` • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`;
                  })
                  .catch((err) => {
                    try {
                      // Read from cache
                      const weather = JSON.parse(
                        Utils.readFile(WEATHER_CACHE_PATH),
                      );
                      const weatherCode =
                        weather.current_condition[0].weatherCode;
                      const weatherDesc =
                        weather.current_condition[0].weatherDesc[0].value;
                      const temperature =
                        weather.current_condition[0][
                          `temp_${userOptions.weather.preferredUnit}`
                        ];
                      const feelsLike =
                        weather.current_condition[0][
                          `FeelsLike${userOptions.weather.preferredUnit}`
                        ];
                      const weatherSymbol =
                        WEATHER_SYMBOL[WWO_CODE[weatherCode]];
                      self.children[0].label = weatherSymbol;
                      // self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit} • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`
                      self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit}`;
                      self.tooltipText =
                        weatherDesc +
                        ` • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`;
                    } catch (err) {
                      print(err);
                    }
                  });
              if (
                userOptions.weather.city != "" &&
                userOptions.weather.city != null
              ) {
                updateWeatherForCity(
                  userOptions.weather.city.replace(/ /g, "%20"),
                );
              } else {
                Utils.execAsync("curl ipinfo.io")
                  .then((output) => {
                    return JSON.parse(output)["city"].toLowerCase();
                  })
                  .then(updateWeatherForCity)
                  .catch(print);
              }
            }),
        }),
      }),
    ],
    setup: (stack) =>
      Utils.timeout(10, () => {
        if (!Battery.available) stack.shown = "desktop";
        else stack.shown = "laptop";
      }),
  });

const switchToRelativeWorkspace = async (self, num) => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;
    Hyprland.messageAsync(
      `dispatch workspace r${num > 0 ? "+" : ""}${num}`,
    ).catch(print);
  } catch {
    execAsync([
      `${App.configDir}/scripts/sway/swayToRelativeWs.sh`,
      `${num}`,
    ]).catch(print);
  }
};

export default () =>
  Box({
    children: [
      Widget.EventBox({
        onScrollUp: (self) => switchToRelativeWorkspace(self, -1),
        onScrollDown: (self) => switchToRelativeWorkspace(self, +1),
        onPrimaryClick: () => App.toggleWindow("sideright"),
        child: Widget.Box({
          className: "spacing-h-4",
          children: [BarGroup({ child: BarClock() }), BatteryModule()],
        }),
      }),
      Widget.Box({
        className: "spacing-h-4",
        children: [BarGroup({ child: RecIndicator() })],
      }),
    ],
  });
