const { GLib } = imports.gi;
import Widget from "resource:///com/github/Aylur/ags/widget.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";
import Mpris from "resource:///com/github/Aylur/ags/service/mpris.js";
const { Box, Button, EventBox, Label, Overlay, Revealer, Scrollable } = Widget;
const { execAsync, exec } = Utils;
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js";
import { MaterialIcon } from "../../.commonwidgets/materialicon.js";
import { showMusicControls } from "../../../variables.js";

const CUSTOM_MODULE_CONTENT_INTERVAL_FILE = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-interval.txt`;
const CUSTOM_MODULE_CONTENT_SCRIPT = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-poll.sh`;
const CUSTOM_MODULE_LEFTCLICK_SCRIPT = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-leftclick.sh`;
const CUSTOM_MODULE_RIGHTCLICK_SCRIPT = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-rightclick.sh`;
const CUSTOM_MODULE_MIDDLECLICK_SCRIPT = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-middleclick.sh`;
const CUSTOM_MODULE_SCROLLUP_SCRIPT = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-scrollup.sh`;
const CUSTOM_MODULE_SCROLLDOWN_SCRIPT = `${GLib.get_user_cache_dir()}/ags/user/scripts/custom-module-scrolldown.sh`;

function trimTrackTitle(title) {
  if (!title) return "";
  const cleanPatterns = [
    /【[^】]*】/, // Touhou n weeb stuff
    " [FREE DOWNLOAD]", // F-777
  ];
  cleanPatterns.forEach((expr) => (title = title.replace(expr, "")));
  return title;
}

function adjustVolume(direction) {
  const step = 0.03;
  execAsync(["playerctl", "volume"])
    .then((output) => {
      let currentVolume = parseFloat(output.trim());
      let newVolume =
        direction === "up" ? currentVolume + step : currentVolume - step;
      if (newVolume > 1.0) newVolume = 1.0;
      if (newVolume < 0.0) newVolume = 0.0;
      execAsync(["playerctl", "volume", newVolume.toFixed(2)]).catch(print);
    })
    .catch(print);
}

const BarGroup = ({ child }) =>
  Box({
    className: "bar-group-margin bar-sides",
    children: [
      Box({
        className: "bar-group bar-group-standalone bar-group-pad-system",
        children: [child],
      }),
    ],
  });

const BarResource = (
  name,
  icon,
  command,
  circprogClassName = "bar-batt-circprog",
  textClassName = "txt-onSurfaceVariant",
  iconClassName = "bar-batt",
) => {
  const resourceCircProg = AnimatedCircProg({
    className: `${circprogClassName}`,
    vpack: "center",
    hpack: "center",
  });
  const resourceProgress = Box({
    homogeneous: true,
    children: [
      Overlay({
        child: Box({
          vpack: "center",
          className: `${iconClassName}`,
          homogeneous: true,
          children: [MaterialIcon(icon, "small")],
        }),
        overlays: [resourceCircProg],
      }),
    ],
  });
  const resourceLabel = Label({
    className: `txt-smallie ${textClassName}`,
  });
  const widget = Button({
    onClicked: () =>
      Utils.execAsync(["bash", "-c", `${userOptions.apps.taskManager}`]).catch(
        print,
      ),
    child: Box({
      className: `spacing-h-4 ${textClassName}`,
      children: [resourceProgress, resourceLabel],
      setup: (self) =>
        self.poll(5000, () =>
          execAsync(["bash", "-c", command])
            .then((output) => {
              resourceCircProg.css = `font-size: ${Number(output)}px;`;
              resourceLabel.label = `${Math.round(Number(output))}%`;
              widget.tooltipText = `${name}: ${Math.round(Number(output))}%`;
            })
            .catch(print),
        ),
    }),
  });
  return widget;
};

