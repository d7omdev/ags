import Utils from 'resource:///com/github/Aylur/ags/utils.js';
import Widget from 'resource:///com/github/Aylur/ags/widget.js';
const { Box, Label } = Widget;

const MAX_KEYS = 10, KEY_COMBO_THRESHOLD = 300, CLEAR_TIMEOUT = 2000;
let keyBuffer = [],
    activeKeys = new Set(),
    lastKeyPressed = '',
    lastKeyTime = 0,
    clearBufferTimeout = null;

const specialKeysMap = {
    'SHIFT': '󰘶',
    'CAPS': '󰘲',
    'TAB': '󰌒',
    'ENTER': '󰌑',
    'COMPOSE': '󰮫',
    'BACKSPACE': '󰌍',
    'SPACE': '󱁐',
    'UP': '',
    'DOWN': '',
    // 'LEFT': '',
    // 'RIGHT': '',
    'CONTROL': 'Ctrl',
    'ALT': 'Alt',
    'META': 'Win',
    'ESC': '󱊷',
};

function getSpecialKey(keyName) {
    const specialKeysPattern = /[\\|\/.,=\-]/;

    if (specialKeysPattern.test(keyName)) {
        return keyName;
    }

    for (const key in specialKeysMap) {
        if (keyName.toUpperCase() === 'LEFT') return '';
        if (keyName.toUpperCase() === 'RIGHT') return '';
        if (keyName.toUpperCase().includes(key.toUpperCase())) {
            return specialKeysMap[key];
        }
    }

    return keyName;
}

function updateDisplay(self) {
    // Update the label with current key buffer
    self.label = keyBuffer.length > 0 ? keyBuffer.join(' ') : self.toggleClassName('hidden', true) && clearBuffer(self);
}

function clearBuffer(self) {
    keyBuffer = [];
    activeKeys.clear();
    lastKeyPressed = '';
    updateDisplay(self);
}

function scheduleBufferClear(self) {
    // Clear any existing timeout
    if (clearBufferTimeout) {
        clearTimeout(clearBufferTimeout);
    }

    // Set new timeout to clear buffer after inactivity
    clearBufferTimeout = setTimeout(() => {
        clearBuffer(self);
    }, CLEAR_TIMEOUT);
}

export const KeystrokeMonitor = () => {
    return Box({
        hpack: 'center',
        homogeneous: true,
        vexpand: true,
        hexpand: true,
        children: [
            Label({
                className: 'txt-hugeass key-vis',
                label: 'Waiting for keystrokes...',
                setup: self => {
                    Utils.subprocess(
                        ['bash', '-c', '/home/d7om/.config/ags/modules/indicators/getKeys.sh'],
                        (output) => {
                            if (!output || output.includes('device added:')) return;

                            const match = output.match(/keyd virtual keyboard\s+(\S+)\s+(\S+)\s+(up|down)/);
                            // console.log(match);

                            if (match) {
                                self.toggleClassName('hidden', false)
                                let keyName = match[2];
                                const keyState = match[3];
                                const currentTime = Date.now();

                                keyName = getSpecialKey(keyName);

                                if (keyState === 'down') {
                                    // Reset clear timeout since we have activity
                                    scheduleBufferClear(self);

                                    if (!activeKeys.has(keyName)) {
                                        const timeSinceLastKey = currentTime - lastKeyTime;

                                        // Check if this key was pressed close enough to the last key
                                        // to be considered part of a combination
                                        if (timeSinceLastKey < KEY_COMBO_THRESHOLD && activeKeys.size > 0) {
                                            // Modify the last entry to make it a combination
                                            if (!keyBuffer[keyBuffer.length - 1].includes('+')) {
                                                keyBuffer[keyBuffer.length - 1] += ' + ' + keyName;
                                            } else {
                                                // If already a combo, just add the new key
                                                keyBuffer[keyBuffer.length - 1] += ' + ' + keyName;
                                            }
                                        } else {
                                            // Add as a new separate keystroke
                                            keyBuffer.push(keyName);
                                            if (keyBuffer.length > MAX_KEYS) {
                                                keyBuffer.shift();
                                            }
                                        }

                                        activeKeys.add(keyName);
                                        lastKeyPressed = keyName;
                                        lastKeyTime = currentTime;
                                        updateDisplay(self);
                                    }
                                } else if (keyState === 'up') {
                                    activeKeys.delete(keyName);
                                    if (activeKeys.size === 0) {
                                        lastKeyPressed = '';
                                    }
                                }
                            }
                        },
                        (err) => console.log(err),
                        self,
                    );
                }
            })
        ]
    });
};

export default (monitor = 0) => Widget.Window({
    name: 'keyvis',
    monitor,
    className: 'indicator',
    layer: 'overlay',
    anchor: ['bottom', 'right'],
    visible: false,
    child: Widget.Box({
        vertical: true,
        className: 'osd-window',
        css: 'min-height: 50px; min-width: 200px; margin: 20px;',
        children: [
            KeystrokeMonitor(),
        ]
    })
});
