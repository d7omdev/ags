import App from "resource:///com/github/Aylur/ags/app.js";
import Brightness from "../../../services/brightness.js";
import Indicator from "../../../services/indicator.js";
import {
    MenuItem,
    Label,
    Scrollable,
    Box,
    EventBox,
    Overlay,
    Menu,
    Button
} from "resource:///com/github/Aylur/ags/widget.js";
import { MaterialIcon } from '../../.commonwidgets/materialicon.js';
const { Gdk } = imports.gi
const { exec, execAsync } = Utils;

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
                            self.hook(Hyprland.active.client, (label) => {
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

const Hyprland = (
    await import("resource:///com/github/Aylur/ags/service/hyprland.js")
).default;
const clients = Hyprland.clients;

export default async (monitor = 0, showtitle = false) => {
    const optionalWindowTitleInstance = await WindowTitle();
    let menu = null;
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

        child:
            // Widget.Box({ className: "bar-corner-spacing" }),
            Overlay({
                overlays: [
                    Box({ hexpand: true }),
                    Box({
                        className: "bar-sidemodule",
                        hexpand: false,
                        children: [
                            Box({
                                vertical: true,
                                className: "bar-space-button",
                                children: showtitle ? [optionalWindowTitleInstance] : [Button({
                                    className: 'bar-group bar-group-standalone bar-group-pad-system',
                                    child: Widget.Box({
                                        tooltipText: 'Click to copy the class of a window',
                                        className: "bar-group-margin",
                                        homogeneous: true,
                                        child: MaterialIcon('select_window_2', 'norm')
                                    }),
                                    onClicked: (button) => {
                                        if (!menu) {
                                            menu = Menu({
                                                className: "menu",
                                                children: clients.map((client) => {
                                                    return MenuItem({
                                                        child: Label({
                                                            vexpand: true,
                                                            className: 'text',
                                                            label: client.class + " • " + (client.title.length > 10 ? client.title.slice(0, 10) + "..." : client.title)
                                                        }), onActivate: () => {
                                                            execAsync(`wl-copy ${client.class}`).catch(print);
                                                            execAsync(`notify-send --icon=info 'Class copied to clipboard' 'Copied class ${client.class}'`).catch(print);
                                                        },

                                                    });
                                                }),
                                            });
                                        }

                                        try {
                                            menu.rect_anchor_dy = 4;
                                            menu.popup_at_widget(
                                                button,
                                                Gdk.Gravity.SOUTH,
                                                Gdk.Gravity.NORTH,
                                                null
                                            );
                                        } catch (error) {
                                            print(`Error showing menu: ${error}`);
                                        }
                                    }
                                }),],
                            }),

                        ]
                    }),
                ],
            }),
    })
};

