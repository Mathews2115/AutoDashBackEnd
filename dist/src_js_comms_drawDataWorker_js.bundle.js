/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/robust-websocket/robust-websocket.js":
/*!***********************************************************!*\
  !*** ./node_modules/robust-websocket/robust-websocket.js ***!
  \***********************************************************/
/***/ (function(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_RESULT__;(function(factory, global) {
  if (true) {
    !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
      return factory(global, navigator)
    }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__))
  } else {}
})(function(global, navigator) {

  var RobustWebSocket = function(url, protocols, userOptions) {
    var realWs = { close: function() {} },
        connectTimeout,
        self = this,
        attempts = 0,
        reconnects = -1,
        reconnectWhenOnlineAgain = false,
        explicitlyClosed = false,
        pendingReconnect,
        opts = Object.assign({},
          RobustWebSocket.defaultOptions,
          typeof userOptions === 'function' ? { shouldReconnect: userOptions } : userOptions
        )

    if (typeof opts.timeout !== 'number') {
      throw new Error('timeout must be the number of milliseconds to timeout a connection attempt')
    }

    if (typeof opts.shouldReconnect !== 'function') {
      throw new Error('shouldReconnect must be a function that returns the number of milliseconds to wait for a reconnect attempt, or null or undefined to not reconnect.')
    }

    ['bufferedAmount', 'url', 'readyState', 'protocol', 'extensions'].forEach(function(readOnlyProp) {
      Object.defineProperty(self, readOnlyProp, {
        get: function() { return realWs[readOnlyProp] }
      })
    })

    function clearPendingReconnectIfNeeded() {
      if (pendingReconnect) {
        clearTimeout(pendingReconnect)
        pendingReconnect = null
      }
    }

    var ononline = function(event) {
      if (reconnectWhenOnlineAgain) {
        clearPendingReconnectIfNeeded()
        reconnect(event)
      }
    },
    onoffline = function() {
      reconnectWhenOnlineAgain = true
      realWs.close(1000)
    },
    connectivityEventsAttached = false

    function detachConnectivityEvents() {
      if (connectivityEventsAttached) {
        global.removeEventListener('online', ononline)
        global.removeEventListener('offline', onoffline)
        connectivityEventsAttached = false
      }
    }

    function attachConnectivityEvents() {
      if (!connectivityEventsAttached) {
        global.addEventListener('online', ononline)
        global.addEventListener('offline', onoffline)
        connectivityEventsAttached = true
      }
    }

    self.send = function() {
      return realWs.send.apply(realWs, arguments)
    }

    self.close = function(code, reason) {
      if (typeof code !== 'number') {
        reason = code
        code = 1000
      }

      clearPendingReconnectIfNeeded()
      reconnectWhenOnlineAgain = false
      explicitlyClosed = true
      detachConnectivityEvents()

      return realWs.close(code, reason)
    }

    self.open = function() {
      if (realWs.readyState !== WebSocket.OPEN && realWs.readyState !== WebSocket.CONNECTING) {
        clearPendingReconnectIfNeeded()
        reconnectWhenOnlineAgain = false
        explicitlyClosed = false

        newWebSocket()
      }
    }

    function reconnect(event) {
      if ((!opts.shouldReconnect.handle1000 && event.code === 1000) || explicitlyClosed) {
        attempts = 0
        return
      }
      if (navigator.onLine === false) {
        reconnectWhenOnlineAgain = true
        return
      }

      var delay = opts.shouldReconnect(event, self)
      if (typeof delay === 'number') {
        pendingReconnect = setTimeout(newWebSocket, delay)
      }
    }

    Object.defineProperty(self, 'listeners', {
      value: {
        open: [function(event) {
          if (connectTimeout) {
            clearTimeout(connectTimeout)
            connectTimeout = null
          }
          event.reconnects = ++reconnects
          event.attempts = attempts
          attempts = 0
          reconnectWhenOnlineAgain = false
        }],
        close: [reconnect]
      }
    })

    Object.defineProperty(self, 'attempts', {
      get: function() { return attempts },
      enumerable: true
    })

    Object.defineProperty(self, 'reconnects', {
      get: function() { return reconnects },
      enumerable: true
    })

    function newWebSocket() {
      var newUrl = (typeof url === 'function' ? url(self) : url);
      pendingReconnect = null
      realWs = new WebSocket(newUrl, protocols || undefined)
      realWs.binaryType = self.binaryType

      attempts++
      self.dispatchEvent(Object.assign(new CustomEvent('connecting'), {
        attempts: attempts,
        reconnects: reconnects
      }))

      connectTimeout = setTimeout(function() {
        connectTimeout = null
        detachConnectivityEvents()
        self.dispatchEvent(Object.assign(new CustomEvent('timeout'), {
          attempts: attempts,
          reconnects: reconnects
        }))
      }, opts.timeout)

      ;['open', 'close', 'message', 'error'].forEach(function(stdEvent) {
        realWs.addEventListener(stdEvent, function(event) {
          self.dispatchEvent(event)

          var cb = self['on' + stdEvent]
          if (typeof cb === 'function') {
            return cb.apply(self, arguments)
          }
        })
      })

      if (!opts.ignoreConnectivityEvents) {
        attachConnectivityEvents()
      }
    }

    if (opts.automaticOpen) {
      newWebSocket()
    }
  }

  RobustWebSocket.defaultOptions = {
    // the time to wait before a successful connection
    // before the attempt is considered to have timed out
    timeout: 4000,
    // Given a CloseEvent or OnlineEvent and the RobustWebSocket state,
    // should a reconnect be attempted? Return the number of milliseconds to wait
    // to reconnect (or null or undefined to not), rather than true or false
    shouldReconnect: function(event, ws) {
      if (event.code === 1008 || event.code === 1011) return
      return [0, 3000, 10000][ws.attempts]
    },

    // Flag to control whether attachement to navigator online/offline events
    // should be disabled.
    ignoreConnectivityEvents: false,

    // Create and connect the WebSocket when the instance is instantiated.
    // Defaults to true to match standard WebSocket behavior
    automaticOpen: true
  }

  RobustWebSocket.prototype.binaryType = 'blob'

  // Taken from MDN https://developer.mozilla.org/en-US/docs/Web/API/EventTarget
  RobustWebSocket.prototype.addEventListener = function(type, callback) {
    if (!(type in this.listeners)) {
      this.listeners[type] = []
    }
    this.listeners[type].push(callback)
  }

  RobustWebSocket.prototype.removeEventListener = function(type, callback) {
    if (!(type in this.listeners)) {
      return
    }
    var stack = this.listeners[type]
    for (var i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1)
        return
      }
    }
  }

  RobustWebSocket.prototype.dispatchEvent = function(event) {
    if (!(event.type in this.listeners)) {
      return
    }
    var stack = this.listeners[event.type]
    for (var i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, event)
    }
  }

  return RobustWebSocket
}, typeof window != 'undefined' ? window : (typeof __webpack_require__.g != 'undefined' ? __webpack_require__.g : this));


/***/ }),

/***/ "./src/js/common/dataMap.js":
/*!**********************************!*\
  !*** ./src/js/common/dataMap.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DATA_KEYS": () => (/* binding */ DATA_KEYS),
/* harmony export */   "WARNING_KEYS": () => (/* binding */ WARNING_KEYS),
/* harmony export */   "createDataStore": () => (/* binding */ createDataStore)
/* harmony export */ });
let key = 0;
const keygen = (reset = false) => {
  if (reset) key = 0;
  return key++;
};

