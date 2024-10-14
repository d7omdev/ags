// This is for the right pills of the bar.
import Widget from "resource:///com/github/Aylur/ags/widget.js"
import * as Utils from "resource:///com/github/Aylur/ags/utils.js"
const { Box, Label, Button, Overlay, Revealer, Menu, MenuItem, Scrollable, Stack, EventBox } =
    Widget
const { exec, execAsync } = Utils
const { GLib, Gdk } = imports.gi
import Battery from "resource:///com/github/Aylur/ags/service/battery.js"
import { MaterialIcon } from "../../.commonwidgets/materialicon.js"
import { AnimatedCircProg } from "../../.commonwidgets/cairo_circularprogress.js"
import {
    WWO_CODE,
    WEATHER_SYMBOL,
    NIGHT_WEATHER_SYMBOL,
} from "../../.commondata/weather.js"

const WEATHER_CACHE_FOLDER = `${GLib.get_user_cache_dir()}/ags/weather`
Utils.exec(`mkdir -p ${WEATHER_CACHE_FOLDER}`)

const BatBatteryProgress = () => {
    const _updateProgress = (circprog) => {
        // Set circular progress value
        circprog.css = `font-size: ${Math.abs(Battery.percent)}px;`

        circprog.toggleClassName(
            "bar-batt-circprog-low",
            Battery.percent <= userOptions.battery.low,
        )
        circprog.toggleClassName("bar-batt-circprog-full", Battery.charged)
    }
    return AnimatedCircProg({
        className: "bar-batt-circprog",
        vpack: "center",
        hpack: "center",
        extraSetup: (self) => self.hook(Battery, _updateProgress),
    })
}

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
                        label.label = GLib.DateTime.new_now_local().format("%I:%M %p")
                    }),
            }),
            Widget.Label({
                className: "txt-norm txt-onLayer1",
                label: "•",
            }),
            Widget.Label({
                className: "txt-smallie bar-date",
                label: GLib.DateTime.new_now_local().format("%a %d/%m"),
                setup: (self) =>
                    self.poll(userOptions.time.dateInterval, (label) => {
                        label.label = GLib.DateTime.new_now_local().format("%a %d/%m")
                    }),
            }),
        ],
    })

const UtilButton = ({ name, icon, onClicked }) =>
    Button({
        vpack: "center",
        tooltipText: name,
        onClicked: onClicked,
        className: "bar-util-btn icon-material txt-norm",
        label: `${icon}`,
    })

const screenRecorderButton = () => {
    let menu = null;

    const runScript = (args) => {
        const command = `~/.config/ags/scripts/record-script.sh ${args}`;
        execAsync(['bash', '-c', command])
            .then(() => print(`Executed: ${command}`))
            .catch((err) => print(`Error executing ${command}: ${err}`));
    };

    const button = UtilButton({
        name: "Screen recorder",
        icon: "screen_record",
        onClicked: (button) => {
            if (!menu) {
                print('Initializing menu');
                menu = Menu({
                    className: "menu",
                    children: [
                        MenuItem({
                            child: Label('Record region'),
                            onActivate: () => runScript('')
                        }),
                        MenuItem({
                            child: Label('Record full screen'),
                            onActivate: () => runScript('--fullscreen')
                        }),
                        MenuItem({
                            child: Label('Record full screen (with sound)'),
                            onActivate: () => runScript('--fullscreen-sound')
                        })
                    ],
                });
            }

            try {
                menu.popup_at_widget(
                    button,
                    Gdk.Gravity.SOUTH,
                    Gdk.Gravity.NORTH,
                    null
                );
                menu.rect_anchor_dy = 6;
                print('Menu popup called');
            } catch (error) {
                print(`Error showing menu: ${error}`);
            }
        },
    });

    return button;
}


const Utilities = () =>
    Box({
        hpack: "center",
        className: "spacing-h-4",
        children: [
            UtilButton({
                name: "Screen snip",
                icon: "screenshot_region",
                onClicked: () => {
                    Utils.execAsync(
                        `${App.configDir}/scripts/grimblast.sh copysave area`,
                    ).catch(print)
                },
            }),
            UtilButton({
                name: "Color picker",
                icon: "colorize",
                onClicked: () => {
                    Utils.execAsync(["hyprpicker", "-a"]).catch(print)
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
        ],
    })

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
                        self.revealChild = Battery.charging
                    }),
            }),
            Label({
                className: "txt-smallie",
                setup: (self) =>
                    self.hook(Battery, (label) => {
                        label.label = `${Number.parseFloat(Battery.percent.toFixed(1))}%`
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
                            )
                            box.toggleClassName("bar-batt-full", Battery.charged)
                        }),
                }),
                overlays: [BatBatteryProgress()],
            }),
        ],
    })