const TrackProgress = () => {
  const _updateProgress = (circprog) => {
    const mpris = Mpris.getPlayer("");
    if (!mpris) return;
    // Set circular progress value
    circprog.css = `font-size: ${Math.max((mpris.position / mpris.length) * 100, 0)}px;`;
  };

  const progressWidget = AnimatedCircProg({
    className: "bar-music-circprog",
    vpack: "center",
    hpack: "center",
    extraSetup: (self) =>
      self.hook(Mpris, _updateProgress).poll(3000, _updateProgress),
  });

  // Wrap the progress widget in EventBox to handle clicks
  return EventBox({
    child: progressWidget,
    onPrimaryClick: () => {
      const mpris = Mpris.getPlayer("");
      if (mpris) {
        // Toggle play/pause on click
        execAsync("playerctl play-pause").catch(print);
        showMusicControls.value = !showMusicControls.value;
      }
    },
  });
};

const switchToRelativeWorkspace = async (self, num) => {
  try {
    const Hyprland = (
      await import("resource:///com/github/Aylur/ags/service/hyprland.js")
    ).default;
    Hyprland.messageAsync(
      `dispatch workspace ${num > 0 ? "+" : ""}${num}`,
    ).catch(print);
  } catch {
    execAsync([
      `${App.configDir}/scripts/sway/swayToRelativeWs.sh`,
      `${num}`,
    ]).catch(print);
  }
};