const DATA_KEYS = {
  // Data From CAN BUS
  PEDAL_POSITION: keygen(),
  RPM: keygen(),
  RTC: keygen(),
  FUEL_PRESSURE: keygen(),
  SPEEDO: keygen(),
  INJECTOR_PULSEWIDTH: keygen(),
  FUEL_FLOW: keygen(),
  CLOSED_LOOP_STATUS: keygen(),
  DUTY_CYCLE: keygen(),
  AFR_LEFT: keygen(),
  CLOSED_LOOP_COMP: keygen(),
  AFR_RIGHT: keygen(),
  TARGET_AFR: keygen(),
  AFR_AVERAGE: keygen(),
  IGNITION_TIMING: keygen(),
  MAP: keygen(),
  KNOCK_RETARD: keygen(),
  MAT: keygen(),
  TPS: keygen(),
  BAR_PRESSURE: keygen(),
  CTS: keygen(),
  OIL_PRESSURE: keygen(),
  BATT_VOLTAGE: keygen(),

  // Data from GPS
  ODOMETER: keygen(),
  TRIP_ODOMETER: keygen(), //
  GPS_SPEEED: keygen(), //m
  // HEADING: keygen(),

  // Our Data
  WARNINGS: keygen(),
  FUEL_LEVEL: keygen(),
  CURRENT_MPG: keygen(),
  AVERAGE_MPG: keygen(),
  AVERAGE_MPG_POINTS: keygen(),
  AVERAGE_MPG_POINT_INDEX: keygen(),
  LOW_LIGHT_DETECTED: keygen(),

  //
  MAX_AVERAGE_POINTS: 100, // make sure this is the same as in PacketEntry.js
};

// Keys for handling the WARNINGS Structure
const WARNING_KEYS = {
  BATT_VOLTAGE: keygen(true), // voltage too low
  OIL_PRESSURE: keygen(), // pressure too low
  LOW_FUEL: keygen(),
  ENGINE_TEMPERATURE: keygen(), // temp too high
  ECU_COMM: keygen(), // trouble communicating with ECU via CAN
  GPS_NOT_ACQUIRED: keygen(), // no 2d/3d fix aqcuired yet
  GPS_ERROR: keygen(), // some sort of untracked error occurred
  COMM_ERROR: keygen(),
};

/**
 * Once Source of truth - keyed by DATA_KEYS
 * @returns
 */
const createDataStore = () => {
  let dataStore = [];
  for (const [_key, value] of Object.entries(DATA_KEYS)) {
    dataStore[value] = 0;
  }

  /**
   *
   * @param {*} key - key from DATA_KEYS
   * @returns
   */
  const getData = (key) => {
    return dataStore[key];
  };

  /**
   *
   * @param {*} warningMask - value from WARNING_KEYS
   * @returns {Boolean}
   */
  const getWarning = (warningMask) => {
    return !!(dataStore[DATA_KEYS.WARNINGS] & (128 >> warningMask % 8));
  };

  /**
   * 
   * @param {Number} key 
   * @param {*} data 
   */
  const setData = (key, data) => {
    dataStore[key] = data;
  };

  /**
   * 
   * @param {Number} bit 
   * @param {Boolean} value 
   */
  const setWarningBit = (bit, value) => {
    if (bit > 7) throw "I screwed up: error - bit field key cannot be > 7";
    if (value) {
      // set the bit
      dataStore[DATA_KEYS.WARNINGS] =
        dataStore[DATA_KEYS.WARNINGS] | (128 >> bit % 8);
    } else {
      // clear the bit
      dataStore[DATA_KEYS.WARNINGS] =
        dataStore[DATA_KEYS.WARNINGS] & ~(128 >> bit % 8);
    }
  };

  return {
    get: getData,
    getWarning: getWarning,
    set: setData,
    setWarning: setWarningBit,
    data: dataStore,
  };
};


/***/ }),

/***/ "./src/js/common/ringBuffer.js":
/*!*************************************!*\
  !*** ./src/js/common/ringBuffer.js ***!
  \*************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
// Queue of Uint8s
class RingBuffer {
    /**
   * @param {ArrayBuffer} buffer
   * @param {number} offset
   * @param {number} length
   * @param {number} frontOffset
   */
    constructor(buffer, offset, length, frontOffset) {
      this.buffer = new Uint8Array(buffer, offset, length);
      this.frontOffset = frontOffset;
      this.buffer = new Uint8Array([...(this.buffer.subarray(this.frontOffset)), ...(this.buffer.subarray(0, this.frontOffset))]);
    }

    get front() {
      return this.buffer[this.frontOffset];
    }
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (RingBuffer);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => (module['default']) :
/******/ 				() => (module);
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be in strict mode.
(() => {
"use strict";
/*!****************************************!*\
  !*** ./src/js/comms/drawDataWorker.js ***!
  \****************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var robust_websocket__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! robust-websocket */ "./node_modules/robust-websocket/robust-websocket.js");
/* harmony import */ var robust_websocket__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(robust_websocket__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _common_dataMap__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../common/dataMap */ "./src/js/common/dataMap.js");
/* harmony import */ var _common_ringBuffer__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../common/ringBuffer */ "./src/js/common/ringBuffer.js");
// https://github.com/nathanboktae/robust-websocket#usage




const dataStore = (0,_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.createDataStore)();

// Testing some data readouts
// dataStore.set(DATA_KEYS.RPM, 4500);
// const data = new Uint8Array(100);
// for(let i = 0; i < 100; i++){
//   data[i] = Math.random() * 25;
// }
// dataStore.set(DATA_KEYS.CURRENT_MPG, 12);
// dataStore.set(DATA_KEYS.AVERAGE_MPG, 6);
// dataStore.set(DATA_KEYS.GPS_SPEEED, 65);
// dataStore.set(DATA_KEYS.ODOMETER, 62636);
// dataStore.set(DATA_KEYS.AVERAGE_MPG_POINTS, new RingBuffer(data.buffer, 0, 100, 1));

(robust_websocket__WEBPACK_IMPORTED_MODULE_0___default().prototype.binaryType) = 'arraybuffer';
const createWS = () => {
  dataStore.setWarning(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.WARNING_KEYS.COMM_ERROR, true);
  let ws = new (robust_websocket__WEBPACK_IMPORTED_MODULE_0___default())("ws://localhost:3333", null, {
    timeout: 30000,
    shouldReconnect: () => 0,
    ignoreConnectivityEvents: false,
  });
  ws.addEventListener('open', function(event) {
    dataStore.setWarning(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.WARNING_KEYS.COMM_ERROR, false);
    // ws.send('Hello!')
  })
  ws.addEventListener('close', (event) => {
    dataStore.setWarning(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.WARNING_KEYS.COMM_ERROR, true);
  })
  ws.addEventListener('error', (event) => {
    dataStore.setWarning(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.WARNING_KEYS.COMM_ERROR, true);
  })

  ws.addEventListener("message", (/** @type {{ data: ArrayBuffer; }} */ evt) => parsePacket(evt));
  return ws;
};

/**
 * These Byte offsets MUST match PacketEntry.js from AutoDashBackEnd
 * @param {DataView} data 
 */
const parseData = (data) => {
  try {
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.PEDAL_POSITION, data.getInt8(0)); // xxx percent
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.RPM, data.getInt16(1));          // xx,xxx
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.FUEL_FLOW, data.getInt16(3));    // Fuel Flow  x,xxx pounds/hour
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.TARGET_AFR, data.getFloat32(5)); // xx.x A/F
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.AFR_AVERAGE, data.getFloat32(9));// xx.x A/F
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.IGNITION_TIMING, data.getFloat32(13)); // xx.x degrees
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.MAP, data.getInt16(17)); // xxx kPa
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.MAT, data.getInt16(19));// xxx F
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.CTS, data.getInt16(21));// xxx F
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.BAR_PRESSURE, data.getFloat32(23));// xxx.x kPa
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.OIL_PRESSURE, data.getInt16(27));// xxx   psi
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.BATT_VOLTAGE, data.getFloat32(29));// xx.x volts
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.WARNINGS, data.getUint8(33));

    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.ODOMETER, data.getInt16(34));
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.TRIP_ODOMETER, data.getInt16(36));//its gonna roll over early, lol - ill fix this at some point
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.GPS_SPEEED, data.getInt16(38));
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.FUEL_LEVEL, data.getInt8(40));
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.CURRENT_MPG, data.getFloat32(41));
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.AVERAGE_MPG, data.getFloat32(45));
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.AVERAGE_MPG_POINTS, new _common_ringBuffer__WEBPACK_IMPORTED_MODULE_2__["default"](data.buffer, 49, 100, data.getInt8(149)));
    dataStore.set(_common_dataMap__WEBPACK_IMPORTED_MODULE_1__.DATA_KEYS.LOW_LIGHT_DETECTED, data.getInt8(150));
  } catch (error) {
    console.error(error);
  }
}

