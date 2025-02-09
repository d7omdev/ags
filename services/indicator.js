import Service from "resource:///com/github/Aylur/ags/service.js";
import * as Utils from "resource:///com/github/Aylur/ags/utils.js";

class IndicatorService extends Service {
  static {
    Service.register(this, { popup: ["double"] });
  }

  _delay = 1500;
  _count = 0;

  popup(value) {
    this.emit("popup", value); // Emit the value to indicate which popup to show
    this._count++;
    Utils.timeout(this._delay, () => {
      this._count--;
      if (this._count === 0) this.emit("popup", -1); // Hide all popups when no active requests
    });
  }

  connectWidget(widget, callback) {
    this.connect("popup", (_, value) => callback(widget, value)); // Pass the value to the callback
  }
}

// Export the singleton instance
const service = new IndicatorService();
globalThis["indicator"] = service; // Make it globally accessible
export default service;