export default () => {
  // TODO: use cairo to make button bounce smaller on click, if that's possible
  const playingState = Box({
    // Wrap a box cuz overlay can't have margins itself
    homogeneous: true,
    children: [
      Overlay({
        child: Box({
          vpack: "center",
          className: "bar-music-playstate",
          homogeneous: true,
          children: [
            Label({
              vpack: "center",
              className: "bar-music-playstate-txt",
              justification: "center",
              setup: (self) =>
                self.hook(Mpris, (label) => {
                  const mpris = Mpris.getPlayer("");
                  label.label = `${mpris !== null && mpris.playBackStatus == "Playing" ? "pause" : "play_arrow"}`;
                }),
            }),
          ],
          setup: (self) =>
            self.hook(Mpris, (label) => {
              const mpris = Mpris.getPlayer("");
              if (!mpris) return;
              label.toggleClassName(
                "bar-music-playstate-playing",
                mpris !== null && mpris.playBackStatus == "Playing",
              );
              label.toggleClassName(
                "bar-music-playstate",
                mpris !== null || mpris.playBackStatus == "Paused",
              );
            }),
        }),
        overlays: [TrackProgress()],
      }),
    ],
  });

  const trackTitleRevealer = Revealer({
    revealChild: false,
    transition: "slide_left",
    transitionDuration: 300,
    child: Label({
      className: "txt-smallie bar-music-txt track-title",
      truncate: "end",
      maxWidthChars: 20,
      setup: (self) =>
        self.hook(Mpris, (label) => {
          const players = Mpris.players;
          let mpris = players[0];
          // players.forEach((player) => {
          //   mpris = player;
          // });

          if (mpris && mpris.trackTitle) {
            label.label = `${trimTrackTitle(mpris.trackTitle.substring(0, 20))} • ${mpris.trackArtists.join(", ")} `;
          } else label.label = "No media";
        }),
    }),
  });
  const showTrackTitleTemporarily = () => {
    trackTitleRevealer.revealChild = true;
    Utils.timeout(2000, () => {
      trackTitleRevealer.revealChild = false;
    });
  };
  const musicStuff = EventBox({
    className: "spacing-h-4",
    onHover: () => {
      trackTitleRevealer.revealChild = true;
    },
    onHoverLost: () => {
      trackTitleRevealer.revealChild = false;
    },
    onScrollUp: () => execAsync("playerctl next").catch(print),
    onScrollDown: () => execAsync("playerctl previous").catch(print),
    child: Box({
      children: [playingState, trackTitleRevealer],
    }),
    setup: (self) =>
      self.hook(Mpris, () => {
        const mpris = Mpris.getPlayer("");
        if (mpris) {
          showTrackTitleTemporarily();
        }
      }),
  });
  const SystemResourcesOrCustomModule = () => {
    // Check if $XDG_CACHE_HOME/ags/user/scripts/custom-module-poll.sh exists
    const SysRevealer = Revealer({
      revealChild: false,
      transition: "slide_left",
      transitionDuration: 300,
      child: Box({
        className: "spacing-h-10 margin-left-10",
        children: [
          BarResource(
            "Swap Usage",
            "swap_horiz",
            `free | awk '/^Swap/ {if ($2 > 0) printf("%.2f\\n", ($3/$2) * 100); else print "0";}'`,
            "bar-swap-circprog",
            "bar-swap-txt",
            "bar-swap-icon",
          ),
          BarResource(
            "CPU Usage",
            "settings_motion_mode",
            `top -bn1 | grep Cpu | sed 's/\\,/\\./g' | awk '{print $2}'`,
            "bar-cpu-circprog",
            "bar-cpu-txt",
            "bar-cpu-icon",
          ),
        ],
      }),
    });

    const SysResources = Box({
      children: [
        BarResource(
          "RAM Usage",
          "memory",
          `free | awk '/^Mem/ {printf("%.2f\\n", ($3/$2) * 100)}'`,
          "bar-ram-circprog",
          "bar-ram-txt",
          "bar-ram-icon",
        ),
        SysRevealer,
      ],
    });
    if (GLib.file_test(CUSTOM_MODULE_CONTENT_SCRIPT, GLib.FileTest.EXISTS)) {
      const interval =
        Number(Utils.readFile(CUSTOM_MODULE_CONTENT_INTERVAL_FILE)) || 5000;
      return BarGroup({
        child: Button({
          child: Label({
            className: "txt-smallie txt-onSurfaceVariant",
            useMarkup: true,
            setup: (self) =>
              Utils.timeout(1, () => {
                self.label = exec(CUSTOM_MODULE_CONTENT_SCRIPT);
                self.poll(interval, (self) => {
                  const content = exec(CUSTOM_MODULE_CONTENT_SCRIPT);
                  self.label = content;
                });
              }),
          }),
          onPrimaryClickRelease: () =>
            execAsync(CUSTOM_MODULE_LEFTCLICK_SCRIPT).catch(print),
          onSecondaryClickRelease: () =>
            execAsync(CUSTOM_MODULE_RIGHTCLICK_SCRIPT).catch(print),
          onMiddleClickRelease: () =>
            execAsync(CUSTOM_MODULE_MIDDLECLICK_SCRIPT).catch(print),
          onScrollUp: () =>
            execAsync(CUSTOM_MODULE_SCROLLUP_SCRIPT).catch(print),
          onScrollDown: () =>
            execAsync(CUSTOM_MODULE_SCROLLDOWN_SCRIPT).catch(print),
        }),
      });
    } else
      return BarGroup({
        child: EventBox({
          child: SysResources,
          onHover: () => {
            SysRevealer.revealChild = true;
          },
          onHoverLost: () => {
            setTimeout(() => {
              SysRevealer.revealChild = false;
            }, 2000);
          },
        }),
      });
  };
  return EventBox({
    onScrollUp: () => adjustVolume("up"),
    onScrollDown: () => adjustVolume("down"),
    child: Box({
      className: "spacing-h-4",
      children: [
        SystemResourcesOrCustomModule(),
        EventBox({
          child: BarGroup({
            child: musicStuff,
          }),
          onPrimaryClick: () => {
            showMusicControls.setValue(!showMusicControls.value);
          },
          onSecondaryClick: () =>
            execAsync([
              "bash",
              "-c",
              'playerctl next || playerctl position `bc <<< "100 * $(playerctl metadata mpris:length) / 1000000 / 100"` &',
            ]).catch(print),
          onMiddleClick: () => execAsync("playerctl play-pause").catch(print),
          setup: (self) =>
            self.on("button-press-event", (self, event) => {
              if (event.get_button()[1] === 8)
                // Side button
                execAsync("playerctl previous").catch(print);
            }),
        }),
      ],
    }),
  });
};