const parsePacket = (/** @type {{ data: ArrayBuffer; }} */ event) => {
  parseData( new DataView(event.data));
};

let ws = null;
onmessage = (evt) => {
  switch (evt.data.msg) {
    case "start":
      ws = createWS();
      break;

    case "process_update_data":
      postMessage({ msg: "update_data_ready", updateData: dataStore.data });
      break;

    default:
      break;
  }
};

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3JjX2pzX2NvbW1zX2RyYXdEYXRhV29ya2VyX2pzLmJ1bmRsZS5qcyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQTtBQUNBLE1BQU0sSUFBMEM7QUFDaEQsSUFBSSxtQ0FBTztBQUNYO0FBQ0EsS0FBSztBQUFBLGtHQUFDO0FBQ04sSUFBSSxLQUFLLEVBS047QUFDSCxDQUFDOztBQUVEO0FBQ0EsbUJBQW1CLHNCQUFzQjtBQUN6QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLCtCQUErQjtBQUMvQjtBQUNBLGdEQUFnRCwrQkFBK0I7QUFDL0U7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EsMEJBQTBCO0FBQzFCLE9BQU87QUFDUCxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxTQUFTO0FBQ1Q7QUFDQTtBQUNBLEtBQUs7O0FBRUw7QUFDQSx3QkFBd0IsaUJBQWlCO0FBQ3pDO0FBQ0EsS0FBSzs7QUFFTDtBQUNBLHdCQUF3QixtQkFBbUI7QUFDM0M7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQSxPQUFPOztBQUVQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLFNBQVM7QUFDVCxPQUFPOztBQUVQLE9BQU87QUFDUDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsU0FBUztBQUNULE9BQU87O0FBRVA7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esc0NBQXNDLE9BQU87QUFDN0M7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxzQ0FBc0MsT0FBTztBQUM3QztBQUNBO0FBQ0E7O0FBRUE7QUFDQSxDQUFDLGtEQUFrRCxxQkFBTSxrQkFBa0IscUJBQU07Ozs7Ozs7Ozs7Ozs7Ozs7OztBQ25QakY7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFTztBQUNQO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ087QUFDUDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDTztBQUNQO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxhQUFhLEdBQUc7QUFDaEI7QUFD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QUNBO0FBQ0E7O0FBRUE7QUFDQSxvQkFBb0Isc0RBQXNEO0FBQzFFOztBQUVBO0FBQ0E7QUFDQTtBQUNBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vQXV0b0Rhc2hGcm9udEVuZC8uL25vZGVfbW9kdWxlcy9yb2J1c3Qtd2Vic29ja2V0L3JvYnVzdC13ZWJzb2NrZXQuanMiLCJ3ZWJwYWNrOi8vQXV0b0Rhc2hGcm9udEVuZC8uL3NyYy9qcy9jb21tb24vZGF0YU1hcC5qcyIsIndlYnBhY2s6Ly9BdXRvRGFzaEZyb250RW5kLy4vc3JjL2pzL2NvbW1vbi9yaW5nQnVmZmVyLmpzIiwid2VicGFjazovL0F1dG9EYXNoRnJvbnRFbmQvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vQXV0b0Rhc2hGcm9udEVuZC93ZWJwYWNrL3J1bnRpbWUvY29tcGF0IGdldCBkZWZhdWx0IGV4cG9ydCIsIndlYnBhY2s6Ly9BdXRvRGFzaEZyb250RW5kL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9BdXRvRGFzaEZyb250RW5kL3dlYnBhY2svcnVudGltZS9nbG9iYWwiLCJ3ZWJwYWNrOi8vQXV0b0Rhc2hGcm9udEVuZC93ZWJwYWNrL3J1bnRpbWUvaGFzT3duUHJvcGVydHkgc2hvcnRoYW5kIiwid2VicGFjazovL0F1dG9EYXNoRnJvbnRFbmQvd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9BdXRvRGFzaEZyb250RW5kLy4vc3JjL2pzL2NvbW1zL2RyYXdEYXRhV29ya2VyLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbihmYWN0b3J5LCBnbG9iYWwpIHtcbiAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgIGRlZmluZShmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBmYWN0b3J5KGdsb2JhbCwgbmF2aWdhdG9yKVxuICAgIH0pXG4gIH0gZWxzZSBpZiAodHlwZW9mIGV4cG9ydHMgPT09ICdvYmplY3QnICYmIHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnKSB7XG4gICAgbW9kdWxlLmV4cG9ydHMgPSBmYWN0b3J5KGdsb2JhbCwgbmF2aWdhdG9yKVxuICB9IGVsc2Uge1xuICAgIC8vIG1vY2sgdGhlIG5hdmlnYXRvciBvYmplY3Qgd2hlbiB1bmRlciB0ZXN0IHNpbmNlIGBuYXZpZ2F0b3Iub25MaW5lYCBpcyByZWFkIG9ubHlcbiAgICBnbG9iYWwuUm9idXN0V2ViU29ja2V0ID0gZmFjdG9yeShnbG9iYWwsIHR5cGVvZiBNb2NoYSAhPT0gJ3VuZGVmaW5lZCcgPyBNb2NoYSA6IG5hdmlnYXRvcilcbiAgfVxufSkoZnVuY3Rpb24oZ2xvYmFsLCBuYXZpZ2F0b3IpIHtcblxuICB2YXIgUm9idXN0V2ViU29ja2V0ID0gZnVuY3Rpb24odXJsLCBwcm90b2NvbHMsIHVzZXJPcHRpb25zKSB7XG4gICAgdmFyIHJlYWxXcyA9IHsgY2xvc2U6IGZ1bmN0aW9uKCkge30gfSxcbiAgICAgICAgY29ubmVjdFRpbWVvdXQsXG4gICAgICAgIHNlbGYgPSB0aGlzLFxuICAgICAgICBhdHRlbXB0cyA9IDAsXG4gICAgICAgIHJlY29ubmVjdHMgPSAtMSxcbiAgICAgICAgcmVjb25uZWN0V2hlbk9ubGluZUFnYWluID0gZmFsc2UsXG4gICAgICAgIGV4cGxpY2l0bHlDbG9zZWQgPSBmYWxzZSxcbiAgICAgICAgcGVuZGluZ1JlY29ubmVjdCxcbiAgICAgICAgb3B0cyA9IE9iamVjdC5hc3NpZ24oe30sXG4gICAgICAgICAgUm9idXN0V2ViU29ja2V0LmRlZmF1bHRPcHRpb25zLFxuICAgICAgICAgIHR5cGVvZiB1c2VyT3B0aW9ucyA9PT0gJ2Z1bmN0aW9uJyA/IHsgc2hvdWxkUmVjb25uZWN0OiB1c2VyT3B0aW9ucyB9IDogdXNlck9wdGlvbnNcbiAgICAgICAgKVxuXG4gICAgaWYgKHR5cGVvZiBvcHRzLnRpbWVvdXQgIT09ICdudW1iZXInKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3RpbWVvdXQgbXVzdCBiZSB0aGUgbnVtYmVyIG9mIG1pbGxpc2Vjb25kcyB0byB0aW1lb3V0IGEgY29ubmVjdGlvbiBhdHRlbXB0JylcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIG9wdHMuc2hvdWxkUmVjb25uZWN0ICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoJ3Nob3VsZFJlY29ubmVjdCBtdXN0IGJlIGEgZnVuY3Rpb24gdGhhdCByZXR1cm5zIHRoZSBudW1iZXIgb2YgbWlsbGlzZWNvbmRzIHRvIHdhaXQgZm9yIGEgcmVjb25uZWN0IGF0dGVtcHQsIG9yIG51bGwgb3IgdW5kZWZpbmVkIHRvIG5vdCByZWNvbm5lY3QuJylcbiAgICB9XG5cbiAgICBbJ2J1ZmZlcmVkQW1vdW50JywgJ3VybCcsICdyZWFkeVN0YXRlJywgJ3Byb3RvY29sJywgJ2V4dGVuc2lvbnMnXS5mb3JFYWNoKGZ1bmN0aW9uKHJlYWRPbmx5UHJvcCkge1xuICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHNlbGYsIHJlYWRPbmx5UHJvcCwge1xuICAgICAgICBnZXQ6IGZ1bmN0aW9uKCkgeyByZXR1cm4gcmVhbFdzW3JlYWRPbmx5UHJvcF0gfVxuICAgICAgfSlcbiAgICB9KVxuXG4gICAgZnVuY3Rpb24gY2xlYXJQZW5kaW5nUmVjb25uZWN0SWZOZWVkZWQoKSB7XG4gICAgICBpZiAocGVuZGluZ1JlY29ubmVjdCkge1xuICAgICAgICBjbGVhclRpbWVvdXQocGVuZGluZ1JlY29ubmVjdClcbiAgICAgICAgcGVuZGluZ1JlY29ubmVjdCA9IG51bGxcbiAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgb25vbmxpbmUgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKHJlY29ubmVjdFdoZW5PbmxpbmVBZ2Fpbikge1xuICAgICAgICBjbGVhclBlbmRpbmdSZWNvbm5lY3RJZk5lZWRlZCgpXG4gICAgICAgIHJlY29ubmVjdChldmVudClcbiAgICAgIH1cbiAgICB9LFxuICAgIG9ub2ZmbGluZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmVjb25uZWN0V2hlbk9ubGluZUFnYWluID0gdHJ1ZVxuICAgICAgcmVhbFdzLmNsb3NlKDEwMDApXG4gICAgfSxcbiAgICBjb25uZWN0aXZpdHlFdmVudHNBdHRhY2hlZCA9IGZhbHNlXG5cbiAgICBmdW5jdGlvbiBkZXRhY2hDb25uZWN0aXZpdHlFdmVudHMoKSB7XG4gICAgICBpZiAoY29ubmVjdGl2aXR5RXZlbnRzQXR0YWNoZWQpIHtcbiAgICAgICAgZ2xvYmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ29ubGluZScsIG9ub25saW5lKVxuICAgICAgICBnbG9iYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIG9ub2ZmbGluZSlcbiAgICAgICAgY29ubmVjdGl2aXR5RXZlbnRzQXR0YWNoZWQgPSBmYWxzZVxuICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGF0dGFjaENvbm5lY3Rpdml0eUV2ZW50cygpIHtcbiAgICAgIGlmICghY29ubmVjdGl2aXR5RXZlbnRzQXR0YWNoZWQpIHtcbiAgICAgICAgZ2xvYmFsLmFkZEV2ZW50TGlzdGVuZXIoJ29ubGluZScsIG9ub25saW5lKVxuICAgICAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignb2ZmbGluZScsIG9ub2ZmbGluZSlcbiAgICAgICAgY29ubmVjdGl2aXR5RXZlbnRzQXR0YWNoZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfVxuXG4gICAgc2VsZi5zZW5kID0gZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gcmVhbFdzLnNlbmQuYXBwbHkocmVhbFdzLCBhcmd1bWVudHMpXG4gICAgfVxuXG4gICAgc2VsZi5jbG9zZSA9IGZ1bmN0aW9uKGNvZGUsIHJlYXNvbikge1xuICAgICAgaWYgKHR5cGVvZiBjb2RlICE9PSAnbnVtYmVyJykge1xuICAgICAgICByZWFzb24gPSBjb2RlXG4gICAgICAgIGNvZGUgPSAxMDAwXG4gICAgICB9XG5cbiAgICAgIGNsZWFyUGVuZGluZ1JlY29ubmVjdElmTmVlZGVkKClcbiAgICAgIHJlY29ubmVjdFdoZW5PbmxpbmVBZ2FpbiA9IGZhbHNlXG4gICAgICBleHBsaWNpdGx5Q2xvc2VkID0gdHJ1ZVxuICAgICAgZGV0YWNoQ29ubmVjdGl2aXR5RXZlbnRzKClcblxuICAgICAgcmV0dXJuIHJlYWxXcy5jbG9zZShjb2RlLCByZWFzb24pXG4gICAgfVxuXG4gICAgc2VsZi5vcGVuID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAocmVhbFdzLnJlYWR5U3RhdGUgIT09IFdlYlNvY2tldC5PUEVOICYmIHJlYWxXcy5yZWFkeVN0YXRlICE9PSBXZWJTb2NrZXQuQ09OTkVDVElORykge1xuICAgICAgICBjbGVhclBlbmRpbmdSZWNvbm5lY3RJZk5lZWRlZCgpXG4gICAgICAgIHJlY29ubmVjdFdoZW5PbmxpbmVBZ2FpbiA9IGZhbHNlXG4gICAgICAgIGV4cGxpY2l0bHlDbG9zZWQgPSBmYWxzZVxuXG4gICAgICAgIG5ld1dlYlNvY2tldCgpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVjb25uZWN0KGV2ZW50KSB7XG4gICAgICBpZiAoKCFvcHRzLnNob3VsZFJlY29ubmVjdC5oYW5kbGUxMDAwICYmIGV2ZW50LmNvZGUgPT09IDEwMDApIHx8IGV4cGxpY2l0bHlDbG9zZWQpIHtcbiAgICAgICAgYXR0ZW1wdHMgPSAwXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgaWYgKG5hdmlnYXRvci5vbkxpbmUgPT09IGZhbHNlKSB7XG4gICAgICAgIHJlY29ubmVjdFdoZW5PbmxpbmVBZ2FpbiA9IHRydWVcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIHZhciBkZWxheSA9IG9wdHMuc2hvdWxkUmVjb25uZWN0KGV2ZW50LCBzZWxmKVxuICAgICAgaWYgKHR5cGVvZiBkZWxheSA9PT0gJ251bWJlcicpIHtcbiAgICAgICAgcGVuZGluZ1JlY29ubmVjdCA9IHNldFRpbWVvdXQobmV3V2ViU29ja2V0LCBkZWxheSlcbiAgICAgIH1cbiAgICB9XG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VsZiwgJ2xpc3RlbmVycycsIHtcbiAgICAgIHZhbHVlOiB7XG4gICAgICAgIG9wZW46IFtmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGlmIChjb25uZWN0VGltZW91dCkge1xuICAgICAgICAgICAgY2xlYXJUaW1lb3V0KGNvbm5lY3RUaW1lb3V0KVxuICAgICAgICAgICAgY29ubmVjdFRpbWVvdXQgPSBudWxsXG4gICAgICAgICAgfVxuICAgICAgICAgIGV2ZW50LnJlY29ubmVjdHMgPSArK3JlY29ubmVjdHNcbiAgICAgICAgICBldmVudC5hdHRlbXB0cyA9IGF0dGVtcHRzXG4gICAgICAgICAgYXR0ZW1wdHMgPSAwXG4gICAgICAgICAgcmVjb25uZWN0V2hlbk9ubGluZUFnYWluID0gZmFsc2VcbiAgICAgICAgfV0sXG4gICAgICAgIGNsb3NlOiBbcmVjb25uZWN0XVxuICAgICAgfVxuICAgIH0pXG5cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2VsZiwgJ2F0dGVtcHRzJywge1xuICAgICAgZ2V0OiBmdW5jdGlvbigpIHsgcmV0dXJuIGF0dGVtcHRzIH0sXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSlcblxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzZWxmLCAncmVjb25uZWN0cycsIHtcbiAgICAgIGdldDogZnVuY3Rpb24oKSB7IHJldHVybiByZWNvbm5lY3RzIH0sXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSlcblxuICAgIGZ1bmN0aW9uIG5ld1dlYlNvY2tldCgpIHtcbiAgICAgIHZhciBuZXdVcmwgPSAodHlwZW9mIHVybCA9PT0gJ2Z1bmN0aW9uJyA/IHVybChzZWxmKSA6IHVybCk7XG4gICAgICBwZW5kaW5nUmVjb25uZWN0ID0gbnVsbFxuICAgICAgcmVhbFdzID0gbmV3IFdlYlNvY2tldChuZXdVcmwsIHByb3RvY29scyB8fCB1bmRlZmluZWQpXG4gICAgICByZWFsV3MuYmluYXJ5VHlwZSA9IHNlbGYuYmluYXJ5VHlwZVxuXG4gICAgICBhdHRlbXB0cysrXG4gICAgICBzZWxmLmRpc3BhdGNoRXZlbnQoT2JqZWN0LmFzc2lnbihuZXcgQ3VzdG9tRXZlbnQoJ2Nvbm5lY3RpbmcnKSwge1xuICAgICAgICBhdHRlbXB0czogYXR0ZW1wdHMsXG4gICAgICAgIHJlY29ubmVjdHM6IHJlY29ubmVjdHNcbiAgICAgIH0pKVxuXG4gICAgICBjb25uZWN0VGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbm5lY3RUaW1lb3V0ID0gbnVsbFxuICAgICAgICBkZXRhY2hDb25uZWN0aXZpdHlFdmVudHMoKVxuICAgICAgICBzZWxmLmRpc3BhdGNoRXZlbnQoT2JqZWN0LmFzc2lnbihuZXcgQ3VzdG9tRXZlbnQoJ3RpbWVvdXQnKSwge1xuICAgICAgICAgIGF0dGVtcHRzOiBhdHRlbXB0cyxcbiAgICAgICAgICByZWNvbm5lY3RzOiByZWNvbm5lY3RzXG4gICAgICAgIH0pKVxuICAgICAgfSwgb3B0cy50aW1lb3V0KVxuXG4gICAgICA7WydvcGVuJywgJ2Nsb3NlJywgJ21lc3NhZ2UnLCAnZXJyb3InXS5mb3JFYWNoKGZ1bmN0aW9uKHN0ZEV2ZW50KSB7XG4gICAgICAgIHJlYWxXcy5hZGRFdmVudExpc3RlbmVyKHN0ZEV2ZW50LCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNlbGYuZGlzcGF0Y2hFdmVudChldmVudClcblxuICAgICAgICAgIHZhciBjYiA9IHNlbGZbJ29uJyArIHN0ZEV2ZW50XVxuICAgICAgICAgIGlmICh0eXBlb2YgY2IgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBjYi5hcHBseShzZWxmLCBhcmd1bWVudHMpXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgaWYgKCFvcHRzLmlnbm9yZUNvbm5lY3Rpdml0eUV2ZW50cykge1xuICAgICAgICBhdHRhY2hDb25uZWN0aXZpdHlFdmVudHMoKVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChvcHRzLmF1dG9tYXRpY09wZW4pIHtcbiAgICAgIG5ld1dlYlNvY2tldCgpXG4gICAgfVxuICB9XG5cbiAgUm9idXN0V2ViU29ja2V0LmRlZmF1bHRPcHRpb25zID0ge1xuICAgIC8vIHRoZSB0aW1lIHRvIHdhaXQgYmVmb3JlIGEgc3VjY2Vzc2Z1bCBjb25uZWN0aW9uXG4gICAgLy8gYmVmb3JlIHRoZSBhdHRlbXB0IGlzIGNvbnNpZGVyZWQgdG8gaGF2ZSB0aW1lZCBvdXRcbiAgICB0aW1lb3V0OiA0MDAwLFxuICAgIC8vIEdpdmVuIGEgQ2xvc2VFdmVudCBvciBPbmxpbmVFdmVudCBhbmQgdGhlIFJvYnVzdFdlYlNvY2tldCBzdGF0ZSxcbiAgICAvLyBzaG91bGQgYSByZWNvbm5lY3QgYmUgYXR0ZW1wdGVkPyBSZXR1cm4gdGhlIG51bWJlciBvZiBtaWxsaXNlY29uZHMgdG8gd2FpdFxuICAgIC8vIHRvIHJlY29ubmVjdCAob3IgbnVsbCBvciB1bmRlZmluZWQgdG8gbm90KSwgcmF0aGVyIHRoYW4gdHJ1ZSBvciBmYWxzZVxuICAgIHNob3VsZFJlY29ubmVjdDogZnVuY3Rpb24oZXZlbnQsIHdzKSB7XG4gICAgICBpZiAoZXZlbnQuY29kZSA9PT0gMTAwOCB8fCBldmVudC5jb2RlID09PSAxMDExKSByZXR1cm5cbiAgICAgIHJldHVybiBbMCwgMzAwMCwgMTAwMDBdW3dzLmF0dGVtcHRzXVxuICAgIH0sXG5cbiAgICAvLyBGbGFnIHRvIGNvbnRyb2wgd2hldGhlciBhdHRhY2hlbWVudCB0byBuYXZpZ2F0b3Igb25saW5lL29mZmxpbmUgZXZlbnRzXG4gICAgLy8gc2hvdWxkIGJlIGRpc2FibGVkLlxuICAgIGlnbm9yZUNvbm5lY3Rpdml0eUV2ZW50czogZmFsc2UsXG5cbiAgICAvLyBDcmVhdGUgYW5kIGNvbm5lY3QgdGhlIFdlYlNvY2tldCB3aGVuIHRoZSBpbnN0YW5jZSBpcyBpbnN0YW50aWF0ZWQuXG4gICAgLy8gRGVmYXVsdHMgdG8gdHJ1ZSB0byBtYXRjaCBzdGFuZGFyZCBXZWJTb2NrZXQgYmVoYXZpb3JcbiAgICBhdXRvbWF0aWNPcGVuOiB0cnVlXG4gIH1cblxuICBSb2J1c3RXZWJTb2NrZXQucHJvdG90eXBlLmJpbmFyeVR5cGUgPSAnYmxvYidcblxuICAvLyBUYWtlbiBmcm9tIE1ETiBodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9lbi1VUy9kb2NzL1dlYi9BUEkvRXZlbnRUYXJnZXRcbiAgUm9idXN0V2ViU29ja2V0LnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkge1xuICAgICAgdGhpcy5saXN0ZW5lcnNbdHlwZV0gPSBbXVxuICAgIH1cbiAgICB0aGlzLmxpc3RlbmVyc1t0eXBlXS5wdXNoKGNhbGxiYWNrKVxuICB9XG5cbiAgUm9idXN0V2ViU29ja2V0LnByb3RvdHlwZS5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24odHlwZSwgY2FsbGJhY2spIHtcbiAgICBpZiAoISh0eXBlIGluIHRoaXMubGlzdGVuZXJzKSkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuICAgIHZhciBzdGFjayA9IHRoaXMubGlzdGVuZXJzW3R5cGVdXG4gICAgZm9yICh2YXIgaSA9IDAsIGwgPSBzdGFjay5sZW5ndGg7IGkgPCBsOyBpKyspIHtcbiAgICAgIGlmIChzdGFja1tpXSA9PT0gY2FsbGJhY2spIHtcbiAgICAgICAgc3RhY2suc3BsaWNlKGksIDEpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIFJvYnVzdFdlYlNvY2tldC5wcm90b3R5cGUuZGlzcGF0Y2hFdmVudCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgaWYgKCEoZXZlbnQudHlwZSBpbiB0aGlzLmxpc3RlbmVycykpIHtcbiAgICAgIHJldHVyblxuICAgIH1cbiAgICB2YXIgc3RhY2sgPSB0aGlzLmxpc3RlbmVyc1tldmVudC50eXBlXVxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gc3RhY2subGVuZ3RoOyBpIDwgbDsgaSsrKSB7XG4gICAgICBzdGFja1tpXS5jYWxsKHRoaXMsIGV2ZW50KVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiBSb2J1c3RXZWJTb2NrZXRcbn0sIHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiAodHlwZW9mIGdsb2JhbCAhPSAndW5kZWZpbmVkJyA/IGdsb2JhbCA6IHRoaXMpKTtcbiIsImxldCBrZXkgPSAwO1xuY29uc3Qga2V5Z2VuID0gKHJlc2V0ID0gZmFsc2UpID0+IHtcbiAgaWYgKHJlc2V0KSBrZXkgPSAwO1xuICByZXR1cm4ga2V5Kys7XG59O1xuXG5leHBvcnQgY29uc3QgREFUQV9LRVlTID0ge1xuICAvLyBEYXRhIEZyb20gQ0FOIEJVU1xuICBQRURBTF9QT1NJVElPTjoga2V5Z2VuKCksXG4gIFJQTToga2V5Z2VuKCksXG4gIFJUQzoga2V5Z2VuKCksXG4gIEZVRUxfUFJFU1NVUkU6IGtleWdlbigpLFxuICBTUEVFRE86IGtleWdlbigpLFxuICBJTkpFQ1RPUl9QVUxTRVdJRFRIOiBrZXlnZW4oKSxcbiAgRlVFTF9GTE9XOiBrZXlnZW4oKSxcbiAgQ0xPU0VEX0xPT1BfU1RBVFVTOiBrZXlnZW4oKSxcbiAgRFVUWV9DWUNMRToga2V5Z2VuKCksXG4gIEFGUl9MRUZUOiBrZXlnZW4oKSxcbiAgQ0xPU0VEX0xPT1BfQ09NUDoga2V5Z2VuKCksXG4gIEFGUl9SSUdIVDoga2V5Z2VuKCksXG4gIFRBUkdFVF9BRlI6IGtleWdlbigpLFxuICBBRlJfQVZFUkFHRToga2V5Z2VuKCksXG4gIElHTklUSU9OX1RJTUlORzoga2V5Z2VuKCksXG4gIE1BUDoga2V5Z2VuKCksXG4gIEtOT0NLX1JFVEFSRDoga2V5Z2VuKCksXG4gIE1BVDoga2V5Z2VuKCksXG4gIFRQUzoga2V5Z2VuKCksXG4gIEJBUl9QUkVTU1VSRToga2V5Z2VuKCksXG4gIENUUzoga2V5Z2VuKCksXG4gIE9JTF9QUkVTU1VSRToga2V5Z2VuKCksXG4gIEJBVFRfVk9MVEFHRToga2V5Z2VuKCksXG5cbiAgLy8gRGF0YSBmcm9tIEdQU1xuICBPRE9NRVRFUjoga2V5Z2VuKCksXG4gIFRSSVBfT0RPTUVURVI6IGtleWdlbigpLCAvL1xuICBHUFNfU1BFRUVEOiBrZXlnZW4oKSwgLy9tXG4gIC8vIEhFQURJTkc6IGtleWdlbigpLFxuXG4gIC8vIE91ciBEYXRhXG4gIFdBUk5JTkdTOiBrZXlnZW4oKSxcbiAgRlVFTF9MRVZFTDoga2V5Z2VuKCksXG4gIENVUlJFTlRfTVBHOiBrZXlnZW4oKSxcbiAgQVZFUkFHRV9NUEc6IGtleWdlbigpLFxuICBBVkVSQUdFX01QR19QT0lOVFM6IGtleWdlbigpLFxuICBBVkVSQUdFX01QR19QT0lOVF9JTkRFWDoga2V5Z2VuKCksXG4gIExPV19MSUdIVF9ERVRFQ1RFRDoga2V5Z2VuKCksXG5cbiAgLy9cbiAgTUFYX0FWRVJBR0VfUE9JTlRTOiAxMDAsIC8vIG1ha2Ugc3VyZSB0aGlzIGlzIHRoZSBzYW1lIGFzIGluIFBhY2tldEVudHJ5LmpzXG59O1xuXG4vLyBLZXlzIGZvciBoYW5kbGluZyB0aGUgV0FSTklOR1MgU3RydWN0dXJlXG5leHBvcnQgY29uc3QgV0FSTklOR19LRVlTID0ge1xuICBCQVRUX1ZPTFRBR0U6IGtleWdlbih0cnVlKSwgLy8gdm9sdGFnZSB0b28gbG93XG4gIE9JTF9QUkVTU1VSRToga2V5Z2VuKCksIC8vIHByZXNzdXJlIHRvbyBsb3dcbiAgTE9XX0ZVRUw6IGtleWdlbigpLFxuICBFTkdJTkVfVEVNUEVSQVRVUkU6IGtleWdlbigpLCAvLyB0ZW1wIHRvbyBoaWdoXG4gIEVDVV9DT01NOiBrZXlnZW4oKSwgLy8gdHJvdWJsZSBjb21tdW5pY2F0aW5nIHdpdGggRUNVIHZpYSBDQU5cbiAgR1BTX05PVF9BQ1FVSVJFRDoga2V5Z2VuKCksIC8vIG5vIDJkLzNkIGZpeCBhcWN1aXJlZCB5ZXRcbiAgR1BTX0VSUk9SOiBrZXlnZW4oKSwgLy8gc29tZSBzb3J0IG9mIHVudHJhY2tlZCBlcnJvciBvY2N1cnJlZFxuICBDT01NX0VSUk9SOiBrZXlnZW4oKSxcbn07XG5cbi8qKlxuICogT25jZSBTb3VyY2Ugb2YgdHJ1dGggLSBrZXllZCBieSBEQVRBX0tFWVNcbiAqIEByZXR1cm5zXG4gKi9cbmV4cG9ydCBjb25zdCBjcmVhdGVEYXRhU3RvcmUgPSAoKSA9PiB7XG4gIGxldCBkYXRhU3RvcmUgPSBbXTtcbiAgZm9yIChjb25zdCBbX2tleSwgdmFsdWVdIG9mIE9iamVjdC5lbnRyaWVzKERBVEFfS0VZUykpIHtcbiAgICBkYXRhU3RvcmVbdmFsdWVdID0gMDtcbiAgfVxuXG4gIC8qKlxuICAgKlxuICAgKiBAcGFyYW0geyp9IGtleSAtIGtleSBmcm9tIERBVEFfS0VZU1xuICAgKiBAcmV0dXJuc1xuICAgKi9cbiAgY29uc3QgZ2V0RGF0YSA9IChrZXkpID0+IHtcbiAgICByZXR1cm4gZGF0YVN0b3JlW2tleV07XG4gIH07XG5cbiAgLyoqXG4gICAqXG4gICAqIEBwYXJhbSB7Kn0gd2FybmluZ01hc2sgLSB2YWx1ZSBmcm9tIFdBUk5JTkdfS0VZU1xuICAgKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAgICovXG4gIGNvbnN0IGdldFdhcm5pbmcgPSAod2FybmluZ01hc2spID0+IHtcbiAgICByZXR1cm4gISEoZGF0YVN0b3JlW0RBVEFfS0VZUy5XQVJOSU5HU10gJiAoMTI4ID4+IHdhcm5pbmdNYXNrICUgOCkpO1xuICB9O1xuXG4gIC8qKlxuICAgKiBcbiAgICogQHBhcmFtIHtOdW1iZXJ9IGtleSBcbiAgICogQHBhcmFtIHsqfSBkYXRhIFxuICAgKi9cbiAgY29uc3Qgc2V0RGF0YSA9IChrZXksIGRhdGEpID0+IHtcbiAgICBkYXRhU3RvcmVba2V5XSA9IGRhdGE7XG4gIH07XG5cbiAgLyoqXG4gICAqIFxuICAgKiBAcGFyYW0ge051bWJlcn0gYml0IFxuICAgKiBAcGFyYW0ge0Jvb2xlYW59IHZhbHVlIFxuICAgKi9cbiAgY29uc3Qgc2V0V2FybmluZ0JpdCA9IChiaXQsIHZhbHVlKSA9PiB7XG4gICAgaWYgKGJpdCA+IDcpIHRocm93IFwiSSBzY3Jld2VkIHVwOiBlcnJvciAtIGJpdCBmaWVsZCBrZXkgY2Fubm90IGJlID4gN1wiO1xuICAgIGlmICh2YWx1ZSkge1xuICAgICAgLy8gc2V0IHRoZSBiaXRcbiAgICAgIGRhdGFTdG9yZVtEQVRBX0tFWVMuV0FSTklOR1NdID1cbiAgICAgICAgZGF0YVN0b3JlW0RBVEFfS0VZUy5XQVJOSU5HU10gfCAoMTI4ID4+IGJpdCAlIDgpO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBjbGVhciB0aGUgYml0XG4gICAgICBkYXRhU3RvcmVbREFUQV9LRVlTLldBUk5JTkdTXSA9XG4gICAgICAgIGRhdGFTdG9yZVtEQVRBX0tFWVMuV0FSTklOR1NdICYgfigxMjggPj4gYml0ICUgOCk7XG4gICAgfVxuICB9O1xuXG4gIHJldHVybiB7XG4gICAgZ2V0OiBnZXREYXRhLFxuICAgIGdldFdhcm5pbmc6IGdldFdhcm5pbmcsXG4gICAgc2V0OiBzZXREYXRhLFxuICAgIHNldFdhcm5pbmc6IHNldFdhcm5pbmdCaXQsXG4gICAgZGF0YTogZGF0YVN0b3JlLFxuICB9O1xufTtcbiIsIi8vIFF1ZXVlIG9mIFVpbnQ4c1xuY2xhc3MgUmluZ0J1ZmZlciB7XG4gICAgLyoqXG4gICAqIEBwYXJhbSB7QXJyYXlCdWZmZXJ9IGJ1ZmZlclxuICAgKiBAcGFyYW0ge251bWJlcn0gb2Zmc2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBsZW5ndGhcbiAgICogQHBhcmFtIHtudW1iZXJ9IGZyb250T2Zmc2V0XG4gICAqL1xuICAgIGNvbnN0cnVjdG9yKGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgsIGZyb250T2Zmc2V0KSB7XG4gICAgICB0aGlzLmJ1ZmZlciA9IG5ldyBVaW50OEFycmF5KGJ1ZmZlciwgb2Zmc2V0LCBsZW5ndGgpO1xuICAgICAgdGhpcy5mcm9udE9mZnNldCA9IGZyb250T2Zmc2V0O1xuICAgICAgdGhpcy5idWZmZXIgPSBuZXcgVWludDhBcnJheShbLi4uKHRoaXMuYnVmZmVyLnN1YmFycmF5KHRoaXMuZnJvbnRPZmZzZXQpKSwgLi4uKHRoaXMuYnVmZmVyLnN1YmFycmF5KDAsIHRoaXMuZnJvbnRPZmZzZXQpKV0pO1xuICAgIH1cblxuICAgIGdldCBmcm9udCgpIHtcbiAgICAgIHJldHVybiB0aGlzLmJ1ZmZlclt0aGlzLmZyb250T2Zmc2V0XTtcbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJpbmdCdWZmZXI7IiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0dmFyIGNhY2hlZE1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF07XG5cdGlmIChjYWNoZWRNb2R1bGUgIT09IHVuZGVmaW5lZCkge1xuXHRcdHJldHVybiBjYWNoZWRNb2R1bGUuZXhwb3J0cztcblx0fVxuXHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuXHR2YXIgbW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSA9IHtcblx0XHQvLyBubyBtb2R1bGUuaWQgbmVlZGVkXG5cdFx0Ly8gbm8gbW9kdWxlLmxvYWRlZCBuZWVkZWRcblx0XHRleHBvcnRzOiB7fVxuXHR9O1xuXG5cdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuXHRfX3dlYnBhY2tfbW9kdWxlc19fW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuXHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuXHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG59XG5cbiIsIi8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSAobW9kdWxlKSA9PiB7XG5cdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuXHRcdCgpID0+IChtb2R1bGVbJ2RlZmF1bHQnXSkgOlxuXHRcdCgpID0+IChtb2R1bGUpO1xuXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCB7IGE6IGdldHRlciB9KTtcblx0cmV0dXJuIGdldHRlcjtcbn07IiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5nID0gKGZ1bmN0aW9uKCkge1xuXHRpZiAodHlwZW9mIGdsb2JhbFRoaXMgPT09ICdvYmplY3QnKSByZXR1cm4gZ2xvYmFsVGhpcztcblx0dHJ5IHtcblx0XHRyZXR1cm4gdGhpcyB8fCBuZXcgRnVuY3Rpb24oJ3JldHVybiB0aGlzJykoKTtcblx0fSBjYXRjaCAoZSkge1xuXHRcdGlmICh0eXBlb2Ygd2luZG93ID09PSAnb2JqZWN0JykgcmV0dXJuIHdpbmRvdztcblx0fVxufSkoKTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gaHR0cHM6Ly9naXRodWIuY29tL25hdGhhbmJva3RhZS9yb2J1c3Qtd2Vic29ja2V0I3VzYWdlXG5pbXBvcnQgUm9idXN0V2ViU29ja2V0IGZyb20gXCJyb2J1c3Qtd2Vic29ja2V0XCI7XG5pbXBvcnQgeyBjcmVhdGVEYXRhU3RvcmUsIERBVEFfS0VZUywgV0FSTklOR19LRVlTIH0gZnJvbSBcIi4uL2NvbW1vbi9kYXRhTWFwXCI7XG5pbXBvcnQgUmluZ0J1ZmZlciBmcm9tIFwiLi4vY29tbW9uL3JpbmdCdWZmZXJcIjtcblxuY29uc3QgZGF0YVN0b3JlID0gY3JlYXRlRGF0YVN0b3JlKCk7XG5cbi8vIFRlc3Rpbmcgc29tZSBkYXRhIHJlYWRvdXRzXG4vLyBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5SUE0sIDQ1MDApO1xuLy8gY29uc3QgZGF0YSA9IG5ldyBVaW50OEFycmF5KDEwMCk7XG4vLyBmb3IobGV0IGkgPSAwOyBpIDwgMTAwOyBpKyspe1xuLy8gICBkYXRhW2ldID0gTWF0aC5yYW5kb20oKSAqIDI1O1xuLy8gfVxuLy8gZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuQ1VSUkVOVF9NUEcsIDEyKTtcbi8vIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLkFWRVJBR0VfTVBHLCA2KTtcbi8vIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLkdQU19TUEVFRUQsIDY1KTtcbi8vIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLk9ET01FVEVSLCA2MjYzNik7XG4vLyBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5BVkVSQUdFX01QR19QT0lOVFMsIG5ldyBSaW5nQnVmZmVyKGRhdGEuYnVmZmVyLCAwLCAxMDAsIDEpKTtcblxuUm9idXN0V2ViU29ja2V0LnByb3RvdHlwZS5iaW5hcnlUeXBlID0gJ2FycmF5YnVmZmVyJztcbmNvbnN0IGNyZWF0ZVdTID0gKCkgPT4ge1xuICBkYXRhU3RvcmUuc2V0V2FybmluZyhXQVJOSU5HX0tFWVMuQ09NTV9FUlJPUiwgdHJ1ZSk7XG4gIGxldCB3cyA9IG5ldyBSb2J1c3RXZWJTb2NrZXQoXCJ3czovL2xvY2FsaG9zdDozMzMzXCIsIG51bGwsIHtcbiAgICB0aW1lb3V0OiAzMDAwMCxcbiAgICBzaG91bGRSZWNvbm5lY3Q6ICgpID0+IDAsXG4gICAgaWdub3JlQ29ubmVjdGl2aXR5RXZlbnRzOiBmYWxzZSxcbiAgfSk7XG4gIHdzLmFkZEV2ZW50TGlzdGVuZXIoJ29wZW4nLCBmdW5jdGlvbihldmVudCkge1xuICAgIGRhdGFTdG9yZS5zZXRXYXJuaW5nKFdBUk5JTkdfS0VZUy5DT01NX0VSUk9SLCBmYWxzZSk7XG4gICAgLy8gd3Muc2VuZCgnSGVsbG8hJylcbiAgfSlcbiAgd3MuYWRkRXZlbnRMaXN0ZW5lcignY2xvc2UnLCAoZXZlbnQpID0+IHtcbiAgICBkYXRhU3RvcmUuc2V0V2FybmluZyhXQVJOSU5HX0tFWVMuQ09NTV9FUlJPUiwgdHJ1ZSk7XG4gIH0pXG4gIHdzLmFkZEV2ZW50TGlzdGVuZXIoJ2Vycm9yJywgKGV2ZW50KSA9PiB7XG4gICAgZGF0YVN0b3JlLnNldFdhcm5pbmcoV0FSTklOR19LRVlTLkNPTU1fRVJST1IsIHRydWUpO1xuICB9KVxuXG4gIHdzLmFkZEV2ZW50TGlzdGVuZXIoXCJtZXNzYWdlXCIsICgvKiogQHR5cGUge3sgZGF0YTogQXJyYXlCdWZmZXI7IH19ICovIGV2dCkgPT4gcGFyc2VQYWNrZXQoZXZ0KSk7XG4gIHJldHVybiB3cztcbn07XG5cbi8qKlxuICogVGhlc2UgQnl0ZSBvZmZzZXRzIE1VU1QgbWF0Y2ggUGFja2V0RW50cnkuanMgZnJvbSBBdXRvRGFzaEJhY2tFbmRcbiAqIEBwYXJhbSB7RGF0YVZpZXd9IGRhdGEgXG4gKi9cbmNvbnN0IHBhcnNlRGF0YSA9IChkYXRhKSA9PiB7XG4gIHRyeSB7XG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuUEVEQUxfUE9TSVRJT04sIGRhdGEuZ2V0SW50OCgwKSk7IC8vIHh4eCBwZXJjZW50XG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuUlBNLCBkYXRhLmdldEludDE2KDEpKTsgICAgICAgICAgLy8geHgseHh4XG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuRlVFTF9GTE9XLCBkYXRhLmdldEludDE2KDMpKTsgICAgLy8gRnVlbCBGbG93ICB4LHh4eCBwb3VuZHMvaG91clxuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLlRBUkdFVF9BRlIsIGRhdGEuZ2V0RmxvYXQzMig1KSk7IC8vIHh4LnggQS9GXG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuQUZSX0FWRVJBR0UsIGRhdGEuZ2V0RmxvYXQzMig5KSk7Ly8geHgueCBBL0ZcbiAgICBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5JR05JVElPTl9USU1JTkcsIGRhdGEuZ2V0RmxvYXQzMigxMykpOyAvLyB4eC54IGRlZ3JlZXNcbiAgICBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5NQVAsIGRhdGEuZ2V0SW50MTYoMTcpKTsgLy8geHh4IGtQYVxuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLk1BVCwgZGF0YS5nZXRJbnQxNigxOSkpOy8vIHh4eCBGXG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuQ1RTLCBkYXRhLmdldEludDE2KDIxKSk7Ly8geHh4IEZcbiAgICBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5CQVJfUFJFU1NVUkUsIGRhdGEuZ2V0RmxvYXQzMigyMykpOy8vIHh4eC54IGtQYVxuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLk9JTF9QUkVTU1VSRSwgZGF0YS5nZXRJbnQxNigyNykpOy8vIHh4eCAgIHBzaVxuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLkJBVFRfVk9MVEFHRSwgZGF0YS5nZXRGbG9hdDMyKDI5KSk7Ly8geHgueCB2b2x0c1xuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLldBUk5JTkdTLCBkYXRhLmdldFVpbnQ4KDMzKSk7XG5cbiAgICBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5PRE9NRVRFUiwgZGF0YS5nZXRJbnQxNigzNCkpO1xuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLlRSSVBfT0RPTUVURVIsIGRhdGEuZ2V0SW50MTYoMzYpKTsvL2l0cyBnb25uYSByb2xsIG92ZXIgZWFybHksIGxvbCAtIGlsbCBmaXggdGhpcyBhdCBzb21lIHBvaW50XG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuR1BTX1NQRUVFRCwgZGF0YS5nZXRJbnQxNigzOCkpO1xuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLkZVRUxfTEVWRUwsIGRhdGEuZ2V0SW50OCg0MCkpO1xuICAgIGRhdGFTdG9yZS5zZXQoREFUQV9LRVlTLkNVUlJFTlRfTVBHLCBkYXRhLmdldEZsb2F0MzIoNDEpKTtcbiAgICBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5BVkVSQUdFX01QRywgZGF0YS5nZXRGbG9hdDMyKDQ1KSk7XG4gICAgZGF0YVN0b3JlLnNldChEQVRBX0tFWVMuQVZFUkFHRV9NUEdfUE9JTlRTLCBuZXcgUmluZ0J1ZmZlcihkYXRhLmJ1ZmZlciwgNDksIDEwMCwgZGF0YS5nZXRJbnQ4KDE0OSkpKTtcbiAgICBkYXRhU3RvcmUuc2V0KERBVEFfS0VZUy5MT1dfTElHSFRfREVURUNURUQsIGRhdGEuZ2V0SW50OCgxNTApKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgfVxufVxuXG5jb25zdCBwYXJzZVBhY2tldCA9ICgvKiogQHR5cGUge3sgZGF0YTogQXJyYXlCdWZmZXI7IH19ICovIGV2ZW50KSA9PiB7XG4gIHBhcnNlRGF0YSggbmV3IERhdGFWaWV3KGV2ZW50LmRhdGEpKTtcbn07XG5cbmxldCB3cyA9IG51bGw7XG5vbm1lc3NhZ2UgPSAoZXZ0KSA9PiB7XG4gIHN3aXRjaCAoZXZ0LmRhdGEubXNnKSB7XG4gICAgY2FzZSBcInN0YXJ0XCI6XG4gICAgICB3cyA9IGNyZWF0ZVdTKCk7XG4gICAgICBicmVhaztcblxuICAgIGNhc2UgXCJwcm9jZXNzX3VwZGF0ZV9kYXRhXCI6XG4gICAgICBwb3N0TWVzc2FnZSh7IG1zZzogXCJ1cGRhdGVfZGF0YV9yZWFkeVwiLCB1cGRhdGVEYXRhOiBkYXRhU3RvcmUuZGF0YSB9KTtcbiAgICAgIGJyZWFrO1xuXG4gICAgZGVmYXVsdDpcbiAgICAgIGJyZWFrO1xuICB9XG59O1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9