const BarGroup = ({ child }) =>
    Widget.Box({
        className: "bar-group-margin bar-sides",
        children: [
            Widget.Box({
                className: "bar-group bar-group-standalone bar-group-pad-system",
                children: [child],
            }),
        ],
    })
function isNightTime() {
    const currentHour = new Date().getHours()
    return currentHour < 6 || currentHour > 18
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
            BarGroup({ child: Utilities() }),
            BarGroup({ child: BarBattery() }),
            BarGroup({
                child: Box({
                    hexpand: true,
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
                            const WEATHER_CACHE_PATH = WEATHER_CACHE_FOLDER + "/wttr.in.txt"
                            const updateWeatherForCity = (city) =>
                                execAsync(
                                    `curl https://wttr.in/${city.replace(/ /g, "%20")}?format=j1`,
                                )
                                    .then((output) => {
                                        const weather = JSON.parse(output)
                                        Utils.writeFile(
                                            JSON.stringify(weather),
                                            WEATHER_CACHE_PATH,
                                        ).catch(print)
                                        const weatherCode =
                                            weather.current_condition[0].weatherCode
                                        const weatherDesc =
                                            weather.current_condition[0].weatherDesc[0].value
                                        const temperature =
                                            weather.current_condition[0][
                                            `temp_${userOptions.weather.preferredUnit}`
                                            ]
                                        const feelsLike =
                                            weather.current_condition[0][
                                            `FeelsLike${userOptions.weather.preferredUnit}`
                                            ]
                                        const weatherSymbol = isNightTime()
                                            ? NIGHT_WEATHER_SYMBOL[WWO_CODE[weatherCode]]
                                            : WEATHER_SYMBOL[WWO_CODE[weatherCode]]
                                        self.children[0].label = weatherSymbol
                                        // self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit} • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`;
                                        self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit}`
                                        self.tooltipText =
                                            weatherDesc +
                                            ` • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`
                                    })
                                    .catch((err) => {
                                        try {
                                            // Read from cache
                                            const weather = JSON.parse(
                                                Utils.readFile(WEATHER_CACHE_PATH),
                                            )
                                            const weatherCode =
                                                weather.current_condition[0].weatherCode
                                            const weatherDesc =
                                                weather.current_condition[0].weatherDesc[0].value
                                            const temperature =
                                                weather.current_condition[0][
                                                `temp_${userOptions.weather.preferredUnit}`
                                                ]
                                            const feelsLike =
                                                weather.current_condition[0][
                                                `FeelsLike${userOptions.weather.preferredUnit}`
                                                ]
                                            const weatherSymbol =
                                                WEATHER_SYMBOL[WWO_CODE[weatherCode]]
                                            self.children[0].label = weatherSymbol
                                            // self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit} • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`
                                            self.children[1].label = `${temperature}°${userOptions.weather.preferredUnit}`
                                            self.tooltipText =
                                                weatherDesc +
                                                ` • Feels like ${feelsLike}°${userOptions.weather.preferredUnit}`
                                        } catch (err) {
                                            print(err)
                                        }
                                    })
                            if (
                                userOptions.weather.city != "" &&
                                userOptions.weather.city != null
                            ) {
                                updateWeatherForCity(
                                    userOptions.weather.city.replace(/ /g, "%20"),
                                )
                            } else {
                                Utils.execAsync("curl ipinfo.io")
                                    .then((output) => {
                                        return JSON.parse(output)["city"].toLowerCase()
                                    })
                                    .then(updateWeatherForCity)
                                    .catch(print)
                            }
                        }),
                }),
            }),
        ],
        setup: (stack) =>
            Utils.timeout(10, () => {
                if (!Battery.available) stack.shown = "desktop"
                else stack.shown = "laptop"
            }),
    })

const switchToRelativeWorkspace = async (self, num) => {
    try {
        const Hyprland = (
            await import("resource:///com/github/Aylur/ags/service/hyprland.js")
        ).default
        Hyprland.messageAsync(
            `dispatch workspace ${num > 0 ? "+" : ""}${num}`,
        ).catch(print)
    } catch {
        execAsync([
            `${App.configDir}/scripts/sway/swayToRelativeWs.sh`,
            `${num}`,
        ]).catch(print)
    }
}

export default () =>
    Widget.EventBox({
        onScrollUp: (self) => switchToRelativeWorkspace(self, -1),
        onScrollDown: (self) => switchToRelativeWorkspace(self, +1),
        onPrimaryClick: () => App.toggleWindow("sideright"),
        child: Widget.Box({
            className: "spacing-h-4",
            children: [BarGroup({ child: BarClock() }), BatteryModule()],
        }),
    });
