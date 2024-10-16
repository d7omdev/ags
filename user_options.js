// For every option, see ~/.config/ags/modules/.configuration/user_options.js
// (vscode users ctrl+click this: file://./modules/.configuration/user_options.js)
// (vim users: `:vsp` to split window, move cursor to this path, press `gf`. `Ctrl-w` twice to switch between)
//   options listed in this file will override the default ones in the above file

const userConfigOptions = {
    // ai: {
    //     defaultGPTProvider: "",
    //     defaultTemperature: null,
    //     enhancements: null,
    //     useHistory: null,
    //     safety: null,
    //     writingCursor: "",
    //     proxyUrl: null,
    // },
    // animations: {
    //     choreographyDelay: null,
    //     durationSmall: null,
    //     durationLarge: null,
    // },
    appearance: {
        //     autoDarkMode: {
        //         enabled: null,
        //         from: "",
        //         to: "",
        //     },
        //     keyboardUseFlag: null,
        //     layerSmoke: null,
        //     layerSmokeStrength: null,
        // barRoundCorne: false,
        //     fakeScreenRounding: null,
    },
    // apps: {
    //     // bluetooth: "",
    //     // imageViewer: "",
    //     // network: "",
    //     // settings: "",
    //     taskManager: "missioncenter",
    //     terminal: "kitty",
    // },
    // battery: {
    //     low: null,
    //     critical: null,
    //     warnLevels: [],
    //     warnTitles: [],
    //     warnMessages: [],
    //     suspendThreshold: null,
    // },
    // brightness: {
    //     controllers: {
    //         default: "",
    //     },
    // },
    // cheatsheet: {
    //     keybinds: {
    //         configPath: "",
    //     },
    // },
    // gaming: {
    //     crosshair: {
    //         size: null,
    //         color: "",
    //     },
    // },
    // monitors: {
    //     scaleMethod: "",
    // },
    // music: {
    //     preferredPlayer: "",
    // },
    // onScreenKeyboard: {
    //     layout: "",
    // },
    // overview: {
    //     scale: null,
    //     numOfRows: null,
    //     numOfCols: null,
    //     wsNumScale: null,
    //     wsNumMarginScale: null,
    // },
    sidebar: {
        //     ai: {
        //         extraGptModels: {},
        //     },
        //     image: {
        //         columns: null,
        //         batchCount: null,
        //         allowNsfw: null,
        //     },
        pages: {
            // order: [],
            apis: {
                order: ["gemini", "gpt"],
            },
        },
    },
    // search: {
    //     enableFeatures: {
    //         actions: null,
    //         commands: null,
    //         mathResults: null,
    //         directorySearch: null,
    //         aiSearch: null,
    //         webSearch: null,
    //     },
    //     engineBaseUrl: "",
    //     excludedSites: [],
    // },
    // time: {
    //     format: "",
    //     interval: null,
    //     dateFormatLong: "",
    //     dateInterval: null,
    //     dateFormat: "",
    // },
    // weather: {
    //     city: "",
    //     preferredUnit: "",
    // },
    workspaces: {
        shown: 5,
    },
    // dock: {
    //     enabled: null,
    //     hiddenThickness: null,
    //     pinnedApps: [],
    //     layer: "",
    //     monitorExclusivity: null,
    //     searchPinnedAppIcons: null,
    //     trigger: [],
    //     autoHide: [],
    // },
    // icons: {
    //     searchPaths: [],
    //     symbolicIconTheme: {
    //         dark: "",
    //         light: "",
    //     },
    //     substitutions: {},
    //     regexSubstitutions: [],
    // },
    // keybinds: {
    //     overview: {
    //         altMoveLeft: "",
    //         altMoveRight: "",
    //         deleteToEnd: "",
    //     },
    //     sidebar: {
    //         apis: {
    //             nextTab: "",
    //             prevTab: "",
    //         },
    //         options: {
    //             nextTab: "",
    //             prevTab: "",
    //         },
    //         pin: "",
    //         cycleTab: "",
    //         nextTab: "",
    //         prevTab: "",
    //     },
    //     cheatsheet: {
    //         keybinds: {
    //             nextTab: "",
    //             prevTab: "",
    //         },
    //         nextTab: "",
    //         prevTab: "",
    //         cycleTab: "",
    //     },
    // },
};

export default userConfigOptions;

