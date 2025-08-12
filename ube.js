var library = (function (exports, $$1) {
    'use strict';

    function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

    var $__default = /*#__PURE__*/_interopDefaultLegacy($$1);

    /**
     * Tests user agent using regex
     * @param {RegExp} regex
     * @returns {boolean}
     */
    function testUserAgent(regex) {
      return navigator && navigator.userAgent && regex && regex.test(navigator.userAgent);
    }
    var isAppleDevice = testUserAgent(/(ipod|iphone|ipad)/i);
    var isAndroid = testUserAgent(/android/i);
    var isNoCameraStream = testUserAgent(/(XiaoMi|MiuiBrowser|YaSearch|YaApp)/i);
    var detectDeviceScreen = function detectDeviceScreen() {
      if (window.screen && window.screen.width && window.screen.height) {
        return window.screen.width + "X" + window.screen.height;
      }
    };

    $__default["default"].fn.ubeAutocomplete = function (opts) {
      var field = $__default["default"](this);
      var defaultAutocompleteOpts = {
        minLength: 1,
        open: function open(result) {
          if (isAppleDevice) $__default["default"]('.ui-autocomplete').off('menufocus hover mouseover');
          if (opts.classes && opts.classes["ui-autocomplete"] && opts.classes["ui-autocomplete"] == 'max-height') {
            $__default["default"]('.ui-autocomplete.max-height').css({
              maxHeight: '250px',
              overflowY: 'scroll'
            });
          }
        }
      };
      var overrideOptions = {};
      var position = $__default["default"](this).attr("data-position");
      if (position !== "off") {
        defaultAutocompleteOpts.position = position === "top" ? {
          my: "left bottom",
          at: "left top",
          collision: "flip"
        } : {
          my: "left top",
          at: "left bottom",
          collision: "flip"
        };
      }
      var appendToTarget = $__default["default"](this).attr("data-target") ? $__default["default"]($__default["default"](this).attr("data-target")) : $__default["default"](this).closest("form");
      if (appendToTarget && appendToTarget.length === 1) defaultAutocompleteOpts.appendTo = appendToTarget;
      function setDataSource(source) {
        field.data("source", source);
      }

      //UBE-787 Set data source on response
      if (opts.source) {
        if (Array.isArray(opts.source)) setDataSource(opts.source);else if (typeof opts.source === "function") {
          overrideOptions.source = function (request, response) {
            opts.source(request, function (result) {
              setDataSource(result);
              response(result);
            });
          };
        }
      }
      return $__default["default"](this).autocomplete($__default["default"].extend(defaultAutocompleteOpts, opts, overrideOptions)).disableBrowserAutocomplete();
    };

    function ubeHostFallBack() {
      if (!$.ube) $.ube = {};
      if (!$.ube.host) {
        $.ube.host = "https://ube-test.pmsm.org.ru";
      }
      if (!$.ube.leadHost) {
        $.ube.leadHost = "https://preprod-lead.pmsm.org.ru";
      }
    }
    function ubeHostAdd(formName) {
      if ((typeof formName === 'string' || formName instanceof String) && formName && !/^http(s)?:\/\//.test(formName) && !/\//.test(formName) && /-/.test(formName) && formName.length < 64) {
        ubeHostFallBack();
        return $.ube.host + "/form/" + formName;
      } else {
        return formName;
      }
    }

    function toggleLoader(visible) {
      console.log("UBE Toggle loader " + visible);
      if ($.ube.toggleLoader) $.ube.toggleLoader(visible);
    }

    (function () {
      var sendRequest = function sendRequest(apiUrl, type, data, callback) {
        toggleLoader(true);
        return $__default["default"].ajax(apiUrl, {
          type: type,
          data: data,
          contentType: "application/json"
        }).done(function (response) {
          toggleLoader(false);
          console.log('UBE :: Successful request to ' + apiUrl + ' with response:', response);
          $__default["default"]('#qr-reader').remove();
          if (callback) callback(response);
        }).fail(function (error) {
          toggleLoader(false);
          console.log('UBE :: Request to ' + apiUrl + ' failed with error:', error);
        });
      };
      $__default["default"].fn.ubeCamera = function (name, options) {
        var container = $__default["default"](this).first();
        var form = container.find("form");
        var getPhotoBase64 = options.getPhotoBase64;
        ubeHostFallBack();
        function initCamera() {
          container.find(".ube-visibility-show-for-method, .ube-visibility-show-for-megafonMethod, .ube-visibility-show-for-documentMethod, .ube-visibility-show-for-faceMethod").hide();
          container.find(".ube-visibility-show-for-camera").show();
          initializeCameraCapture();
        }
        function initializeCameraCapture() {
          $__default["default"](".ube-camera-error").hide();
          $__default["default"](".ube-camera-container").show();
          var renderContainer = container.find(".ube-camera-container");
          var renderTarget = container.find(".ube-camera-render");
          var captureButton = container.find(".ube-camera-capture");
          var fallbackTarget = container.find(".ube-camera-fallback");
          if (renderTarget.data("init")) return false;
          renderTarget.data("init", true);
          function renderCameraCapture() {
            if (isNoCameraStream) return renderFileUpload();
            fallbackTarget.hide();
            renderTarget.html("<video></video>").show();
            renderContainer.addClass("ube-camera-option-capture").removeClass("ube-camera-option-upload");
            var video = renderTarget.find("video")[0];
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              video.setAttribute('autoplay', '');
              video.setAttribute('muted', '');
              video.setAttribute('playsinline', '');
              var constraints = {
                audio: false,
                video: {
                  facingMode: 'environment'
                }
              };
              var stopVideoCapture = function stopVideoCapture() {
                console.log("stopVideoCapture()");
                video.pause();
                video.src = "";
                if (video.srcObject) {
                  video.srcObject.getTracks().forEach(function (track) {
                    track.stop();
                  });
                }
                renderTarget.html("");
                renderTarget.data("init", false);
              };
              form.on("stopVideoCapture", function () {
                console.log("Handling stop function");
                stopVideoCapture();
              });
              navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                video.srcObject = stream;
                console.log("Video capture init success");
                captureButton.off("click").click(function (e) {
                  e.preventDefault();
                  var canvas = $__default["default"]("<canvas style='visibility:hidden;display:block;position: absolute;top:-2000px;left:-2000px'></canvas>").appendTo("body")[0];
                  console.log("Capturing video");
                  console.log(canvas.width);
                  console.log(canvas.height);
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  canvas.getContext('2d').drawImage(video, 0, 0);
                  // Other browsers will fall back to image/png

                  var imageData = canvas.toDataURL('image/png');
                  console.log("Image data:");
                  console.log(imageData);
                  if (getPhotoBase64) {
                    getPhotoBase64(imageData);
                  }
                  return false;
                });
              })["catch"](function (e) {
                console.log("Capture video error 1");
                renderFileUpload();
              });
            } else {
              console.log("Capture video error 2");
              renderFileUpload();
            }
          }
          function renderFileUpload() {
            renderContainer.removeClass("ube-camera-option-capture").addClass("ube-camera-option-upload");
            fallbackTarget.show();
            renderTarget.hide();
            var dummyFile = $__default["default"]("<input type=\"file\" accept=\"image/*\" capture=\"user\" style='width:0;height:0;position:absolute;'/>").appendTo("body");
            dummyFile.off("change").change(function () {
              console.log("File field changed");
              var reader = new FileReader();
              reader.addEventListener("load", function () {
                var imageData = this.result;
                console.log("Image data:");
                console.log(imageData);
                if (getPhotoBase64) {
                  getPhotoBase64(imageData);
                }
                dummyFile.val("");
                dummyFile.wrap('<form>').closest('form').get(0).reset();
                dummyFile.unwrap();
              }, false);
              reader.readAsDataURL(this.files[0]);
            });
            captureButton.add(".ube-camera-option-upload").off("click").click(function (e) {
              console.log("Capture upload clicked");
              e.preventDefault();
              dummyFile.click();
              return false;
            });
          }
          renderCameraCapture();
        }
        initCamera();
      };
      $__default["default"].fn.ubeCapture = function (entity, sessionKey, options, callback) {
        console.log(options);
        var fps = options.fps,
          boxSize = options.boxSize,
          _options$type = options.type,
          type = _options$type === void 0 ? 'recognition' : _options$type;
        var container = $__default["default"](this);
        container.html('<div id="qr-reader"></div>');
        var html5QrCode = new Html5Qrcode("qr-reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats.DATA_MATRIX]
        });
        var qrCodeSuccessCallback = function qrCodeSuccessCallback(decodedText) {
          console.log(decodedText);
          html5QrCode.stop();
          $__default["default"]('.ube-capture-canvas').html('');
          $__default["default"]('.ube-capture-result').html('Результат сканирования:<br>' + decodedText);
          var data;
          switch (type) {
            case 'bind':
              data = JSON.stringify({
                sessionKey: sessionKey,
                serial: decodedText,
                data: {
                  entity: entity
                }
              });
              sendRequest("".concat($__default["default"].ube.host, "/api/session/device/bind"), 'POST', data, callback);
              break;
            case 'recognition':
              data = JSON.stringify({
                decodedMatrix: decodedText
              });
              //TODO получить URL API проверки DataMatrix
              if (callback) callback({
                status: 'success',
                label: 'Распознавание Data Matrix',
                message: 'Успешно распознано',
                decodedText: decodedText
              });
              break;
          }
        };
        var config = {
          fps: fps,
          qrbox: boxSize
        };
        html5QrCode.start({
          facingMode: 'environment'
        }, config, qrCodeSuccessCallback);
      };
    })();

    function _arrayLikeToArray(r, a) {
      (null == a || a > r.length) && (a = r.length);
      for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
      return n;
    }
    function _arrayWithHoles(r) {
      if (Array.isArray(r)) return r;
    }
    function _arrayWithoutHoles(r) {
      if (Array.isArray(r)) return _arrayLikeToArray(r);
    }
    function _assertClassBrand(e, t, n) {
      if ("function" == typeof e ? e === t : e.has(t)) return arguments.length < 3 ? t : n;
      throw new TypeError("Private element is not present on this object");
    }
    function _assertThisInitialized(e) {
      if (void 0 === e) throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
      return e;
    }
    function asyncGeneratorStep(n, t, e, r, o, a, c) {
      try {
        var i = n[a](c),
          u = i.value;
      } catch (n) {
        return void e(n);
      }
      i.done ? t(u) : Promise.resolve(u).then(r, o);
    }
    function _asyncToGenerator(n) {
      return function () {
        var t = this,
          e = arguments;
        return new Promise(function (r, o) {
          var a = n.apply(t, e);
          function _next(n) {
            asyncGeneratorStep(a, r, o, _next, _throw, "next", n);
          }
          function _throw(n) {
            asyncGeneratorStep(a, r, o, _next, _throw, "throw", n);
          }
          _next(void 0);
        });
      };
    }
    function _callSuper(t, o, e) {
      return o = _getPrototypeOf(o), _possibleConstructorReturn(t, _isNativeReflectConstruct() ? Reflect.construct(o, e || [], _getPrototypeOf(t).constructor) : o.apply(t, e));
    }
    function _checkPrivateRedeclaration(e, t) {
      if (t.has(e)) throw new TypeError("Cannot initialize the same private elements twice on an object");
    }
    function _classCallCheck(a, n) {
      if (!(a instanceof n)) throw new TypeError("Cannot call a class as a function");
    }
    function _classPrivateFieldGet2(s, a) {
      return s.get(_assertClassBrand(s, a));
    }
    function _classPrivateFieldInitSpec(e, t, a) {
      _checkPrivateRedeclaration(e, t), t.set(e, a);
    }
    function _classPrivateFieldSet2(s, a, r) {
      return s.set(_assertClassBrand(s, a), r), r;
    }
    function _defineProperties(e, r) {
      for (var t = 0; t < r.length; t++) {
        var o = r[t];
        o.enumerable = o.enumerable || !1, o.configurable = !0, "value" in o && (o.writable = !0), Object.defineProperty(e, _toPropertyKey(o.key), o);
      }
    }
    function _createClass(e, r, t) {
      return r && _defineProperties(e.prototype, r), t && _defineProperties(e, t), Object.defineProperty(e, "prototype", {
        writable: !1
      }), e;
    }
    function _defineProperty(e, r, t) {
      return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, {
        value: t,
        enumerable: !0,
        configurable: !0,
        writable: !0
      }) : e[r] = t, e;
    }
    function _getPrototypeOf(t) {
      return _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf.bind() : function (t) {
        return t.__proto__ || Object.getPrototypeOf(t);
      }, _getPrototypeOf(t);
    }
    function _inherits(t, e) {
      if ("function" != typeof e && null !== e) throw new TypeError("Super expression must either be null or a function");
      t.prototype = Object.create(e && e.prototype, {
        constructor: {
          value: t,
          writable: !0,
          configurable: !0
        }
      }), Object.defineProperty(t, "prototype", {
        writable: !1
      }), e && _setPrototypeOf(t, e);
    }
    function _isNativeReflectConstruct() {
      try {
        var t = !Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
      } catch (t) {}
      return (_isNativeReflectConstruct = function () {
        return !!t;
      })();
    }
    function _iterableToArray(r) {
      if ("undefined" != typeof Symbol && null != r[Symbol.iterator] || null != r["@@iterator"]) return Array.from(r);
    }
    function _iterableToArrayLimit(r, l) {
      var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
      if (null != t) {
        var e,
          n,
          i,
          u,
          a = [],
          f = !0,
          o = !1;
        try {
          if (i = (t = t.call(r)).next, 0 === l) {
            if (Object(t) !== t) return;
            f = !1;
          } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
        } catch (r) {
          o = !0, n = r;
        } finally {
          try {
            if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
          } finally {
            if (o) throw n;
          }
        }
        return a;
      }
    }
    function _nonIterableRest() {
      throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function _nonIterableSpread() {
      throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }
    function ownKeys(e, r) {
      var t = Object.keys(e);
      if (Object.getOwnPropertySymbols) {
        var o = Object.getOwnPropertySymbols(e);
        r && (o = o.filter(function (r) {
          return Object.getOwnPropertyDescriptor(e, r).enumerable;
        })), t.push.apply(t, o);
      }
      return t;
    }
    function _objectSpread2(e) {
      for (var r = 1; r < arguments.length; r++) {
        var t = null != arguments[r] ? arguments[r] : {};
        r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
          _defineProperty(e, r, t[r]);
        }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
          Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
        });
      }
      return e;
    }
    function _possibleConstructorReturn(t, e) {
      if (e && ("object" == typeof e || "function" == typeof e)) return e;
      if (void 0 !== e) throw new TypeError("Derived constructors may only return object or undefined");
      return _assertThisInitialized(t);
    }
    function _regeneratorRuntime() {
      _regeneratorRuntime = function () {
        return e;
      };
      var t,
        e = {},
        r = Object.prototype,
        n = r.hasOwnProperty,
        o = Object.defineProperty || function (t, e, r) {
          t[e] = r.value;
        },
        i = "function" == typeof Symbol ? Symbol : {},
        a = i.iterator || "@@iterator",
        c = i.asyncIterator || "@@asyncIterator",
        u = i.toStringTag || "@@toStringTag";
      function define(t, e, r) {
        return Object.defineProperty(t, e, {
          value: r,
          enumerable: !0,
          configurable: !0,
          writable: !0
        }), t[e];
      }
      try {
        define({}, "");
      } catch (t) {
        define = function (t, e, r) {
          return t[e] = r;
        };
      }
      function wrap(t, e, r, n) {
        var i = e && e.prototype instanceof Generator ? e : Generator,
          a = Object.create(i.prototype),
          c = new Context(n || []);
        return o(a, "_invoke", {
          value: makeInvokeMethod(t, r, c)
        }), a;
      }
      function tryCatch(t, e, r) {
        try {
          return {
            type: "normal",
            arg: t.call(e, r)
          };
        } catch (t) {
          return {
            type: "throw",
            arg: t
          };
        }
      }
      e.wrap = wrap;
      var h = "suspendedStart",
        l = "suspendedYield",
        f = "executing",
        s = "completed",
        y = {};
      function Generator() {}
      function GeneratorFunction() {}
      function GeneratorFunctionPrototype() {}
      var p = {};
      define(p, a, function () {
        return this;
      });
      var d = Object.getPrototypeOf,
        v = d && d(d(values([])));
      v && v !== r && n.call(v, a) && (p = v);
      var g = GeneratorFunctionPrototype.prototype = Generator.prototype = Object.create(p);
      function defineIteratorMethods(t) {
        ["next", "throw", "return"].forEach(function (e) {
          define(t, e, function (t) {
            return this._invoke(e, t);
          });
        });
      }
      function AsyncIterator(t, e) {
        function invoke(r, o, i, a) {
          var c = tryCatch(t[r], t, o);
          if ("throw" !== c.type) {
            var u = c.arg,
              h = u.value;
            return h && "object" == typeof h && n.call(h, "__await") ? e.resolve(h.__await).then(function (t) {
              invoke("next", t, i, a);
            }, function (t) {
              invoke("throw", t, i, a);
            }) : e.resolve(h).then(function (t) {
              u.value = t, i(u);
            }, function (t) {
              return invoke("throw", t, i, a);
            });
          }
          a(c.arg);
        }
        var r;
        o(this, "_invoke", {
          value: function (t, n) {
            function callInvokeWithMethodAndArg() {
              return new e(function (e, r) {
                invoke(t, n, e, r);
              });
            }
            return r = r ? r.then(callInvokeWithMethodAndArg, callInvokeWithMethodAndArg) : callInvokeWithMethodAndArg();
          }
        });
      }
      function makeInvokeMethod(e, r, n) {
        var o = h;
        return function (i, a) {
          if (o === f) throw Error("Generator is already running");
          if (o === s) {
            if ("throw" === i) throw a;
            return {
              value: t,
              done: !0
            };
          }
          for (n.method = i, n.arg = a;;) {
            var c = n.delegate;
            if (c) {
              var u = maybeInvokeDelegate(c, n);
              if (u) {
                if (u === y) continue;
                return u;
              }
            }
            if ("next" === n.method) n.sent = n._sent = n.arg;else if ("throw" === n.method) {
              if (o === h) throw o = s, n.arg;
              n.dispatchException(n.arg);
            } else "return" === n.method && n.abrupt("return", n.arg);
            o = f;
            var p = tryCatch(e, r, n);
            if ("normal" === p.type) {
              if (o = n.done ? s : l, p.arg === y) continue;
              return {
                value: p.arg,
                done: n.done
              };
            }
            "throw" === p.type && (o = s, n.method = "throw", n.arg = p.arg);
          }
        };
      }
      function maybeInvokeDelegate(e, r) {
        var n = r.method,
          o = e.iterator[n];
        if (o === t) return r.delegate = null, "throw" === n && e.iterator.return && (r.method = "return", r.arg = t, maybeInvokeDelegate(e, r), "throw" === r.method) || "return" !== n && (r.method = "throw", r.arg = new TypeError("The iterator does not provide a '" + n + "' method")), y;
        var i = tryCatch(o, e.iterator, r.arg);
        if ("throw" === i.type) return r.method = "throw", r.arg = i.arg, r.delegate = null, y;
        var a = i.arg;
        return a ? a.done ? (r[e.resultName] = a.value, r.next = e.nextLoc, "return" !== r.method && (r.method = "next", r.arg = t), r.delegate = null, y) : a : (r.method = "throw", r.arg = new TypeError("iterator result is not an object"), r.delegate = null, y);
      }
      function pushTryEntry(t) {
        var e = {
          tryLoc: t[0]
        };
        1 in t && (e.catchLoc = t[1]), 2 in t && (e.finallyLoc = t[2], e.afterLoc = t[3]), this.tryEntries.push(e);
      }
      function resetTryEntry(t) {
        var e = t.completion || {};
        e.type = "normal", delete e.arg, t.completion = e;
      }
      function Context(t) {
        this.tryEntries = [{
          tryLoc: "root"
        }], t.forEach(pushTryEntry, this), this.reset(!0);
      }
      function values(e) {
        if (e || "" === e) {
          var r = e[a];
          if (r) return r.call(e);
          if ("function" == typeof e.next) return e;
          if (!isNaN(e.length)) {
            var o = -1,
              i = function next() {
                for (; ++o < e.length;) if (n.call(e, o)) return next.value = e[o], next.done = !1, next;
                return next.value = t, next.done = !0, next;
              };
            return i.next = i;
          }
        }
        throw new TypeError(typeof e + " is not iterable");
      }
      return GeneratorFunction.prototype = GeneratorFunctionPrototype, o(g, "constructor", {
        value: GeneratorFunctionPrototype,
        configurable: !0
      }), o(GeneratorFunctionPrototype, "constructor", {
        value: GeneratorFunction,
        configurable: !0
      }), GeneratorFunction.displayName = define(GeneratorFunctionPrototype, u, "GeneratorFunction"), e.isGeneratorFunction = function (t) {
        var e = "function" == typeof t && t.constructor;
        return !!e && (e === GeneratorFunction || "GeneratorFunction" === (e.displayName || e.name));
      }, e.mark = function (t) {
        return Object.setPrototypeOf ? Object.setPrototypeOf(t, GeneratorFunctionPrototype) : (t.__proto__ = GeneratorFunctionPrototype, define(t, u, "GeneratorFunction")), t.prototype = Object.create(g), t;
      }, e.awrap = function (t) {
        return {
          __await: t
        };
      }, defineIteratorMethods(AsyncIterator.prototype), define(AsyncIterator.prototype, c, function () {
        return this;
      }), e.AsyncIterator = AsyncIterator, e.async = function (t, r, n, o, i) {
        void 0 === i && (i = Promise);
        var a = new AsyncIterator(wrap(t, r, n, o), i);
        return e.isGeneratorFunction(r) ? a : a.next().then(function (t) {
          return t.done ? t.value : a.next();
        });
      }, defineIteratorMethods(g), define(g, u, "Generator"), define(g, a, function () {
        return this;
      }), define(g, "toString", function () {
        return "[object Generator]";
      }), e.keys = function (t) {
        var e = Object(t),
          r = [];
        for (var n in e) r.push(n);
        return r.reverse(), function next() {
          for (; r.length;) {
            var t = r.pop();
            if (t in e) return next.value = t, next.done = !1, next;
          }
          return next.done = !0, next;
        };
      }, e.values = values, Context.prototype = {
        constructor: Context,
        reset: function (e) {
          if (this.prev = 0, this.next = 0, this.sent = this._sent = t, this.done = !1, this.delegate = null, this.method = "next", this.arg = t, this.tryEntries.forEach(resetTryEntry), !e) for (var r in this) "t" === r.charAt(0) && n.call(this, r) && !isNaN(+r.slice(1)) && (this[r] = t);
        },
        stop: function () {
          this.done = !0;
          var t = this.tryEntries[0].completion;
          if ("throw" === t.type) throw t.arg;
          return this.rval;
        },
        dispatchException: function (e) {
          if (this.done) throw e;
          var r = this;
          function handle(n, o) {
            return a.type = "throw", a.arg = e, r.next = n, o && (r.method = "next", r.arg = t), !!o;
          }
          for (var o = this.tryEntries.length - 1; o >= 0; --o) {
            var i = this.tryEntries[o],
              a = i.completion;
            if ("root" === i.tryLoc) return handle("end");
            if (i.tryLoc <= this.prev) {
              var c = n.call(i, "catchLoc"),
                u = n.call(i, "finallyLoc");
              if (c && u) {
                if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
                if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
              } else if (c) {
                if (this.prev < i.catchLoc) return handle(i.catchLoc, !0);
              } else {
                if (!u) throw Error("try statement without catch or finally");
                if (this.prev < i.finallyLoc) return handle(i.finallyLoc);
              }
            }
          }
        },
        abrupt: function (t, e) {
          for (var r = this.tryEntries.length - 1; r >= 0; --r) {
            var o = this.tryEntries[r];
            if (o.tryLoc <= this.prev && n.call(o, "finallyLoc") && this.prev < o.finallyLoc) {
              var i = o;
              break;
            }
          }
          i && ("break" === t || "continue" === t) && i.tryLoc <= e && e <= i.finallyLoc && (i = null);
          var a = i ? i.completion : {};
          return a.type = t, a.arg = e, i ? (this.method = "next", this.next = i.finallyLoc, y) : this.complete(a);
        },
        complete: function (t, e) {
          if ("throw" === t.type) throw t.arg;
          return "break" === t.type || "continue" === t.type ? this.next = t.arg : "return" === t.type ? (this.rval = this.arg = t.arg, this.method = "return", this.next = "end") : "normal" === t.type && e && (this.next = e), y;
        },
        finish: function (t) {
          for (var e = this.tryEntries.length - 1; e >= 0; --e) {
            var r = this.tryEntries[e];
            if (r.finallyLoc === t) return this.complete(r.completion, r.afterLoc), resetTryEntry(r), y;
          }
        },
        catch: function (t) {
          for (var e = this.tryEntries.length - 1; e >= 0; --e) {
            var r = this.tryEntries[e];
            if (r.tryLoc === t) {
              var n = r.completion;
              if ("throw" === n.type) {
                var o = n.arg;
                resetTryEntry(r);
              }
              return o;
            }
          }
          throw Error("illegal catch attempt");
        },
        delegateYield: function (e, r, n) {
          return this.delegate = {
            iterator: values(e),
            resultName: r,
            nextLoc: n
          }, "next" === this.method && (this.arg = t), y;
        }
      }, e;
    }
    function _setPrototypeOf(t, e) {
      return _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function (t, e) {
        return t.__proto__ = e, t;
      }, _setPrototypeOf(t, e);
    }
    function _slicedToArray(r, e) {
      return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
    }
    function _toConsumableArray(r) {
      return _arrayWithoutHoles(r) || _iterableToArray(r) || _unsupportedIterableToArray(r) || _nonIterableSpread();
    }
    function _toPrimitive(t, r) {
      if ("object" != typeof t || !t) return t;
      var e = t[Symbol.toPrimitive];
      if (void 0 !== e) {
        var i = e.call(t, r || "default");
        if ("object" != typeof i) return i;
        throw new TypeError("@@toPrimitive must return a primitive value.");
      }
      return ("string" === r ? String : Number)(t);
    }
    function _toPropertyKey(t) {
      var i = _toPrimitive(t, "string");
      return "symbol" == typeof i ? i : i + "";
    }
    function _typeof(o) {
      "@babel/helpers - typeof";

      return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
        return typeof o;
      } : function (o) {
        return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
      }, _typeof(o);
    }
    function _unsupportedIterableToArray(r, a) {
      if (r) {
        if ("string" == typeof r) return _arrayLikeToArray(r, a);
        var t = {}.toString.call(r).slice(8, -1);
        return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
      }
    }

    (function () {
      function showPopup(message) {
        if ($__default["default"].ube && $__default["default"].ube.showPopup) $__default["default"].ube.showPopup(message);else {
          console.log(message);
          alert(message);
        }
      }
      function urlToFile(url) {
        return fetch(url).then(function (res) {
          return res.blob();
        }).then(function (blob) {
          return new File([blob], "File name", {
            type: "image/png"
          });
        });
      }
      function invert(ctx) {
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      function rotate(canvas) {
        var ctx = canvas.getContext("2d");
        ctx.translate(canvas.width / 2, canvas.height / 2); // translate to canvas center
        ctx.rotate(Math.PI * 0.5); // add rotation transform
        ctx.globalCompositeOperation = "copy"; // set comp. mode to "copy"
        ctx.drawImage(ctx.canvas, 0, 0, canvas.width, canvas.height, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);
      }
      function contrast(ctx, contrast) {
        var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
        var d = imgData.data;
        contrast = contrast / 100 + 1; //convert to decimal & shift range: [0..2]
        var intercept = 128 * (1 - contrast);
        for (var i = 0; i < d.length; i += 4) {
          //r,g,b,a
          d[i] = d[i] * contrast + intercept;
          d[i + 1] = d[i + 1] * contrast + intercept;
          d[i + 2] = d[i + 2] * contrast + intercept;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      /**
       *
       * @param {string} name
       * @param {{getDataMatrix: function, getImages: function?, debugTarget: string?, returnCanvas: boolean?, cropWidth: number?, cropHeight: number?, interval: number?}} options
       */
      $__default["default"].fn.ubeCameraCHZ = function (name, options) {
        var defaultOptions = {
          cropWidth: 400,
          cropHeight: 400,
          interval: 500,
          returnCanvas: true,
          cameraTimeoutSeconds: 20,
          scanFormat: 'DATA_MATRIX',
          errorMessage: 'DM не распознан, попробуй сделать фотографию более четкой в более светлом месте'
        };
        options = _objectSpread2(_objectSpread2({}, defaultOptions), options || {});
        var html5QrCode = new Html5Qrcode("reader", {
          formatsToSupport: [Html5QrcodeSupportedFormats[options.scanFormat]]
        });
        function scanFile(imageToScan, images, stop) {
          return urlToFile(imageToScan).then(function (imageFile) {
            return html5QrCode.scanFile(imageFile, false).then(function (decodedText) {
              // success, use decodedText
              $__default["default"]("#result").text(decodedText);
              console.log("Decoded text:", decodedText);
              return options.getDataMatrix(decodedText, images, stop).then(function () {
                return decodedText;
              });
            });
          });
        }
        function prepareImages(canvas) {
          var ctx = canvas.getContext("2d");
          contrast(ctx, 30);
          // rotate the canvas to the specified degrees
          var imagesToScan = [];
          // get images on all four sides as leading side
          for (var i = 1; i < 5; i++) {
            var img = canvas.toDataURL('image/png', 1);
            imagesToScan.push(img);
            invert(ctx);
            img = canvas.toDataURL('image/png', 1);
            imagesToScan.push(img);
            rotate(canvas);
          }
          return imagesToScan;
        }
        options.intervalCallback = function (canvas, stop) {
          var imagesToScan = prepareImages(canvas);
          scanImages(imagesToScan, stop);
        };
        options.getPhotoBase64 = function (canvas, stop) {
          var imagesToScan = prepareImages(canvas);
          scanImages(imagesToScan, stop, function () {
            showPopup(options.errorMessage);
          });
        };
        options.timeoutCallback = function (stop) {
          return options.timeout(stop);
        };
        function scanImages(imagesToScan, stop, errorCb) {
          // check all images recursively
          (function process(index) {
            if (index >= imagesToScan.length) {
              if (errorCb) errorCb();
              return;
            }
            scanFile(imagesToScan[index], imagesToScan, stop).then(function (decodedText) {
              if (!decodedText) process(index + 1);
            })["catch"](function (err) {
              console.log("Error scanning file. Reason: ".concat(err));
              if (options.getImages) options.getImages(imagesToScan, stop);
              process(index + 1);
            });
          })(0);
        }
        return $__default["default"](this).ubeCamera2(name, options);
      };

      /**
       *
       * @param {string} name
       * @param {{intervalCallback: function?, debugTarget: string?, getPhotoBase64: function?, returnCanvas: boolean?, cropWidth: number?, cropHeight: number?, interval: number?}} options
       */
      $__default["default"].fn.ubeCamera2 = function (name, options) {
        var container = $__default["default"](this).first();
        var form = container.find("form");
        var getPhotoBase64 = options.getPhotoBase64;
        function debug(text) {
          console.log(text);
          if (options.debugTarget) {
            $__default["default"](options.debugTarget).append("<p>" + text + "</p>");
            if ($__default["default"](options.debugTarget).find('p').length > 5) $__default["default"](options.debugTarget).find('p').first().remove();
          }
        }
        ubeHostFallBack();
        function loadTemplate() {
          var host = $__default["default"].ube.host;
          var template_url = options.template || host + "/form/" + name;
          $__default["default"].get(template_url).then(function (res) {
            container.html(res.template);
            initModule();
          });
        }
        function initCamera() {
          container.find(".ube-visibility-show-for-method, .ube-visibility-show-for-faceMethod").hide();
          container.find(".ube-visibility-show-for-camera").show();
          initializeCameraCapture();
        }
        function initializeCameraCapture() {
          $__default["default"](".ube-camera-error").hide();
          $__default["default"](".ube-camera-container").show();
          var renderContainer = container.find(".ube-camera-container");
          var renderTarget = container.find(".ube-camera-render");
          var captureButton = container.find(".ube-camera-capture");
          var fallbackTarget = container.find(".ube-camera-fallback");
          var shadeContainer = container.find(".ube-camera-shade");
          if (renderTarget.data("init")) return false;
          renderTarget.data("init", true);
          function createDummyCanvas() {
            return $__default["default"]("<canvas style='visibility:hidden;display:block;position: absolute;top:-2000px;left:-2000px'></canvas>").appendTo("body")[0];
          }
          function removeCanvas(canvas) {
            setTimeout(function () {
              $__default["default"](canvas).remove();
            }, 1000);
          }
          function drawScanBorders() {
            var SCAN_AREA_WIDTH = 70;
            var SCAN_AREA_HEIGHT = 70;
            var videoRenderWidth = $__default["default"]('.ube-camera-render').width();
            var videoRenderHeight = $__default["default"]('.ube-camera-render').height();
            var borderYAxisWidth = (videoRenderHeight - SCAN_AREA_HEIGHT) / 2 + 'px';
            var borderXAxisWidth = (videoRenderWidth - SCAN_AREA_WIDTH) / 2 + 'px';
            $__default["default"]('.ube-camera-shade').css('borderWidth', borderYAxisWidth + ' ' + borderXAxisWidth);
          }
          function formatResultBase64(base64, cb) {
            var stopCapture = function stopCapture() {};
            var canvas = createDummyCanvas();
            var image = new Image();
            image.onload = function () {
              if (options.cropWidth && image.width > options.cropWidth && options.cropHeight && image.height > options.cropHeight) {
                var canvasWidth = Math.min(options.cropWidth, image.width);
                var canvasHeight = Math.min(options.cropHeight, image.height);
                canvas.width = canvasWidth;
                canvas.height = canvasHeight;
                canvas.getContext('2d').drawImage(image, (image.width - canvasWidth) / 2, (image.height - canvasHeight) / 2, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
              } else {
                var _canvasWidth = image.width;
                var _canvasHeight = image.height;
                canvas.width = _canvasWidth;
                canvas.height = _canvasHeight;
                canvas.getContext('2d').drawImage(image, 0, 0);
              }
              cb(canvas, stopCapture);
            };
            image.src = base64;
          }
          function formatResultCanvas(canvas) {
            if (options.returnCanvas) return canvas;else return canvas.toDataURL('image/png', 1);
          }
          function renderCameraCapture() {
            if (isNoCameraStream) return renderFileUpload();
            fallbackTarget.hide();
            renderTarget.html("<video></video>").show();
            renderContainer.show().addClass("ube-camera-option-capture").removeClass("ube-camera-option-upload");
            var video = renderTarget.find("video")[0];
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              video.setAttribute('autoplay', '');
              video.setAttribute('muted', '');
              video.setAttribute('playsinline', '');
              var constraints = {
                audio: false,
                video: {
                  facingMode: 'environment',
                  height: {
                    ideal: 4096
                  },
                  resizeMode: 'crop-and-scale'
                }
              };
              var stopVideoCapture = function stopVideoCapture() {
                debug("stopVideoCapture()");
                video.pause();
                video.src = "";
                if (video.srcObject) {
                  video.srcObject.getTracks().forEach(function (track) {
                    track.stop();
                  });
                }
                shadeContainer.hide();
                renderTarget.html("").data("init", false).hide();
                renderContainer.hide();
              };
              form.on("stopVideoCapture", function () {
                debug("Handling stop function");
                stopVideoCapture();
              });
              navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                video.srcObject = stream;
                debug("Video capture init success");
                var _stream$getTracks$0$g = stream.getTracks()[0].getSettings(),
                  width = _stream$getTracks$0$g.width,
                  height = _stream$getTracks$0$g.height;
                debug("".concat(width, "x").concat(height)); // 640x480

                var track = stream.getVideoTracks()[0];
                var capabilities = track.getCapabilities();
                var settings = stream.getVideoTracks()[0].getSettings();
                debug(JSON.stringify(settings));
                debug(JSON.stringify(capabilities));
                if (capabilities.zoom) {
                  //включаем аппаратный зум
                  debug('Hardware zoom: ' + capabilities.zoom.max);
                } else {
                  debug('No hardware zoom');
                }
                function readVideoFrame(canvas) {
                  debug("Capturing video");
                  if (options.cropWidth && video.videoWidth > options.cropWidth && options.cropHeight && video.videoHeight > options.cropHeight) {
                    var canvasWidth = Math.min(options.cropWidth, video.videoWidth);
                    var canvasHeight = Math.min(options.cropHeight, video.videoHeight);
                    canvas.width = canvasWidth;
                    canvas.height = canvasHeight;
                    canvas.getContext('2d').drawImage(video, (video.videoWidth - canvasWidth) / 2, (video.videoHeight - canvasHeight) / 2, canvasWidth, canvasHeight, 0, 0, canvasWidth, canvasHeight);
                  } else {
                    var _canvasWidth2 = video.videoWidth;
                    var _canvasHeight2 = video.videoHeight;
                    canvas.width = _canvasWidth2;
                    canvas.height = _canvasHeight2;
                    canvas.getContext('2d').drawImage(video, 0, 0);
                  }
                  debug(canvas.width);
                  debug(canvas.height);
                  // Other browsers will fall back to image/png

                  //const ctx = canvas.getContext('2d');
                  //greyScale(ctx);
                  //contrast(ctx, 50);
                  //invert(ctx);
                  return canvas;
                }
                if (options.intervalCallback) {
                  debug('Init interval capture');
                  var canvas = createDummyCanvas();
                  var attemptsCount = 0;
                  var scanIntervalMS = options.interval || 500;
                  var attemptsCountLimit = options.cameraTimeoutSeconds * 1000 / scanIntervalMS;
                  var intervalId = setInterval(function () {
                    if (attemptsCount > attemptsCountLimit) {
                      $__default["default"]('body').on('click', '.ube-reload', function () {
                        container.find(".ube-visibility-show-for-method, .ube-visibility-show-for-faceMethod").hide();
                        container.find(".ube-visibility-show-for-camera").show();
                      });
                      if (options.timeout) options.timeoutCallback(function () {
                        //Stop function
                        removeCanvas(resultCanvas);
                        stopVideoCapture();
                        clearInterval(intervalId);
                      });
                      return;
                    }
                    drawScanBorders();
                    // Other browsers will fall back to image/png
                    var resultCanvas = readVideoFrame(canvas);
                    options.intervalCallback(formatResultCanvas(resultCanvas), function () {
                      //Stop function
                      removeCanvas(resultCanvas);
                      stopVideoCapture();
                      clearInterval(intervalId);
                    });
                    attemptsCount++;
                  }, options.interval || 500);
                }
                captureButton.off("click").click(function (e) {
                  e.preventDefault();
                  var canvas = createDummyCanvas();
                  var imageData = readVideoFrame(canvas);
                  if (getPhotoBase64) {
                    getPhotoBase64(imageData);
                  } else if (options.intervalCallback) {
                    options.intervalCallback(imageData);
                  }
                  removeCanvas(canvas);
                  return false;
                });
              })["catch"](function (e) {
                debug("Capture video error 1");
                renderFileUpload();
              });
            } else {
              debug("Capture video error 2");
              renderFileUpload();
            }
          }
          function renderFileUpload() {
            renderContainer.removeClass("ube-camera-option-capture").addClass("ube-camera-option-upload");
            fallbackTarget.show();
            renderTarget.hide();
            shadeContainer.hide();
            var dummyFile = $__default["default"]("<input type=\"file\" accept=\"image/*\" capture=\"user\" style='width:0;height:0;position:absolute;'/>").appendTo("body");
            dummyFile.off("change").change(function () {
              debug("File field changed");
              var reader = new FileReader();
              reader.addEventListener("load", function () {
                var imageData = this.result;
                console.log("Image data:");
                console.log(imageData);
                if (getPhotoBase64) {
                  formatResultBase64(imageData, getPhotoBase64);
                }
                dummyFile.val("");
                dummyFile.wrap('<form>').closest('form').get(0).reset();
                dummyFile.unwrap();
              }, false);
              reader.readAsDataURL(this.files[0]);
            });
            captureButton.add(".ube-camera-option-upload").off("click").click(function (e) {
              console.log("Capture upload clicked");
              e.preventDefault();
              dummyFile.click();
              return false;
            });
          }
          if (options.mode === 'camera') renderCameraCapture();else renderFileUpload();
        }
        function initModule() {
          $__default["default"](".ube-visibility-show-for-method").show();
          $__default["default"](".ube-method-button").on('click', function () {
            options.mode = $__default["default"](this).data('option');
            initCamera();
          });
        }
        if (options.isTemplatePreloaded) {
          initModule();
        } else {
          loadTemplate();
        }
      };
    })();

    /**
     * UBE plugin to check if idx docs check passed
     * @param sessionKey { String } - UBE session key
     * @param callback { Function } - callback function to get result of check
     * @param interval { Number } - interval between start and end of requests in seconds
     * @param timeout { Number } - interval between getInfo queries in seconds
     */
    $.fn.ubeCheckAV = function (sessionKey, callback, interval, timeout) {
      var getInfo = function getInfo() {
        return $.ajax({
          url: "".concat($.ube.host, "/esb/iqos-redesign-idx-cabinet/cabinet"),
          headers: {
            "Authorization": "Bearer " + sessionKey
          }
        }).done(function (response) {
          if (response && response.checkDocsIDX) {
            switch (response.checkDocsIDX) {
              case 'CHECK_NOT_STARTED':
                callback('none');
                break;
              case 'CHECK_STARTED':
                callback('pending');
                break;
              case 'CHECK_SUCCESS':
                callback('success');
                break;
              case 'CHECK_FAIL':
                callback('fail');
                break;
              case 'CHECK_MANUAL':
                callback('manual');
                break;
            }
          }
        }).fail(function () {
          console.log('UBE getInfo Error');
        });
      };
      if (!sessionKey) {
        console.log('UBE Check AV session key is not presented');
        return;
      }
      if (!callback) {
        console.log('UBE Check AV callback is not presented');
        return;
      }
      if (!interval || !timeout) {
        getInfo();
      } else {
        var now = new Date();
        var dateAfterTimeout = new Date(now.getTime() + interval * 1000);
        var timer = setInterval(function () {
          if (new Date().getTime() < dateAfterTimeout.getTime()) {
            getInfo();
          } else {
            clearInterval(timer);
          }
        }, timeout * 1000);
      }
    };

    $__default["default"].fn.disableBrowserAutocomplete = function () {
      return this.each(function () {
        var field = $__default["default"](this);
        if (field.attr("autocomplete") !== "off") field.attr("autocomplete", "random-" + new Date().getTime());
        return field;
      });
    };

    var ubeCookie$1 = function ubeCookie(key, value, expires) {
      if (key && value === undefined) {
        var parts = ("; " + document.cookie).split("; " + key + "=");
        return parts.length === 2 ? parts.pop().split(";").shift() : undefined;
      } else if (key && value === null) {
        document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + '; expires=' + new Date(0).toUTCString() + "; path=/; secure;";
      } else if (key) {
        if (!expires) {
          var now = new Date();
          expires = new Date(now.setMonth(now.getMonth() + 13)).toUTCString();
        }
        document.cookie = encodeURIComponent(key) + '=' + encodeURIComponent(value) + '; expires=' + expires + "; path=/; secure;";
      }
    };
    var sessionExpiration = function sessionExpiration() {
      return new Date(new Date().getTime() + 30 * 60 * 1000).toUTCString();
    };
    var getCookiesArray = function getCookiesArray() {
      var cookies = document.cookie.split(';');
      var response = [];
      response = cookies.map(function (cookie) {
        cookie = cookie.split('=');
        var key = cookie[0].trim();
        var value = cookie[1].trim();
        return _defineProperty({}, key, value);
      });
      return response;
    };
    var getGA4UserId = function getGA4UserId() {
      var cookiesArray = getCookiesArray();
      var ga4UserIdObject = cookiesArray.find(function (x) {
        return x['ga4'] && x['ga4'].startsWith('GA1.2.');
      });
      var ga4UserId;
      if (ga4UserIdObject && ga4UserIdObject['ga4']) {
        ga4UserId = ga4UserIdObject['ga4'].slice(6);
      }
      return ga4UserId;
    };
    var getGA4SessionId = function getGA4SessionId() {
      var ga4SessionId;
      var cookiesArray = getCookiesArray();
      cookiesArray.forEach(function (x) {
        if (x) {
          var _Object$keys = Object.keys(x),
            _Object$keys2 = _slicedToArray(_Object$keys, 1),
            key = _Object$keys2[0];
          if (key && x[key].startsWith('GS1.')) {
            var parts = x[key].split('.');
            if (parts[1]) {
              if (!ga4SessionId) {
                ga4SessionId = +parts[2];
              }
              if (ga4SessionId < +parts[2]) {
                ga4SessionId = +parts[2];
              }
            }
          }
        }
      });
      return ga4SessionId;
    };
    var cookies = {
      UBE_SESSION_KEY: "ube_session_key",
      UBE_FACE_BEFORE: "ube_face_before",
      UBE_COOKIE_POLICY: "UBE_COOKIE_POLICY",
      UBE_COOKIE_CHECK: "UBE_COOKIE_CHECK",
      UBE_SESSION_KEY_REG: "UBE_SESSION_KEY_REG",
      UBE_AGE_VERIFIED_TOKEN: "UBE_AGE_VERIFIED_TOKEN",
      UBE_AGE_VERIFIED: "UBE_AGE_VERIFIED",
      UBE_JWT_FACE_TOKEN: "UBE_JWT_FACE_TOKEN",
      UBE_WIDGET_SESSION_KEY: "UBE_WIDGET_SESSION_KEY",
      UBE_WIDGET_REGISTER: "UBE_WIDGET_REGISTER",
      UBE_WIDGET_LOGIN: "UBE_WIDGET_LOGIN",
      UBE_DOCUMENTS_PROVIDED: "UBE_DOCUMENTS_PROVIDED",
      UBE_USERID: "UBE_USERID"
    };

    /**
     * Get image file size from base64 format
     * @param base64Src {string}  
     * @return {number}
     */

    function getImageSize(base64Src) {
      var endingOffset = 1;
      var encodingCoefficient = 0.75; // base64 encodes 3 bytes of binary data on 4 chars 
      if (base64Src.endsWith('==')) {
        endingOffset = 2;
      }
      var sizeInBytes = (base64Src.length - endingOffset) * encodingCoefficient;
      var sizeInKB = sizeInBytes / 1024;
      return sizeInKB;
    }

    /**
     * Resize image based on dimensions restrictions 
     * @param image {Object}
     * @param image.width {number} 
     * @param image.height {number}
     */

    function resizeImage(image, maxWidth, maxHeight, maxPixels) {
      if (image.width < maxWidth && image.height < maxHeight && image.width * image.height < maxPixels) return true;
      var imageProportion = image.width / image.height;
      if (image.width * image.height > maxPixels) {
        image.height = Math.sqrt(maxPixels / imageProportion);
        image.width = image.height * imageProportion;
      }
      if (image.width > image.height) {
        if (image.width > maxWidth) {
          image.height = image.height * (maxWidth / image.width);
          image.width = maxWidth;
        }
      } else {
        if (image.height > maxHeight) {
          image.width = image.width * (maxHeight / image.height);
          image.height = maxHeight;
        }
      }
      return false;
    }
    function imageDataToBlob(imageData) {
      var block = imageData.split(";");
      // Get the content type of the image
      var contentType = block[0].split(":")[1]; // In this case "image/gif"
      // get the real base64 content of the file
      var realData = block[1].split(",")[1]; // In this case "R0lGODlhPQBEAPeoAJosM...."
      // Convert it to a blob to upload
      var blob = b64toBlob(realData, contentType);
      return blob;
    }

    /**
     * Convert a base64 string in a Blob according to the data and contentType.
     *
     * @param b64Data {String} Pure base64 string without contentType
     * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
     * @param sliceSize {Int} SliceSize to process the byteCharacters
     * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
     * @return Blob
     */
    function b64toBlob(b64Data, contentType, sliceSize) {
      contentType = contentType || '';
      sliceSize = sliceSize || 512;
      var byteCharacters = atob(b64Data);
      var byteArrays = [];
      for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        var slice = byteCharacters.slice(offset, offset + sliceSize);
        var byteNumbers = new Array(slice.length);
        for (var i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        var byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      var blob = new Blob(byteArrays, {
        type: contentType
      });
      return blob;
    }

    /**
     * Sends request ELK log with ACS check results
     * @param {String} type - photo creation type
     * @param {Boolean} result - photo verification result 
     * @param {Boolean} error - error for elk 
     * @param {String} errorText - error message from default vendor
     * @param {{initial: {width: Number, height: Number, sizeKB: Number}, resized: {width: Number, height: Number, sizeKB: Number}}} photoData - aggregated physical photo data 
     * @param {String} image - image in base64 
     * @param {String} formKey - Face Reco form key  
     */

    function logACSResultToELK(type, result, error, errorText, photoData, image, formKey, token, faceId) {
      ubeHostFallBack();
      var data = {
        event: 'ACSVerification',
        type: type,
        result: result,
        error: error,
        image: image,
        formKey: formKey
      };
      if (!result || error) data.errorText = errorText;
      if (token) data.faceToken = token;
      if (faceId) data.faceId = faceId;
      data.photoData = {
        initial: {
          width: photoData.initial.width,
          height: photoData.initial.height,
          sizeKB: photoData.initial.sizeKB
        },
        resized: {
          width: photoData.resized.width,
          height: photoData.resized.height,
          sizeKB: photoData.resized.sizeKB
        }
      };
      $__default["default"].ajax({
        url: $__default["default"].ube.host + '/api/log/face',
        method: 'POST',
        data: JSON.stringify(data),
        processData: false,
        cache: false,
        dataType: 'json',
        crossDomain: true,
        contentType: 'application/json',
        error: function error(err) {
          console.log('UBE :: error sending data to ELK', err);
        },
        success: function success(data) {
          if (data.jwt) ubeCookie$1(cookies.UBE_JWT_FACE_TOKEN, data.jwt);
          console.log('UBE :: data successfully sent');
        }
      });
    }

    (function () {
      function toggleLoader(visible) {
        if ($__default["default"].ube && $__default["default"].ube.toggleLoader) $__default["default"].ube.toggleLoader(visible);
      }
      function showPopup(message) {
        if ($__default["default"].ube && $__default["default"].ube.showPopup) $__default["default"].ube.showPopup(message);else {
          alert(message);
        }
      }
      function getToken(callback, repeat) {
        var MAX_REPEAT_COUNT = 4;
        var getTimeout = function getTimeout(repeat) {
          return Math.pow(2, MAX_REPEAT_COUNT - repeat) * 1000;
        };
        if (!repeat) repeat = MAX_REPEAT_COUNT;
        $__default["default"].getJSON($__default["default"].ube.host + "/api/face/token").done(function (data) {
          toggleLoader(false);
          if (!data.access_token || !data.next_validation_endpoint) {
            repeat = repeat - 1;
            if (repeat > 0) setTimeout(function () {
              return getToken(callback, repeat);
            }, getTimeout(repeat));else {
              showPopup("Ошибка в ответе сервиса ACS API");
            }
          } else {
            callback(data.access_token, data.next_validation_endpoint);
          }
        }).fail(function (jqxhr, textStatus, error) {
          repeat = repeat - 1;
          if (repeat > 0) setTimeout(function () {
            return getToken(callback, repeat);
          }, getTimeout(repeat));else {
            showPopup("Ошибка в ответе сервиса ACS API");
          }
        });
      }
      function validateToken(token, captureType, callback, repeat) {
        if (!repeat) repeat = 3;
        $__default["default"].ajax({
          url: $__default["default"].ube.host + "/api/face/token",
          method: "post",
          data: JSON.stringify({
            token: token,
            captureType: captureType
          }),
          contentType: 'application/json; charset=UTF-8'
        }).done(function (data) {
          toggleLoader(false);
          callback(data);
        }).fail(function (jqxhr, textStatus, error) {
          repeat = repeat - 1;
          if (repeat > 0) validateToken(token, captureType, callback);else showPopup("Ошибка при валидации результатов ACS API");
        });
      }
      $__default["default"].fn.ubeFaceLocal = function (name, options) {
        var container = $__default["default"](this).first();
        var form = container.find("form");
        var verifyFaceResult;
        window.backupLocalStorage = {};
        window.backupLocalStorage.setItem = function (key, value) {
          window.backupLocalStorage[key] = value;
        };
        window.backupLocalStorage.getItem = function (key) {
          return window.backupLocalStorage[key];
        };
        window.backupLocalStorage.removeItem = function (key) {
          delete window.backupLocalStorage[key];
        };
        ubeHostFallBack();
        var host = $__default["default"].ube.host;
        function onSuccess(token, captureType) {
          validateToken(token, captureType, function (result) {
            if (onSubmissionSuccess) onSubmissionSuccess(verifyFaceResult);
          }, null);
        }
        function loadTemplate() {
          var templateURL = options.template || host + "/form/" + name;
          $__default["default"].get(templateURL).then(function (res) {
            container.html(res.template);
            initFace();
          });
        }
        function initFace() {
          container.find(".ube-visibility-show-for-method, .ube-visibility-show-for-megafonMethod, .ube-visibility-show-for-documentMethod").hide();
          container.find(".ube-visibility-show-for-faceMethod").show();
          faceapi.nets.tinyFaceDetector.loadFromUri(host + '/js/plugin/').then(function () {
            getToken(initializeFaceCapture, undefined);
          });
        }
        function initializeFaceCapture(_token, _tokenUrl) {
          $__default["default"](".ube-face-error").hide();
          $__default["default"](".ube-face-container").show();
          var token = _token;
          var tokenUrl = _tokenUrl;
          var renderContainer = container.find(".ube-camera-container");
          var renderTarget = container.find(".ube-camera-render");
          var captureButton = container.find(".ube-camera-capture");
          var fallbackTarget = container.find(".ube-camera-fallback");
          if (renderTarget.data("init") || !token || !tokenUrl) return false;
          renderTarget.data("init", true);
          function sendBlobToServer(_x, _x2, _x3, _x4) {
            return _sendBlobToServer.apply(this, arguments);
          }
          function _sendBlobToServer() {
            _sendBlobToServer = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(imageBase64, callback, type, imageData) {
              var blob, configName, eventType, result;
              return _regeneratorRuntime().wrap(function _callee$(_context) {
                while (1) switch (_context.prev = _context.next) {
                  case 0:
                    blob = imageDataToBlob(imageBase64);
                    configName = name.replace('-face', '-reg');
                    toggleLoader(true);
                    if (type === 'auto') eventType = 'auto';else eventType = 'upload';
                    _context.prev = 4;
                    _context.next = 7;
                    return $__default["default"].ajax({
                      url: "".concat(host, "/api/log/verifyFace/").concat(configName),
                      data: JSON.stringify({
                        image: imageBase64,
                        type: type,
                        imageData: imageData
                      }),
                      type: "POST",
                      processData: false,
                      cache: false,
                      dataType: "json",
                      contentType: 'application/json',
                      crossDomain: true
                    });
                  case 7:
                    result = _context.sent;
                    verifyFaceResult = result;
                    _context.next = 14;
                    break;
                  case 11:
                    _context.prev = 11;
                    _context.t0 = _context["catch"](4);
                    toggleLoader(false);
                  case 14:
                    $__default["default"].ajax({
                      url: tokenUrl,
                      data: blob,
                      type: "POST",
                      processData: false,
                      cache: false,
                      dataType: "json",
                      contentType: 'application/octet-stream',
                      crossDomain: true,
                      headers: {
                        "Authorization": "Bearer " + token,
                        "X-ACS-PICTURE-MODE": "stream"
                      },
                      error: function error(err) {
                        var _verifyFaceResult;
                        toggleLoader(false);
                        logACSResultToELK(eventType, false, true, 'Network Error', imageData, imageBase64, configName, (_verifyFaceResult = verifyFaceResult) === null || _verifyFaceResult === void 0 ? void 0 : _verifyFaceResult.faceId);
                      },
                      success: function success(data) {
                        toggleLoader(false);
                        if (data) {
                          var _verifyFaceResult2;
                          logACSResultToELK(eventType, true, false, null, imageData, imageBase64, configName, token, (_verifyFaceResult2 = verifyFaceResult) === null || _verifyFaceResult2 === void 0 ? void 0 : _verifyFaceResult2.faceId);
                          onSuccess(token);
                        }
                      }
                    });
                  case 15:
                  case "end":
                    return _context.stop();
                }
              }, _callee, null, [[4, 11]]);
            }));
            return _sendBlobToServer.apply(this, arguments);
          }
          function renderCameraCapture() {
            if (isNoCameraStream) return renderFileUpload();
            fallbackTarget.hide();
            renderTarget.html("<video></video>").show();
            renderContainer.addClass("ube-camera-option-capture").removeClass("ube-camera-option-upload");
            var video = renderTarget.find("video")[0];
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
              video.setAttribute('autoplay', '');
              video.setAttribute('muted', '');
              video.setAttribute('playsinline', '');
              var constraints = {
                audio: false,
                video: {
                  facingMode: 'user'
                }
              };
              var stopVideoCapture = function stopVideoCapture() {
                video.pause();
                video.src = "";
                if (video.srcObject) {
                  video.srcObject.getTracks().forEach(function (track) {
                    track.stop();
                  });
                }
                renderTarget.html("");
                renderTarget.data("init", false);
              };
              form.on("stopVideoCapture", function () {
                stopVideoCapture();
              });
              navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
                video.srcObject = stream;
                var canvas = $__default["default"]("<canvas style='visibility:hidden;display:block;position: absolute;top:-2000px;left:-2000px'></canvas>").appendTo("body")[0];
                var img = new Image();
                function getImage() {
                  canvas.width = video.videoWidth;
                  canvas.height = video.videoHeight;
                  canvas.getContext('2d').drawImage(video, 0, 0);
                  var imageData = canvas.toDataURL('image/png');
                  return imageData;
                }
                setTimeout(function () {
                  scanFace().then(function (res) {
                    sendBlobToServer(res.image, stopVideoCapture, 'auto', res.imageData);
                  });
                }, 500);
                var scanFace = function scanFace() {
                  return new Promise(function cb(resolve, reject) {
                    var input = getImage();
                    img.onload = function () {
                      faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).then(function (res) {
                        if (!res) cb(resolve);else {
                          var imageData = {
                            width: img.width,
                            height: img.height,
                            sizeKB: getImageSize(img.src).toFixed(3)
                          };
                          var aggregatedImageData = {
                            initial: imageData,
                            resized: imageData
                          };
                          resolve({
                            image: img.src,
                            imageData: aggregatedImageData
                          });
                        }
                      });
                    };
                    img.src = input;
                  });
                };
              })["catch"](function (e) {
                renderFileUpload();
              });
            } else {
              renderFileUpload();
            }
          }
          function renderFileUpload() {
            renderContainer.removeClass("ube-camera-option-capture").addClass("ube-camera-option-upload");
            fallbackTarget.show();
            renderTarget.hide();
            var dummyFile = $__default["default"]("<input type=\"file\" accept=\"image/*\" capture=\"user\" style='width:0;height:0;position:absolute;'/>").appendTo("body");
            dummyFile.off("change").change(function () {
              var reader = new FileReader();
              reader.addEventListener("load", function () {
                var imageData = this.result;
                var img = new Image();
                img.onload = function () {
                  faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions()).then(function (res) {
                    if (!res) {
                      alert('Лицо не распознано');
                    } else {
                      var _imageData = {
                        width: img.width,
                        height: img.height,
                        sizeKB: getImageSize(img.src).toFixed(3)
                      };
                      var aggregatedImageData = {
                        initial: _imageData,
                        resized: _imageData
                      };
                      sendBlobToServer(img.src, null, 'upload', aggregatedImageData);
                    }
                  });
                };
                img.src = imageData;
              }, false);
              reader.readAsDataURL(this.files[0]);
            });
            captureButton.add(".ube-camera-option-upload").off("click").click(function (e) {
              e.preventDefault();
              dummyFile.click();
              return false;
            });
          }
          renderCameraCapture();
        }
        var isTemplatePreloaded = options.isTemplatePreloaded,
          onSubmissionSuccess = options.onSubmissionSuccess;
        if (isTemplatePreloaded) {
          initFace();
        } else {
          loadTemplate();
        }
      };
    })();

    var MD5 = function MD5(string) {
      function RotateLeft(lValue, iShiftBits) {
        return lValue << iShiftBits | lValue >>> 32 - iShiftBits;
      }
      function AddUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = lX & 0x80000000;
        lY8 = lY & 0x80000000;
        lX4 = lX & 0x40000000;
        lY4 = lY & 0x40000000;
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
          return lResult ^ 0x80000000 ^ lX8 ^ lY8;
        }
        if (lX4 | lY4) {
          if (lResult & 0x40000000) {
            return lResult ^ 0xC0000000 ^ lX8 ^ lY8;
          } else {
            return lResult ^ 0x40000000 ^ lX8 ^ lY8;
          }
        } else {
          return lResult ^ lX8 ^ lY8;
        }
      }
      function F(x, y, z) {
        return x & y | ~x & z;
      }
      function G(x, y, z) {
        return x & z | y & ~z;
      }
      function H(x, y, z) {
        return x ^ y ^ z;
      }
      function I(x, y, z) {
        return y ^ (x | ~z);
      }
      function FF(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      }
      function GG(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      }
      function HH(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      }
      function II(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
      }
      function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - lNumberOfWords_temp1 % 64) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
          lWordCount = (lByteCount - lByteCount % 4) / 4;
          lBytePosition = lByteCount % 4 * 8;
          lWordArray[lWordCount] = lWordArray[lWordCount] | string.charCodeAt(lByteCount) << lBytePosition;
          lByteCount++;
        }
        lWordCount = (lByteCount - lByteCount % 4) / 4;
        lBytePosition = lByteCount % 4 * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | 0x80 << lBytePosition;
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
      }
      function WordToHex(lValue) {
        var WordToHexValue = "",
          WordToHexValue_temp = "",
          lByte,
          lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
          lByte = lValue >>> lCount * 8 & 255;
          WordToHexValue_temp = "0" + lByte.toString(16);
          WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
      }
      function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";
        for (var n = 0; n < string.length; n++) {
          var c = string.charCodeAt(n);
          if (c < 128) {
            utftext += String.fromCharCode(c);
          } else if (c > 127 && c < 2048) {
            utftext += String.fromCharCode(c >> 6 | 192);
            utftext += String.fromCharCode(c & 63 | 128);
          } else {
            utftext += String.fromCharCode(c >> 12 | 224);
            utftext += String.fromCharCode(c >> 6 & 63 | 128);
            utftext += String.fromCharCode(c & 63 | 128);
          }
        }
        return utftext;
      }
      var x = Array();
      var k, AA, BB, CC, DD, a, b, c, d;
      var S11 = 7,
        S12 = 12,
        S13 = 17,
        S14 = 22;
      var S21 = 5,
        S22 = 9,
        S23 = 14,
        S24 = 20;
      var S31 = 4,
        S32 = 11,
        S33 = 16,
        S34 = 23;
      var S41 = 6,
        S42 = 10,
        S43 = 15,
        S44 = 21;
      string = Utf8Encode(string);
      x = ConvertToWordArray(string);
      a = 0x67452301;
      b = 0xEFCDAB89;
      c = 0x98BADCFE;
      d = 0x10325476;
      for (k = 0; k < x.length; k += 16) {
        AA = a;
        BB = b;
        CC = c;
        DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = AddUnsigned(a, AA);
        b = AddUnsigned(b, BB);
        c = AddUnsigned(c, CC);
        d = AddUnsigned(d, DD);
      }
      var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);
      return temp.toLowerCase();
    };

    var fontList = ["Andale Mono", "Arial", "Arial Black", "Arial Hebrew", "Arial MT", "Arial Narrow", "Arial Rounded MT Bold", "Arial Unicode MS", "Bitstream Vera Sans Mono", "Book Antiqua", "Bookman Old Style", "Calibri", "Cambria", "Cambria Math", "Century", "Century Gothic", "Century Schoolbook", "Comic Sans", "Comic Sans MS", "Consolas", "Courier", "Courier New", "Garamond", "Geneva", "Georgia", "Helvetica", "Helvetica Neue", "Impact", "Lucida Bright", "Lucida Calligraphy", "Lucida Console", "Lucida Fax", "LUCIDA GRANDE", "Lucida Handwriting", "Lucida Sans", "Lucida Sans Typewriter", "Lucida Sans Unicode", "Microsoft Sans Serif", "Monaco", "Monotype Corsiva", "MS Gothic", "MS Outlook", "MS PGothic", "MS Reference Sans Serif", "MS Sans Serif", "MS Serif", "MYRIAD", "MYRIAD PRO", "Palatino", "Palatino Linotype", "Segoe Print", "Segoe Script", "Segoe UI", "Segoe UI Light", "Segoe UI Semibold", "Segoe UI Symbol", "Tahoma", "Times", "Times New Roman", "Times New Roman PS", "Trebuchet MS", "Ubuntu", "Verdana", "Wingdings", "Wingdings 2", "Wingdings 3"];
    var CanvasFontDetector = function CanvasFontDetector() {
      var baseFonts = ['monospace', 'sans-serif', 'serif'];
      var testString = "mimimimimimimimimimimimimimimimimimimimimimimimimimimi";
      var testSize = '72px';
      function fontFamily(fonts) {
        var result = [];
        var arrayLength = fonts.length;
        for (var i = 0; i < arrayLength; i++) {
          result.push("'" + fonts[i] + "'");
        }
        result = result.join(", ");
        return result;
      }
      function CanvasTester(testString, testSize) {
        var canvas = document.createElement("canvas");
        var context = canvas.getContext("2d");
        return function () {
          context.font = testSize + " " + fontFamily(arguments);
          var dim = context.measureText(testString);
          return dim.width;
        };
      }
      var test = new CanvasTester(testString, testSize);
      var defaultWidth = {};
      for (var index in baseFonts) {
        defaultWidth[baseFonts[index]] = test(baseFonts[index]);
      }
      function detect(font) {
        var detected = false;
        for (var index = 0, l = baseFonts.length; index < l; index++) {
          var width = test(font, baseFonts[index]);
          var matched = width != defaultWidth[baseFonts[index]];
          detected = detected || matched;
        }
        return detected;
      }
      this.detect = detect;
    };
    var getFonts = function getFonts() {
      var installedFonts = '';
      var d2 = new CanvasFontDetector();
      for (var index = 0; index < fontList.length; ++index) {
        var font = fontList[index];
        if (d2.detect(font)) {
          installedFonts += fontList[index];
          installedFonts += ';';
        }
      }
      return installedFonts;
    };

    /*
    CryptoJS v3.1.2
    code.google.com/p/crypto-js
    (c) 2009-2013 by Jeff Mott. All rights reserved.
    code.google.com/p/crypto-js/wiki/License
    */
    var CryptoJS = CryptoJS || function (e, m) {
      var p = {},
        j = p.lib = {},
        l = function l() {},
        f = j.Base = {
          extend: function extend(a) {
            l.prototype = this;
            var c = new l();
            a && c.mixIn(a);
            c.hasOwnProperty("init") || (c.init = function () {
              c.$super.init.apply(this, arguments);
            });
            c.init.prototype = c;
            c.$super = this;
            return c;
          },
          create: function create() {
            var a = this.extend();
            a.init.apply(a, arguments);
            return a;
          },
          init: function init() {},
          mixIn: function mixIn(a) {
            for (var c in a) a.hasOwnProperty(c) && (this[c] = a[c]);
            a.hasOwnProperty("toString") && (this.toString = a.toString);
          },
          clone: function clone() {
            return this.init.prototype.extend(this);
          }
        },
        n = j.WordArray = f.extend({
          init: function init(a, c) {
            a = this.words = a || [];
            this.sigBytes = c != m ? c : 4 * a.length;
          },
          toString: function toString(a) {
            return (a || h).stringify(this);
          },
          concat: function concat(a) {
            var c = this.words,
              q = a.words,
              d = this.sigBytes;
            a = a.sigBytes;
            this.clamp();
            if (d % 4) for (var b = 0; b < a; b++) c[d + b >>> 2] |= (q[b >>> 2] >>> 24 - 8 * (b % 4) & 255) << 24 - 8 * ((d + b) % 4);else if (65535 < q.length) for (b = 0; b < a; b += 4) c[d + b >>> 2] = q[b >>> 2];else c.push.apply(c, q);
            this.sigBytes += a;
            return this;
          },
          clamp: function clamp() {
            var a = this.words,
              c = this.sigBytes;
            a[c >>> 2] &= 4294967295 << 32 - 8 * (c % 4);
            a.length = e.ceil(c / 4);
          },
          clone: function clone() {
            var a = f.clone.call(this);
            a.words = this.words.slice(0);
            return a;
          },
          random: function random(a) {
            for (var c = [], b = 0; b < a; b += 4) c.push(4294967296 * e.random() | 0);
            return new n.init(c, a);
          }
        }),
        b = p.enc = {},
        h = b.Hex = {
          stringify: function stringify(a) {
            var c = a.words;
            a = a.sigBytes;
            for (var b = [], d = 0; d < a; d++) {
              var f = c[d >>> 2] >>> 24 - 8 * (d % 4) & 255;
              b.push((f >>> 4).toString(16));
              b.push((f & 15).toString(16));
            }
            return b.join("");
          },
          parse: function parse(a) {
            for (var c = a.length, b = [], d = 0; d < c; d += 2) b[d >>> 3] |= parseInt(a.substr(d, 2), 16) << 24 - 4 * (d % 8);
            return new n.init(b, c / 2);
          }
        },
        g = b.Latin1 = {
          stringify: function stringify(a) {
            var c = a.words;
            a = a.sigBytes;
            for (var b = [], d = 0; d < a; d++) b.push(String.fromCharCode(c[d >>> 2] >>> 24 - 8 * (d % 4) & 255));
            return b.join("");
          },
          parse: function parse(a) {
            for (var c = a.length, b = [], d = 0; d < c; d++) b[d >>> 2] |= (a.charCodeAt(d) & 255) << 24 - 8 * (d % 4);
            return new n.init(b, c);
          }
        },
        r = b.Utf8 = {
          stringify: function stringify(a) {
            try {
              return decodeURIComponent(escape(g.stringify(a)));
            } catch (c) {
              throw Error("Malformed UTF-8 data");
            }
          },
          parse: function parse(a) {
            return g.parse(unescape(encodeURIComponent(a)));
          }
        },
        k = j.BufferedBlockAlgorithm = f.extend({
          reset: function reset() {
            this._data = new n.init();
            this._nDataBytes = 0;
          },
          _append: function _append(a) {
            "string" == typeof a && (a = r.parse(a));
            this._data.concat(a);
            this._nDataBytes += a.sigBytes;
          },
          _process: function _process(a) {
            var c = this._data,
              b = c.words,
              d = c.sigBytes,
              f = this.blockSize,
              h = d / (4 * f),
              h = a ? e.ceil(h) : e.max((h | 0) - this._minBufferSize, 0);
            a = h * f;
            d = e.min(4 * a, d);
            if (a) {
              for (var g = 0; g < a; g += f) this._doProcessBlock(b, g);
              g = b.splice(0, a);
              c.sigBytes -= d;
            }
            return new n.init(g, d);
          },
          clone: function clone() {
            var a = f.clone.call(this);
            a._data = this._data.clone();
            return a;
          },
          _minBufferSize: 0
        });
      j.Hasher = k.extend({
        cfg: f.extend(),
        init: function init(a) {
          this.cfg = this.cfg.extend(a);
          this.reset();
        },
        reset: function reset() {
          k.reset.call(this);
          this._doReset();
        },
        update: function update(a) {
          this._append(a);
          this._process();
          return this;
        },
        finalize: function finalize(a) {
          a && this._append(a);
          return this._doFinalize();
        },
        blockSize: 16,
        _createHelper: function _createHelper(a) {
          return function (c, b) {
            return new a.init(b).finalize(c);
          };
        },
        _createHmacHelper: function _createHmacHelper(a) {
          return function (b, f) {
            return new s.HMAC.init(a, f).finalize(b);
          };
        }
      });
      var s = p.algo = {};
      return p;
    }(Math);
    (function () {
      var e = CryptoJS,
        m = e.lib,
        p = m.WordArray,
        j = m.Hasher,
        l = [],
        m = e.algo.SHA1 = j.extend({
          _doReset: function _doReset() {
            this._hash = new p.init([1732584193, 4023233417, 2562383102, 271733878, 3285377520]);
          },
          _doProcessBlock: function _doProcessBlock(f, n) {
            for (var b = this._hash.words, h = b[0], g = b[1], e = b[2], k = b[3], j = b[4], a = 0; 80 > a; a++) {
              if (16 > a) l[a] = f[n + a] | 0;else {
                var c = l[a - 3] ^ l[a - 8] ^ l[a - 14] ^ l[a - 16];
                l[a] = c << 1 | c >>> 31;
              }
              c = (h << 5 | h >>> 27) + j + l[a];
              c = 20 > a ? c + ((g & e | ~g & k) + 1518500249) : 40 > a ? c + ((g ^ e ^ k) + 1859775393) : 60 > a ? c + ((g & e | g & k | e & k) - 1894007588) : c + ((g ^ e ^ k) - 899497514);
              j = k;
              k = e;
              e = g << 30 | g >>> 2;
              g = h;
              h = c;
            }
            b[0] = b[0] + h | 0;
            b[1] = b[1] + g | 0;
            b[2] = b[2] + e | 0;
            b[3] = b[3] + k | 0;
            b[4] = b[4] + j | 0;
          },
          _doFinalize: function _doFinalize() {
            var f = this._data,
              e = f.words,
              b = 8 * this._nDataBytes,
              h = 8 * f.sigBytes;
            e[h >>> 5] |= 128 << 24 - h % 32;
            e[(h + 64 >>> 9 << 4) + 14] = Math.floor(b / 4294967296);
            e[(h + 64 >>> 9 << 4) + 15] = b;
            f.sigBytes = 4 * e.length;
            this._process();
            return this._hash;
          },
          clone: function clone() {
            var e = j.clone.call(this);
            e._hash = this._hash.clone();
            return e;
          }
        });
      e.SHA1 = j._createHelper(m);
      e.HmacSHA1 = j._createHmacHelper(m);
    })();

    var _canvasFingerprint = /*#__PURE__*/new WeakMap();
    var _audioFingerprint = /*#__PURE__*/new WeakMap();
    var _fontFingerprint = /*#__PURE__*/new WeakMap();
    var Fingerprint = /*#__PURE__*/function () {
      function Fingerprint() {
        _classCallCheck(this, Fingerprint);
        _classPrivateFieldInitSpec(this, _canvasFingerprint, void 0);
        _classPrivateFieldInitSpec(this, _audioFingerprint, void 0);
        _classPrivateFieldInitSpec(this, _fontFingerprint, void 0);
      }
      return _createClass(Fingerprint, [{
        key: "calculateCanvasBase64",
        value: function calculateCanvasBase64() {
          var canvas = document.createElement('canvas');
          var ctx = canvas.getContext('2d');
          var txt = 'CANVAS_FINGERPRINT';
          ctx.textBaseline = "top";
          ctx.font = "14px 'Arial'";
          ctx.textBaseline = "alphabetic";
          ctx.fillStyle = "#f60";
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = "#069";
          ctx.fillText(txt, 2, 15);
          ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
          ctx.fillText(txt, 4, 17);
          _classPrivateFieldSet2(_canvasFingerprint, this, MD5(canvas.toDataURL()));
        }
      }, {
        key: "calculateAudioFingerprint",
        value: function calculateAudioFingerprint() {
          var _this = this;
          var context, pxi_compressor, pxi_oscillator, hash, pxi_full_buffer_hash, pxi_output;
          try {
            if (context = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100), !context) {
              _classPrivateFieldSet2(_audioFingerprint, this, "");
              pxi_output = 0;
            }
            pxi_oscillator = context.createOscillator();
            pxi_oscillator.type = "triangle";
            pxi_oscillator.frequency.value = 1e4;
            pxi_compressor = context.createDynamicsCompressor();
            pxi_compressor.threshold && (pxi_compressor.threshold.value = -50);
            pxi_compressor.knee && (pxi_compressor.knee.value = 40);
            pxi_compressor.ratio && (pxi_compressor.ratio.value = 12);
            pxi_compressor.reduction && (pxi_compressor.reduction.value = -20);
            pxi_compressor.attack && (pxi_compressor.attack.value = 0);
            pxi_compressor.release && (pxi_compressor.release.value = .25);
            pxi_oscillator.connect(pxi_compressor);
            pxi_compressor.connect(context.destination);
            pxi_oscillator.start(0);
            context.startRendering();
            context.oncomplete = function (evnt) {
              pxi_output = 0;
              var sha1 = CryptoJS.algo.SHA1.create();
              for (var i = 0; i < evnt.renderedBuffer.length; i++) {
                sha1.update(evnt.renderedBuffer.getChannelData(0)[i].toString());
              }
              hash = sha1.finalize();
              pxi_full_buffer_hash = hash.toString(CryptoJS.enc.Hex);
              _classPrivateFieldSet2(_audioFingerprint, _this, pxi_full_buffer_hash);
              pxi_compressor.disconnect();
            };
          } catch (u) {
            pxi_output = 0;
            _classPrivateFieldSet2(_audioFingerprint, this, "");
          }
        }
      }, {
        key: "calculateFontFingerprint",
        value: function calculateFontFingerprint() {
          var fonts = getFonts();
          _classPrivateFieldSet2(_fontFingerprint, this, MD5(fonts));
        }
      }, {
        key: "fingerprintData",
        get: function get() {
          return {
            c: _classPrivateFieldGet2(_canvasFingerprint, this),
            a: _classPrivateFieldGet2(_audioFingerprint, this),
            f: _classPrivateFieldGet2(_fontFingerprint, this)
          };
        }
      }]);
    }();

    var objectTypes = {
      'function': true,
      'object': true
    };

    /** Used as a reference to the global object. */
    var root = objectTypes[typeof window === "undefined" ? "undefined" : _typeof(window)] && window || undefined;

    /** Detect free variable `exports`. */
    var freeExports = objectTypes[typeof exports === "undefined" ? "undefined" : _typeof(exports)] && exports;

    /** Detect free variable `module`. */
    var freeModule = objectTypes[typeof module === "undefined" ? "undefined" : _typeof(module)] && module && !module.nodeType && module;

    /** Detect free variable `global` from Node.js or Browserified code and use it as `root`. */
    var freeGlobal = freeExports && freeModule && (typeof global === "undefined" ? "undefined" : _typeof(global)) == 'object' && global;
    if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
      root = freeGlobal;
    }

    /**
     * Used as the maximum length of an array-like object.
     * See the [ES6 spec](http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength)
     * for more details.
     */
    var maxSafeInteger = Math.pow(2, 53) - 1;

    /** Regular expression to detect Opera. */
    var reOpera = /\bOpera/;

    /** Used for native method references. */
    var objectProto = Object.prototype;

    /** Used to check for own properties of an object. */
    var hasOwnProperty = objectProto.hasOwnProperty;

    /** Used to resolve the internal `[[Class]]` of values. */
    var toString = objectProto.toString;

    /*--------------------------------------------------------------------------*/

    /**
     * Capitalizes a string value.
     *
     * @private
     * @param {string} string The string to capitalize.
     * @returns {string} The capitalized string.
     */
    function capitalize$1(string) {
      string = String(string);
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * A utility function to clean up the OS name.
     *
     * @private
     * @param {string} os The OS name to clean up.
     * @param {string} [pattern] A `RegExp` pattern matching the OS name.
     * @param {string} [label] A label for the OS.
     */
    function cleanupOS(os, pattern, label) {
      // Platform tokens are defined at:
      // http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
      // http://web.archive.org/web/20081122053950/http://msdn.microsoft.com/en-us/library/ms537503(VS.85).aspx
      var data = {
        '10.0': '10',
        '6.4': '10 Technical Preview',
        '6.3': '8.1',
        '6.2': '8',
        '6.1': 'Server 2008 R2 / 7',
        '6.0': 'Server 2008 / Vista',
        '5.2': 'Server 2003 / XP 64-bit',
        '5.1': 'XP',
        '5.01': '2000 SP1',
        '5.0': '2000',
        '4.0': 'NT',
        '4.90': 'ME'
      };
      // Detect Windows version from platform tokens.
      if (pattern && label && /^Win/i.test(os) && !/^Windows Phone /i.test(os) && (data = data[/[\d.]+$/.exec(os)])) {
        os = 'Windows ' + data;
      }
      // Correct character case and cleanup string.
      os = String(os);
      if (pattern && label) {
        os = os.replace(RegExp(pattern, 'i'), label);
      }
      os = format(os.replace(/ ce$/i, ' CE').replace(/\bhpw/i, 'web').replace(/\bMacintosh\b/, 'Mac OS').replace(/_PowerPC\b/i, ' OS').replace(/\b(OS X) [^ \d]+/i, '$1').replace(/\bMac (OS X)\b/, '$1').replace(/\/(\d)/, ' $1').replace(/_/g, '.').replace(/(?: BePC|[ .]*fc[ \d.]+)$/i, '').replace(/\bx86\.64\b/gi, 'x86_64').replace(/\b(Windows Phone) OS\b/, '$1').replace(/\b(Chrome OS \w+) [\d.]+\b/, '$1').split(' on ')[0]);
      return os;
    }

    /**
     * An iteration utility for arrays and objects.
     *
     * @private
     * @param {Array|Object} object The object to iterate over.
     * @param {Function} callback The function called per iteration.
     */
    function each(object, callback) {
      var index = -1,
        length = object ? object.length : 0;
      if (typeof length == 'number' && length > -1 && length <= maxSafeInteger) {
        while (++index < length) {
          callback(object[index], index, object);
        }
      } else {
        forOwn(object, callback);
      }
    }

    /**
     * Trim and conditionally capitalize string values.
     *
     * @private
     * @param {string} string The string to format.
     * @returns {string} The formatted string.
     */
    function format(string) {
      string = trim(string);
      return /^(?:webOS|i(?:OS|P))/.test(string) ? string : capitalize$1(string);
    }

    /**
     * Iterates over an object's own properties, executing the `callback` for each.
     *
     * @private
     * @param {Object} object The object to iterate over.
     * @param {Function} callback The function executed per own property.
     */
    function forOwn(object, callback) {
      for (var key in object) {
        if (hasOwnProperty.call(object, key)) {
          callback(object[key], key, object);
        }
      }
    }

    /**
     * Gets the internal `[[Class]]` of a value.
     *
     * @private
     * @param {*} value The value.
     * @returns {string} The `[[Class]]`.
     */
    function getClassOf(value) {
      return value == null ? capitalize$1(value) : toString.call(value).slice(8, -1);
    }

    /**
     * Host objects can return type values that are different from their actual
     * data type. The objects we are concerned with usually return non-primitive
     * types of "object", "function", or "unknown".
     *
     * @private
     * @param {*} object The owner of the property.
     * @param {string} property The property to check.
     * @returns {boolean} Returns `true` if the property value is a non-primitive, else `false`.
     */
    function isHostType(object, property) {
      var type = object != null ? _typeof(object[property]) : 'number';
      return !/^(?:boolean|number|string|undefined)$/.test(type) && (type == 'object' ? !!object[property] : true);
    }

    /**
     * Prepares a string for use in a `RegExp` by making hyphens and spaces optional.
     *
     * @private
     * @param {string} string The string to qualify.
     * @returns {string} The qualified string.
     */
    function qualify(string) {
      return String(string).replace(/([ -])(?!$)/g, '$1?');
    }

    /**
     * A bare-bones `Array#reduce` like utility function.
     *
     * @private
     * @param {Array} array The array to iterate over.
     * @param {Function} callback The function called per iteration.
     * @returns {*} The accumulated result.
     */
    function reduce(array, callback) {
      var accumulator = null;
      each(array, function (value, index) {
        accumulator = callback(accumulator, value, index, array);
      });
      return accumulator;
    }

    /**
     * Removes leading and trailing whitespace from a string.
     *
     * @private
     * @param {string} string The string to trim.
     * @returns {string} The trimmed string.
     */
    function trim(string) {
      return String(string).replace(/^ +| +$/g, '');
    }

    /*--------------------------------------------------------------------------*/

    /**
     * Creates a new platform object.
     *
     * @memberOf platform
     * @param {Object|string} [ua=navigator.userAgent] The user agent string or
     *  context object.
     * @returns {Object} A platform object.
     */
    function parse(ua) {
      /** The environment context object. */
      var context = root;

      /** Used to flag when a custom context is provided. */
      var isCustomContext = ua && _typeof(ua) == 'object' && getClassOf(ua) != 'String';

      // Juggle arguments.
      if (isCustomContext) {
        context = ua;
        ua = null;
      }

      /** Browser navigator object. */
      var nav = context.navigator || {};

      /** Browser user agent string. */
      var userAgent = nav.userAgent || '';
      ua || (ua = userAgent);

      /** Used to detect if browser is like Chrome. */
      var likeChrome = isCustomContext ? !!nav.likeChrome : /\bChrome\b/.test(ua) && !/internal|\n/i.test(toString.toString());

      /** Internal `[[Class]]` value shortcuts. */
      var objectClass = 'Object',
        airRuntimeClass = isCustomContext ? objectClass : 'ScriptBridgingProxyObject',
        enviroClass = isCustomContext ? objectClass : 'Environment',
        javaClass = isCustomContext && context.java ? 'JavaPackage' : getClassOf(context.java),
        phantomClass = isCustomContext ? objectClass : 'RuntimeObject';

      /** Detect Java environments. */
      var java = /\bJava/.test(javaClass) && context.java;

      /** Detect Rhino. */
      var rhino = java && getClassOf(context.environment) == enviroClass;

      /** A character to represent alpha. */
      var alpha = java ? 'a' : "\u03B1";

      /** A character to represent beta. */
      var beta = java ? 'b' : "\u03B2";

      /** Browser document object. */
      var doc = context.document || {};

      /**
       * Detect Opera browser (Presto-based).
       * http://www.howtocreate.co.uk/operaStuff/operaObject.html
       * http://dev.opera.com/articles/view/opera-mini-web-content-authoring-guidelines/#operamini
       */
      var opera = context.operamini || context.opera;

      /** Opera `[[Class]]`. */
      var operaClass = reOpera.test(operaClass = isCustomContext && opera ? opera['[[Class]]'] : getClassOf(opera)) ? operaClass : opera = null;

      /*------------------------------------------------------------------------*/

      /** Temporary variable used over the script's lifetime. */
      var data;

      /** The CPU architecture. */
      var arch = ua;

      /** Platform description array. */
      var description = [];

      /** Platform alpha/beta indicator. */
      var prerelease = null;

      /** A flag to indicate that environment features should be used to resolve the platform. */
      var useFeatures = ua == userAgent;

      /** The browser/environment version. */
      var version = useFeatures && opera && typeof opera.version == 'function' && opera.version();

      /** A flag to indicate if the OS ends with "/ Version" */
      var isSpecialCasedOS;

      /* Detectable layout engines (order is important). */
      var layout = getLayout([{
        'label': 'EdgeHTML',
        'pattern': 'Edge'
      }, 'Trident', {
        'label': 'WebKit',
        'pattern': 'AppleWebKit'
      }, 'iCab', 'Presto', 'NetFront', 'Tasman', 'KHTML', 'Gecko']);

      /* Detectable browser names (order is important). */
      var name = getName(['Adobe AIR', 'Arora', 'Avant Browser', 'Breach', 'Camino', 'Electron', 'Epiphany', 'Fennec', 'Flock', 'Galeon', 'GreenBrowser', 'iCab', 'Iceweasel', 'K-Meleon', 'Konqueror', 'Lunascape', 'Maxthon', {
        'label': 'Microsoft Edge',
        'pattern': '(?:Edge|Edg|EdgA|EdgiOS)'
      }, 'Midori', 'Nook Browser', 'PaleMoon', 'PhantomJS', 'Raven', 'Rekonq', 'RockMelt', {
        'label': 'Samsung Internet',
        'pattern': 'SamsungBrowser'
      }, 'SeaMonkey', {
        'label': 'Silk',
        'pattern': '(?:Cloud9|Silk-Accelerated)'
      }, 'Sleipnir', 'SlimBrowser', {
        'label': 'SRWare Iron',
        'pattern': 'Iron'
      }, 'Sunrise', 'Swiftfox', 'Vivaldi', 'Waterfox', 'WebPositive', {
        'label': 'Yandex Browser',
        'pattern': 'YaBrowser'
      }, {
        'label': 'UC Browser',
        'pattern': 'UCBrowser'
      }, 'Opera Mini', {
        'label': 'Opera Mini',
        'pattern': 'OPiOS'
      }, 'Opera', {
        'label': 'Opera',
        'pattern': 'OPR'
      }, 'Chromium', 'Chrome', {
        'label': 'Chrome',
        'pattern': '(?:HeadlessChrome)'
      }, {
        'label': 'Chrome Mobile',
        'pattern': '(?:CriOS|CrMo)'
      }, {
        'label': 'Firefox',
        'pattern': '(?:Firefox|Minefield)'
      }, {
        'label': 'Firefox for iOS',
        'pattern': 'FxiOS'
      }, {
        'label': 'IE',
        'pattern': 'IEMobile'
      }, {
        'label': 'IE',
        'pattern': 'MSIE'
      }, 'Safari']);

      /* Detectable products (order is important). */
      var product = getProduct([{
        'label': 'BlackBerry',
        'pattern': 'BB10'
      }, 'BlackBerry', {
        'label': 'Galaxy S',
        'pattern': 'GT-I9000'
      }, {
        'label': 'Galaxy S2',
        'pattern': 'GT-I9100'
      }, {
        'label': 'Galaxy S3',
        'pattern': 'GT-I9300'
      }, {
        'label': 'Galaxy S4',
        'pattern': 'GT-I9500'
      }, {
        'label': 'Galaxy S5',
        'pattern': 'SM-G900'
      }, {
        'label': 'Galaxy S6',
        'pattern': 'SM-G920'
      }, {
        'label': 'Galaxy S6 Edge',
        'pattern': 'SM-G925'
      }, {
        'label': 'Galaxy S7',
        'pattern': 'SM-G930'
      }, {
        'label': 'Galaxy S7 Edge',
        'pattern': 'SM-G935'
      }, 'Google TV', 'Lumia', 'iPad', 'iPod', 'iPhone', 'Kindle', {
        'label': 'Kindle Fire',
        'pattern': '(?:Cloud9|Silk-Accelerated)'
      }, 'Nexus', 'Nook', 'PlayBook', 'PlayStation Vita', 'PlayStation', 'TouchPad', 'Transformer', {
        'label': 'Wii U',
        'pattern': 'WiiU'
      }, 'Wii', 'Xbox One', {
        'label': 'Xbox 360',
        'pattern': 'Xbox'
      }, 'Xoom']);

      /* Detectable manufacturers. */
      var manufacturer = getManufacturer({
        'Apple': {
          'iPad': 1,
          'iPhone': 1,
          'iPod': 1
        },
        'Alcatel': {},
        'Archos': {},
        'Amazon': {
          'Kindle': 1,
          'Kindle Fire': 1
        },
        'Asus': {
          'Transformer': 1
        },
        'Barnes & Noble': {
          'Nook': 1
        },
        'BlackBerry': {
          'PlayBook': 1
        },
        'Google': {
          'Google TV': 1,
          'Nexus': 1
        },
        'HP': {
          'TouchPad': 1
        },
        'HTC': {},
        'Huawei': {},
        'Lenovo': {},
        'LG': {},
        'Microsoft': {
          'Xbox': 1,
          'Xbox One': 1
        },
        'Motorola': {
          'Xoom': 1
        },
        'Nintendo': {
          'Wii U': 1,
          'Wii': 1
        },
        'Nokia': {
          'Lumia': 1
        },
        'Oppo': {},
        'Samsung': {
          'Galaxy S': 1,
          'Galaxy S2': 1,
          'Galaxy S3': 1,
          'Galaxy S4': 1
        },
        'Sony': {
          'PlayStation': 1,
          'PlayStation Vita': 1
        },
        'Xiaomi': {
          'Mi': 1,
          'Redmi': 1
        }
      });

      /* Detectable operating systems (order is important). */
      var os = getOS(['Windows Phone', 'KaiOS', 'Android', 'CentOS', {
        'label': 'Chrome OS',
        'pattern': 'CrOS'
      }, 'Debian', {
        'label': 'DragonFly BSD',
        'pattern': 'DragonFly'
      }, 'Fedora', 'FreeBSD', 'Gentoo', 'Haiku', 'Kubuntu', 'Linux Mint', 'OpenBSD', 'Red Hat', 'SuSE', 'Ubuntu', 'Xubuntu', 'Cygwin', 'Symbian OS', 'hpwOS', 'webOS ', 'webOS', 'Tablet OS', 'Tizen', 'Linux', 'Mac OS X', 'Macintosh', 'Mac', 'Windows 98;', 'Windows ']);

      /*------------------------------------------------------------------------*/

      /**
       * Picks the layout engine from an array of guesses.
       *
       * @private
       * @param {Array} guesses An array of guesses.
       * @returns {null|string} The detected layout engine.
       */
      function getLayout(guesses) {
        return reduce(guesses, function (result, guess) {
          return result || RegExp('\\b' + (guess.pattern || qualify(guess)) + '\\b', 'i').exec(ua) && (guess.label || guess);
        });
      }

      /**
       * Picks the manufacturer from an array of guesses.
       *
       * @private
       * @param {Array} guesses An object of guesses.
       * @returns {null|string} The detected manufacturer.
       */
      function getManufacturer(guesses) {
        return reduce(guesses, function (result, value, key) {
          // Lookup the manufacturer by product or scan the UA for the manufacturer.
          return result || (value[product] || value[/^[a-z]+(?: +[a-z]+\b)*/i.exec(product)] || RegExp('\\b' + qualify(key) + '(?:\\b|\\w*\\d)', 'i').exec(ua)) && key;
        });
      }

      /**
       * Picks the browser name from an array of guesses.
       *
       * @private
       * @param {Array} guesses An array of guesses.
       * @returns {null|string} The detected browser name.
       */
      function getName(guesses) {
        return reduce(guesses, function (result, guess) {
          return result || RegExp('\\b' + (guess.pattern || qualify(guess)) + '\\b', 'i').exec(ua) && (guess.label || guess);
        });
      }

      /**
       * Picks the OS name from an array of guesses.
       *
       * @private
       * @param {Array} guesses An array of guesses.
       * @returns {null|string} The detected OS name.
       */
      function getOS(guesses) {
        return reduce(guesses, function (result, guess) {
          var pattern = guess.pattern || qualify(guess);
          if (!result && (result = RegExp('\\b' + pattern + '(?:/[\\d.]+|[ \\w.]*)', 'i').exec(ua))) {
            result = cleanupOS(result, pattern, guess.label || guess);
          }
          return result;
        });
      }

      /**
       * Picks the product name from an array of guesses.
       *
       * @private
       * @param {Array} guesses An array of guesses.
       * @returns {null|string} The detected product name.
       */
      function getProduct(guesses) {
        return reduce(guesses, function (result, guess) {
          var pattern = guess.pattern || qualify(guess);
          if (!result && (result = RegExp('\\b' + pattern + ' *\\d+[.\\w_]*', 'i').exec(ua) || RegExp('\\b' + pattern + ' *\\w+-[\\w]*', 'i').exec(ua) || RegExp('\\b' + pattern + '(?:; *(?:[a-z]+[_-])?[a-z]+\\d+|[^ ();-]*)', 'i').exec(ua))) {
            // Split by forward slash and append product version if needed.
            if ((result = String(guess.label && !RegExp(pattern, 'i').test(guess.label) ? guess.label : result).split('/'))[1] && !/[\d.]+/.test(result[0])) {
              result[0] += ' ' + result[1];
            }
            // Correct character case and cleanup string.
            guess = guess.label || guess;
            result = format(result[0].replace(RegExp(pattern, 'i'), guess).replace(RegExp('; *(?:' + guess + '[_-])?', 'i'), ' ').replace(RegExp('(' + guess + ')[-_.]?(\\w)', 'i'), '$1 $2'));
          }
          return result;
        });
      }

      /**
       * Resolves the version using an array of UA patterns.
       *
       * @private
       * @param {Array} patterns An array of UA patterns.
       * @returns {null|string} The detected version.
       */
      function getVersion(patterns) {
        return reduce(patterns, function (result, pattern) {
          return result || (RegExp(pattern + '(?:-[\\d.]+/|(?: for [\\w-]+)?[ /-])([\\d.]+[^ ();/_-]*)', 'i').exec(ua) || 0)[1] || null;
        });
      }

      /**
       * Returns `platform.description` when the platform object is coerced to a string.
       *
       * @name toString
       * @memberOf platform
       * @returns {string} Returns `platform.description` if available, else an empty string.
       */
      function toStringPlatform() {
        return this.description || '';
      }

      /*------------------------------------------------------------------------*/

      // Convert layout to an array so we can add extra details.
      layout && (layout = [layout]);

      // Detect Android products.
      // Browsers on Android devices typically provide their product IDS after "Android;"
      // up to "Build" or ") AppleWebKit".
      // Example:
      // "Mozilla/5.0 (Linux; Android 8.1.0; Moto G (5) Plus) AppleWebKit/537.36
      // (KHTML, like Gecko) Chrome/70.0.3538.80 Mobile Safari/537.36"
      if (/\bAndroid\b/.test(os) && !product && (data = /\bAndroid[^;]*;(.*?)(?:Build|\) AppleWebKit)\b/i.exec(ua))) {
        product = trim(data[1])
        // Replace any language codes (eg. "en-US").
        .replace(/^[a-z]{2}-[a-z]{2};\s*/i, '') || null;
      }
      // Detect product names that contain their manufacturer's name.
      if (manufacturer && !product) {
        product = getProduct([manufacturer]);
      } else if (manufacturer && product) {
        product = product.replace(RegExp('^(' + qualify(manufacturer) + ')[-_.\\s]', 'i'), manufacturer + ' ').replace(RegExp('^(' + qualify(manufacturer) + ')[-_.]?(\\w)', 'i'), manufacturer + ' $2');
      }
      // Clean up Google TV.
      if (data = /\bGoogle TV\b/.exec(product)) {
        product = data[0];
      }
      // Detect simulators.
      if (/\bSimulator\b/i.test(ua)) {
        product = (product ? product + ' ' : '') + 'Simulator';
      }
      // Detect Opera Mini 8+ running in Turbo/Uncompressed mode on iOS.
      if (name == 'Opera Mini' && /\bOPiOS\b/.test(ua)) {
        description.push('running in Turbo/Uncompressed mode');
      }
      // Detect IE Mobile 11.
      if (name == 'IE' && /\blike iPhone OS\b/.test(ua)) {
        data = parse(ua.replace(/like iPhone OS/, ''));
        manufacturer = data.manufacturer;
        product = data.product;
      }
      // Detect iOS.
      else if (/^iP/.test(product)) {
        name || (name = 'Safari');
        os = 'iOS' + ((data = / OS ([\d_]+)/i.exec(ua)) ? ' ' + data[1].replace(/_/g, '.') : '');
      }
      // Detect Kubuntu.
      else if (name == 'Konqueror' && /^Linux\b/i.test(os)) {
        os = 'Kubuntu';
      }
      // Detect Android browsers.
      else if (manufacturer && manufacturer != 'Google' && (/Chrome/.test(name) && !/\bMobile Safari\b/i.test(ua) || /\bVita\b/.test(product)) || /\bAndroid\b/.test(os) && /^Chrome/.test(name) && /\bVersion\//i.test(ua)) {
        name = 'Android Browser';
        os = /\bAndroid\b/.test(os) ? os : 'Android';
      }
      // Detect Silk desktop/accelerated modes.
      else if (name == 'Silk') {
        if (!/\bMobi/i.test(ua)) {
          os = 'Android';
          description.unshift('desktop mode');
        }
        if (/Accelerated *= *true/i.test(ua)) {
          description.unshift('accelerated');
        }
      }
      // Detect UC Browser speed mode.
      else if (name == 'UC Browser' && /\bUCWEB\b/.test(ua)) {
        description.push('speed mode');
      }
      // Detect PaleMoon identifying as Firefox.
      else if (name == 'PaleMoon' && (data = /\bFirefox\/([\d.]+)\b/.exec(ua))) {
        description.push('identifying as Firefox ' + data[1]);
      }
      // Detect Firefox OS and products running Firefox.
      else if (name == 'Firefox' && (data = /\b(Mobile|Tablet|TV)\b/i.exec(ua))) {
        os || (os = 'Firefox OS');
        product || (product = data[1]);
      }
      // Detect false positives for Firefox/Safari.
      else if (!name || (data = !/\bMinefield\b/i.test(ua) && /\b(?:Firefox|Safari)\b/.exec(name))) {
        // Escape the `/` for Firefox 1.
        if (name && !product && /[\/,]|^[^(]+?\)/.test(ua.slice(ua.indexOf(data + '/') + 8))) {
          // Clear name of false positives.
          name = null;
        }
        // Reassign a generic name.
        if ((data = product || manufacturer || os) && (product || manufacturer || /\b(?:Android|Symbian OS|Tablet OS|webOS)\b/.test(os))) {
          name = /[a-z]+(?: Hat)?/i.exec(/\bAndroid\b/.test(os) ? os : data) + ' Browser';
        }
      }
      // Add Chrome version to description for Electron.
      else if (name == 'Electron' && (data = (/\bChrome\/([\d.]+)\b/.exec(ua) || 0)[1])) {
        description.push('Chromium ' + data);
      }
      // Detect non-Opera (Presto-based) versions (order is important).
      if (!version) {
        version = getVersion(['(?:Cloud9|CriOS|CrMo|Edge|Edg|EdgA|EdgiOS|FxiOS|HeadlessChrome|IEMobile|Iron|Opera ?Mini|OPiOS|OPR|Raven|SamsungBrowser|Silk(?!/[\\d.]+$)|UCBrowser|YaBrowser)', 'Version', qualify(name), '(?:Firefox|Minefield|NetFront)']);
      }
      // Detect stubborn layout engines.
      if (data = layout == 'iCab' && parseFloat(version) > 3 && 'WebKit' || /\bOpera\b/.test(name) && (/\bOPR\b/.test(ua) ? 'Blink' : 'Presto') || /\b(?:Midori|Nook|Safari)\b/i.test(ua) && !/^(?:Trident|EdgeHTML)$/.test(layout) && 'WebKit' || !layout && /\bMSIE\b/i.test(ua) && (os == 'Mac OS' ? 'Tasman' : 'Trident') || layout == 'WebKit' && /\bPlayStation\b(?! Vita\b)/i.test(name) && 'NetFront') {
        layout = [data];
      }
      // Detect Windows Phone 7 desktop mode.
      if (name == 'IE' && (data = (/; *(?:XBLWP|ZuneWP)(\d+)/i.exec(ua) || 0)[1])) {
        name += ' Mobile';
        os = 'Windows Phone ' + (/\+$/.test(data) ? data : data + '.x');
        description.unshift('desktop mode');
      }
      // Detect Windows Phone 8.x desktop mode.
      else if (/\bWPDesktop\b/i.test(ua)) {
        name = 'IE Mobile';
        os = 'Windows Phone 8.x';
        description.unshift('desktop mode');
        version || (version = (/\brv:([\d.]+)/.exec(ua) || 0)[1]);
      }
      // Detect IE 11 identifying as other browsers.
      else if (name != 'IE' && layout == 'Trident' && (data = /\brv:([\d.]+)/.exec(ua))) {
        if (name) {
          description.push('identifying as ' + name + (version ? ' ' + version : ''));
        }
        name = 'IE';
        version = data[1];
      }
      // Leverage environment features.
      if (useFeatures) {
        // Detect server-side environments.
        // Rhino has a global function while others have a global object.
        if (isHostType(context, 'global')) {
          if (java) {
            data = java.lang.System;
            arch = data.getProperty('os.arch');
            os = os || data.getProperty('os.name') + ' ' + data.getProperty('os.version');
          }
          if (rhino) {
            try {
              version = context.require('ringo/engine').version.join('.');
              name = 'RingoJS';
            } catch (e) {
              if ((data = context.system) && data.global.system == context.system) {
                name = 'Narwhal';
                os || (os = data[0].os || null);
              }
            }
            if (!name) {
              name = 'Rhino';
            }
          } else if (_typeof(context.process) == 'object' && !context.process.browser && (data = context.process)) {
            if (_typeof(data.versions) == 'object') {
              if (typeof data.versions.electron == 'string') {
                description.push('Node ' + data.versions.node);
                name = 'Electron';
                version = data.versions.electron;
              } else if (typeof data.versions.nw == 'string') {
                description.push('Chromium ' + version, 'Node ' + data.versions.node);
                name = 'NW.js';
                version = data.versions.nw;
              }
            }
            if (!name) {
              name = 'Node.js';
              arch = data.arch;
              os = data.platform;
              version = /[\d.]+/.exec(data.version);
              version = version ? version[0] : null;
            }
          }
        }
        // Detect Adobe AIR.
        else if (getClassOf(data = context.runtime) == airRuntimeClass) {
          name = 'Adobe AIR';
          os = data.flash.system.Capabilities.os;
        }
        // Detect PhantomJS.
        else if (getClassOf(data = context.phantom) == phantomClass) {
          name = 'PhantomJS';
          version = (data = data.version || null) && data.major + '.' + data.minor + '.' + data.patch;
        }
        // Detect IE compatibility modes.
        else if (typeof doc.documentMode == 'number' && (data = /\bTrident\/(\d+)/i.exec(ua))) {
          // We're in compatibility mode when the Trident version + 4 doesn't
          // equal the document mode.
          version = [version, doc.documentMode];
          if ((data = +data[1] + 4) != version[1]) {
            description.push('IE ' + version[1] + ' mode');
            layout && (layout[1] = '');
            version[1] = data;
          }
          version = name == 'IE' ? String(version[1].toFixed(1)) : version[0];
        }
        // Detect IE 11 masking as other browsers.
        else if (typeof doc.documentMode == 'number' && /^(?:Chrome|Firefox)\b/.test(name)) {
          description.push('masking as ' + name + ' ' + version);
          name = 'IE';
          version = '11.0';
          layout = ['Trident'];
          os = 'Windows';
        }
        os = os && format(os);
      }
      // Detect prerelease phases.
      if (version && (data = /(?:[ab]|dp|pre|[ab]\d+pre)(?:\d+\+?)?$/i.exec(version) || /(?:alpha|beta)(?: ?\d)?/i.exec(ua + ';' + (useFeatures && nav.appMinorVersion)) || /\bMinefield\b/i.test(ua) && 'a')) {
        prerelease = /b/i.test(data) ? 'beta' : 'alpha';
        version = version.replace(RegExp(data + '\\+?$'), '') + (prerelease == 'beta' ? beta : alpha) + (/\d+\+?/.exec(data) || '');
      }
      // Detect Firefox Mobile.
      if (name == 'Fennec' || name == 'Firefox' && /\b(?:Android|Firefox OS|KaiOS)\b/.test(os)) {
        name = 'Firefox Mobile';
      }
      // Obscure Maxthon's unreliable version.
      else if (name == 'Maxthon' && version) {
        version = version.replace(/\.[\d.]+/, '.x');
      }
      // Detect Xbox 360 and Xbox One.
      else if (/\bXbox\b/i.test(product)) {
        if (product == 'Xbox 360') {
          os = null;
        }
        if (product == 'Xbox 360' && /\bIEMobile\b/.test(ua)) {
          description.unshift('mobile mode');
        }
      }
      // Add mobile postfix.
      else if ((/^(?:Chrome|IE|Opera)$/.test(name) || name && !product && !/Browser|Mobi/.test(name)) && (os == 'Windows CE' || /Mobi/i.test(ua))) {
        name += ' Mobile';
      }
      // Detect IE platform preview.
      else if (name == 'IE' && useFeatures) {
        try {
          if (context.external === null) {
            description.unshift('platform preview');
          }
        } catch (e) {
          description.unshift('embedded');
        }
      }
      // Detect BlackBerry OS version.
      // http://docs.blackberry.com/en/developers/deliverables/18169/HTTP_headers_sent_by_BB_Browser_1234911_11.jsp
      else if ((/\bBlackBerry\b/.test(product) || /\bBB10\b/.test(ua)) && (data = (RegExp(product.replace(/ +/g, ' *') + '/([.\\d]+)', 'i').exec(ua) || 0)[1] || version)) {
        data = [data, /BB10/.test(ua)];
        os = (data[1] ? (product = null, manufacturer = 'BlackBerry') : 'Device Software') + ' ' + data[0];
        version = null;
      }
      // Detect Opera identifying/masking itself as another browser.
      // http://www.opera.com/support/kb/view/843/
      else if (this != forOwn && product != 'Wii' && (useFeatures && opera || /Opera/.test(name) && /\b(?:MSIE|Firefox)\b/i.test(ua) || name == 'Firefox' && /\bOS X (?:\d+\.){2,}/.test(os) || name == 'IE' && (os && !/^Win/.test(os) && version > 5.5 || /\bWindows XP\b/.test(os) && version > 8 || version == 8 && !/\bTrident\b/.test(ua))) && !reOpera.test(data = parse.call(forOwn, ua.replace(reOpera, '') + ';')) && data.name) {
        // When "identifying", the UA contains both Opera and the other browser's name.
        data = 'ing as ' + data.name + ((data = data.version) ? ' ' + data : '');
        if (reOpera.test(name)) {
          if (/\bIE\b/.test(data) && os == 'Mac OS') {
            os = null;
          }
          data = 'identify' + data;
        }
        // When "masking", the UA contains only the other browser's name.
        else {
          data = 'mask' + data;
          if (operaClass) {
            name = format(operaClass.replace(/([a-z])([A-Z])/g, '$1 $2'));
          } else {
            name = 'Opera';
          }
          if (/\bIE\b/.test(data)) {
            os = null;
          }
          if (!useFeatures) {
            version = null;
          }
        }
        layout = ['Presto'];
        description.push(data);
      }
      // Detect WebKit Nightly and approximate Chrome/Safari versions.
      if (data = (/\bAppleWebKit\/([\d.]+\+?)/i.exec(ua) || 0)[1]) {
        // Correct build number for numeric comparison.
        // (e.g. "532.5" becomes "532.05")
        data = [parseFloat(data.replace(/\.(\d)$/, '.0$1')), data];
        // Nightly builds are postfixed with a "+".
        if (name == 'Safari' && data[1].slice(-1) == '+') {
          name = 'WebKit Nightly';
          prerelease = 'alpha';
          version = data[1].slice(0, -1);
        }
        // Clear incorrect browser versions.
        else if (version == data[1] || version == (data[2] = (/\bSafari\/([\d.]+\+?)/i.exec(ua) || 0)[1])) {
          version = null;
        }
        // Use the full Chrome version when available.
        data[1] = (/\b(?:Headless)?Chrome\/([\d.]+)/i.exec(ua) || 0)[1];
        // Detect Blink layout engine.
        if (data[0] == 537.36 && data[2] == 537.36 && parseFloat(data[1]) >= 28 && layout == 'WebKit') {
          layout = ['Blink'];
        }
        // Detect JavaScriptCore.
        // http://stackoverflow.com/questions/6768474/how-can-i-detect-which-javascript-engine-v8-or-jsc-is-used-at-runtime-in-androi
        if (!useFeatures || !likeChrome && !data[1]) {
          layout && (layout[1] = 'like Safari');
          data = (data = data[0], data < 400 ? 1 : data < 500 ? 2 : data < 526 ? 3 : data < 533 ? 4 : data < 534 ? '4+' : data < 535 ? 5 : data < 537 ? 6 : data < 538 ? 7 : data < 601 ? 8 : data < 602 ? 9 : data < 604 ? 10 : data < 606 ? 11 : data < 608 ? 12 : '12');
        } else {
          layout && (layout[1] = 'like Chrome');
          data = data[1] || (data = data[0], data < 530 ? 1 : data < 532 ? 2 : data < 532.05 ? 3 : data < 533 ? 4 : data < 534.03 ? 5 : data < 534.07 ? 6 : data < 534.10 ? 7 : data < 534.13 ? 8 : data < 534.16 ? 9 : data < 534.24 ? 10 : data < 534.30 ? 11 : data < 535.01 ? 12 : data < 535.02 ? '13+' : data < 535.07 ? 15 : data < 535.11 ? 16 : data < 535.19 ? 17 : data < 536.05 ? 18 : data < 536.10 ? 19 : data < 537.01 ? 20 : data < 537.11 ? '21+' : data < 537.13 ? 23 : data < 537.18 ? 24 : data < 537.24 ? 25 : data < 537.36 ? 26 : layout != 'Blink' ? '27' : '28');
        }
        // Add the postfix of ".x" or "+" for approximate versions.
        layout && (layout[1] += ' ' + (data += typeof data == 'number' ? '.x' : /[.+]/.test(data) ? '' : '+'));
        // Obscure version for some Safari 1-2 releases.
        if (name == 'Safari' && (!version || parseInt(version) > 45)) {
          version = data;
        } else if (name == 'Chrome' && /\bHeadlessChrome/i.test(ua)) {
          description.unshift('headless');
        }
      }
      // Detect Opera desktop modes.
      if (name == 'Opera' && (data = /\bzbov|zvav$/.exec(os))) {
        name += ' ';
        description.unshift('desktop mode');
        if (data == 'zvav') {
          name += 'Mini';
          version = null;
        } else {
          name += 'Mobile';
        }
        os = os.replace(RegExp(' *' + data + '$'), '');
      }
      // Detect Chrome desktop mode.
      else if (name == 'Safari' && /\bChrome\b/.exec(layout && layout[1])) {
        description.unshift('desktop mode');
        name = 'Chrome Mobile';
        version = null;
        if (/\bOS X\b/.test(os)) {
          manufacturer = 'Apple';
          os = 'iOS 4.3+';
        } else {
          os = null;
        }
      }
      // Newer versions of SRWare Iron uses the Chrome tag to indicate its version number.
      else if (/\bSRWare Iron\b/.test(name) && !version) {
        version = getVersion('Chrome');
      }
      // Strip incorrect OS versions.
      if (version && version.indexOf(data = /[\d.]+$/.exec(os)) == 0 && ua.indexOf('/' + data + '-') > -1) {
        os = trim(os.replace(data, ''));
      }
      // Ensure OS does not include the browser name.
      if (os && os.indexOf(name) != -1 && !RegExp(name + ' OS').test(os)) {
        os = os.replace(RegExp(' *' + qualify(name) + ' *'), '');
      }
      // Add layout engine.
      if (layout && !/\b(?:Avant|Nook)\b/.test(name) && (/Browser|Lunascape|Maxthon/.test(name) || name != 'Safari' && /^iOS/.test(os) && /\bSafari\b/.test(layout[1]) || /^(?:Adobe|Arora|Breach|Midori|Opera|Phantom|Rekonq|Rock|Samsung Internet|Sleipnir|SRWare Iron|Vivaldi|Web)/.test(name) && layout[1])) {
        // Don't add layout details to description if they are falsey.
        (data = layout[layout.length - 1]) && description.push(data);
      }
      // Combine contextual information.
      if (description.length) {
        description = ['(' + description.join('; ') + ')'];
      }
      // Append manufacturer to description.
      if (manufacturer && product && product.indexOf(manufacturer) < 0) {
        description.push('on ' + manufacturer);
      }
      // Append product to description.
      if (product) {
        description.push((/^on /.test(description[description.length - 1]) ? '' : 'on ') + product);
      }
      // Parse the OS into an object.
      if (os) {
        data = / ([\d.+]+)$/.exec(os);
        isSpecialCasedOS = data && os.charAt(os.length - data[0].length - 1) == '/';
        os = {
          'architecture': 32,
          'family': data && !isSpecialCasedOS ? os.replace(data[0], '') : os,
          'version': data ? data[1] : null,
          'toString': function toString() {
            var version = this.version;
            return this.family + (version && !isSpecialCasedOS ? ' ' + version : '') + (this.architecture == 64 ? ' 64-bit' : '');
          }
        };
      }
      // Add browser/OS architecture.
      if ((data = /\b(?:AMD|IA|Win|WOW|x86_|x)64\b/i.exec(arch)) && !/\bi686\b/i.test(arch)) {
        if (os) {
          os.architecture = 64;
          os.family = os.family.replace(RegExp(' *' + data), '');
        }
        if (name && (/\bWOW64\b/i.test(ua) || useFeatures && /\w(?:86|32)$/.test(nav.cpuClass || nav.platform) && !/\bWin64; x64\b/i.test(ua))) {
          description.unshift('32-bit');
        }
      }
      // Chrome 39 and above on OS X is always 64-bit.
      else if (os && /^OS X/.test(os.family) && name == 'Chrome' && parseFloat(version) >= 39) {
        os.architecture = 64;
      }
      ua || (ua = null);

      /*------------------------------------------------------------------------*/

      /**
       * The platform object.
       *
       * @name platform
       * @type Object
       */
      var platform = {};

      /**
       * The platform description.
       *
       * @memberOf platform
       * @type string|null
       */
      platform.description = ua;

      /**
       * The name of the browser's layout engine.
       *
       * The list of common layout engines include:
       * "Blink", "EdgeHTML", "Gecko", "Trident" and "WebKit"
       *
       * @memberOf platform
       * @type string|null
       */
      platform.layout = layout && layout[0];

      /**
       * The name of the product's manufacturer.
       *
       * The list of manufacturers include:
       * "Apple", "Archos", "Amazon", "Asus", "Barnes & Noble", "BlackBerry",
       * "Google", "HP", "HTC", "LG", "Microsoft", "Motorola", "Nintendo",
       * "Nokia", "Samsung" and "Sony"
       *
       * @memberOf platform
       * @type string|null
       */
      platform.manufacturer = manufacturer;

      /**
       * The name of the browser/environment.
       *
       * The list of common browser names include:
       * "Chrome", "Electron", "Firefox", "Firefox for iOS", "IE",
       * "Microsoft Edge", "PhantomJS", "Safari", "SeaMonkey", "Silk",
       * "Opera Mini" and "Opera"
       *
       * Mobile versions of some browsers have "Mobile" appended to their name:
       * eg. "Chrome Mobile", "Firefox Mobile", "IE Mobile" and "Opera Mobile"
       *
       * @memberOf platform
       * @type string|null
       */
      platform.name = name;

      /**
       * The alpha/beta release indicator.
       *
       * @memberOf platform
       * @type string|null
       */
      platform.prerelease = prerelease;

      /**
       * The name of the product hosting the browser.
       *
       * The list of common products include:
       *
       * "BlackBerry", "Galaxy S4", "Lumia", "iPad", "iPod", "iPhone", "Kindle",
       * "Kindle Fire", "Nexus", "Nook", "PlayBook", "TouchPad" and "Transformer"
       *
       * @memberOf platform
       * @type string|null
       */
      platform.product = product;

      /**
       * The browser's user agent string.
       *
       * @memberOf platform
       * @type string|null
       */
      platform.ua = ua;

      /**
       * The browser/environment version.
       *
       * @memberOf platform
       * @type string|null
       */
      platform.version = name && version;

      /**
       * The name of the operating system.
       *
       * @memberOf platform
       * @type Object
       */
      platform.os = os || {
        /**
         * The CPU architecture the OS is built for.
         *
         * @memberOf platform.os
         * @type number|null
         */
        'architecture': null,
        /**
         * The family of the OS.
         *
         * Common values include:
         * "Windows", "Windows Server 2008 R2 / 7", "Windows Server 2008 / Vista",
         * "Windows XP", "OS X", "Linux", "Ubuntu", "Debian", "Fedora", "Red Hat",
         * "SuSE", "Android", "iOS" and "Windows Phone"
         *
         * @memberOf platform.os
         * @type string|null
         */
        'family': null,
        /**
         * The version of the OS.
         *
         * @memberOf platform.os
         * @type string|null
         */
        'version': null,
        /**
         * Returns the OS string.
         *
         * @memberOf platform.os
         * @returns {string} The OS string.
         */
        'toString': function toString() {
          return 'null';
        }
      };
      platform.parse = parse;
      platform.toString = toStringPlatform;
      if (platform.version) {
        description.unshift(version);
      }
      if (platform.name) {
        description.unshift(name);
      }
      if (os && name && !(os == String(os).split(' ')[0] && (os == name.split(' ')[0] || product))) {
        description.push(product ? '(' + os + ')' : 'on ' + os);
      }
      if (description.length) {
        platform.description = description.join(' ');
      }
      return platform;
    }

    /*--------------------------------------------------------------------------*/

    // Export platform.
    var platform = parse();

    // Some AMD build optimizers, like r.js, check for condition patterns like the following:
    if (typeof define == 'function' && _typeof(define.amd) == 'object' && define.amd) {
      // Expose platform on the global object to prevent errors when platform is
      // loaded by a script tag in the presence of an AMD loader.
      // See http://requirejs.org/docs/errors.html#mismatch for more details.
      root.platform = platform;

      // Define as an anonymous module so platform can be aliased through path mapping.
      define(function () {
        return platform;
      });
    }
    // Check for `exports` after `define` in case a build optimizer adds an `exports` object.
    else if (freeExports && freeModule) {
      // Export for CommonJS support.
      forOwn(platform, function (value, key) {
        freeExports[key] = value;
      });
    } else {
      // Export to the global object.
      root.platform = platform;
    }

    var _deviceResolution = /*#__PURE__*/new WeakMap();
    var _deviceModel = /*#__PURE__*/new WeakMap();
    var _deviceTimezone = /*#__PURE__*/new WeakMap();
    var Device = /*#__PURE__*/function () {
      function Device() {
        _classCallCheck(this, Device);
        _classPrivateFieldInitSpec(this, _deviceResolution, void 0);
        _classPrivateFieldInitSpec(this, _deviceModel, void 0);
        _classPrivateFieldInitSpec(this, _deviceTimezone, void 0);
      }
      return _createClass(Device, [{
        key: "calculateDeviceResolution",
        value: function calculateDeviceResolution() {
          _classPrivateFieldSet2(_deviceResolution, this, window.screen.width + "X" + window.screen.height);
        }
      }, {
        key: "calculateDeviceModel",
        value: function calculateDeviceModel() {
          _classPrivateFieldSet2(_deviceModel, this, platform.product ? platform.product : "unknown");
        }
      }, {
        key: "calculateDeviceTimezone",
        value: function calculateDeviceTimezone() {
          _classPrivateFieldSet2(_deviceTimezone, this, Intl.DateTimeFormat().resolvedOptions().timeZone);
        }
      }, {
        key: "getDeviceData",
        get: function get() {
          return {
            deviceResolution: _classPrivateFieldGet2(_deviceResolution, this),
            deviceModel: _classPrivateFieldGet2(_deviceModel, this),
            deviceTimezone: _classPrivateFieldGet2(_deviceTimezone, this)
          };
        }
      }]);
    }();

    var getQueryParameter = function getQueryParameter(query, sParam) {
      var sPageURL = query.includes('?') ? decodeURIComponent(query.substring(1)) : decodeURIComponent(query);
      var sURLVariables = sPageURL.split('&');
      var sParameterName, i;
      for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split(/=([^]*)/);
        if (sParameterName[0] === sParam) return sParameterName[1] || true;
      }
    };
    var getQueryString = function getQueryString(url) {
      return url.split('?')[1] || '';
    };
    var isMbepDomain = function isMbepDomain() {
      var mbepDomains = ["parliament.ru", "marlboro.ru", "mrphilipmorris.ru", "bondstreet.ru", "lmlab.ru", "nextlook.ru", "mychesterfield.ru"];
      var preparedDomain = window.location.host.split('.').slice(-2).join('.');
      return mbepDomains.includes(preparedDomain);
    };

    const byteToHex = [];
    for (let i = 0; i < 256; ++i) {
        byteToHex.push((i + 0x100).toString(16).slice(1));
    }
    function unsafeStringify(arr, offset = 0) {
        return (byteToHex[arr[offset + 0]] +
            byteToHex[arr[offset + 1]] +
            byteToHex[arr[offset + 2]] +
            byteToHex[arr[offset + 3]] +
            '-' +
            byteToHex[arr[offset + 4]] +
            byteToHex[arr[offset + 5]] +
            '-' +
            byteToHex[arr[offset + 6]] +
            byteToHex[arr[offset + 7]] +
            '-' +
            byteToHex[arr[offset + 8]] +
            byteToHex[arr[offset + 9]] +
            '-' +
            byteToHex[arr[offset + 10]] +
            byteToHex[arr[offset + 11]] +
            byteToHex[arr[offset + 12]] +
            byteToHex[arr[offset + 13]] +
            byteToHex[arr[offset + 14]] +
            byteToHex[arr[offset + 15]]).toLowerCase();
    }

    let getRandomValues;
    const rnds8 = new Uint8Array(16);
    function rng() {
        if (!getRandomValues) {
            if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
                throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
            }
            getRandomValues = crypto.getRandomValues.bind(crypto);
        }
        return getRandomValues(rnds8);
    }

    const randomUUID = typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID.bind(crypto);
    var native = { randomUUID };

    function v4(options, buf, offset) {
        if (native.randomUUID && !buf && !options) {
            return native.randomUUID();
        }
        options = options || {};
        const rnds = options.random ?? options.rng?.() ?? rng();
        if (rnds.length < 16) {
            throw new Error('Random bytes length must be >= 16');
        }
        rnds[6] = (rnds[6] & 0x0f) | 0x40;
        rnds[8] = (rnds[8] & 0x3f) | 0x80;
        if (buf) {
            offset = offset || 0;
            if (offset < 0 || offset + 16 > buf.length) {
                throw new RangeError(`UUID byte range ${offset}:${offset + 15} is out of buffer bounds`);
            }
            for (let i = 0; i < 16; ++i) {
                buf[offset + i] = rnds[i];
            }
            return buf;
        }
        return unsafeStringify(rnds);
    }

    new URL(document.currentScript.src).host;
    function getScript(scriptUrl, callback) {
      var script = document.createElement('script');
      script.src = scriptUrl;
      script.onload = callback;
      document.body.appendChild(script);
    }
    function executeCaptcha(cb) {
      var repeats = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;
      try {
        grecaptcha.execute('6LcXBdEZAAAAAHJnopGOUJ1DQls4rhdvUz-8Oy8i', {
          action: 'registration'
        }).then(function (token) {
          cb(token);
        });
      } catch (error) {
        if (error.message && error.message.includes('not loaded in api.js')) {
          getScript("https://www.google.com/recaptcha/api.js?render=6LcXBdEZAAAAAHJnopGOUJ1DQls4rhdvUz-8Oy8i", function () {
            setTimeout(function () {
              if (repeats > 0) executeCaptcha(cb, repeats - 1);else console.error("UBE AF: " + error.message);
            }, 500);
          });
        } else {
          console.error(error);
        }
      }
    }
    function validateCaptchaV3(cb) {
      try {
        if (grecaptcha) {
          grecaptcha.ready(function () {
            executeCaptcha(cb);
          });
        } else {
          var message = "Google ReCaptcha library not found or broken";
          console.error("UBE AF: " + message);
          cb(undefined, message);
        }
      } catch (e) {
        if (window.location.host.includes('force.com')) {
          cb(undefined, _message);
        } else {
          getScript("https://www.google.com/recaptcha/api.js?render=6LcXBdEZAAAAAHJnopGOUJ1DQls4rhdvUz-8Oy8i", function () {
            validateCaptchaV3(cb);
          });
        }
        var _message = "Google ReCaptcha exception: " + (e && e.message || e);
        console.error("UBE AF: " + _message);
        console.log('UBE :: loading recaptcha v3 API...');
      }
    }

    /**
     * Calculate fingerprint data
     * @param [key] - optional ube form key
     * @param [token] - optional recaptcha v3 token
     * @returns {Promise<{c: string, a:string, f: string, r: string, m: string, z: string, h: string, g: string, token?: string, tokenError?: string}>}
     */
    function calculate(key, token) {
      return new Promise(function (callback) {
        var fingerPrint = new Fingerprint();
        var device = new Device();
        fingerPrint.calculateAudioFingerprint();
        fingerPrint.calculateCanvasBase64();
        fingerPrint.calculateFontFingerprint();
        device.calculateDeviceResolution();
        device.calculateDeviceModel();
        device.calculateDeviceTimezone();
        setTimeout(function () {
          var hashParams = fingerPrint.fingerprintData;
          var deviceParams = device.getDeviceData;
          var d = ubeCookie('_d') || v4();
          var data = {
            c: hashParams.c,
            a: hashParams.a,
            f: hashParams.f,
            r: deviceParams.deviceResolution,
            m: deviceParams.deviceModel,
            z: deviceParams.deviceTimezone,
            h: window.location.href,
            g: d,
            key: key
          };
          ubeCookie('_d', d);
          var scanToken = getQueryParameter(window.location.search, 'scanToken');
          if (scanToken) {
            data.scanToken = scanToken;
          }
          var toReturn = _objectSpread2({}, data);
          function afterCaptcha(token, error) {
            if (token) toReturn.token = token;else if (error) toReturn.tokenError = error;
            callback(toReturn);
          }
          if (!token) {
            validateCaptchaV3(afterCaptcha);
          } else {
            toReturn.token = token;
            callback(toReturn);
          }
        }, 500);
      });
    }

    /**
     * Write captcha v3 score to storage
     * @param data
     * @returns data
     */

    function setCaptchaScore(data) {
      data && data.captchaScore && sessionStorage.setItem('impressionScore', data.captchaScore);
      return data;
    }

    /**
     * Send fingerprint data to collect impression token
     * @param data
     * @returns {Promise<{token: string}>}
     */
    function send(data) {
      var options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
      return fetch("https://ube-test.pmsm.org.ru/api/impression/token", options).then(function (response) {
        return response.json();
      })["catch"](function (e) {
        console.error("UBE AF: Error requesting Impression API");
        console.error(e);
        throw e;
      });
    }
    var isImpressionStarted = false;
    window.Impression = {
      /**
       * Write impression token in ube
       * @param [key] - optional ube form key
       */
      runImpression: function runImpression(key) {
        if (key && !window.location.host.includes('force.com') && !$.ube.impressionToken && !isImpressionStarted) {
          this.getToken(key).then(function (res) {
            $.ube.impressionToken = res;
            isImpressionStarted = true;
          })["catch"](function (e) {
            return console.log(e);
          });
        }
      },
      /**
       * Get Impression token
       * @param [key] - optional ube form key
       * @param [token] - optional recaptcha v3 token
       * @returns {Promise<string>}
       */
      getToken: function getToken(key, token) {
        return calculate(key, token).then(send).then(setCaptchaScore).then(function (data) {
          return data && data.token;
        });
      }
    };

    function gaEvent(action, label, value) {
      //console.log("GA Event: "+action+" "+label);
      try {
        ga('send', 'event', 'UBE', action, label, value);
      } catch (e) {
        //console.error("UBE :: GA Is not configured");
      }
    }
    function preparePayload(category, action, label) {
      var categories = ['Login', 'PersonalCabinet', 'Registration', 'PhoneVerification'];
      var pageCategories = ['qr_age', 'qr_phone', 'qr_reg'];
      var actions = ['Start'];
      var nevent = categories.includes(category) && actions.includes(action) ? 'nevent' : false;
      var pageViewEvent = pageCategories.includes(category) ? 'dl-pageview' : false;
      var result = {
        'event': pageViewEvent || nevent || 'aevent',
        'interactionType': 'False'
      };
      if (nevent) {
        result = Object.assign(result, {
          'ncategory': category || "UBE",
          'naction': action,
          'nlabel': label
        });
      } else if (pageViewEvent) {
        result = Object.assign(result, {
          'pageURL': window.location.href,
          'pageType': category,
          'pageParameters': action || '',
          'pageCampaign': label || ''
        });
      } else {
        result = Object.assign(result, {
          'ecategory': category || "UBE",
          'eaction': action,
          'elabel': label
        });
      }
      return result;
    }
    function gaPush(category, action, label) {
      var payload = preparePayload(category, action, label);
      try {
        dataLayer.push(payload);
        if (payload.event === 'aevent' && window.ymGoal) window.ymGoal(category, action, label, ubeCookie$1(cookies.UBE_USERID) || '');
      } catch (e) {}
      try {
        gaEvent(category, action);
      } catch (e) {}
    }
    function gaUserId(userId) {
      try {
        dataLayer.push({
          'UserID': userId,
          'userid': userId,
          'userId': userId
        });
      } catch (e) {}
      try {
        ga('set', 'userId', userId);
      } catch (e) {}
      try {
        window.gib.setAuthStatus(window.gib.IS_AUTHORIZED);
        window.gib.setLogin(userId);
      } catch (e) {}
    }
    var dataVariablesToGa = ["allocationCode", "ref", "partner"];
    var pageVariablesToGa = ["event", "pageURL", "pageType", "pageParameters", "pageCampaign"];

    /**
     *
     * @param {{}} data - object with variables
     */
    function gaPushObject(data) {
      try {
        if (!data) return;
        var gaObject = {};
        dataVariablesToGa.forEach(function (key) {
          if (data[key]) gaObject["v" + key] = data[key];
        });
        pageVariablesToGa.forEach(function (key) {
          if (data[key]) gaObject[key] = data[key];
        });
        if (Object.keys(gaObject).length > 0) {
          dataLayer.push(gaObject);
        }
      } catch (e) {}
    }

    var faceErrors = {
      AntispoofingFake: {
        title: 'Хм...',
        subtitle: 'Похоже, ты используешь фото другого человека.',
        text: 'Пожалуйста, попробуй выбрать другой снимок себя или включи камеру.'
      },
      AntispoofingUndetermined: {
        title: 'Сожалеем!',
        subtitle: 'Нам не удалось убедиться, что это действительно ты.',
        text: 'Пожалуйста, попробуй выбрать другой снимок себя или включи камеру.'
      },
      FaceBoxTooSmall: {
        title: 'Упс...',
        subtitle: 'Лицо на представленном изображении слишком маленькое.',
        text: 'Пожалуйста, попробуй снова.'
      },
      YotiServerError: {
        title: 'Хм...',
        subtitle: 'Наш сервис временно недоступен.',
        text: 'Пожалуйста, попробуй снова.'
      },
      "default": {
        title: 'Хм...',
        subtitle: 'Кажется, ты выглядишь слишком молодо.',
        text: 'Пожалуйста, попробуй снова.'
      }
    };

    (function () {
      function toggleLoader(visible) {
        console.log("UBE Toggle loader " + visible);
        if ($__default["default"].ube && $__default["default"].ube.toggleLoader) $__default["default"].ube.toggleLoader(visible);
      }
      function showPopup(message) {
        if ($__default["default"].ube && $__default["default"].ube.showPopup) $__default["default"].ube.showPopup(message);else {
          console.log(message);
          alert(message);
        }
      }
      function getToken(callback, repeat) {
        var MAX_REPEAT_COUNT = 4;
        var getTimeout = function getTimeout(repeat) {
          return Math.pow(2, MAX_REPEAT_COUNT - repeat) * 1000;
        };
        var host = $__default["default"].ube.host;
        if (!repeat) repeat = MAX_REPEAT_COUNT;
        $__default["default"].getJSON(host + "/api/face/token").done(function (data) {
          toggleLoader(false);
          console.log("Token response:");
          console.log(data);
          if (!data.access_token || !data.next_validation_endpoint) {
            console.log("Not token or endpoint in response");
            repeat = repeat - 1;
            if (repeat > 0) setTimeout(function () {
              return getToken(callback, repeat);
            }, getTimeout(repeat));else {
              gaPush("AV", "dl_qr_av_fr_fail", "form - fr - reason: Get-Token-Error-UBE");
              showPopup("Ошибка в ответе сервиса ACS API");
            }
          } else {
            gaPush("dl_qr_av_fr_start", "form - fr");
            callback(data.access_token, data.next_validation_endpoint);
          }
        }).fail(function (jqxhr, textStatus, error) {
          var err = textStatus + ", " + error;
          console.log("Token request Failed: " + err);
          repeat = repeat - 1;
          if (repeat > 0) setTimeout(function () {
            return getToken(callback, repeat);
          }, getTimeout(repeat));else {
            gaPush("AV", "dl_qr_av_fr_fail", "form - fr - reason: Get-Token-Error-ACS");
            showPopup("Ошибка в ответе сервиса ACS API");
          }
        });
      }
      function validateToken(token, captureType, callback, repeat) {
        var host = $__default["default"].ube.host;
        if (!repeat) repeat = 3;
        $__default["default"].ajax({
          url: host + "/api/face/token",
          method: "post",
          data: JSON.stringify({
            token: token,
            captureType: captureType
          }),
          contentType: 'application/json; charset=UTF-8'
        }).done(function (data) {
          toggleLoader(false);
          console.log("Token validation response:");
          console.log(data);
          callback(data);
        }).fail(function (jqxhr, textStatus, error) {
          var err = textStatus + ", " + error;
          console.log("Token validation Failed: " + err);
          repeat = repeat - 1;
          if (repeat > 0) validateToken(token, captureType, callback);else showPopup("Ошибка при валидации результатов ACS API");
        });
      }
      $__default["default"].fn.ubeFace = function (name, options) {
        var promoCampaignName;
        var container = $__default["default"](this).first();
        var tryCount = 1;
        var b64Img = '';
        var form = container.find("form");
        window.backupLocalStorage = {};
        window.backupLocalStorage.setItem = function (key, value) {
          window.backupLocalStorage[key] = value;
        };
        window.backupLocalStorage.getItem = function (key) {
          return window.backupLocalStorage[key];
        };
        window.backupLocalStorage.removeItem = function (key) {
          delete window.backupLocalStorage[key];
        };
        ubeHostFallBack();
        $__default["default"].ube.host;
        function onError(event, data) {
          if (event === 'limit') {
            var expires = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
            ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN, '', expires);
            ubeCookie$1(cookies.UBE_AGE_VERIFIED, '', expires);
            ubeCookie$1(cookies.UBE_FACE_BEFORE, '', expires);
            try {
              if (localStorage) {
                localStorage.removeItem(cookies.UBE_AGE_VERIFIED_TOKEN);
                localStorage.removeItem(cookies.UBE_AGE_VERIFIED);
                localStorage.removeItem(cookies.UBE_FACE_BEFORE);
              }
            } catch (error) {
              window.backupLocalStorage.removeItem(cookies.UBE_AGE_VERIFIED_TOKEN);
              window.backupLocalStorage.removeItem(cookies.UBE_AGE_VERIFIED);
              window.backupLocalStorage.removeItem(cookies.UBE_FACE_BEFORE);
            }
          }
          if (options.onSubmissionError) options.onSubmissionError(event, data);
        }
        function onSuccess(token, captureType) {
          validateToken(token, captureType, function (result) {
            if (result && result.ga) {
              if (result.ga instanceof Array) result.ga.forEach(function (ga) {
                gaPush(ga.category, ga.action, ga.label);
              });else if (result.ga.action) {
                var ga = result.ga;
                gaPush(ga.category, ga.action, ga.label);
              }
            }
            if (result && result.data) {
              if (result.data.sessionKey) {
                var d = new Date();
                var faceDate = new Date();
                var expires = null;
                var faceExpires = null;
                d.setTime(d.getTime() + 50 * 60 * 1000);
                faceDate.setTime(faceDate.getTime() + 120 * 60 * 1000);
                expires = "expires=" + d.toUTCString();
                faceExpires = "expires=" + faceDate.toUTCString();
                ubeCookie$1(cookies.UBE_SESSION_KEY_REG, result.data.sessionKey, expires);
                ubeCookie$1(cookies.UBE_FACE_BEFORE, true);
                ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN, token, faceExpires);
                ubeCookie$1(cookies.UBE_AGE_VERIFIED, "face", faceExpires);
                try {
                  if (localStorage) {
                    localStorage.setItem(cookies.UBE_FACE_BEFORE, true);
                    localStorage.setItem(cookies.UBE_AGE_VERIFIED_TOKEN, token);
                    localStorage.setItem(cookies.UBE_AGE_VERIFIED, "face");
                  }
                } catch (error) {
                  window.backupLocalStorage.setItem(cookies.UBE_FACE_BEFORE, true);
                  window.backupLocalStorage.setItem(cookies.UBE_AGE_VERIFIED_TOKEN, token);
                  window.backupLocalStorage.setItem(cookies.UBE_AGE_VERIFIED, "face");
                }
              }
              if (options.onSubmissionSuccess) options.onSubmissionSuccess(result.data);
            }
          }, null);
        }
        function loadTemplate() {
          var host = $__default["default"].ube.host;
          var templateURL = options.template || host + "/form/" + name;
          $__default["default"].get(templateURL).then(function (res) {
            container.html(res.template);
            promoCampaignName = res.properties && res.properties.promoCampaignName || '';
            sessionStorage.setItem('promoCampaignName', promoCampaignName);
            initFace();
          });
        }
        function initFace() {
          container.find(".ube-visibility-show-for-method, .ube-visibility-show-for-megafonMethod, .ube-visibility-show-for-documentMethod").hide();
          container.find(".ube-visibility-show-for-faceMethod").show();
          gaPush("qr_age", "fr", promoCampaignName);
          getToken(initializeFaceCapture, undefined);
        }
        function initializeFaceCapture(_token, _tokenUrl) {
          $__default["default"](".ube-face-error").hide();
          $__default["default"](".ube-face-container").show();
          console.log("Request token", token);
          var token = _token;
          var tokenUrl = _tokenUrl;
          var fcm;
          var renderContainer = container.find(".ube-camera-container");
          var renderTarget = container.find(".ube-camera-render");
          var captureButton = container.find(".ube-camera-capture");
          var fallbackTarget = container.find(".ube-camera-fallback");
          if (renderTarget.data("init") || !token || !tokenUrl) return false;
          renderTarget.data("init", true);
          function sendBlobToServer(blob, callback, type, imageData) {
            toggleLoader(true);
            console.log("Sending blob to server", token);
            var eventType;
            if (type === 'auto') eventType = 'ACS Camera';else eventType = 'Photo Upload';
            gaPush("dl_qr_av_fr_process", "send - form - fr_".concat(type));
            var timeoutId = setTimeout(function () {
              if (xhrRequest) {
                // xhrRequest.abort();
                toggleLoader(false);
                if (tryCount < 2) {
                  tryCount++;
                  fcm.reload();
                  showPopup('Ой, не получилось распознать ваш возраст, повторите попытку еще раз');
                } else {
                  fcm.unmount();
                  onError('Limit');
                }
              }
            }, 10000);
            var xhrRequest = $__default["default"].ajax({
              url: tokenUrl,
              data: blob,
              // the formData function is available in almost all new browsers.
              type: "POST",
              processData: false,
              cache: false,
              dataType: "json",
              // Change this according to your response from the server.
              contentType: 'application/octet-stream',
              crossDomain: true,
              headers: {
                "Authorization": "Bearer " + token,
                "X-ACS-PICTURE-MODE": "stream"
              },
              error: function error(err) {
                toggleLoader(false);
                console.error("Error from ACS API");
                console.error(err);
                clearTimeout(timeoutId);
                logACSResultToELK(eventType, false, true, 'Network Error', imageData, b64Img, name);
              },
              success: function success(data) {
                clearTimeout(timeoutId);
                toggleLoader(false);
                console.log("Success from ACS API");
                console.log(data);
                if (data) {
                  console.log(data.status_code);
                  console.log(data.error_message);
                  console.log(data.error_code);
                  var errorMessage = data.error_message;
                  if (data.status_code === "SUCCESS" && !window.bad) {
                    var label = tryCount === 1 ? 'first' : 'second';
                    gaPush("dl_qr_av_fr_success", "form - fr_".concat(type, " - ").concat(label));
                    logACSResultToELK(eventType, true, false, null, imageData, b64Img, name);
                    if (callback) callback();
                    onSuccess(token);
                  } else if (data.next_validation_type === "DOCUMENT" || window.bad) {
                    if (callback) callback();
                    onError("limit", data);
                    var _label;
                    if (errorMessage === "Technical Error") _label = 'technical';else if (tryCount === 1) _label = 'first';else _label = 'second';
                    if (!data.error_message.includes('Yoti does not recognize')) ;
                    var detailMessage;
                    if (data.errors_detail) {
                      detailMessage = data.errors_detail && data.errors_detail[0] && data.errors_detail[0].code;
                    } else if (data.error_message) {
                      detailMessage = data.error_message;
                    } else {
                      detailMessage = "Technical Error";
                    }
                    logACSResultToELK(eventType, false, false, detailMessage, imageData, b64Img, name);
                    if (data.errors_detail) {
                      var _errorMessage = data.errors_detail[0] && data.errors_detail[0].code || "Technical Error";
                      var _label3;
                      if (_errorMessage === "Technical Error") _label3 = 'technical';else if (tryCount === 1) _label3 = 'first';else _label3 = 'second';
                      gaPush("dl_qr_av_fr_fail", "form - fr_".concat(type, " - ").concat(_label3, " - reason: ").concat(_errorMessage));
                      logACSResultToELK(eventType, false, false, _errorMessage, imageData, b64Img, name);
                    } else gaPush("dl_qr_av_fr_fail", "form - fr_".concat(type, " - ").concat(_label, " - reason: ").concat(errorMessage));
                  } else if (data.error_message) {
                    console.log(data.error_message);
                    if (!data.error_message.includes('Yoti does not recognize')) {
                      var _label4;
                      if (errorMessage === "Technical Error") _label4 = 'technical';else if (tryCount === 1) _label4 = 'first';else _label4 = 'second';
                      gaPush("dl_qr_av_fr_fail", "form - fr_".concat(type, " - ").concat(_label4, " - reason: ").concat(errorMessage));
                    }
                    if (options.debug && $__default["default"].ube.host === "https://ube-test.pmsm.org.ru") {
                      var photoFileName = "photo_in_base_64.txt";
                      var responseFileName = "face_reco_response.txt";
                      var fileContent = b64Img;
                      var photoFile = new Blob([fileContent], {
                        type: 'text/plain'
                      });
                      var responseFile = new Blob([JSON.stringify(data)], {
                        type: 'text/plain'
                      });
                      window.URL = window.URL || window.webkitURL;
                      container.before("<p>Error message: ".concat(data.error_message, "</p>"));
                      if (data.errors_detail && data.errors_detail[0] && data.errors_detail[0].code) container.before("<p>Error code reason: ".concat(data.errors_detail[0].code, "</p>"));
                      container.before('<a class="ube-error-link btn btn-primary mb-3">Download uploaded photo in base64</a>');
                      container.before('<a class="ube-error-link-2 btn btn-primary mb-3">Download response</a>');
                      $__default["default"]('.ube-error-link').attr('href', window.URL.createObjectURL(photoFile)).attr('download', photoFileName);
                      $__default["default"]('.ube-error-link-2').attr('href', window.URL.createObjectURL(responseFile)).attr('download', responseFileName);
                    }
                    var _detailMessage;
                    if (data.errors_detail) {
                      _detailMessage = data.errors_detail && data.errors_detail[0] && data.errors_detail[0].code;
                    } else if (data.error_message) {
                      _detailMessage = data.error_message;
                    } else {
                      _detailMessage = "Technical Error";
                    }
                    logACSResultToELK(eventType, false, false, _detailMessage, imageData, b64Img, name);
                    if (data.errors_detail) {
                      var code = data.errors_detail[0].code;
                      if (!!faceErrors[code]) {
                        var _faceErrors$code = faceErrors[code];
                          _faceErrors$code.title;
                          _faceErrors$code.subtitle;
                          _faceErrors$code.text;
                      }
                      var _errorMessage2 = code || "Technical Error";
                      var _label5;
                      if (_errorMessage2 === "Technical Error") _label5 = 'technical';else if (tryCount === 1) _label5 = 'first';else _label5 = 'second';
                      gaPush("dl_qr_av_fr_fail", "form - fr_".concat(type, " - ").concat(_label5, " - reason: ").concat(_errorMessage2));
                    }
                    if (tryCount < 2) {
                      tryCount++;
                      fcm.reload();
                      if (options.acsOptions && options.acsOptions.debugMode && data.errors_detail) {
                        $__default["default"]('body').append('<p class="server-error-message"></p>');
                        $__default["default"]('.server-error-message').html(JSON.stringify(data.errors_detail));
                      }
                      showPopup("Ой! Похоже, что вы выглядите слишком молодо.<br><br> <small>Возможно вы не выполнили одно из условий. В любом случае стоит попробовать еще раз, чтобы изображение получилось более чётким, не засвеченным и не слишком затемненным.</small>");
                    } else {
                      if (callback) callback();
                      onError("limit", data);
                    }
                  }
                }
              }
            });
            xhrRequest.abort();
          }
          function renderCameraCapture() {
            if (isNoCameraStream) return renderFileUpload();
            fallbackTarget.hide();
            renderTarget.show();
            renderContainer.addClass("ube-camera-option-capture").removeClass("ube-camera-option-upload");
            $__default["default"]('.ube-camera-capture').hide();
            var onFaceSuccess = function onFaceSuccess(_ref) {
              var img = _ref.img;
              console.log("Image data:");
              b64Img = img;
              console.log(img);
              if (options.acsOptions && options.acsOptions.debugMode) {
                if (!$__default["default"]('#result-image').length) {
                  $__default["default"]('.container').append('<textarea id="result-image"></textarea>');
                }
                $__default["default"]('#result-image').text(img);
              }
              var blob = imageDataToBlob(img);
              console.log("Blob:");
              console.log(blob);
              var dummyForm = $__default["default"]("<form style='position: absolute;top:-2000px;left:-2000px;display: block;'>" + "<input type=\"text\" id=\"filename\" name=\"filename\" />" + "</form>");
              dummyForm.appendTo("body");
              var formDataToUpload = new FormData(dummyForm[0]);
              formDataToUpload.append("image", blob);
              var dummyImg = new Image();
              dummyImg.onload = function () {
                var imageData = {
                  width: dummyImg.width,
                  height: dummyImg.height,
                  sizeKB: getImageSize(img).toFixed(3)
                };
                var aggregatedImageData = {
                  initial: imageData,
                  resized: imageData
                };
                console.log("Sending ACS API request");
                sendBlobToServer(blob, stopVideoCapture, 'auto', aggregatedImageData);
              };
              dummyImg.src = img;
            };
            var onFaceError = function onFaceError(err) {
              var errLabel = err.message || err || 'Unknown error';
              console.log('Face capture error:', errLabel);
              gaPush("dl_qr_av_fr_process", "start - form - fr_upload - reason: ".concat(errLabel));
              renderFileUpload();
            };
            var onReadyForCaptureFace = function onReadyForCaptureFace() {
              gaPush("dl_qr_av_fr_process", "start - form - fr_auto");
              // YOTI PERFORMANCE MEASURE
              if (options.acsOptions && options.acsOptions.performanceMode) {
                var acsInit = window.performance.now();
                var initTime = (acsInit - acsStart).toFixed(2);
                alert('Init time: ' + initTime + ' ms');
              }
              options.onFormLoad && options.onFormLoad();

              //! YOTI PERFORMANCE MEASURE
            };
            var props = {
              faceCaptureAssetsRootUrl: $__default["default"].ube.host + '/js/plugin/',
              onSuccess: onFaceSuccess,
              onError: onFaceError,
              language: 'ru',
              captureMethod: 'auto',
              onReadyForCapture: onReadyForCaptureFace,
              manualCaptureFallback: false
            };

            // YOTI PERFORMANCE MEASURE
            if (options.acsOptions && options.acsOptions.performanceMode) {
              var acsStart = window.performance.now();
            }

            //! YOTI PERFORMANCE MEASURE

            fcm = Yoti.FaceCaptureModule.render(props, renderTarget[0]);
            var stopVideoCapture = function stopVideoCapture() {
              console.log("stopVideoCapture()");
              fcm.unmount();
            };
            form.on("stopVideoCapture", function () {
              console.log("Handling stop function");
              stopVideoCapture();
            });
          }
          function renderFileUpload() {
            renderContainer.removeClass("ube-camera-option-capture").addClass("ube-camera-option-upload");
            fallbackTarget.show();
            renderTarget.hide();
            $__default["default"]('.ube-camera-capture').show();
            var dummyFile = $__default["default"]("<input type=\"file\" accept=\"image/*\" capture=\"user\" style='width:0;height:0;position:absolute;'/>").appendTo("body");
            var canvas = $__default["default"]("<canvas class='ube-dummy-image' style='visibility:hidden;display:block;position: absolute;top:-5000px;left:-5000px'></canvas>").appendTo("body")[0];
            var maxWidth = 2000;
            var maxHeight = 2000;
            var maxPixels = 2000000;
            dummyFile.off("change").change(function () {
              console.log("File field changed");
              var reader = new FileReader();
              reader.addEventListener("load", function () {
                var initialImage = this.result;
                console.log("Image data:");
                console.log(initialImage);
                b64Img = initialImage;
                var dummyImg = new Image();
                var resizedImage;
                dummyImg.onload = function () {
                  var imageFileSizeKB = getImageSize(initialImage).toFixed(3);
                  var ctx = canvas.getContext("2d");
                  var initialImageData = {
                    width: dummyImg.width,
                    height: dummyImg.height,
                    sizeKB: imageFileSizeKB
                  };
                  var isImageValid = resizeImage(dummyImg, maxWidth, maxHeight, maxPixels);
                  canvas.width = dummyImg.width;
                  canvas.height = dummyImg.height;
                  ctx.drawImage(dummyImg, 0, 0, dummyImg.width, dummyImg.height);
                  resizedImage = canvas.toDataURL('image/jpeg', 0.9);
                  dummyFile.val("");
                  dummyFile.wrap('<form>').closest('form').get(0).reset();
                  dummyFile.unwrap();
                  var resizedImageData = {
                    width: dummyImg.width,
                    height: dummyImg.height,
                    sizeKB: getImageSize(resizedImage).toFixed(3)
                  };
                  var aggregatedImageData = {
                    initial: initialImageData,
                    resized: isImageValid ? initialImageData : resizedImageData
                  };
                  var blob = imageDataToBlob(isImageValid ? initialImage : resizedImage);
                  sendBlobToServer(blob, undefined, 'upload', aggregatedImageData);
                };
                dummyImg.src = initialImage;
              }, false);
              reader.readAsDataURL(this.files[0]);
            });
            captureButton.add(".ube-camera-option-upload").off("click").click(function (e) {
              console.log("Capture upload clicked");
              e.preventDefault();
              dummyFile.click();
              return false;
            });
            options.onFormLoad && options.onFormLoad();
          }
          renderCameraCapture();
        }
        var isTemplatePreloaded = options.isTemplatePreloaded;
          options.onSubmissionSuccess;
        if (isTemplatePreloaded) {
          initFace();
        } else {
          loadTemplate();
        }
        Impression.runImpression(name);
      };
    })();

    (function () {
      function parseFileToBase64(fileSelector, callback, previewSelector) {
        var file = fileSelector && fileSelector[0] && fileSelector[0].files ? fileSelector[0].files[0] : null;
        function callbackBase64(base64data) {
          fileSelector.data("base64", base64data);
          if (previewSelector) previewSelector.attr("src", base64data);
          if (callback) callback();
        }
        function fallback(reader) {
          reader.addEventListener("load", function () {
            var base64data = reader.result;
            callbackBase64(base64data);
          }, false);
        }
        if (file) {
          var reader = new FileReader();
          reader.onload = function (readerEvent) {
            try {
              var image = new Image();
              image.onload = function (imageEvent) {
                try {
                  // Resize the image
                  var canvas = document.createElement('canvas'),
                    max_size = 1600,
                    width = image.width,
                    height = image.height;
                  if (width > height) {
                    if (width > max_size) {
                      height *= max_size / width;
                      width = max_size;
                    }
                  } else {
                    if (height > max_size) {
                      width *= max_size / height;
                      height = max_size;
                    }
                  }
                  canvas.width = width;
                  canvas.height = height;
                  canvas.getContext('2d').drawImage(image, 0, 0, width, height);
                  var resizedImage = canvas.toDataURL('image/jpeg');
                  callbackBase64(resizedImage);
                } catch (err) {
                  fallback(reader);
                }
              };
              image.onerror = function () {
                if (readerEvent.target.result.includes('data:application/pdf')) {
                  callbackBase64(readerEvent.target.result);
                }
              };
              image.src = readerEvent.target.result;
            } catch (err) {
              fallback(reader);
            }
          };
          reader.readAsDataURL(file);
        } else fileSelector.data("base64", null);
      }
      $__default["default"].fn.ubeFileToBase64 = function (opts) {
        var fileSelector = $__default["default"](this);
        var callback = opts.callback,
          previewSelector = opts.previewSelector;
        parseFileToBase64(fileSelector, callback, previewSelector);
      };
    })();

    (function () {
      $.fn.ubeLeadWidget = function (name, options) {
        $.ube = $.ube || {};
        $.ube.showRules = options.showRules && options.showRules;
        $.ube.hideRules = options.hideRules && options.hideRules;
        $.ube.toggleLoader = options.toggleLoader && options.toggleLoader;
        $.ube.showPopup = options.showPopup && options.showPopup;
        $.ube.host = options.host || $.ube.host;
        function showPopup(message) {
          if ($.ube && $.ube.showPopup) $.ube.showPopup(message);else alert(message);
        }
        if (!options.onLeadCreate) {
          var message = "UBE: \u043E\u0442\u0441\u0443\u0441\u0442\u0432\u0443\u0435\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 onLeadCreate: function(next) {...}";
          console.error(message);
          showPopup(message);
        }
        $(this).ube(name, {
          isTemplatePreloaded: false,
          onFormLoad: function onFormLoad() {
            options.onFormLoad && options.onFormLoad();
          },
          onSubmissionSuccess: function onSubmissionSuccess(submissionId, leadId, result) {
            switch (result.event) {
              case "created":
                options.onLeadCreate();
                break;
            }
          }
        });
      };
    })();

    (function () {
      var hostname = window.location.hostname;
      var pathname = window.location.pathname;
      var defaultAllocationCode = "CTBPL";
      var defaultUtmMedium = "web";
      var utmSources = {
        scanpack: "scanpack",
        premiumOne: "premium-one"
      };
      var UBE_PROD_HOST = "ube.pmsm.org.ru";
      var domainToCode = {
        "parliament.ru": "CTBPL",
        "marlboro.ru": "CTBML",
        "mrphilipmorris.ru": "CTBPM",
        "bondstreet.ru": "CTBBS",
        "lmlab.ru": "CTBLM",
        "nextlook.ru": "CTBNX",
        "mychesterfield.ru": "CTBCE"
      };

      /**
       * Finds domain by allocation code
       * @param {string} allocationCode
       * @return {string}
       */
      function domainByCode(allocationCode) {
        return Object.keys(domainToCode).find(function (key) {
          return domainToCode[key] === allocationCode;
        });
      }
      function toggleLoader(visible) {
        console.log("UBE Toggle loader " + visible);
        if ($__default["default"].ube && $__default["default"].ube.toggleLoader) $__default["default"].ube.toggleLoader(visible);
      }
      function showPopup(message) {
        if ($__default["default"].ube && $__default["default"].ube.showPopup) $__default["default"].ube.showPopup(message);else {
          console.log(message);
          alert(message);
        }
      }

      /**
       * Generates and returns consumer link in callback
       * @param {string} sessionKey
       * @param {string} allocationCode - CTBBS, CTBML, etc
       * @param {function} callback
       * @param {number} [repeat=3]
       */
      function generateLinkByAllocation(sessionKey, allocationCode, callback, repeat) {
        var host = $__default["default"].ube.host;
        toggleLoader(true);
        if (!repeat) repeat = 3;

        /**
         * Direct link if autologin link failed
         */
        function fallback() {
          var domain = domainByCode(allocationCode);
          if (!domain) {
            console.error("UBE Невозможно создать прямую ссылку на сайт");
            showPopup("Ошибка создания персональной ссылки");
          } else callback("https://".concat(domain, "/?"));
        }
        function addProtocolPrefix(link) {
          return link && !link.startsWith("http") ? "https://" + link : link;
        }
        if (!sessionKey || sessionKey === "") return fallback();
        $__default["default"].ajax({
          url: host + "/api/session/createHash",
          headers: {
            "ube-session-key": sessionKey,
            "Authorization": "Bearer " + sessionKey
          },
          data: {
            allocationCode: allocationCode
          },
          success: function success(data, status, xhr) {
            toggleLoader(false);
            if (data.result !== true || !data.value) {
              if (repeat > 1) {
                generateLinkByAllocation(sessionKey, allocationCode, callback, repeat - 1);
              } else {
                console.log("UBE :: Generate personal link error");
                console.log(xhr, status, data);
                return fallback();
              }
            } else {
              callback(addProtocolPrefix(data.value));
            }
          },
          error: function error(xhr, resp, text) {
            if (repeat > 1) {
              generateLinkByAllocation(sessionKey, allocationCode, callback, repeat - 1);
            } else {
              toggleLoader(false);
              console.log("UBE :: Generate personal link error");
              console.log(xhr, resp, text);
              return fallback();
            }
          }
        });
      }

      /**
       * Retrieves utm source from domain
       * @return {string}
       */
      function utmSourceByURL() {
        if (hostname.startsWith("qr.")) return utmSources.scanpack;else if (hostname.endsWith("premium.one") && pathname.startsWith("/qr/")) return utmSources.scanpack;else if (hostname.endsWith("premium.one")) return utmSources.premiumOne;else return utmSources.scanpack;
      }

      /**
       * Retrieves utm campaign from path
       * @return {string}
       */
      function utmCampaignByURL() {
        if (hostname.startsWith("qr.")) return pathname;else if (hostname.endsWith("premium.one") && pathname.startsWith("/qr/")) return pathname.replace(/^\/qr\/([^\/]+)\/(.*[^\/])\/?\/?$/, "$2");else return pathname.replace(/^\/?(.*[^\/])\/?$/, "$1");
      }

      /**
       * Retrieves allocation code from domain
       * @return {string}
       */
      function allocationCodeByURL() {
        //Cases like qr.parliament.ru, qr.marlboro.ru
        var foundDomain = Object.keys(domainToCode).find(function (x) {
          return hostname.endsWith(x);
        });

        //Cases like test.premium.one/qr/parliament/
        if (!foundDomain) foundDomain = Object.keys(domainToCode).find(function (x) {
          return pathname.includes(x.replace(".ru", ""));
        });
        if (foundDomain) return domainToCode[foundDomain];
        return defaultAllocationCode;
      }

      /**
      * Check if MBEP
      * @returns {boolean}
      */
      var isMBEPCheck = function isMBEPCheck(link) {
        return !!Object.keys(domainToCode).find(function (key) {
          return link.includes(key);
        });
      };

      /**
      * Check if QR
      * @returns {boolean}
      */
      var isQRCheck = function isQRCheck(hostname) {
        return hostname.includes("qr.");
      };

      /**
      * Check if P1
      * @returns {boolean}
      */
      var isP1Check = function isP1Check(hostname) {
        return hostname.includes("premium.one");
      };

      /**
       * Переадресация потребителя на сгенерированную хеш ссылку
       * @param options
       */
      $__default["default"].ubeLink = function (options) {
        var _ref = options || {},
          allocationCode = _ref.allocationCode,
          sessionKey = _ref.sessionKey,
          utmSource = _ref.utmSource,
          utmMedium = _ref.utmMedium,
          utmCampaign = _ref.utmCampaign,
          utmContent = _ref.utmContent,
          utmTerm = _ref.utmTerm,
          callback = _ref.callback,
          redirect = _ref.redirect,
          formKey = _ref.formKey,
          external = _ref.external;
        if (!allocationCode || allocationCode === "") allocationCode = allocationCodeByURL();
        if (!utmCampaign || utmCampaign === "") utmCampaign = utmCampaignByURL();
        if (!utmSource || utmSource === "") utmSource = utmSourceByURL();
        if (!utmMedium || utmMedium === "") utmMedium = defaultUtmMedium;
        if (!sessionKey || sessionKey === "") sessionKey = ubeCookie$1(cookies.UBE_WIDGET_SESSION_KEY) || ubeCookie$1(cookies.UBE_SESSION_KEY);
        ubeHostFallBack();
        var host = $__default["default"].ube.host;
        var category, action, label;
        if (isP1Check(hostname)) {
          category = "dl_p1_to_".concat(allocationCode.includes('IQ') ? 'iqos' : 'mbep');
          action = "p1_".concat(window.location.pathname, " - to_").concat(allocationCode.includes('IQ') ? 'iqos' : 'mbep', "_").concat(redirect);
        } else if (isQRCheck(hostname)) {
          category = 'dl_qr_to_mbep';
          action = "qr_".concat(hostname, "_").concat(window.location.pathname, " - to_mbep_").concat(domainByCode(allocationCode), "_").concat(redirect);
        } else {
          category = 'UBE-Link';
          action = "UBE-Link-".concat(allocationCode);
          label = allocationCode;
        }
        if (!options.external) gaPush(category, action, label);
        var domain = domainByCode(allocationCode);
        var linkIsMBEP = isMBEPCheck(hostname);
        if (!external && (linkIsMBEP || hostname.includes(domain))) {
          var mbepDomain = domain || hostname;
          var stageRedirect = '/api/to-brand/?brand=';
          stageRedirect += !host.includes(UBE_PROD_HOST) ? window.location.host.split('-').slice(0, -1).join('-') + '.' + mbepDomain : mbepDomain;
          if (formKey) stageRedirect += '&formKey=' + formKey;
          if (redirect) stageRedirect = stageRedirect + '&page=' + encodeURIComponent(redirect);
          BX.ajax.runComponentAction('cc:ube.client.forms', 'authBySessionKey', {
            mode: 'class',
            data: {
              sessionKey: sessionKey
            }
          }).then(function () {
            window.location.href = window.location.origin + stageRedirect;
          })["catch"](function (error) {
            console.log(error.message);
          });
        } else {
          generateLinkByAllocation(sessionKey, allocationCode, function (link) {
            var linkWithUtm = link + "&utm_source=".concat(utmSource, "&utm_medium=").concat(utmMedium, "&utm_campaign=").concat(utmCampaign);
            if (utmContent && utmContent !== "") linkWithUtm += "&utm_content=".concat(utmContent);
            if (utmTerm && utmTerm !== "") linkWithUtm += "&utm_term=".concat(utmTerm);
            if (redirect && redirect !== "") linkWithUtm += "&redirect=".concat(encodeURIComponent(redirect));
            if (callback) callback(link, linkWithUtm);else if (external && external.link) {
              var sourceQuery = getQueryString(link);
              if (!sourceQuery) return console.error('UBE :: empty query string, check returning url');
              var targetQuery = getQueryString(external.link);
              console.log(sourceQuery);
              var hash = getQueryParameter(sourceQuery, 'T');
              window.location.href = "".concat(external.link).concat(targetQuery ? '&' : '?').concat(external.tokenParam, "=").concat(hash);
            } else window.location.href = linkWithUtm;
          });
        }
      };
    })();

    (function () {
      var limit = 10;
      var months = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
      function loadTemplate() {
        return $__default["default"].get($__default["default"].ube.host + "/template/loyalty-history");
      }
      function loadData(sessionKey) {
        return $__default["default"].ajax({
          url: $__default["default"].ube.host + "/api/session/get?attributes=1",
          type: "GET",
          headers: {
            "Authorization": "Bearer " + sessionKey
          }
        });
      }
      function displayLoyalty(container, templateString, data) {
        $__default["default"](".loyalty-history").remove();
        var template = $__default["default"](templateString);
        var holder = template.find(".loyalty-history_holder");
        var entry = template.find(".loyalty-history_entry").clone();
        holder.empty();
        var dataItemToDom = function dataItemToDom(item) {
          var entryCopy = entry.clone();
          var points = parseInt(item.points) || 0;
          var pointText = "Баллов";
          if (points % 10 === 1) pointText = "Балл";else if (points % 10 < 5 && points % 10 > 1) pointText = "Балла";
          if (item.deactivated && item.deactivatedText && !item.active) {
            entryCopy.find(".loyalty-history_label").text("У вас списаны баллы");
            entryCopy.find(".loyalty-history_date").text(item.deactivated);
            entryCopy.find(".loyalty-history_description").text(item.deactivatedText);
            entryCopy.find(".loyalty-history_points").text("- " + points + " " + pointText);
            holder.append(entryCopy);
          } else if (item.created && item.text) {
            entryCopy.find(".loyalty-history_label").text("Вам начислены баллы");
            entryCopy.find(".loyalty-history_date").text(item.created);
            entryCopy.find(".loyalty-history_description").text(item.text);
            entryCopy.find(".loyalty-history_points").text("+ " + points + " " + pointText);
            holder.append(entryCopy);
          }
        };
        var showAllButton = template.find(".loyalty-history_button a");
        function showAllFun() {
          showAllButton.hide();
          data.slice(limit).forEach(dataItemToDom);
        }
        showAllButton.click(function (e) {
          e.preventDefault();
          setTimeout(showAllFun, 300);
          return false;
        });
        if (data.length > 0) {
          data.slice(0, limit).forEach(dataItemToDom);
          if (data.length > limit) showAllButton.show();else showAllButton.hide();
          template.find(".loyalty-history_empty").hide();
        } else {
          showAllButton.hide();
          template.find(".loyalty-history_empty").show();
        }
        container.html(template);
      }
      function formatDate(dateString) {
        if (!dateString) return dateString;
        if (typeof dateString === 'string' || dateString instanceof String) {
          dateString = formatDateSort(dateString);
          var dateSplit = dateString.split("-");
          var year = parseInt(dateSplit[0]);
          var month = months[parseInt(dateSplit[1]) - 1];
          var day = parseInt(dateSplit[2]);
          var currentYear = new Date().getFullYear();
          if (year === currentYear) return "".concat(day, " ").concat(month);else return "".concat(day, " ").concat(month, " ").concat(year);
        }
        return dateString;
      }
      function formatDateSort(dateString) {
        if (!dateString) return dateString;
        if (typeof dateString === 'string' || dateString instanceof String) {
          if (dateString.length === 10) dateString = dateString + "T23:59:59.999Z";
        }
        return dateString;
      }
      function historyFromData(data) {
        if (data && data.attributes) {
          var loyaltyHistory = data.attributes.loyaltyHistory || [];
          var existingKeys = [];
          var filteredLoyaltyHistory = [];
          loyaltyHistory.sort(function (a, b) {
            var dateA = formatDateSort(a.deactivated || a.created);
            var dateB = formatDateSort(b.deactivated || b.created);
            if (dateA < dateB) return 1;else if (dateA === dateB) {
              if (a.deactivated && !b.deactivated) return -1;else if (!a.deactivated && b.deactivated) return 1;else return 0;
            } else return -1;
          }).forEach(function (item) {
            var isActive = [1, "1", true, "true", "True", "TRUE", "Yes", "YES", "TRUE"].indexOf(item.active) > 0;
            var key = item.id + (isActive ? "1" : "0");
            item.active = isActive;
            item.created = formatDate(item.created);
            item.deactivated = formatDate(item.deactivated);
            item.points = parseInt(item.points);
            if (existingKeys.indexOf(key) === -1) {
              existingKeys.push(key);
              filteredLoyaltyHistory.push(item);
            }
          });
          return filteredLoyaltyHistory;
        } else return [];
      }
      function displayError(container, e) {
        console.error(e);
        container.html("<p>Ошибка при получении данных</p>");
      }
      $__default["default"].fn.ubeLoyalty = function (sessionKey) {
        if (!sessionKey || sessionKey === "") throw new Error("loyalty requires sessionKey as parameter");
        var container = $__default["default"](this).first();
        ubeHostFallBack();
        var template;
        var data;
        loadTemplate().then(function (_template) {
          template = _template;
          if (data && template) displayLoyalty(container, template, data);
        })["catch"](function (e) {
          displayError(container, e);
        });
        loadData(sessionKey).then(function (_data) {
          data = historyFromData(_data);
          if (data && template) displayLoyalty(container, template, data);
        })["catch"](function (e) {
          displayError(container, e);
        });
      };
    })();

    $__default["default"].fn.ubeMask = function (explicitInputMask, explicitPlaceholder, inputPlaceholder) {
      return this.each(function () {
        var field = $__default["default"](this);
        var inputMask = explicitInputMask || $__default["default"](this).attr("data-mask");
        var placeholder = explicitPlaceholder || $__default["default"](this).attr("placeholder");
        if (inputMask && inputMask.length > 0) {
          field.addClass("ube-field-masked").attr("data-mask", inputMask);
          var maskFun = function maskFun(a, b) {
            if (isAndroid) {
              field.attr('inputmode', 'numeric');
            }
            if ($__default["default"].ube && $__default["default"].ube.fieldMask) return $__default["default"].ube.fieldMask(field, a, b);

            // COMMENTED TO TEST OUT ANDROID MASK

            // else if (isAndroid) {
            //     if (b && b.placeholder) field.attr("placeholder", b.placeholder);
            //     try {
            //         if (field.unmask) field.unmask();
            //     } catch (e) {
            //     }
            //     try {
            //         if (field.inputmask) field.inputmask('remove');
            //     } catch (e) {
            //     }
            //     field.removeAttr("data-mask");
            //     return false;
            // }
            else if (field.inputmask) return field.inputmask(a, b);else return field.mask(a, b);
          };
          if (placeholder && placeholder.length > 0) {
            field.attr("data-placeholder", placeholder);
            maskFun(inputMask, {
              placeholder: inputPlaceholder || placeholder
            });
          } else maskFun(inputMask, {});
        }
      });
    };

    var Block = /*#__PURE__*/function () {
      function Block(name, options, container, globalCtx) {
        _classCallCheck(this, Block);
        this.name = name;
        this.options = options;
        this.container = container;
      }
      return _createClass(Block, [{
        key: "runBlock",
        value: function runBlock(key, state, cb) {
          var _this = this;
          if (this.options && this.options.onSwitchBlock) this.options.onSwitchBlock(key, state.previousBlock);
          this.run(key, state, function (block, newState) {
            _this.close(state);
            cb(block, _objectSpread2(_objectSpread2(_objectSpread2({}, state), newState || {}), {}, {
              previousBlock: key
            }));
          });
        }
      }, {
        key: "initContainers",
        value: function initContainers(wrapperKey, innerKey) {
          var wrapper, inner;
          if (wrapperKey) {
            wrapper = $(".ube-widget-".concat(wrapperKey, "-container"));
            if (!wrapper.length) wrapper = $("<div class=\"ube-widget-".concat(wrapperKey, "-container screen\"></div>")).appendTo(this.container);
          }
          if (!innerKey) return wrapper;
          if (innerKey && wrapper && wrapper.length) {
            inner = $(".ube-form-".concat(innerKey));
            if (!inner.length) inner = $("<div class=\"ube-form-".concat(innerKey, "\"></div>")).appendTo(wrapper);
          }
          return inner;
        }
      }, {
        key: "close",
        value: function close(state) {}
      }]);
    }();

    function authBySocial(_x) {
      return _authBySocial.apply(this, arguments);
    }
    function _authBySocial() {
      _authBySocial = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2(_ref) {
        var formKey, socialName, successCB, errorCB, windowReference, messageHandle, _messageHandle, link;
        return _regeneratorRuntime().wrap(function _callee2$(_context2) {
          while (1) switch (_context2.prev = _context2.next) {
            case 0:
              _messageHandle = function _messageHandle3() {
                _messageHandle = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(event) {
                  var token, uuid, response, result;
                  return _regeneratorRuntime().wrap(function _callee$(_context) {
                    while (1) switch (_context.prev = _context.next) {
                      case 0:
                        if (!(event.origin !== window.location.origin)) {
                          _context.next = 2;
                          break;
                        }
                        return _context.abrupt("return");
                      case 2:
                        token = localStorage.getItem("socialToken");
                        uuid = localStorage.getItem("socialUuid");
                        if (!(token && uuid)) {
                          _context.next = 17;
                          break;
                        }
                        _context.next = 7;
                        return fetch("".concat($.ube.host, "/api/social/auth/").concat(socialName, "/").concat(formKey), {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            token: token,
                            uuid: uuid,
                            ageVerifiedToken: ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN),
                            jwtFaceToken: ubeCookie$1(cookies.UBE_JWT_FACE_TOKEN),
                            isFaceSkipped: JSON.parse(sessionStorage.getItem("isFaceSkipped"))
                          })
                        });
                      case 7:
                        response = _context.sent;
                        _context.next = 10;
                        return response.json();
                      case 10:
                        result = _context.sent;
                        if (response.ok) {
                          _context.next = 13;
                          break;
                        }
                        return _context.abrupt("return", errorCB(result));
                      case 13:
                        successCB(result);
                        window.removeEventListener('message', messageHandle);
                        _context.next = 19;
                        break;
                      case 17:
                        window.removeEventListener('message', messageHandle);
                        errorCB({
                          message: "Ошибка авторизации"
                        });
                      case 19:
                        localStorage.removeItem("socialToken");
                        localStorage.removeItem("socialUuid");
                      case 21:
                      case "end":
                        return _context.stop();
                    }
                  }, _callee);
                }));
                return _messageHandle.apply(this, arguments);
              };
              messageHandle = function _messageHandle2(_x4) {
                return _messageHandle.apply(this, arguments);
              };
              formKey = _ref.formKey, socialName = _ref.socialName, successCB = _ref.successCB, errorCB = _ref.errorCB;
              _context2.prev = 3;
              windowReference = window.open('', "mozillaWindow", "popup");
              _context2.next = 7;
              return getSocialLink(formKey, socialName);
            case 7:
              link = _context2.sent;
              windowReference.location = link;
              window.addEventListener('message', messageHandle);
              _context2.next = 16;
              break;
            case 12:
              _context2.prev = 12;
              _context2.t0 = _context2["catch"](3);
              windowReference.close();
              errorCB(_context2.t0);
            case 16:
            case "end":
              return _context2.stop();
          }
        }, _callee2, null, [[3, 12]]);
      }));
      return _authBySocial.apply(this, arguments);
    }
    function getSocialLink(_x2, _x3) {
      return _getSocialLink.apply(this, arguments);
    }
    function _getSocialLink() {
      _getSocialLink = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(formKey, socialName) {
        var response, data;
        return _regeneratorRuntime().wrap(function _callee3$(_context3) {
          while (1) switch (_context3.prev = _context3.next) {
            case 0:
              _context3.next = 2;
              return fetch("".concat($.ube.host, "/api/social/auth/getUrl/").concat(formKey, "/").concat(socialName), {
                method: "POST",
                headers: {
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  redirectUrl: window.location.origin
                })
              });
            case 2:
              response = _context3.sent;
              _context3.next = 5;
              return response.json();
            case 5:
              data = _context3.sent;
              if (response.ok) {
                _context3.next = 8;
                break;
              }
              throw new Error(data.message);
            case 8:
              return _context3.abrupt("return", data.url);
            case 9:
            case "end":
              return _context3.stop();
          }
        }, _callee3);
      }));
      return _getSocialLink.apply(this, arguments);
    }
    function getAvStatus(sessionKey, formKey) {
      return $.ajax({
        url: "".concat($.ube.host, "/esb/").concat(formKey, "/avUserStatus"),
        headers: {
          "Authorization": "Bearer " + sessionKey
        }
      }).fail(function () {
        return console.log('UBE getAvStatus Error');
      });
    }
    function getInfo(sessionKey, formKey) {
      return $.ajax({
        url: "".concat($.ube.host, "/esb/").concat(formKey, "/cabinet"),
        headers: {
          "Authorization": "Bearer " + sessionKey
        }
      }).fail(function () {
        return console.log('UBE getInfo Error');
      });
    }

    var initRichcall = function initRichcall(sessionKey, formKey, callback) {
      getInfo(sessionKey, formKey).done(function (_ref) {
        var firstName = _ref.firstName,
          lastName = _ref.lastName,
          mobile_phone_full = _ref.mobile_phone_full;
        $('#richcall').on('click', function () {
          var link = "https://iqos.richcall.io/client?widget-code=0002-IQOS-AGES&callerId=".concat(mobile_phone_full, "&callerName=").concat(firstName, " ").concat(lastName);
          var richcallWindow = window.open(link, "richcallWindow", "popup");
          $(window).on('message', function (event) {
            var _originalEvent$data, _originalEvent$data2;
            var originalEvent = event.originalEvent;
            if ((originalEvent === null || originalEvent === void 0 ? void 0 : originalEvent.origin) !== 'https://iqos.richcall.io') return;
            if ((originalEvent === null || originalEvent === void 0 || (_originalEvent$data = originalEvent.data) === null || _originalEvent$data === void 0 ? void 0 : _originalEvent$data.event) === 'CALL_IN_PROGRESS') {
              pendingVerificationRequest(sessionKey, formKey);
            }
            if ((originalEvent === null || originalEvent === void 0 || (_originalEvent$data2 = originalEvent.data) === null || _originalEvent$data2 === void 0 ? void 0 : _originalEvent$data2.event) === 'SESSION_STOPPED') {
              var _originalEvent$data3;
              var errorCode = originalEvent === null || originalEvent === void 0 || (_originalEvent$data3 = originalEvent.data) === null || _originalEvent$data3 === void 0 ? void 0 : _originalEvent$data3.errorCode;
              if (errorCode === 'SUCCESS') {
                richcallWindow.close();
                callback();
              } else if (errorCode === 'NETWORK_ERROR') {
                richcallWindow.close();
                if ($('.ube-richcall-error').length) {
                  $(".ube-richcall-container").hide();
                  $(".ube-richcall-error").show();
                }
              }
              $(window).off('message');
            }
          });
        });
      });
    };
    function pendingVerificationRequest(sessionKey, formKey) {
      var currentTry = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;
      var urlParams = new URL(document.location).searchParams;
      var utmCampaign = urlParams.get('utm_campaign');
      var data;
      if (utmCampaign !== null) {
        data = JSON.stringify({
          utmCampaign: utmCampaign
        });
      }
      $.ajax({
        url: "".concat($.ube.host, "/api/f2s/consumer/").concat(formKey, "/pendingVerification"),
        method: 'POST',
        data: data,
        contentType: 'application/json; charset=UTF-8',
        headers: {
          "Authorization": "Bearer " + sessionKey
        }
      }).fail(function () {
        if (currentTry < 3) {
          setTimeout(function () {
            return pendingVerificationRequest(sessionKey, formKey, ++currentTry);
          }, 200);
        }
      });
    }

    var AV = /*#__PURE__*/function (_Block) {
      function AV() {
        _classCallCheck(this, AV);
        return _callSuper(this, AV, arguments);
      }
      _inherits(AV, _Block);
      return _createClass(AV, [{
        key: "run",
        value: function run(key, state, cb) {
          var gaUJEvent = state.originalEvent === 'registration' ? 'reg' : 'auth';
          var sessionKey = state.sessionKey;
          var options = this.options,
            name = this.name;
          var target = this.initContainers('login', 'docs');
          gaPush("qr_age", "idx - after_" + gaUJEvent, sessionStorage.getItem('promoCampaignName'));
          target.show().ubeAV("".concat($.ube.host, "/main/").concat(name), sessionKey, {
            data: {
              entity: name
            },
            isTemplatePreloaded: false,
            richcall: function richcall() {
              initRichcall(sessionKey, name, function () {
                cb({
                  avResult: 'delayed'
                }, {
                  av: 0,
                  sku: true,
                  originalEven: state.originalEvent
                });
              });
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              switch (result.event) {
                case "instant":
                  cb({
                    avResult: 'instant'
                  }, {
                    av: 1,
                    sku: false,
                    sessionKey: result.data.sessionKey,
                    result: result,
                    originalEvent: state.originalEvent
                  });
                  break;
                case "later":
                  cb({
                    avResult: 'delayed'
                  }, {
                    av: 0,
                    sku: true,
                    sessionKey: result.data.sessionKey,
                    result: result,
                    originalEvent: state.originalEvent
                  });
                  break;
                case "delayed":
                  if (!ubeCookie$1(cookies.UBE_DOCUMENTS_PROVIDED)) {
                    var dateTarget = new Date();
                    dateTarget.setDate(dateTarget.getDate() + 7); // 1 week
                    ubeCookie$1(cookies.UBE_DOCUMENTS_PROVIDED, 'Y', dateTarget);
                  }
                  if (options.isTrial) cb({
                    avResult: 'instant'
                  }, {
                    av: 1,
                    sku: false,
                    sessionKey: result.data.sessionKey,
                    result: result,
                    originalEvent: state.originalEvent
                  });else cb({
                    avResult: 'delayed'
                  }, {
                    av: 0,
                    sku: true,
                    sessionKey: result.data.sessionKey,
                    result: result,
                    originalEvent: state.originalEvent
                  });
                  break;
                default:
                  console.error("UBE :: Unknown AV result event: " + result.event);
                  break;
              }
            },
            onSessionError: function onSessionError() {
              $.ube.showPopup("Ошибка сессии");
            }
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-form-docs').remove();
        }
      }]);
    }(Block);

    var Content = /*#__PURE__*/function (_Block) {
      function Content() {
        _classCallCheck(this, Content);
        return _callSuper(this, Content, arguments);
      }
      _inherits(Content, _Block);
      return _createClass(Content, [{
        key: "run",
        value: function run(key, state, cb) {
          gaPush('dl_qr_content_start', '');
          this.options.skuContent(function () {
            gaPush('dl_qr_content_end', '');
            cb({
              userLoggedIn: state.login
            }, {
              sku: true,
              skuShown: true
            });
          }, state);
        }
      }, {
        key: "close",
        value: function close() {
          $('.content-screen').hide();
        }
      }]);
    }(Block);

    var DteCoupon = /*#__PURE__*/function (_Block) {
      function DteCoupon() {
        _classCallCheck(this, DteCoupon);
        return _callSuper(this, DteCoupon, arguments);
      }
      _inherits(DteCoupon, _Block);
      return _createClass(DteCoupon, [{
        key: "run",
        value: function run(key, state, cb) {
          var options = this.options;
          var dteCouponName = this.name.replace('-reg', '-coupon');
          var target = this.initContainers('dte-coupon');
          target.show().ube(dteCouponName, {
            isTemplatePreloaded: false,
            sessionKey: state.sessionKey,
            onFormLoad: function onFormLoad() {
              $('.dte-coupon-skip').on('click', cb);
              options.onFormLoad && options.onFormLoad(key);
            },
            onSubmissionSuccess: function onSubmissionSuccess() {
              cb();
            }
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-widget-dte-coupon-container').hide();
        }
      }]);
    }(Block);

    var EmailOptin = /*#__PURE__*/function (_Block) {
      function EmailOptin() {
        _classCallCheck(this, EmailOptin);
        return _callSuper(this, EmailOptin, arguments);
      }
      _inherits(EmailOptin, _Block);
      return _createClass(EmailOptin, [{
        key: "run",
        value: function run(key, state, cb) {
          var options = this.options;
          var target = $("<div class=\"ube-widget-optin\"></div>").appendTo(this.container);
          target.show().ube('ube2-optin', {
            isTemplatePreloaded: false,
            data: state.result.data.data,
            template: state.result.data.template,
            sessionKey: state.sessionKey,
            onFormLoad: function onFormLoad() {
              options.onFormLoad && options.onFormLoad(key);
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              var response = {
                event: result.event,
                sessionKey: result.data.sessionKey,
                userId: userId
              };
              var block = {
                regStatus: ''
              };
              var state = {
                sessionKey: result.data.sessionKey
              };
              switch (result.event) {
                case "alreadyVerified":
                  console.log("UBE Register AV1 result", response);
                  block.regStatus = 'alreadyVerified';
                  state.av = 1;
                  state.avStatus = 1;
                  cb(block, state);
                  break;
                case "registered":
                  console.log("UBE Register result", response);
                  block.regStatus = 'registered';
                  state.av = 0;
                  state.avStatus = 0;
                  cb(block, state);
                  break;
                case "close":
                  target.hide();
                  break;
              }
            }
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-widget-optin, .ube-form-register').hide();
        }
      }]);
    }(Block);

    var Face = /*#__PURE__*/function (_Block) {
      function Face() {
        _classCallCheck(this, Face);
        return _callSuper(this, Face, arguments);
      }
      _inherits(Face, _Block);
      return _createClass(Face, [{
        key: "run",
        value: function run(key, state, cb) {
          var target = this.initContainers('face');
          var faceName = this.name.replace('-reg', '-face');
          var options = this.options;
          var faceSuccess = {
            face: true,
            av: 1,
            faceAV: 1
          };
          var faceFailure = {
            face: true,
            av: 0,
            faceAV: 0
          };
          sessionStorage.setItem('isFaceSkipped', state.shouldSkipFace);
          if (state.shouldSkipFace) {
            gaPush('dl_qr_av_fr_skip', 'click - skip - form - fr');
            return cb({
              avStatus: 1
            }, faceSuccess);
          }
          gaPush('dl_qr_av_fr_process', 'view - screen_fr');
          return target.ubeFace(faceName, _objectSpread2({
            isTemplatePreloaded: false,
            onFormLoad: function onFormLoad() {
              options.onFormLoad && options.onFormLoad(key);
            },
            onSubmissionSuccess: function onSubmissionSuccess() {
              if (options.onFaceSuccess) {
                options.onFaceSuccess(function () {
                  cb({
                    avStatus: 1
                  }, faceSuccess);
                });
              } else {
                cb({
                  avStatus: 1
                }, faceSuccess);
              }
            },
            onSubmissionError: function onSubmissionError() {
              target.find(".ube-hide-on-fail").hide();
              target.find(".ube-show-on-fail").show();
              cb({
                avStatus: 0
              }, faceFailure);
            }
          }, this.options.face));
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-widget-face-container').hide();
        }
      }]);
    }(Block);

    var FailContent = /*#__PURE__*/function (_Block) {
      function FailContent() {
        _classCallCheck(this, FailContent);
        return _callSuper(this, FailContent, arguments);
      }
      _inherits(FailContent, _Block);
      return _createClass(FailContent, [{
        key: "run",
        value: function run(key, state, cb) {
          this.options.failContent(function () {
            cb({
              target: 'inner'
            });
          }, state);
        }
      }, {
        key: "close",
        value: function close() {
          $('.fail-screen').hide();
        }
      }]);
    }(Block);

    var IDXReg = /*#__PURE__*/function (_Block) {
      function IDXReg() {
        _classCallCheck(this, IDXReg);
        return _callSuper(this, IDXReg, arguments);
      }
      _inherits(IDXReg, _Block);
      return _createClass(IDXReg, [{
        key: "run",
        value: function run(key, state, cb) {
          var _state$user;
          var options = this.options;
          var target = this.initContainers('login', 'idx');
          var idxName = this.name.replace("-reg", "-idx");
          target.show().ube(idxName, {
            isTemplatePreloaded: false,
            sessionKey: state.sessionKey,
            loadFormDataFromSession: false,
            onFormLoad: function onFormLoad() {
              options.onFormLoad && options.onFormLoad(key);
            },
            data: _objectSpread2({
              phone: (state === null || state === void 0 || (_state$user = state.user) === null || _state$user === void 0 ? void 0 : _state$user.phone) || state.phone,
              agreeWithRules: false
            }, state === null || state === void 0 ? void 0 : state.user),
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              switch (result.event) {
                case 'success':
                  cb({
                    idxRegResult: 'success'
                  }, {
                    sessionKey: result.data.sessionKey
                  });
              }
            }
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-form-idx').hide();
        }
      }]);
    }(Block);

    var PhoneCheck = /*#__PURE__*/function (_Block) {
      function PhoneCheck() {
        _classCallCheck(this, PhoneCheck);
        return _callSuper(this, PhoneCheck, arguments);
      }
      _inherits(PhoneCheck, _Block);
      return _createClass(PhoneCheck, [{
        key: "run",
        value: function run(key, state, cb) {
          var options = this.options;
          var target = this.initContainers('login', 'phone-check');
          var phoneCheckName = this.name.replace("-reg", "-phone-check");
          var isFRCookieExists = ubeCookie$1(cookies.UBE_JWT_FACE_TOKEN) || false;
          var isTrial = options && options.trial;
          var isDocuments = options && options.documents;
          var isIDXEnabled = !state.faceAV;
          var formKey = this.name;
          var backToPhoneSend = function backToPhoneSend() {
            $('.ube-form-phone-check').hide();
            $('.ube-form-phone-send').show();
            $(".ube-phone-send-form [name=phone]").focus();
          };
          var isFormSubmitted = false;
          !ubeCookie$1(cookies.UBE_WIDGET_REGISTER) && !ubeCookie$1(cookies.UBE_WIDGET_LOGIN);
          target.show().ube(phoneCheckName, {
            sessionKey: state.sessionKey,
            isTemplatePreloaded: false,
            data: {
              phone: state.phone
            },
            onFormLoad: function onFormLoad() {
              if ((isDocuments || isIDXEnabled) && !isFRCookieExists) {
                $('.ube-av0-phone-send, .ube-av0-phone-check').show();
                $('.ube-av1-phone-send, .ube-av1-phone-check').hide();
              } else {
                $('.ube-av1-phone-send, .ube-av1-phone-check').show();
                $('.ube-av0-phone-send, .ube-av0-phone-check').hide();
              }
              options.onFormLoad && options.onFormLoad(key);
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              var block = {
                loginStatus: ''
              };
              var state = {
                login: true,
                sessionKey: result.data.sessionKey,
                event: 'login',
                result: result,
                originalEvent: 'login'
              };
              switch (result.event) {
                case 'cancel':
                case 'close':
                  backToPhoneSend();
                  break;
                case 'verified':
                  if (isFormSubmitted) break;
                  isFormSubmitted = true;
                  if (isIDXEnabled) {
                    block.loginStatus = 'verified-av0';
                    state.av = 0;
                    state.avStatus = 0;
                  } else {
                    block.loginStatus = 'verified-av1';
                    state.av = 1;
                    state.avStatus = 1;
                  }
                  cb(block, state);
                  break;
                case 'loginSuccess':
                  if (isFormSubmitted) break;
                  isFormSubmitted = true;
                  ubeCookie$1(cookies.UBE_WIDGET_LOGIN, 'Y');
                  getAvStatus(result.data.sessionKey, formKey).done(function (response) {
                    var av = response.av,
                      trialAccess = response.trialAccess;
                    var avStatus = +av;
                    state.avStatus = avStatus;
                    state.av = avStatus;
                    if (isIDXEnabled || isDocuments || isTrial) {
                      if (avStatus === 1 || isTrial && avStatus === 0 && trialAccess) {
                        console.log("UBE Login result", response);
                        if (trialAccess) console.log("UBE :: user has trial access");
                        block.loginStatus = 'loginSuccess-av1';
                      } else {
                        block.loginStatus = 'loginSuccess-av0';
                      }
                    } else {
                      block.loginStatus = 'loginSuccess-av' + avStatus;
                    }
                    cb(block, state);
                  });
                  break;
              }
            }
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-form-phone-check').hide();
        }
      }]);
    }(Block);

    var PhoneSend = /*#__PURE__*/function (_Block) {
      function PhoneSend() {
        _classCallCheck(this, PhoneSend);
        return _callSuper(this, PhoneSend, arguments);
      }
      _inherits(PhoneSend, _Block);
      return _createClass(PhoneSend, [{
        key: "run",
        value: function run(key, state, cb) {
          var _PhoneSendParams$para, _PhoneSendParams$para2;
          var options = this.options;
          var target = this.initContainers('login', 'phone-send');
          var isDocuments = options && options.documents;
          var isIDXEnabled = !state.faceAV;
          var phoneSendName = this.name.replace("-reg", "-phone-send");
          var isFRCookieExists = ubeCookie$1(cookies.UBE_JWT_FACE_TOKEN) || false;
          var isTrial = options && options.trial;
          var data = options && options.data || {};
          var formKey = this.name;
          var PhoneSendParams = state.customUJ.find(function (x) {
            return x.id === state.currentNodeId;
          });
          var logins = {
            vk: PhoneSendParams === null || PhoneSendParams === void 0 || (_PhoneSendParams$para = PhoneSendParams.params) === null || _PhoneSendParams$para === void 0 ? void 0 : _PhoneSendParams$para.loginThroughVK,
            yandex: PhoneSendParams === null || PhoneSendParams === void 0 || (_PhoneSendParams$para2 = PhoneSendParams.params) === null || _PhoneSendParams$para2 === void 0 ? void 0 : _PhoneSendParams$para2.loginThroughYA
          };
          var socialNamesMapping = {
            vk: 'vk',
            yandex: 'ya'
          };
          var user;
          var formData = _objectSpread2(_objectSpread2({}, data), {}, {
            phone: ""
          });
          function handleSocialAuth(formKey, socialName) {
            authBySocial({
              formKey: formKey,
              socialName: socialName,
              successCB: function successCB(result) {
                onSocialAuthSuccess(result, socialName);
              },
              errorCB: function errorCB(error) {
                gaPush('dl_qr_auth_social_fail', "view - pop_up_fail_social - ".concat(socialNamesMapping[socialName]));
                $.ube.showPopup(error.message);
                options.toggleLoader && options.toggleLoader(false);
              }
            });
          }
          function onSocialAuthSuccess(result, socialName) {
            var _result$user, _result$user2;
            var block = {
              loginStatus: ''
            };
            var state = {
              login: true,
              sessionKey: result.sessionKey,
              event: 'login',
              result: result,
              originalEvent: 'login',
              user: result === null || result === void 0 ? void 0 : result.user
            };
            switch (result.event) {
              case "authorization_not_found":
                if (!(result !== null && result !== void 0 && (_result$user = result.user) !== null && _result$user !== void 0 && _result$user.phone)) {
                  $(target).find('[name="sessionKey"]').val(result === null || result === void 0 ? void 0 : result.sessionKey);
                  if (result.user) user = result.user;
                  $('.ube-auth-vk, .ube-auth-yandex').hide();
                  gaPush('dl_qr_auth_social_fail', "view - pop_up_fail_social - ".concat(socialNamesMapping[socialName]));
                  options.toggleLoader && options.toggleLoader(false);
                  options.showPopup && options.showPopup('Добавьте номер телефона');
                  return;
                }
                if (isIDXEnabled) {
                  block.loginStatus = 'verified-av0';
                  state.av = 0;
                  state.avStatus = 0;
                } else {
                  block.loginStatus = 'verified-av1';
                  state.av = 1;
                  state.avStatus = 1;
                }
                cb(block, state);
                options.toggleLoader && options.toggleLoader(false);
                break;
              case 'authorization_success':
                ubeCookie$1(cookies.UBE_WIDGET_LOGIN, 'Y');
                ubeCookie$1(cookies.UBE_USERID, result === null || result === void 0 || (_result$user2 = result.user) === null || _result$user2 === void 0 ? void 0 : _result$user2.id, sessionExpiration());
                getAvStatus(result.sessionKey, formKey).done(function (response) {
                  var av = response.av,
                    trialAccess = response.trialAccess;
                  var avStatus = +av;
                  state.avStatus = avStatus;
                  state.av = avStatus;
                  if (isIDXEnabled || isDocuments || isTrial) {
                    if (avStatus === 1 || isTrial && avStatus === 0 && trialAccess) {
                      console.log("UBE Login result", response);
                      if (trialAccess) console.log("UBE :: user has trial access");
                      block.loginStatus = 'loginSuccess-av1';
                    } else {
                      block.loginStatus = 'loginSuccess-av0';
                    }
                  } else {
                    block.loginStatus = 'loginSuccess-av' + avStatus;
                  }
                  options.toggleLoader && options.toggleLoader(false);
                  cb(block, state);
                });
                break;
            }
            gaPush('dl_qr_auth_social_success', "form - social - ".concat(socialNamesMapping[socialName]));
          }
          target.show().ube(phoneSendName, {
            data: formData,
            isTemplatePreloaded: false,
            onFormLoad: function onFormLoad(_ref) {
              var alternativeCaptchaEnabled = _ref.alternativeCaptchaEnabled,
                alternativeGrecaptcha = _ref.alternativeGrecaptcha;
              if ($('.ube-phone-send-preferredMethod').length) {
                gaPush('dl_qr_phone_process', 'view - screen_fork');
                $('.method-btn').on('click', function (e) {
                  e.preventDefault();
                  var method = $(this).data('method');
                  formData.preferredMethod = method;
                  $('.ube-phone-send-preferredMethod').hide();
                  $(".ube-phone-send-".concat(method)).show();
                  $('.ube-phone-send-container').show();
                  if (method === 'telegram' && alternativeCaptchaEnabled && alternativeGrecaptcha) {
                    sessionStorage.setItem('sitekey', alternativeGrecaptcha);
                    gaPush('dl_qr_phone_process', "click - phone_".concat(method, "_push - screen_fork"));
                    gaPush('dl_qr_phone_start', "form - phone_telegram_push");
                  } else {
                    gaPush('dl_qr_phone_process', "click - phone_".concat(method, "_code - screen_fork"));
                    gaPush('dl_qr_phone_start', "form - phone_sms_code");
                  }
                  sessionStorage.setItem('preferredMethod', method);
                });
              }
              var _loop = function _loop(login) {
                if (logins[login]) {
                  $(".ube-auth-".concat(login)).on('click', function () {
                    gaPush('dl_qr_auth_social_start', "click - icon: ".concat(socialNamesMapping[login]));
                    options.toggleLoader && options.toggleLoader(true);
                    handleSocialAuth(formKey, login);
                  });
                }
              };
              for (var login in logins) {
                _loop(login);
              }
              if ((isDocuments || isIDXEnabled) && !isFRCookieExists) {
                $('.ube-av0-phone-send, .ube-av0-phone-check').show();
                $('.ube-av1-phone-send, .ube-av1-phone-check').hide();
              } else {
                $('.ube-av1-phone-send, .ube-av1-phone-check').show();
                $('.ube-av0-phone-send, .ube-av0-phone-check').hide();
              }
              options.onFormLoad && options.onFormLoad(key);
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              var state = {
                phone: result.data.phone,
                sessionKey: result.data.sessionKey
              };
              if (user) state.user = user;
              switch (result.event) {
                case 'success':
                  cb({
                    loginStatus: 'phoneCheck'
                  }, state);
                  break;
              }
            }
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-form-phone-send').hide();
        }
      }]);
    }(Block);

    var Redirect = /*#__PURE__*/function (_Block) {
      function Redirect() {
        _classCallCheck(this, Redirect);
        return _callSuper(this, Redirect, arguments);
      }
      _inherits(Redirect, _Block);
      return _createClass(Redirect, [{
        key: "run",
        value: function run(key, state, cb) {
          var _this$options = this.options,
            toggleLoader = _this$options.toggleLoader,
            redirect = _this$options.redirect;
          toggleLoader && toggleLoader(true);
          var redirectOptions = {
            allocationCode: redirect.allocation,
            redirect: redirect.page,
            formKey: this.name,
            sessionKey: state.sessionKey
          };
          if (redirect.external) redirectOptions.external = redirect.external;
          $.ubeLink(redirectOptions);
        }
      }, {
        key: "close",
        value: function close() {
          $('.ube-form-docs').hide();
        }
      }]);
    }(Block);

    var Registration = /*#__PURE__*/function (_Block) {
      function Registration() {
        _classCallCheck(this, Registration);
        return _callSuper(this, Registration, arguments);
      }
      _inherits(Registration, _Block);
      return _createClass(Registration, [{
        key: "run",
        value: function run(key, state, cb) {
          var options = this.options;
          var target = this.initContainers('login', 'register');
          var isIDXEnabled = !state.faceAV;
          target.show().ube(this.name, {
            isTemplatePreloaded: false,
            loadFormDataFromSession: true,
            sessionKey: state.sessionKey,
            data: _objectSpread2({}, state.user),
            onFormLoad: function onFormLoad() {
              if (isIDXEnabled) {
                $(".ube-av1").hide();
              } else {
                $(".ube-av0").hide();
              }
              options.onFormLoad && options.onFormLoad(key);
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              var response = {
                event: result.event,
                sessionKey: result.data.sessionKey,
                userId: userId
              };
              var block = {
                regStatus: ''
              };
              var state = {
                sessionKey: result.data.sessionKey,
                result: result
              };
              state.originalEvent = 'registration';
              ubeCookie$1(cookies.UBE_WIDGET_REGISTER, 'Y');
              switch (result.event) {
                case "alreadyVerified":
                  console.log("UBE Register AV1 result", response);
                  block.regStatus = 'alreadyVerified';
                  state.av = 1;
                  state.avStatus = 1;
                  cb(block, state);
                  break;
                case "registered":
                  console.log("UBE Register result", response);
                  $('#popup-content').hide();
                  $('#registration-content').hide();
                  block.regStatus = 'registered';
                  state.av = 0;
                  state.avStatus = 0;
                  cb(block, state);
                  break;
                case "2optin":
                  block.regStatus = 'optin';
                  cb(block, state);
                  break;
              }
            }
          });
        }
      }, {
        key: "close",
        value: function close(state) {
          if (!state.withOptin) $('.ube-form-register').hide();
        }
      }]);
    }(Block);

    var Start = /*#__PURE__*/function (_Block) {
      function Start() {
        _classCallCheck(this, Start);
        return _callSuper(this, Start, arguments);
      }
      _inherits(Start, _Block);
      return _createClass(Start, [{
        key: "run",
        value: function run(key, state, cb) {
          $('.start-screen').show();
          ubeCookie$1(cookies.UBE_USERID, null);
          window.mbepUserId = '';
          this.options.startContent(function (userFlow) {
            userFlow ? cb({
              userFlow: userFlow
            }) : cb();
          });
        }
      }, {
        key: "close",
        value: function close() {
          $('.start-screen').hide();
        }
      }]);
    }(Block);

    var Survey = /*#__PURE__*/function (_Block) {
      function Survey() {
        _classCallCheck(this, Survey);
        return _callSuper(this, Survey, arguments);
      }
      _inherits(Survey, _Block);
      return _createClass(Survey, [{
        key: "run",
        value: function () {
          var _run = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee3(key, state, cb) {
            var _state$config;
            var formKey, isBenefitReceived, _isBenefitReceived;
            return _regeneratorRuntime().wrap(function _callee3$(_context3) {
              while (1) switch (_context3.prev = _context3.next) {
                case 0:
                  _isBenefitReceived = function _isBenefitReceived3() {
                    _isBenefitReceived = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee2() {
                      var response, data;
                      return _regeneratorRuntime().wrap(function _callee2$(_context2) {
                        while (1) switch (_context2.prev = _context2.next) {
                          case 0:
                            _context2.prev = 0;
                            _context2.next = 3;
                            return fetch("".concat($.ube.host, "/api/f2s/consumer/").concat(formKey, "/user/benefitStatus"), {
                              method: 'GET',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + state.sessionKey
                              }
                            });
                          case 3:
                            response = _context2.sent;
                            if (response.ok) {
                              _context2.next = 6;
                              break;
                            }
                            throw new Error("Response status: ".concat(response.status));
                          case 6:
                            _context2.next = 8;
                            return response.json();
                          case 8:
                            data = _context2.sent;
                            if (data.hasBenefit) state.surveyBenefitReceived = true;
                            _context2.next = 15;
                            break;
                          case 12:
                            _context2.prev = 12;
                            _context2.t0 = _context2["catch"](0);
                            console.error(_context2.t0.message);
                          case 15:
                          case "end":
                            return _context2.stop();
                        }
                      }, _callee2, null, [[0, 12]]);
                    }));
                    return _isBenefitReceived.apply(this, arguments);
                  };
                  isBenefitReceived = function _isBenefitReceived2() {
                    return _isBenefitReceived.apply(this, arguments);
                  };
                  formKey = this.name;
                  if (!((_state$config = state.config) !== null && _state$config !== void 0 && (_state$config = _state$config.survey) !== null && _state$config !== void 0 && _state$config.checkBenefitReceived)) {
                    _context3.next = 6;
                    break;
                  }
                  _context3.next = 6;
                  return isBenefitReceived();
                case 6:
                  this.options.survey(function () {
                    cb();
                  }, state, /*#__PURE__*/function () {
                    var _ref = _asyncToGenerator(/*#__PURE__*/_regeneratorRuntime().mark(function _callee(data) {
                      var response, result;
                      return _regeneratorRuntime().wrap(function _callee$(_context) {
                        while (1) switch (_context.prev = _context.next) {
                          case 0:
                            _context.next = 2;
                            return fetch("".concat($.ube.host, "/api/session/").concat(formKey, "/survey"), {
                              method: 'POST',
                              headers: {
                                "Content-Type": "application/json",
                                "Authorization": "Bearer " + state.sessionKey
                              },
                              body: JSON.stringify(data)
                            });
                          case 2:
                            response = _context.sent;
                            _context.next = 5;
                            return response.json();
                          case 5:
                            result = _context.sent;
                            if (response.ok) {
                              _context.next = 9;
                              break;
                            }
                            (result === null || result === void 0 ? void 0 : result.message) && $.ube.showPopup(result.message);
                            throw result;
                          case 9:
                            return _context.abrupt("return", result);
                          case 10:
                          case "end":
                            return _context.stop();
                        }
                      }, _callee);
                    }));
                    return function (_x4) {
                      return _ref.apply(this, arguments);
                    };
                  }());
                case 7:
                case "end":
                  return _context3.stop();
              }
            }, _callee3, this);
          }));
          function run(_x, _x2, _x3) {
            return _run.apply(this, arguments);
          }
          return run;
        }()
      }, {
        key: "close",
        value: function close() {
          $('.survey-screen').hide();
        }
      }]);
    }(Block);

    var ThankYou = /*#__PURE__*/function (_Block) {
      function ThankYou() {
        _classCallCheck(this, ThankYou);
        return _callSuper(this, ThankYou, arguments);
      }
      _inherits(ThankYou, _Block);
      return _createClass(ThankYou, [{
        key: "run",
        value: function run(key, state, cb) {
          $('.final-screen').show();
          this.options.finalContent(function () {
            cb({
              sku: state.sku
            }, {});
          }, state);
        }
      }, {
        key: "close",
        value: function close() {
          $('.final-screen').hide();
        }
      }]);
    }(Block);

    (function () {
      $.getCoupon = function (entity, sessionKey) {
        return $.ajax({
          url: $.ube.host + "/api/session/coupon/" + entity,
          headers: {
            "Authorization": "Bearer " + sessionKey
          }
        }).done(function (result) {
          if (result) return result;
        }).fail(function (xhr, resp, text) {
          console.log("UBE :: Get Coupon ERROR");
          console.log(xhr, resp, text);
        });
      };
    })();

    (function () {
      var callbackBlacklist = ['mrl-lpe-global-face'];
      $.fn.ubeScanpackFace = function (name, callback, options) {
        var container = $(this).first();
        if (!container || container.length === 0) console.error("UBE - Отсутствует контейнер");
        if (!name || name === "") return container.html("UBE - Не указан параметр name");
        name = name.replace("-reg", "-face");
        var ubeFaceOptions = _objectSpread2({
          isTemplatePreloaded: false,
          onSubmissionSuccess: function onSubmissionSuccess(result) {
            callback(true, result);
          },
          onSubmissionError: function onSubmissionError(result) {
            container.find(".ube-hide-on-fail").hide();
            container.find(".ube-show-on-fail").show();
            if (!callbackBlacklist.includes(name)) callback(false, result);
          }
        }, options);
        container.ubeFace(name, ubeFaceOptions);
      };
    })();

    /**
     * @type {Object.<string, Block>}
     */
    var MAPPING = {
      input: Start,
      faceNode: Face,
      contentNode: Content,
      failContentNode: FailContent,
      smsPhoneSendNode: PhoneSend,
      smsPhoneCheckNode: PhoneCheck,
      IDXNode: IDXReg,
      regNode: Registration,
      emailOptinNode: EmailOptin,
      avNode: AV,
      surveyNode: Survey,
      thankYouPageNode: ThankYou,
      dteCouponNode: DteCoupon,
      output: Redirect
    };

    /**
     * Creates new class instance
     * @param {String} key 
     * @returns {Block}
     */
    function create(key, name, options, container) {
      var TargetClass = MAPPING[key];
      return new TargetClass(name, options, container);
    }

    (function () {
      $__default["default"].fn.ubeScanpackLogin = function (name, callback, options) {
        var isDocuments = options && options.documents;
        var isFaceVerified = ubeCookie$1(cookies.UBE_FACE_BEFORE) && ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN) && ubeCookie$1(cookies.UBE_AGE_VERIFIED);
        var isIDXEnabled = options && options.idx && !isFaceVerified;
        var isTrial = options && options.trial;
        function setCookies(sessionKey, event) {
          ubeCookie$1(cookies.UBE_WIDGET_SESSION_KEY, sessionKey, sessionExpiration());
          if (event === 'registration') {
            ubeCookie$1(cookies.UBE_WIDGET_REGISTER, 'Y');
          } else if (event === 'login') {
            ubeCookie$1(cookies.UBE_WIDGET_LOGIN, 'Y');
          }
        }
        function getInfo(sessionKey) {
          return $__default["default"].ajax({
            url: "".concat($__default["default"].ube.host, "/esb/").concat(name, "/avUserStatus"),
            headers: {
              "Authorization": "Bearer " + sessionKey
            }
          }).fail(function () {
            return console.log('error');
          });
        }
        var data = options && options.data || {};
        var container = $__default["default"](this).first();
        if (!container || container.length === 0) console.error("UBE - Отсутствует контейнер");
        if (!name || name === "") return container.html("UBE - Не указан параметр name");
        var phoneSendName = name.replace("-reg", "-phone-send");
        var phoneCheckName = name.replace("-reg", "-phone-check");
        var idxName = name.replace("-reg", "-idx");
        container.empty();
        var phoneSendContainer = $__default["default"]('<div class="ube-form-phone-send"></div>').appendTo(container);
        var phoneCheckContainer = $__default["default"]('<div class="ube-form-phone-check"></div>').hide().appendTo(container);
        var registrationContainer = $__default["default"]('<div class="ube-form-register"></div>').hide().appendTo(container);
        var avContainer = $__default["default"]('<div class="ube-form-docs"></div>').hide().appendTo(container);
        var idxContainer = $__default["default"]('<div class="ube-form-idx"></div>').hide().appendTo(container);
        var popupContainer = $__default["default"]('<div class="ube-popup"></div>').hide().appendTo($__default["default"]('body'));
        var isFRCookieExists = ubeCookie$1(cookies.UBE_JWT_FACE_TOKEN) || false;
        var handleTextVisibility = function handleTextVisibility() {
          if ((isDocuments || isIDXEnabled) && !isFRCookieExists) {
            $__default["default"]('.ube-av0-phone-send, .ube-av0-phone-check').show();
            $__default["default"]('.ube-av1-phone-send, .ube-av1-phone-check').hide();
          } else {
            $__default["default"]('.ube-av1-phone-send, .ube-av1-phone-check').show();
            $__default["default"]('.ube-av0-phone-send, .ube-av0-phone-check').hide();
          }
        };
        function loadPhoneSend() {
          var formData = _objectSpread2(_objectSpread2({}, data), {}, {
            phone: ""
          });
          phoneSendContainer.show().ube(phoneSendName, {
            data: formData,
            isTemplatePreloaded: false,
            onFormLoad: handleTextVisibility,
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              switch (result.event) {
                case 'success':
                  loadPhoneCheck(result.data.sessionKey, result.data.phone);
                  break;
              }
            }
          });
        }
        function backToPhoneSend() {
          phoneCheckContainer.hide();
          phoneSendContainer.show();
          $__default["default"](".ube-phone-send-form [name=phone]").focus();
        }
        function loadPhoneCheck(sessionKey, phone) {
          phoneSendContainer.hide();
          var isFormSubmitted = false;
          !ubeCookie$1(cookies.UBE_WIDGET_REGISTER) && !ubeCookie$1(cookies.UBE_WIDGET_LOGIN);
          phoneCheckContainer.show().ube(phoneCheckName, {
            sessionKey: sessionKey,
            isTemplatePreloaded: false,
            loadFormDataFromSession: true,
            data: {
              phone: phone
            },
            onFormLoad: handleTextVisibility,
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              switch (result.event) {
                case 'cancel':
                case 'close':
                  backToPhoneSend();
                  break;
                case 'verified':
                  if (!isFormSubmitted) {
                    isFormSubmitted = true;
                    if (isIDXEnabled) showIDXPage(result.data.sessionKey, phone);else showRegistrationPage(result.data.sessionKey, phone);
                  }
                  break;
                case 'loginSuccess':
                  if (!isFormSubmitted) {
                    isFormSubmitted = true;
                    setCookies(result.data.sessionKey, 'login');
                    var response = {
                      event: result.event,
                      sessionKey: result.data.sessionKey,
                      userId: userId
                    };
                    getInfo(result.data.sessionKey).done(function (response) {
                      var av = response.av,
                        trialAccess = response.trialAccess;
                      var avStatus = +av;
                      if (isIDXEnabled || isDocuments || isTrial) {
                        if (avStatus === 1 || isTrial && avStatus === 0 && trialAccess) {
                          console.log("UBE Login result", response);
                          if (trialAccess) console.log("UBE :: user has trial access");
                          callback(result.event, result, 'login', 1);
                        } else {
                          showAVPage(result.data.sessionKey, 'login');
                        }
                      } else {
                        callback(result.event, result, 'login', avStatus);
                      }
                    });
                    console.log("UBE Login result", response);
                  }
                  break;
              }
            }
          });
        }
        function showIDXPage(sessionKey, phone) {
          phoneCheckContainer.hide();
          idxContainer.appendTo(container).show().ube(idxName, {
            isTemplatePreloaded: false,
            sessionKey: sessionKey,
            loadFormDataFromSession: false,
            data: {
              phone: phone
            },
            setFieldValue: function setFieldValue(key, value, common) {
              if (key === 'agreeWithRules') $__default["default"]('#agreeWithRules').prop('checked', false);else common(key, value);
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              switch (result.event) {
                case 'success':
                  showRegistrationPage(result.data.sessionKey, phone, result);
              }
            }
          });
        }
        function showRegistrationPage(sessionKey, phone, result) {
          phoneCheckContainer.hide();
          idxContainer.hide();
          registrationContainer.show().ube(name, {
            isTemplatePreloaded: false,
            sessionKey: sessionKey,
            data: {
              phone: phone
            },
            onFormLoad: function onFormLoad() {
              if (isIDXEnabled) {
                $__default["default"](".ube-av1").hide();
              } else {
                $__default["default"](".ube-av0").hide();
              }
            },
            setFieldValue: function setFieldValue(key, value, common) {
              if (result && key === 'birthDate' && result.birthDate) {
                var v = result.birthDate.split(".").join("");
                $__default["default"]('#birthDateField').val(v);
              } else if (result && key === 'firstName' && result.firstName) {
                $__default["default"]('#firstNameField').val(result.firstName);
              } else if (result && key === 'lastName' && result.lastName) {
                $__default["default"]('#lastNameField').val(result.lastName);
              } else if (result && key === 'consent') {
                $__default["default"]('#checkboxField').prop('checked', true);
              } else if (result && key === 'idxId' && result.idxID) {
                $__default["default"]('#idxID').val(result.idxID);
              } else {
                common(key, value);
              }
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              var response = {
                event: result.event,
                sessionKey: result.data.sessionKey,
                userId: userId
              };
              switch (result.event) {
                case "alreadyVerified":
                  handleAV1Result(result, response);
                  break;
                case "registered":
                  handleAV0Result(result, response);
                  break;
                case "2optin":
                  toOptInEmail(submissionId, userId, result);
                  break;
              }
            }
          });
        }
        var handleAV1Result = function handleAV1Result(result, response) {
          setCookies(result.data.sessionKey, 'registration');
          console.log("UBE Register AV1 result", response);
          callback(result.event, result, 'registration', 1);
        };
        var handleAV0Result = function handleAV0Result(result, response) {
          setCookies(result.data.sessionKey, 'registration');
          console.log("UBE Register result", response);
          if (isDocuments || isIDXEnabled) {
            showAVPage(response.sessionKey, 'registration');
          } else {
            $__default["default"]('#popup-content').hide();
            $__default["default"]('#registration-content').hide();
            callback(result.event, result, 'registration', 1);
          }
        };
        function showAVPage(sessionKey, originalEvent) {
          var gaUJEvent = originalEvent === 'registration' ? 'reg' : 'auth';
          gaPush("qr_age", "idx - after_" + gaUJEvent, sessionStorage.getItem('promoCampaignName'));
          registrationContainer.hide();
          phoneCheckContainer.hide();
          avContainer.show().ubeAV("".concat($__default["default"].ube.host, "/main/").concat(name), sessionKey, {
            data: {
              entity: name
            },
            isTemplatePreloaded: false,
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              switch (result.event) {
                case "instant":
                  callback(result.event, result, originalEvent, 1);
                  break;
                case "later":
                  callback(result.event, result, originalEvent, 0);
                  break;
                case "delayed":
                  if (!ubeCookie$1(cookies.UBE_DOCUMENTS_PROVIDED)) {
                    var dateTarget = new Date();
                    dateTarget.setDate(dateTarget.getDate() + 7); // 1 week
                    ubeCookie$1(cookies.UBE_DOCUMENTS_PROVIDED, 'Y', dateTarget);
                  }
                  if (isTrial) callback(result.event, result, originalEvent, 1);else callback(result.event, result, originalEvent, 0);
                  break;
                default:
                  console.error("UBE :: Unknown AV result event: " + result.event);
                  break;
              }
            },
            onSessionError: function onSessionError(message, sessionKey) {
              $__default["default"].ube.showPopup("Ошибка сессии");
            }
          });
        }
        function toOptInEmail(submissionId, userId, result) {
          popupContainer.ube("ube2-optin", {
            data: result.data.data,
            template: result.data.template,
            onFormLoad: function onFormLoad() {
              popupContainer.fadeIn();
            },
            onSubmissionSuccess: function onSubmissionSuccess(submissionId, userId, result) {
              var response = {
                event: result.event,
                sessionKey: result.data.sessionKey,
                userId: userId
              };
              popupContainer.fadeOut();
              switch (result.event) {
                case "alreadyVerified":
                  handleAV1Result(result, response);
                  break;
                case "registered":
                  handleAV0Result(result, response);
                  break;
              }
            }
          });
        }
        loadPhoneSend();
      };
    })();

    $__default["default"].tgLink = function (options) {
      var _options$utmSource = options.utmSource,
        utmSource = _options$utmSource === void 0 ? getQueryParameter(window.location.search, 'utm_source') : _options$utmSource,
        _options$utmCampaign = options.utmCampaign,
        utmCampaign = _options$utmCampaign === void 0 ? getQueryParameter(window.location.search, 'utm_campaign') : _options$utmCampaign,
        _options$utmContent = options.utmContent,
        utmContent = _options$utmContent === void 0 ? getQueryParameter(window.location.search, 'utm_content') : _options$utmContent,
        referralFormKey = options.referralFormKey,
        url = options.url,
        isAuth = options.isAuth;
      var ymid = ubeCookie('_ym_uid');
      function canParse(x) {
        try {
          new URL(x);
          return true;
        } catch (e) {
          return false;
        }
      }
      if (!url) alert('$.tgLink отстутствует параметр url');
      if (!canParse(url)) alert('$.tgLink некорректный формат ссылки url: ' + url);
      if (!utmSource) alert('$.tgLink отстутствует параметр utmSource');
      if (!utmCampaign) alert('$.tgLink отстутствует параметр utmCampaign');
      var jwtFaceToken = ubeCookie('UBE_JWT_FACE_TOKEN');
      var impression = $__default["default"].ube.impressionToken;
      if (!url.includes('?')) url += '?';
      var tgLink = url && "".concat(url, "&utm_source=").concat(utmSource, "&utm_campaign=").concat(utmCampaign, "&tokenfr=").concat(ubeCookie('UBE_AGE_VERIFIED_TOKEN') || false);
      if (jwtFaceToken) tgLink += "&jwtFaceToken=".concat(jwtFaceToken);
      if (impression) tgLink += "&impression=".concat(impression);
      if (referralFormKey) tgLink += "&referralFormKey=".concat(referralFormKey);
      if (utmContent) tgLink += "&utm_content=".concat(utmContent);
      if (ymid) tgLink += "&ymid=".concat(ymid);
      if (!canParse(tgLink)) alert('$.tgLink некорректный формат ссылки');
      if (!isAuth) {
        window.location.href = new URL(tgLink);
      } else {
        $__default["default"].ubeLink({
          external: true,
          callback: function callback(link) {
            if (link) {
              var token = link.match(/T=[^&]*/)[0].slice(2);
              if (token) {
                tgLink += "&token=".concat(token);
              } else {
                console.error('$.tgLink получен пустой token от сервера');
              }
              window.location.href = new URL(tgLink);
            }
          }
        });
      }
    };

    (function () {
      $.fn.ubeWidget = function (name, options) {
        var container = $(this).first();
        var faceContainer = $('<div class="ube-face-container screen"></div>').appendTo(container);
        var loginContainer = $('<div class="ube-login-container screen"></div>').appendTo(container);
        var timeoutEntity;
        if (!ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN)) localStorage.removeItem(cookies.UBE_AGE_VERIFIED_TOKEN);
        $.ube = $.ube || {};
        $.ube.showRules = options.showRules && options.showRules;
        $.ube.hideRules = options.hideRules && options.hideRules;
        $.ube.toggleLoader = options.toggleLoader && options.toggleLoader;
        $.ube.showPopup = options.showPopup && options.showPopup;
        $.ube.host = options.host || $.ube.host;
        Impression.runImpression(name);
        if (!options.classes) {
          $('.screen').hide().filter('.ube-screen-start').show();
        } else {
          faceContainer.addClass(options.classes.face[0]);
          loginContainer.addClass(options.classes.login[0]);
        }
        function showPopup(message) {
          if ($.ube && $.ube.showPopup) $.ube.showPopup(message);else {
            alert(message);
          }
        }
        var mandatoryParams = ['startContent', 'skuContent', 'finalContent'];
        mandatoryParams.forEach(function (param) {
          if (!options[param]) {
            var message = "UBE: \u043E\u0442\u0441\u0443\u0441\u0442\u0432\u0443\u0435\u0442 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u044B\u0439 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 ".concat(param, ": function(next) {...}");
            console.error(message);
            showPopup(message);
          }
        });

        /**
         * @type {{
        * event: string,
        * result: Object,
        * avStatus: number,
        * skuShown: boolean,
        * originalEvent: string,
        * faceRecoPassed: boolean
        * }} globalCtx
        */
        var globalCtx = {};

        /**
         * @type {{
         * previousBlock: string, 
         * customUJ: array, 
         * face: boolean,
         * shouldSkipFace: boolean,
         * login: false,
         * ujType: string,
         * ujTemplate: string,
         * skuShown: boolean,
         * redirect: Object,
         * av: number,
         * faceAV: number,
         * faceReco: Object,
         * sessionKey: string,
         * phone: string,
         * withOptin: boolean,
         * config: Object
         * }} state
         */
        var state = {
          previousBlock: '',
          customUJ: [],
          face: false,
          shouldSkipFace: false,
          login: false,
          ujType: '',
          ujTemplate: '',
          skuShown: false,
          sku: false,
          faceAV: 0,
          av: 0,
          redirect: {
            autoInit: false,
            manualInit: false,
            source: ''
          }
        };
        $.get("".concat($.ube.host, "/form/").concat(name, "/?journey=true")).then(function (res) {
          if (res.enabled) state.ujTemplate = res.templateName;
          if (state.ujTemplate === 'reversed') {
            state.av = 0;
            state.face = true;
            var expires = "expires=Thu, 01 Jan 1970 00:00:00 UTC";
            ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN, '', expires);
            ubeCookie$1(cookies.UBE_AGE_VERIFIED, '', expires);
            ubeCookie$1(cookies.UBE_FACE_BEFORE, '', expires);
            try {
              if (localStorage) {
                localStorage.removeItem(cookies.UBE_AGE_VERIFIED_TOKEN);
                localStorage.removeItem(cookies.UBE_AGE_VERIFIED);
                localStorage.removeItem(cookies.UBE_FACE_BEFORE);
              }
            } catch (error) {
              window.backupLocalStorage.removeItem(cookies.UBE_AGE_VERIFIED_TOKEN);
              window.backupLocalStorage.removeItem(cookies.UBE_AGE_VERIFIED);
              window.backupLocalStorage.removeItem(cookies.UBE_FACE_BEFORE);
            }
          }
        });
        $.get("".concat($.ube.host, "/api/scanpack/userJourney/").concat(name)).then(function (res) {
          if (res.journey) {
            if (res.journey.find(function (x) {
              return x.key === 'emailOptinNode';
            })) state.withOptin = true;
            state.customUJ = res.journey;
            $('.ube-face-container').remove();
            $('.ube-login-container').remove();
            startCustomUJ();
          } else options.startContent(next);
        })["catch"](function () {
          options.startContent(next);
        });
        $.get("".concat($.ube.host, "/api/config/safeOptions/").concat(name)).then(function (res) {
          if (res.config) state.config = res.config;
        })["catch"](function (error) {
          console.log("Error: " + error);
        });
        function skipFace() {
          var jwtToken = ubeCookie$1(cookies.UBE_JWT_FACE_TOKEN);
          if (jwtToken) {
            $.post("".concat($.ube.host, "/api/session/validate/token"), {
              jwt: jwtToken
            }).done(function (response) {
              if (response.result) {
                state.shouldSkipFace = true;
                state.face = true;
                state.faceAV = 1;
              }
            }).fail(function (xhr, status, error) {
              console.log("UBE :: JWT validation error");
              console.log(xhr, status, error);
            });
          }
        }
        skipFace();
        var startContent = function startContent() {
          gaPush('dl_qr_content_start', '');
          state.faceAV = 1;
          state.skuShown = true;
          options.skuContent(next, {
            faceRecoPassed: true
          });
        };
        var processDefaultUJ = function processDefaultUJ() {
          if (state.login) {
            if (state.faceAV === 1 || state.faceAV === 0 && state.av === 0 || state.faceAV === 0 && state.av === 1 && state.skuShown) {
              gaPush('dl_qr_content_end', '');
              startRedirect();
            } else {
              if (!options.classes) {
                $('.screen').hide();
              } else {
                loginContainer.addClass(options.classes.login[1]);
              }
              if (state.faceAV === 0 && state.av === 1 && !state.skuShown) {
                gaPush('dl_qr_content_start', '');
              }
              state.skuShown = true;
              options.skuContent(next, _objectSpread2(_objectSpread2({}, globalCtx), {}, {
                faceRecoPassed: state.faceAV
              }));
            }
          } else if (state.face) {
            if (!state.skuShown && state.ujTemplate !== 'reversed' && state.faceAV) {
              if (state.shouldSkipFace) {
                sessionStorage.setItem('isFaceSkipped', true);
                gaPush('dl_qr_av_fr_skip', 'click - skip - form - fr');
              }
              startContent();
            } else {
              if (state.av || state.faceAV) gaPush('dl_qr_content_end', '');
              startLogin();
            }
          } else startFaceReco();
        };
        var processCustomUJ = function processCustomUJ(result) {
          var block = result && result.block || {};
          var currentState = result && result.state || state;
          var nextBlockKey = getNextBlock(block, currentState);
          nextBlockKey && _runBlockRecursive(nextBlockKey, currentState);
        };
        var next = function next(res) {
          if (state.customUJ.length > 0) processCustomUJ(res || {});else processDefaultUJ();
        };
        var startRedirect = function startRedirect() {
          var redirect = options.redirect;
          if (!redirect) {
            console.warn('UBE - не указан параметр redirect');
            return;
          }
          var initializeRedirect = function initializeRedirect() {
            options.toggleLoader(true);
            var redirectOptions = {
              allocationCode: redirect.allocation,
              redirect: redirect.page,
              formKey: name
            };
            if (redirect.external) redirectOptions.external = redirect.external;
            $.ubeLink(redirectOptions);
          };
          if (redirect.auto) {
            if (!state.redirect.autoInit) {
              state.redirect.autoInit = true;
              var timeoutInMS = parseInt(redirect.auto) || 3000;
              timeoutEntity = setTimeout(function () {
                initializeRedirect();
              }, timeoutInMS);
            } else {
              clearTimeout(timeoutEntity);
              initializeRedirect();
            }
          } else if (state.redirect.source !== 'sku' && !state.redirect.manualInit) {
            state.redirect.manualInit = true;
            return;
          } else {
            initializeRedirect();
          }
        };
        var startFaceReco = function startFaceReco() {
          gaPush('dl_qr_av_fr_process', 'view - screen_fr');
          toggleLoader(true);
          state.face = true;
          if (!options.classes) {
            $('.screen').hide();
            faceContainer.show();
          } else {
            faceContainer.removeClass(options.classes.face[0]);
          }
          faceContainer.ubeScanpackFace(name, function (result) {
            if (!options.classes) {
              faceContainer.hide();
            } else {
              faceContainer.addClass(options.classes.face[1]);
            }
            if (result) {
              sessionStorage.setItem('isFaceSkipped', state.shouldSkipFace);
              startContent();
            } else if (options && options.failContent) {
              options.failContent(next, {
                faceRecoPassed: false
              });
            } else {
              startLogin();
            }
          });
        };
        var startLogin = function startLogin() {
          if (!options.classes) {
            $('.screen').hide();
            loginContainer.show();
          } else {
            loginContainer.removeClass(options.classes.login[0]);
          }
          loginContainer.ubeScanpackLogin(name, function (event, result, originalEvent, avStatus) {
            globalCtx = _objectSpread2(_objectSpread2({}, globalCtx), {}, {
              event: event,
              result: result,
              originalEvent: originalEvent,
              avStatus: avStatus,
              faceRecoPassed: state.faceAV,
              skuShown: state.skuShown
            });
            state.login = true;
            state.av = avStatus;
            state.ujEvent = originalEvent;
            if (!state.skuShown) state.redirect.source = 'sku';
            options.finalContent(next, globalCtx);
            if (options.classes) {
              loginContainer.addClass(options.classes.login[1]);
            } else {
              loginContainer.hide();
            }
            if (avStatus && state.skuShown) {
              startRedirect();
            }
          }, {
            idx: state.faceAV === 0,
            trial: options.trial
          });
        };
        var startCustomUJ = function startCustomUJ() {
          return _runBlockRecursive(state.customUJ[0].key, state);
        };
        var _runBlockRecursive = function runBlockRecursive(key, state) {
          runBlock(key, state, function (block, state) {
            var nextBlockKey = getNextBlock(block, state);
            nextBlockKey && _runBlockRecursive(nextBlockKey, state);
          });
        };
        var getNextBlock = function getNextBlock(block, state) {
          var nextBlockId;
          var _state$customUJ$find = state.customUJ.find(function (item) {
              return item.key === state.previousBlock;
            }),
            nextBlock = _state$customUJ$find.nextBlock,
            data = _state$customUJ$find.data;
          if (nextBlock) nextBlockId = nextBlock;else if (data.conditions && Array.isArray(data.conditions) && data.conditions.length > 0) {
            var nextBlockCondition = data.conditions.find(function (item) {
              return item.key == Object.entries(block)[0][0] && item.value == Object.entries(block)[0][1];
            });
            nextBlockId = nextBlockCondition.next;
          }
          var targetBlock = state.customUJ.find(function (item) {
            return item.id === nextBlockId;
          });
          return targetBlock ? targetBlock.key : '';
        };
        var runBlock = function runBlock(key, state, cb) {
          state.currentNodeId = state.customUJ.find(function (item) {
            return item.key === key;
          }).id;
          create(key, name, options, container).runBlock(key, state, cb);
        };
      };
    })();

    $__default["default"].scrollToElement = function (selector) {
      if (!selector) return false;
      var elements = $__default["default"](selector);
      if (elements.length === 0) return false;
      var el = elements.first();
      elements.each(function () {
        if ($__default["default"](this).offset().top < el.offset().top) el = $__default["default"](this);
      });
      return el.focus();
    };

    $__default["default"].fn.ubeStopwatch = function () {
      var seconds = 0;
      var stopwatchTimeout;
      function startStopwatch() {
        console.log('UBE :: Stopwatch started');
        var initialMoment = Date.now();
        var interval = 1000;
        var expectedMoment = initialMoment + 1000;
        function countSecond() {
          seconds++;
          var difference = Date.now() - expectedMoment;
          expectedMoment += 1000;
          stopwatchTimeout = setTimeout(function () {
            countSecond();
          }, interval - difference);
          console.log('seconds:', seconds);
        }
        stopwatchTimeout = setTimeout(function () {
          countSecond();
        }, interval);
      }
      function stopStopwatch() {
        console.log('UBE :: Stopwatch stopped on ' + seconds + ' seconds');
        clearTimeout(stopwatchTimeout);
        var result = seconds;
        seconds = 0;
        return result;
      }
      function pauseStopwatch() {
        console.log('UBE :: Stopwatch paused on ' + seconds + ' seconds');
        clearTimeout(stopwatchTimeout);
        return seconds;
      }
      return {
        start: function start() {
          startStopwatch();
        },
        stop: function stop() {
          return stopStopwatch();
        },
        pause: function pause() {
          return pauseStopwatch();
        }
      };
    };

    /**
     *
     * @param {function} onStop
     * @param {integer} secondsCount
     * @param {boolean} isSecond
     * @return {{stop: stop, start: start}}
     */
    $__default["default"].fn.ubeTimer = function (onStop, secondsCount, isSecond) {
      var target = $__default["default"](this);
      var timer;
      var timeLeft;
      function stop() {
        if (timer) {
          clearInterval(timer);
          clearTimeout(timer);
          timer = undefined;
        }
      }
      function iterateOneSecond() {
        timeLeft--;
        var timeText = " секунд";
        var mod = timeLeft % 10;
        var mod100 = timeLeft % 100;
        if (mod100 < 10 || mod100 > 20) {
          if (mod === 1) timeText = isSecond ? " секунду" : " секунда";else if (mod > 1 && mod < 5) timeText = " секунды";
        }
        target.text(timeLeft + timeText);
        if (timeLeft <= 0) {
          stop();
          if (onStop) onStop();
        }
      }
      return {
        start: function start() {
          stop();
          timeLeft = secondsCount || 60;
          iterateOneSecond();
          timer = setInterval(iterateOneSecond, 1000);
        },
        stop: stop
      };
    };

    $__default["default"].fn.ubeTraverseEnter = function () {
      var form = $__default["default"](this);
      var selector = form.find('.ube-traverse-enter').length > 0 ? '.ube-traverse-enter' : 'input';
      form.find(selector).keydown(function (e) {
        var fields = form.find(selector + ':visible');
        if (e.which === 13) {
          var index = fields.index(this) + 1;
          var length = fields.length;
          if ($__default["default"](this).is(".ube-wizard-enter-next")) {
            form.trigger("ubeNext");
            e.preventDefault();
            return false;
          } else if (index < length) {
            fields.eq(index).focus();
            e.preventDefault();
            return false;
          }
        }
      });
    };

    $__default["default"].fn.ubeValidate = function (key, handleValid, handleInvalid) {
      var container = $__default["default"](this).first();
      var ube = container.data('ube');
      if (!ube) return console.error("UBE :: Element is not initialized with UBE");
      ube.validateAllFields(handleValid, handleInvalid, ube.appendChildrenKeys(key));
    };

    (function () {
      function getLink(sessionKey) {
        return $__default["default"].ajax({
          url: $__default["default"].ube.host + "/api/referral/link",
          headers: {
            "ube-session-key": sessionKey,
            "Authorization": "Bearer " + sessionKey
          }
        });
      }
      function sendLink(sessionKey) {
        return $__default["default"].ajax({
          url: $__default["default"].ube.host + "/api/referral/link/send",
          headers: {
            "ube-session-key": sessionKey,
            "Authorization": "Bearer " + sessionKey
          }
        });
      }
      $__default["default"].fn.ubeWallet = function (sessionKey, callbackBefore, callbackAfter, callbackError) {
        var component = $__default["default"](this);
        if (!sessionKey || sessionKey === "") throw new Error("wallet requires sessionKey as parameter");
        ubeHostFallBack();
        if (isAppleDevice || isAndroid) {
          callbackBefore("mobile");
          getLink(sessionKey).then(function (result) {
            if (!result || !result.value) callbackError("Отсутствует ссылка на скачивание карты. Попробуйте позже или обратитесь в Контакт Центр");else component.attr("href", result.value).attr("download", true).click(function () {
              callbackAfter("mobile");
            });
          })["catch"](function (e) {
            callbackError("Ошибка при запросе карты. Попробуйте позже или обратитесь в Контакт Центр");
            console.error(e);
          });
        } else {
          callbackBefore("desktop");
          component.off("click").click(function (e) {
            e.preventDefault();
            sendLink(sessionKey).then(function (result) {
              if (!result) callbackError("Ошибка при отправке карты. Попробуйте позже или обратитесь в Контакт Центр");else if (result.value === false) callbackError("Отсутствует ссылка на скачивание карты. Попробуйте позже или обратитесь в Контакт Центр");else if (result.phone === false) callbackError("Отсутствует номер телефона в профиле. Для отправки СМС заполните его");else if (result.value === true) callbackAfter("desktop");else callbackError("Ошибка при отправке карты. Попробуйте позже или обратитесь в Контакт Центр");
            })["catch"](function (e) {
              callbackError("Ошибка при отправке карты. Попробуйте позже или обратитесь в Контакт Центр");
              console.error(e);
            });
            return false;
          });
        }
      };
    })();

    if (!String.prototype.includes) {
      String.prototype.includes = function (search, start) {

        if (typeof start !== 'number') {
          start = 0;
        }
        if (start + search.length > this.length) {
          return false;
        } else {
          return this.indexOf(search, start) !== -1;
        }
      };
    }
    if (!Array.prototype.includes) {
      Object.defineProperty(Array.prototype, "includes", {
        enumerable: false,
        value: function value(obj) {
          var newArr = this.filter(function (el) {
            return el == obj;
          });
          return newArr.length > 0;
        }
      });
    }
    if (!Array.prototype.flat) {
      Object.defineProperty(Array.prototype, 'flat', {
        value: function value() {
          var depth = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
          return this.reduce(function (flat, toFlatten) {
            return flat.concat(Array.isArray(toFlatten) && depth > 1 ? toFlatten.flat(depth - 1) : toFlatten);
          }, []);
        }
      });
    }

    var dotBirthDate = function dotBirthDate(birthDate) {
      return (birthDate || "").replace(/^.*(\d{2})[^0-9]*(\d{2})[^0-9]*(\d{4}).*$/, "$1.$2.$3").replace(/^.*(\d{4})[^0-9]*(\d{2})[^0-9]*(\d{2}).*$/, "$3.$2.$1");
    };
    var _factory = /*#__PURE__*/new WeakMap();
    var _key = /*#__PURE__*/new WeakMap();
    var _autoAddToDOM = /*#__PURE__*/new WeakMap();
    var _trimFields = /*#__PURE__*/new WeakMap();
    var Field = /*#__PURE__*/function () {
      function Field(factory, key) {
        _classCallCheck(this, Field);
        _classPrivateFieldInitSpec(this, _factory, void 0);
        _classPrivateFieldInitSpec(this, _key, void 0);
        _classPrivateFieldInitSpec(this, _autoAddToDOM, ["locationId", "entity", "socialId", "socialKey", "phoneCodeSentAt", "phoneCodeSent", "emailCodeSentAt", "emailCodeSent", "phoneValidatedValue", "emailValidatedValue", "method", "profileId", "token", "tokenUrl", "externalId", "utmCampaign", "utmContent", "utmSource", "utmMedia", "isPhoneCross", "isEmailCross", "popup", "mobileTelephoneVerifiedCode", "emailVerifiedCode", "phoneVerifiedLabel", "emailVerifiedLabel", "isEmailChangedOneMonth", "isPhoneChangedOneMonth", "dteContactId"]);
        _classPrivateFieldInitSpec(this, _trimFields, ["firstName", "lastName", "email", "middleName"]);
        _classPrivateFieldSet2(_factory, this, factory);
        _classPrivateFieldSet2(_key, this, key);
        this.getDOMField = this.getDOMField.bind(this);
        this.createFieldIfAbsent = this.createFieldIfAbsent.bind(this);
        this.setDOMFieldLabel = this.setDOMFieldLabel.bind(this);
        this.setDOMFieldValue = this.setDOMFieldValue.bind(this);
        this.getDOMFieldValue = this.getDOMFieldValue.bind(this);
      }
      return _createClass(Field, [{
        key: "container",
        get: function get() {
          return _classPrivateFieldGet2(_factory, this).container;
        }
      }, {
        key: "key",
        get: function get() {
          return _classPrivateFieldGet2(_key, this);
        }
      }, {
        key: "component",
        get: function get() {
          return _classPrivateFieldGet2(_factory, this).component(this.key);
        }
      }, {
        key: "typ",
        get: function get() {
          return this.component.type;
        }
      }, {
        key: "createFieldIfAbsent",
        value: function createFieldIfAbsent() {
          var key = this.key;
          if (_classPrivateFieldGet2(_autoAddToDOM, this).indexOf(key) >= 0 && this.getDOMField().length === 0) this.container.find("form").append('<input type="hidden" name="' + key + '"/>');
        }
      }, {
        key: "getDOMField",
        value: function getDOMField(filter) {
          var container = this.container;
          var key = this.key;
          var typ = this.typ;
          var field;
          if (filter && filter.length > 0) field = container.find("[name='" + key + "']").filter(filter);else if (typ === 'radio') {
            field = container.find("[name='" + key + "']:checked");
            if (field.length === 0) field = container.find("[name='" + key + "']");
          } else field = container.find("[name='" + key + "']");
          return field;
        }
      }, {
        key: "setDOMFieldLabel",
        value: function setDOMFieldLabel(value) {
          var key = this.key;
          var label = value;
          if (key === "gender") {
            switch (value) {
              case "male":
                label = "Мужской";
                break;
              case "female":
                label = "Женский";
                break;
              default:
                label = "";
                break;
            }
          } else if (key === "phone" || key === "phoneValidatedValue") {
            if (("" + label).length === 10) {
              label = (label + "").replace(/^(\d{3})(\d{3})(\d{2})(\d{2})$/, "+7 ($1) $2-$3-$4");
            }
          } else if (key === "birthDate") {
            label = dotBirthDate(label);
          }
          this.container.find(".ube-value-label-" + key).html(label);
        }
      }, {
        key: "setDOMFieldValue",
        value: function setDOMFieldValue(value) {
          var container = this.container;
          var key = this.key;
          var typ = this.typ;
          var getField = this.getDOMField;
          var options = _classPrivateFieldGet2(_factory, this).options;
          var createFieldIfAbsent = this.createFieldIfAbsent;
          var common = function common(key, value) {
            if (typ === "radio") {
              var fieldIsRadio = getField("[type=radio]").length > 0;
              if (fieldIsRadio) {
                if (value) getField("[value='" + value + "']").prop("checked", true);else getField().prop("checked", false);
              } else {
                getField().val(value);
              }
            } else if (typ === "checkbox") {
              getField().prop("checked", value);
            } else if (["locationId", "cigaretteType", "cigaretteTypeExt", "cigaretteBrand", "cigaretteBrandExt"].indexOf(key) > -1) {
              getField().attr('data-value', value);
            } else {
              createFieldIfAbsent();
              getField().val(value);
            }
          };
          if (options.setFieldValue) options.setFieldValue(key, value, common);else common(key, value);
          var selectorToSetValue = container.find(".ube-value-" + key);
          if (selectorToSetValue.is("input[type=checkbox]")) selectorToSetValue.prop("checked", value);else selectorToSetValue.html(value);
          this.setDOMFieldLabel(value);
        }

        /**
         *
         * @param defaultValue - value if DOM field is absent
         * @returns {any}
         */
      }, {
        key: "getDOMFieldValue",
        value: function getDOMFieldValue(defaultValue) {
          var typ = this.typ;
          var field = this.getDOMField();
          if (!field || field.length === 0) return defaultValue;else if (typ === "checkbox") return field.is(":checked");else if (typ === "select" && this.component.dataSrc === "url") return field.attr("data-value");else if (typ === "phoneNumber") return field.val() ? field.val().replace(/[^0-9]/g, "").replace(/^([78])([0-9]{10}).*$/, "$2") : undefined;else if (typ === "file") return field.data("base64");else {
            var value = field.attr("data-value") || field.val();
            if (value && _classPrivateFieldGet2(_trimFields, this).includes(this.key)) value = value.trim();
            return value;
          }
        }
      }]);
    }();

    var _fieldNames = /*#__PURE__*/new WeakMap();
    var _fieldsComponentMap = /*#__PURE__*/new WeakMap();
    var _fieldsInstanceMap = /*#__PURE__*/new WeakMap();
    var _container = /*#__PURE__*/new WeakMap();
    var _components = /*#__PURE__*/new WeakMap();
    var _options = /*#__PURE__*/new WeakMap();
    var Factory = /*#__PURE__*/function () {
      function Factory(container, components, options) {
        var _this = this;
        _classCallCheck(this, Factory);
        _classPrivateFieldInitSpec(this, _fieldNames, void 0);
        _classPrivateFieldInitSpec(this, _fieldsComponentMap, void 0);
        _classPrivateFieldInitSpec(this, _fieldsInstanceMap, void 0);
        _classPrivateFieldInitSpec(this, _container, void 0);
        _classPrivateFieldInitSpec(this, _components, void 0);
        _classPrivateFieldInitSpec(this, _options, void 0);
        _classPrivateFieldSet2(_container, this, container);
        _classPrivateFieldSet2(_components, this, components);
        _classPrivateFieldSet2(_options, this, options);
        _classPrivateFieldSet2(_fieldNames, this, []);
        _classPrivateFieldSet2(_fieldsInstanceMap, this, {});
        _classPrivateFieldSet2(_fieldsComponentMap, this, {});
        components.forEach(function (component) {
          _classPrivateFieldGet2(_fieldNames, _this).push(component.key);
          _classPrivateFieldGet2(_fieldsInstanceMap, _this)[component.key] = new Field(_this, component.key);
          _classPrivateFieldGet2(_fieldsComponentMap, _this)[component.key] = component;
        });
        this.field = this.field.bind(this);
        this.component = this.component.bind(this);
        this.hasField = this.hasField.bind(this);
        this.getField = this.getField.bind(this);
        this.setFieldValue = this.setFieldValue.bind(this);
        this.getFieldValue = this.getFieldValue.bind(this);
        this.fieldNamesByTag = this.fieldNamesByTag.bind(this);
        this.autoCreateAbsentFields = this.autoCreateAbsentFields.bind(this);
      }
      return _createClass(Factory, [{
        key: "container",
        get: function get() {
          return _classPrivateFieldGet2(_container, this);
        }
      }, {
        key: "options",
        get: function get() {
          return _classPrivateFieldGet2(_options, this);
        }
      }, {
        key: "fieldNames",
        get: function get() {
          return _classPrivateFieldGet2(_fieldNames, this);
        }
      }, {
        key: "fieldMap",
        get: function get() {
          return _classPrivateFieldGet2(_fieldsComponentMap, this);
        }
      }, {
        key: "fieldNamesByTag",
        value: function fieldNamesByTag(tag) {
          if (!tag || tag === "") return [];
          return _classPrivateFieldGet2(_components, this).filter(function (component) {
            return component.tags && component.tags.indexOf(tag) > -1;
          }).map(function (x) {
            return x.key;
          });
        }
      }, {
        key: "field",
        value: function field(key) {
          if (!_classPrivateFieldGet2(_fieldNames, this).includes(key)) throw new Error("Unknown field key ".concat(key));
          return _classPrivateFieldGet2(_fieldsInstanceMap, this)[key];
        }
      }, {
        key: "component",
        value: function component(key) {
          if (!_classPrivateFieldGet2(_fieldNames, this).includes(key)) throw new Error("Unknown component key ".concat(key));
          return _classPrivateFieldGet2(_fieldsComponentMap, this)[key];
        }

        /**
         * Checks that form has field with such key
         * @param key
         * @return {boolean}
         */
      }, {
        key: "hasField",
        value: function hasField(key) {
          return !!this.fieldMap[key];
        }
      }, {
        key: "getField",
        value: function getField(key, filter) {
          return this.field(key).getDOMField(filter);
        }
      }, {
        key: "setFieldValue",
        value: function setFieldValue(key, value) {
          return this.field(key).setDOMFieldValue(value);
        }

        /**
         *
         * @param {string} key - field key
         * @param {any} defaultValue - value if DOM field is absent
         * @returns {*|any}
         */
      }, {
        key: "getFieldValue",
        value: function getFieldValue(key, defaultValue) {
          var field = this.field(key);
          var common = function common(key) {
            return field.getDOMFieldValue(defaultValue);
          };
          var custom = this.options.getFieldValue;
          return (custom || common)(key, common);
        }
      }, {
        key: "autoCreateAbsentFields",
        value: function autoCreateAbsentFields() {
          var _this2 = this;
          this.fieldNames.forEach(function (key) {
            return _this2.field(key).createFieldIfAbsent();
          });
        }
      }]);
    }();

    var Context$1 = /*#__PURE__*/_createClass(function Context(host, path) {
      _classCallCheck(this, Context);
      this.host = host;
      this.path = path;
    });
    var Widget = /*#__PURE__*/function () {
      function Widget() {
        _classCallCheck(this, Widget);
      }

      /**
       * Check if widget should launch on this context
       * @param context {Context} widget context
       * @returns {boolean}
       */
      return _createClass(Widget, [{
        key: "isDefinedAt",
        value: function isDefinedAt(context) {}

        /**
         * Launch widget
         * @param context {Context} widget context
         */
      }, {
        key: "launch",
        value: function launch(context) {}
      }]);
    }();

    var RefCode = /*#__PURE__*/function (_Widget) {
      function RefCode() {
        _classCallCheck(this, RefCode);
        return _callSuper(this, RefCode);
      }
      _inherits(RefCode, _Widget);
      return _createClass(RefCode, [{
        key: "isDefinedAt",
        value:
        /**
         * Check if widget should launch on this context
         * @param context {Context} widget context
         * @returns {boolean}
         */
        function isDefinedAt(context) {
          return (context.host.includes("iqos-ecom.de02.agima.ru") || context.host.includes("iqos.ru")) && (context.path === "/loyalty-recommendations/" || context.path === "/dtereferralcode/");
        }

        /**
         * Launch widget
         * @param context {Context} widget context
         */
      }, {
        key: "launch",
        value: function launch(context) {
          var form = $__default["default"](".personal-code__item form");
          form.removeAttr("action").removeAttr("method");
          var field = form.find(".personal-code__field-input");
          $__default["default"](".personal-code__popup .js-popup-close").off("click").click(function () {
            $__default["default"](this).parents(".personal-code__popup").first().addClass("is-hide");
            $__default["default"]('html, body').removeClass('is-overflow-hidden');
            if (/iPad|iPhone|iPod/.test(window.navigator.userAgent)) {
              $__default["default"](window).scrollTop($__default["default"]('.js-personal-code').offset().top);
              $__default["default"]('html, body').removeClass('is-mobile-overflow');
            }
          });
          field.on("focus", function () {
            if (!$__default["default"](this).val() || $__default["default"](this).val() === "") $__default["default"](this).val("+7 (");
          });
          function showFieldError(text) {
            var parent = field.parent();
            parent.addClass('is-bounce');
            setTimeout(function () {
              parent.removeClass('is-bounce');
            }, 1000);
            return form.find(".error-message").html('<div id="phone-error" class="is-error">' + text + '</div>');
          }

          //$(".personal-code__item:first-child .personal-code__item-title").text("ПО НОМЕРУ ТЕЛЕФОНА");

          //$(".personal-code__item:first-child .personal-code__item-desc").text("Введите ваш номер мобильного телефона, чтобы узнать свой персональный код");

          function submitForm() {
            var value = field.val();
            if (!value || value === "") return showFieldError("поле необходимо заполнить");
            var valueFormatted = value.replace(/[^0-9]/g, "").replace(/^(7|8)/g, "");
            if (valueFormatted.length !== 10) return showFieldError("Введите телефон в формате +7 (9XX) 123-45-67");
            $__default["default"](".js-loader").show();
            $__default["default"].get($__default["default"].ube.host + "/api/referral/code/send?phone=" + valueFormatted).done(function (data) {
              if (data && data.result === true) {
                RefCode.showCode();
                window.digitalData.events.push({
                  "category": "Lead",
                  "name": "Get Code Form Sent",
                  "label": "sms"
                });
              } else if (data && data.error && data.error !== "") {
                RefCode.showError(data.error);
              } else {
                RefCode.showAbsent();
              }
            }).always(function () {
              return $__default["default"](".js-loader").hide();
            });
          }
          form.off("submit").submit(function (e) {
            e.preventDefault();
            submitForm();
            return false;
          });
          form.find("button").off("click").click(function (e) {
            e.preventDefault();
            submitForm();
            return false;
          });
        }
      }], [{
        key: "showCode",
        value: function showCode(code) {
          var popup = $__default["default"]("#personal-code .personal-code__popup.js-popup-ok");
          //popup.find(".personal-code__popup-text").html('<div class="personal-code__popup-text-bold">ВАШ КОД</div><br> <div class="ube-popup-code-field" style="width: 256px;height: 51px;border: 1px solid #4F4F4F;margin:auto;"><span style="font-family: Noto Sans;font-style: normal;font-weight: bold;line-height: normal;font-size: 20px;text-align: center;letter-spacing: 3.6px;color: #D6BA81;display:block;margin-top:10px;">'+code+'</span></div>');
          popup.removeClass("is-hide");
          $__default["default"]("html, body").addClass("is-no-scroll");
        }
      }, {
        key: "onPopupShow",
        value: function onPopupShow() {
          $__default["default"]('html, body').addClass('is-overflow-hidden');
          if (/iPad|iPhone|iPod/.test(window.navigator.userAgent)) {
            $__default["default"]('html, body').addClass('is-mobile-overflow');
          }
        }
      }, {
        key: "showAbsent",
        value: function showAbsent() {
          var popup = $__default["default"]("#personal-code .personal-code__popup.js-popup-alert");
          popup.find(".personal-code__popup-text").html('Данный номер телефона отсутствует в базе данных потребителей IQOS. Станьте участником <a style="text-align:center;color:#ffffff;" href="/about-iqos-club/">IQOS Club</a>, чтобы получить свой код рекомендаций.');
          popup.removeClass("is-hide");
          RefCode.onPopupShow();
        }

        /**
         *
         * @param {string} error error text
         */
      }, {
        key: "showError",
        value: function showError(error) {
          var popup = $__default["default"]("#personal-code .personal-code__popup.js-popup-alert");
          popup.find(".personal-code__popup-text").html(error);
          popup.removeClass("is-hide");
          RefCode.onPopupShow();
        }
      }]);
    }(Widget);

    var LoyaltyHistory = /*#__PURE__*/function (_Widget) {
      function LoyaltyHistory() {
        var _this;
        _classCallCheck(this, LoyaltyHistory);
        _this = _callSuper(this, LoyaltyHistory);
        _this.launch = _this.launch.bind(_this);
        _this.display = _this.display.bind(_this);
        _this.showAll = false;
        _this.limit = 5;
        return _this;
      }
      _inherits(LoyaltyHistory, _Widget);
      return _createClass(LoyaltyHistory, [{
        key: "isDefinedAt",
        value:
        /**
         * Check if widget should launch on this context
         * @param context {Context} widget context
         * @returns {boolean}
         */
        function isDefinedAt(context) {
          return false; //context.host.includes("uat-ecom.iqos.ru") && context.path === "/loyalty-status/"
        }

        /**
         * Launch widget
         * @param context {Context} widget context
         */
      }, {
        key: "launch",
        value: function launch(context) {
          var _this2 = this;
          if (!this.template) {
            $__default["default"].get($__default["default"].ube.host + "/template/loyalty-history").done(function (result) {
              _this2.template = result;
              _this2.display();
            });
          } else this.display();
        }
      }, {
        key: "display",
        value: function display() {
          var _this3 = this;
          //Удаляем старый контейнер если есть
          $__default["default"](".loyalty-history").remove();
          var template = $__default["default"](this.template);
          var holder = template.find(".loyalty-history_holder");
          var entry = template.find(".loyalty-history_entry").clone();
          holder.empty();
          var data = [{
            created: "21 сентября",
            text: "Покупка устройства или аксессуаров IQOS",
            points: 500
          }, {
            created: "20 сентября",
            text: "Покупка другом по вашему коду рекомендаций",
            points: 304
          }, {
            created: "19 сентября",
            text: "Заполнение профиля",
            points: 101
          }, {
            deactivated: "18 сентября",
            deactivatedText: "Удаление ранее заполненной информации в профиле",
            points: 500
          }, {
            deactivated: "17 сентября",
            deactivatedText: "Удаление аккаунта социальной сети в личном профиле",
            points: 491
          }, {
            created: "15 сентября",
            text: "Покупка устройства или аксессуаров IQOS",
            points: 354
          }, {
            created: "10 сентября",
            text: "Покупка другом по вашему коду рекомендаций",
            points: 100
          }, {
            created: "9 сентября",
            text: "Заполнение профиля",
            points: 105
          }];
          var dataItemToDom = function dataItemToDom(item) {
            var entryCopy = entry.clone();
            var points = parseInt(item.points) || 0;
            var pointText = "Баллов";
            if (points % 10 === 1) pointText = "Балл";else if (points % 10 < 5 && points % 10 > 1) pointText = "Балла";
            if (item.deactivated && item.deactivatedText) {
              entryCopy.find(".loyalty-history_label").text("У вас списаны баллы");
              entryCopy.find(".loyalty-history_date").text(item.deactivated);
              entryCopy.find(".loyalty-history_description").text(item.deactivatedText);
              entryCopy.find(".loyalty-history_points").text("- " + points + " " + pointText);
            } else {
              entryCopy.find(".loyalty-history_label").text("Вам начислены баллы");
              entryCopy.find(".loyalty-history_date").text(item.created);
              entryCopy.find(".loyalty-history_description").text(item.text);
              entryCopy.find(".loyalty-history_points").text("+ " + points + " " + pointText);
            }
            holder.append(entryCopy);
          };
          var showAllButton = template.find(".loyalty-history_button a");
          showAllButton.click(function (e) {
            e.preventDefault();
            showAllButton.hide();
            data.slice(_this3.limit).forEach(dataItemToDom);
            return false;
          });
          if (data.length > 0) {
            data.slice(0, this.limit).forEach(dataItemToDom);
            if (data.length > this.limit) showAllButton.show();else showAllButton.hide();
            $__default["default"](".points-progress").after(template);
          }
        }
      }], [{
        key: "showCode",
        value: function showCode(code) {
          var popup = $__default["default"]("#personal-code .personal-code__popup.js-popup-ok");
          //popup.find(".personal-code__popup-text").html('<div class="personal-code__popup-text-bold">ВАШ КОД</div><br> <div class="ube-popup-code-field" style="width: 256px;height: 51px;border: 1px solid #4F4F4F;margin:auto;"><span style="font-family: Noto Sans;font-style: normal;font-weight: bold;line-height: normal;font-size: 20px;text-align: center;letter-spacing: 3.6px;color: #D6BA81;display:block;margin-top:10px;">'+code+'</span></div>');
          popup.removeClass("is-hide");
        }
      }, {
        key: "showAbsent",
        value: function showAbsent() {
          var popup = $__default["default"]("#personal-code .personal-code__popup.js-popup-alert");
          popup.find(".personal-code__popup-text").html('Данный номер телефона отсутствует в базе данных потребителей IQOS. Станьте участником <a style="text-align:center;display:block;color:#ffffff;" href="/about-iqos-club/">IQOS Club,<br/> чтобы получить свой код рекомендаций.</a>');
          popup.removeClass("is-hide");
        }

        /**
         *
         * @param {string} error error text
         */
      }, {
        key: "showError",
        value: function showError(error) {
          var popup = $__default["default"]("#personal-code .personal-code__popup.js-popup-alert");
          popup.find(".personal-code__popup-text").html(error);
          popup.removeClass("is-hide");
        }
      }]);
    }(Widget);

    //const widgets = [new RefCode(), new Loyalty(), new LeadTrialForm()];
    var widgets = [new RefCode(), new LoyaltyHistory()];
    var initWidgets = function initWidgets() {
      var path = window.location.pathname;
      var host = window.location.hostname;
      var context = new Context$1(host, path);
      widgets.forEach(function (w) {
        return w.isDefinedAt(context) && w.launch(context);
      });
    };

    var ValidationResult = /*#__PURE__*/function () {
      /**
       * @param {string} key
       * @param {string} value
       * @param {boolean} isValid
       * @param {string} path - Тип валидации или пусть к сервису валидации
       */
      function ValidationResult(key, value, isValid, path) {
        _classCallCheck(this, ValidationResult);
        this.key = key;
        this.value = value;
        this.isValid = isValid;
        this.path = path;
      }
      return _createClass(ValidationResult, [{
        key: "json",
        get: function get() {
          var key = this.key,
            value = this.value,
            isValid = this.isValid,
            path = this.path;
          return {
            key: key,
            value: value,
            isValid: isValid,
            path: path
          };
        }
      }]);
    }();
    var Context = /*#__PURE__*/function () {
      function Context() {
        _classCallCheck(this, Context);
        this.validations = [];
      }

      /**
       *
       * @param {string} key
       * @param {string} value
       * @param {boolean} isValid
       * @param {string} path - Тип валидации или пусть к сервису валидации
       */
      return _createClass(Context, [{
        key: "addValidationResult",
        value: function addValidationResult(key, value, isValid, path) {
          //Если это url - удаляются параметры после ?
          if (path && path.includes("?")) path = path.split("?")[0];
          this.validations.push(new ValidationResult(key, value, isValid, path));
        }

        /**
         * @return {{}} - JSON объект для отправки на сервер. Отправляем только события для email и phone
         */
      }, {
        key: "json",
        get: function get() {
          return {
            validations: this.validations.filter(function (v) {
              return ["/validate/email", "/validate/phone"].includes(v.path);
            }).map(function (v) {
              return v.json;
            })
          };
        }
      }]);
    }();

    var Timer = /*#__PURE__*/function () {
      function Timer() {
        _classCallCheck(this, Timer);
        this.fields = {};
        this.start = new Date().getTime();
        this.end = undefined;
        this.focus = this.focus.bind(this);
        this.blur = this.blur.bind(this);
        this.ends = this.ends.bind(this);
      }

      /**
       * Input field gets focused - focus event
       * @param {string} key
       */
      return _createClass(Timer, [{
        key: "focus",
        value: function focus(key) {
          if (!key) return;
          if (!this.fields[key]) this.fields[key] = {};
          this.fields[key]['start'] = new Date().getTime() - this.start;
        }

        /**
         * Consumer end field intput end leaves it - blur event
         * @param {string} key
         */
      }, {
        key: "blur",
        value: function blur(key) {
          if (!key) return;
          if (!this.fields[key]) this.fields[key] = {};
          this.fields[key]['end'] = new Date().getTime() - this.start;
        }

        /**
         * Provides timer data to submit to backend
         * @return {{start: number, end: number, fields: {}}}
         */
      }, {
        key: "ends",
        value: function ends() {
          this.end = new Date().getTime() - this.start;
          return {
            start: this.start,
            end: this.end,
            fields: this.fields
          };
        }
      }]);
    }();

    var noPreloadForms = [];
    var isNoPreload = function isNoPreload(name) {
      return name && noPreloadForms.indexOf(name) > -1;
    };

    var captchaV3Domains = 'iqos.ru|nng|mrphilipmorris.ru|marlboro.ru|bondstreet.ru|lmlab.ru|nextlook.ru|parliament.ru|premium.one|dailyscan.ru|mychesterfield.ru|localhost';
    var UBE_PROD_HOST = 'https://ube.pmsm.org.ru';
    var checkPhoneWL = function checkPhoneWL(phone, successCb, errorCb) {
      var host = $.ube.host;
      if (host === UBE_PROD_HOST) return errorCb();
      return $.get("".concat(host, "/api/f2s/consumer/phone?phone=").concat(phone)).then(function (res) {
        return res.noCaptcha ? successCb() : errorCb();
      });
    };
    function randomId() {
      return "ube-" + Math.random().toString(36).substr(2);
    }
    function initFormCaptcha(container, captchaType) {
      var captchaId = randomId();
      if (captchaType === 'google') {
        if (!window.grecaptcha) $.getScript("https://www.google.com/recaptcha/api.js?render=explicit");
        container.attr("withReCaptcha", captchaId);
        container.find(".g-recaptcha").first().attr("id", captchaId);
      } else {
        if (!window.smartCaptcha) $.getScript("https://smartcaptcha.yandexcloud.net/captcha.js");
        container.attr("withYandexCaptcha", captchaId);
        container.find(".yandex-captcha").first().attr("id", captchaId);
      }
    }
    function validateYandexCaptcha(container, callback) {
      var captchaId = container.attr("withYandexCaptcha");
      if (captchaId) {
        var widgetId = container.data("captchaWidgetId");
        var isQRForm = isMbepDomain() && window.location.host.includes('qr');
        var categoryPrefix = isQRForm ? 'dl_qr_' : 'dl_';
        var label = 'form - ya_captcha';
        if (widgetId == undefined || widgetId == null) {
          var sitekey = sessionStorage.getItem('sitekey');
          widgetId = smartCaptcha.render(captchaId, {
            sitekey: sitekey,
            invisible: true,
            hideShield: true,
            callback: callback
          });
          container.data("captchaWidgetId", widgetId);
          window.smartCaptcha.subscribe(widgetId, 'challenge-visible', function () {
            return gaPush("".concat(categoryPrefix, "captcha_start"), label);
          });
          window.smartCaptcha.subscribe(widgetId, 'success', function () {
            return gaPush("".concat(categoryPrefix, "captcha_success"), label);
          });
        } else smartCaptcha.reset(widgetId);
        smartCaptcha.execute(widgetId);
      } else {
        callback();
      }
    }
    function validateCaptcha(container, callback) {
      var recaptchaId = container.attr("withReCaptcha");
      if (recaptchaId) {
        var widgetId = container.data("recaptchaWidgetId");
        if (widgetId == undefined || widgetId == null) {
          widgetId = grecaptcha.render(recaptchaId, {
            callback: callback
          });
          container.data("recaptchaWidgetId", widgetId);
        } else grecaptcha.reset(widgetId);
        grecaptcha.execute(widgetId);
      } else {
        callback();
      }
    }

    //UBE-294 Исправление проблемы google captcha callback - всегда вызывается только первый callback
    function getGlobalCapchaCallback(localCallback) {
      window.ubeCaptchaCallback = localCallback;
      if (!window.ubeGlobalCaptchaCallback) window.ubeGlobalCaptchaCallback = function (proof) {
        if (window.ubeCaptchaCallback) window.ubeCaptchaCallback(proof);
      };
      return window.ubeGlobalCaptchaCallback;
    }
    var dataCopy;
    function validateSetCaptchaProof(container, data, captchaType, dataCallback) {
      dataCopy = Object.assign({}, data);
      if (data && data.data && data.data.phone) {
        if (captchaType === 'google') {
          checkPhoneWL(data.data.phone, dataCallback.bind(null, dataCopy), validateCaptcha.bind(null, container, getGlobalCapchaCallback(callback)));
        } else {
          checkPhoneWL(data.data.phone, dataCallback.bind(null, dataCopy), validateYandexCaptcha.bind(null, container, callback));
        }
      } else {
        if (captchaType === 'google') {
          validateCaptcha(container, getGlobalCapchaCallback(callback));
        } else {
          validateYandexCaptcha(container, callback);
        }
      }
      function callback(proof) {
        if (proof) dataCopy.grecaptcha = proof;
        validateCatchaV3(dataCopy, dataCallback);
      }
    }
    function validateCatchaV3(data, dataCallback) {
      if (location.hostname.match(captchaV3Domains)) {
        grecaptcha.ready(function () {
          grecaptcha.execute('6LcXBdEZAAAAAHJnopGOUJ1DQls4rhdvUz-8Oy8i', {
            action: 'registration'
          }).then(function (token) {
            data.grecaptchaV3 = token;
            if (dataCallback) {
              dataCallback(data);
            }
          });
        });
      } else {
        if (dataCallback) {
          dataCallback(data);
        }
      }
    }
    function initFormCaptchaV3() {
      $.getScript("https://www.google.com/recaptcha/api.js?render=6LcXBdEZAAAAAHJnopGOUJ1DQls4rhdvUz-8Oy8i");
    }

    function acceptTerms(sessionKey, entity, termsCode, apiUrl) {
      var data = {
        termsCodesAndVersions: termsCode
      };
      return new Promise(function (resolve, reject) {
        $.ajax({
          url: apiUrl + '/session/' + entity + '/acceptTerms',
          data: JSON.stringify(data),
          type: "POST",
          processData: false,
          cache: false,
          dataType: "json",
          contentType: 'application/json',
          crossDomain: true,
          headers: {
            "Authorization": "Bearer " + sessionKey
          },
          error: function error(err) {
            toggleLoader(false);
            return reject(err);
          },
          success: function success(data) {
            toggleLoader(false);
            return resolve(data);
          }
        });
      });
    }

    function setPassword(sessionKey, entity, newPassword, apiUrl) {
      var data = {
        newPassword: newPassword
      };
      return new Promise(function (resolve, reject) {
        $.ajax({
          url: apiUrl + '/session/' + entity + '/setPassword',
          data: JSON.stringify(data),
          type: "POST",
          processData: false,
          cache: false,
          dataType: "json",
          contentType: 'application/json',
          crossDomain: true,
          headers: {
            "Authorization": "Bearer " + sessionKey
          },
          error: function error(err) {
            toggleLoader(false);
            return reject(err);
          },
          success: function success(data) {
            toggleLoader(false);
            return resolve(data);
          }
        });
      });
    }

    // TODO removed heatingtech due to temporary domain shutdown. Rollback when needed
    var oneTrustDomains = {
      'cloud.bondstreet.ru': 'ac7af100-4974-4ed1-8814-516589dc4ddd',
      'cloud.dailyscan.ru': 'af810e28-6edf-47c1-b99b-9886d07e8d24',
      'cloud.lmlab.ru': 'a489c8a9-75a4-4117-808c-26bdecec6195',
      'cloud.marlboro.ru': 'e16de826-8ca5-461c-8c72-40e3efda2b01',
      'cloud.mrphilipmorris.ru': '23d22c70-1869-4ce5-9b80-916c7a09628b',
      'cloud.mychesterfield.ru': 'b890b37e-4d0f-474e-aa41-41fb90c343ff',
      'cloud.nextlook.ru': '2b5af8d2-ac74-46c0-aece-13deede72930',
      'cloud.parliament.ru': 'd83a9f77-9c14-4584-b6fb-b8c8aeef262a',
      'cloud.pmbrands.ru': '4d003004-d5b0-4759-a077-f619d4022bf2',
      'cloud.premium.one': '514dc8ba-b8bd-4692-95a4-3db150d1744b',
      'qr.bondstreet.ru': '2db2f75c-9e49-4476-b540-9c7d5b7e853d',
      'qr.lmlab.ru': '01be202e-1f24-4da5-980a-2a6873a13b7c',
      'qr.marlboro.ru': 'b4d703f7-6c2c-4ac5-9601-f2bee6b5e7a7',
      'qr.mrphilipmorris.ru': '8db745de-d8b6-4adc-8ec5-8a7ca4214e07',
      'qr.mychesterfield.ru': '3470246f-4d82-4adc-ae42-1e5165ea06a3',
      'qr.nextlook.ru': '6144c970-2507-495a-9d4d-e91817e38a05',
      'qr.parliament.ru': 'b2cdb729-7f38-44f8-ace2-6fefed2e4acd',
      'bondstreet.ru': 'ae0f2ccc-49bc-4b45-bcfd-ef1658061551',
      'dailyscan.ru': '25ea1a4a-f068-49fc-b620-327c634d5d85',
      'lmlab.ru': 'b385c893-bbdc-4819-92a4-e20e675f9f1b',
      'marlboro.ru': 'bc223e4b-2065-43ed-a6d8-2150c350e131',
      'mrphilipmorris.ru': '9632b110-44b0-4a2a-b0ec-4d973ed14b4f',
      'mychesterfield.ru': '03217fae-e963-4480-9d99-83355a5dfb8b',
      'nextlook.ru': 'fa487714-8f39-40d8-bdf6-70b1b7a3dba6',
      'nng.iqos.ru': 'e64426ed-657b-4b87-969f-b0942655515f',
      'parliament.ru': 'b0bd4b5c-a907-4bed-80f7-90d997f6bc46',
      'premium.one': 'b2eb3e21-d616-47b3-9933-82abbff6577b'
    };
    function oneTrustInit() {
      if (!window.Optanon && !window.OptanonWrapper) {
        var domain = Object.keys(oneTrustDomains).find(function (x) {
          return window.location.hostname.includes(x);
        });
        if (domain) {
          console.log('UBE One Trust start loading...');
          var s = document.createElement("script");
          var l = document.createElement("link");
          s.type = "text/javascript";
          s.src = "https://wcmn.myizhora.com/common-init.js?siteid=".concat(oneTrustDomains[domain]);
          l.type = "text/css";
          l.rel = "stylesheet";
          l.href = "https://wcmn.myizhora.com/common-default.css";
          document.body.append(s);
          document.head.append(l);
          s.onload = function () {
            console.log('UBE One Trust loaded');
            $(document).on("mousedown", '#_pmiz_common_consentAccept', function () {
              gaPush('dl_cookie', 'accept');
            });
          };
          return true;
        }
      }
    }

    /**
     *
     * @param {object} options
     * @param {string} path
     * @param {boolean} isLeadForm
     * @param {object} formProperties
     * @returns {string}
     */
    function actionPathReg(options, path, isLeadForm, formProperties) {
      var action_path = "/esb/" + path + "/submission";
      if (isLeadForm) {
        action_path = "/api/lead/" + path + "/submission";
      } else if (formProperties !== null && formProperties !== void 0 && formProperties.useCoreCRM) {
        action_path = "/api/session/core/registration/" + path;
      }
      if (options.actionPathReg) {
        if (typeof options.actionPathReg === 'function') {
          action_path = options.actionPathReg(path);
        } else {
          throw new Error('options.actionPathReg must be a function(path) {return string;}');
        }
      }
      return action_path;
    }

    /**
     * Plural forms for russian words
     * @see https://gist.github.com/znechai/1b25d0ee9a92e5b879175ab4f040dbbc
     * @param  {Integer} count quantity for word
     * @param  {Array} words Array of words. Example: ['депутат', 'депутата', 'депутатов']
     * @return {String} Count + plural form for word
     */
    function pluralize(count, words) {
      var cases = [2, 0, 1, 1, 1, 2];
      return count + ' ' + words[count % 100 > 4 && count % 100 < 20 ? 2 : cases[Math.min(count % 10, 5)]];
    }

    var handleAjaxFail = function handleAjaxFail(jqxhr, textStatus, error) {
      console.log("Request Failed: " + textStatus + ", " + error);
    };
    var capitalize = function capitalize(string) {
      return ("" + string).charAt(0).toUpperCase() + string.slice(1);
    };
    var captchaV3Initialized = false;
    var fingerPrint = new Fingerprint();
    var device = new Device();
    fingerPrint.calculateAudioFingerprint();
    fingerPrint.calculateCanvasBase64();
    fingerPrint.calculateFontFingerprint();
    device.calculateDeviceResolution();
    device.calculateDeviceModel();
    device.calculateDeviceTimezone();
    var ubeSession = function ubeSession(key, value) {
      try {
        if (!sessionStorage) return;
        if (key && value === undefined) {
          return sessionStorage.getItem(key);
        } else if (key && value === null) {
          return sessionStorage.removeItem(key);
        } else if (key) {
          return sessionStorage.setItem(key, value);
        }
      } catch (error) {
        if (!backupSessionStorage) {
          var backupSessionStorage = {};
          backupSessionStorage.setItem = function (key, value) {
            backupSessionStorage[key] = value;
          };
          backupSessionStorage.getItem = function (key) {
            return backupSessionStorage[key];
          };
          backupSessionStorage.removeItem = function (key) {
            delete backupSessionStorage[key];
          };
        }
        if (key && value === undefined) {
          return backupSessionStorage.getItem(key);
        } else if (key && value === null) {
          return backupSessionStorage.removeItem(key);
        } else if (key) {
          return backupSessionStorage.setItem(key, value);
        }
      }
    };
    var _handleLogin = function handleLogin(sessionKey, redirectUrl, data) {
      var kind = data.kind,
        label = data.label,
        socialKey = data.socialKey,
        _data$requireConsent = data.requireConsent,
        requireConsent = _data$requireConsent === void 0 ? false : _data$requireConsent,
        entity = data.entity,
        _data$termsCode = data.termsCode,
        termsCode = _data$termsCode === void 0 ? [] : _data$termsCode,
        _data$enterPassword = data.enterPassword,
        enterPassword = _data$enterPassword === void 0 ? false : _data$enterPassword,
        userId = data.userId;
      var apiUrl = $__default["default"].ube.host + "/api";
      var isSocialLogin = kind === 'socialLogin';
      var action = isSocialLogin ? "form - social - ".concat(socialKey) : 'Success';
      var gaLabel = !isSocialLogin ? label || kind : undefined;
      if ($__default["default"].ube && $__default["default"].ube.login) {
        gaPush(isSocialLogin ? "dl_auth_social_success" : "dl_auth_success", action, gaLabel);
        if (enterPassword && typeof $__default["default"].ube.enterPassword === "function") {
          return $__default["default"].ube.enterPassword(sessionKey, function (newPassword) {
            return setPassword(sessionKey, entity, newPassword, apiUrl);
          }, userId).then(function (respond) {
            var buff = _objectSpread2(_objectSpread2({}, data), {}, {
              enterPassword: false
            });
            return _handleLogin(sessionKey, redirectUrl, buff);
          })["catch"](function (err) {
            console.log('Error while setting password', err);
          });
        }
        if (enterPassword && typeof $__default["default"].ube.enterPassword !== "function") {
          var buff = _objectSpread2(_objectSpread2({}, data), {}, {
            enterPassword: false
          });
          return _handleLogin(sessionKey, redirectUrl, buff);
        }
        if (requireConsent && typeof $__default["default"].ube.showTermsPopup === "function") {
          return $__default["default"].ube.showTermsPopup(sessionKey, termsCode, function () {
            return acceptTerms(sessionKey, entity, termsCode, apiUrl);
          }, userId).then(function (respond) {
            var buff = _objectSpread2(_objectSpread2({}, data), {}, {
              requireConsent: false
            });
            return _handleLogin(sessionKey, redirectUrl, buff);
          })["catch"](function (err) {
            console.log('Error while terms popup', err);
          });
        }
        return $__default["default"].ube.login(sessionKey, redirectUrl, kind);
      } else {
        console.error("Implement $.ube.login function to handle social login and hash login");
      }
    };
    var handleSocialLoginResult = function handleSocialLoginResult(result, entity) {
      if (result && result.sessionKey) {
        _handleLogin(result.sessionKey, result.redirectUrl, {
          kind: result.kind,
          socialKey: result.socialKey,
          requireConsent: result.data.requireConsent,
          entity: entity,
          termsCode: result.data.termsCode
        });
      } else {
        if (result.socialId) {
          gaPush("dl_auth_social_proccess", "get_data - form - social - " + result.socialKey);
          setSocialIdCookie(result.socialId, result.socialKey, result.data);
        }
        if (result.registrationUrl) {
          gaPush("dl_auth_social_fail", "form - social - " + result.socialKey + " - reason: Redirect-Registration");
          window.location.href = result.registrationUrl;
        } else if (result.message) {
          gaPush("dl_auth_social_fail", "view - pop_up_fail_social - " + result.socialKey);
          $__default["default"].ube.showPopup(result.message);
          if ($__default["default"].ube && $__default["default"].ube.loginFail) $__default["default"].ube.loginFail();
        }
      }
    };
    var ubeOauth = function ubeOauth(key, sessionKey, name, api_url, callback, finalRedirectUrl) {
      var popup = window.location.protocol + "//" + window.location.hostname;
      if (window.location.port && window.location.port !== "") popup = popup + ":" + window.location.port;
      popup = popup + "/";
      var initialWindowPath = popup;
      var width = Math.min(Math.max($__default["default"](window).width() - 300, 800), 1200);
      var windowOptions = "location=0,status=0,width=" + width + ",height=650";
      var oauthWindow = window.open(initialWindowPath, "PMSM авторизация " + key, windowOptions);
      $__default["default"].ajax({
        url: api_url + "/auth/" + name + "/" + key + "/url",
        headers: {
          "Authorization": "Bearer " + sessionKey
        }
      }).done(function (data) {
        oauthWindow.location.href = data.authorizationUrl;
        var oauthInterval = window.setInterval(function () {
          if (oauthWindow.closed) {
            window.clearInterval(oauthInterval);
          }
          if (oauthWindow.location.href.indexOf("code=") > -1) {
            window.clearInterval(oauthInterval);
            if (finalRedirectUrl) oauthWindow.location.href = finalRedirectUrl;else oauthWindow.close();
            var code = oauthWindow.location.href.split("code=")[1].split("&")[0];
            if (code && code !== "") {
              $__default["default"].ajax({
                url: api_url + "/auth/" + name + "/" + key + "/callback",
                headers: {
                  "Authorization": "Bearer " + sessionKey
                },
                data: {
                  code: code
                }
              }).done(function (result) {
                if (result.data) {
                  var value;
                  if (key === "vk") {
                    value = result.data.user_id;
                  } else if (key === "instagram") {
                    value = result.data.instagram;
                  } else {
                    value = result.data.user_id || result.data.userId || result.data.socialId || result.data.id;
                  }
                  callback(value, result);
                }
              }).fail(function () {
                console.log("UBE :: Social code check submission ERROR");
                console.log(xhr, resp, text);
              });
            }
          }
        }, 300);
      });
    };
    var _COOKIE_POLICY = cookies.UBE_COOKIE_POLICY;
    var _COOKIE_CHECK = cookies.UBE_COOKIE_CHECK;
    var autoAddSessionFields = ["socialId", "socialKey", "email", "firstName", "lastName", "phone", "gender", "birthDate", "instagram", "vkontakte", "facebook", "telegram", "viber", "utmCampaign", "utmContent", "utmSource", "utmMedium", "utmMedia"];
    var setSocialIdCookie = function setSocialIdCookie(socialId, socialKey, result) {
      autoAddSessionFields.forEach(function (key) {
        if (result[key]) ubeSession(key, result[key]);
      });
      ubeSession("socialId", socialId);
      ubeSession("socialKey", socialKey);
    };
    var clearSessionFields = function clearSessionFields() {
      autoAddSessionFields.forEach(function (key) {
        ubeSession(key, null);
      });
    };
    $__default["default"].ubeCookie = ubeCookie$1;
    window.ubeCookie = $__default["default"].ubeCookie;
    $__default["default"].ubeLoginTelegram = function (entity, user) {
      $__default["default"].get($__default["default"].ube.host + "/api/auth/" + entity + "/telegram/callback", user).done(function (result) {
        toggleLoader(false);
        if (result && result.sessionKey) {
          _handleLogin(result.sessionKey, result.redirectUrl, {
            kind: "telegram"
          });
        } else {
          if (result.socialId) setSocialIdCookie(user.id, "telegram", result.data);
          if (result.registrationUrl) {
            window.location.href = result.registrationUrl;
          } else if (result.message) $__default["default"].ube.showPopup(result.message);
        }
      }).fail(function () {
        toggleLoader(false);
        console.log("UBE :: Social code check submission ERROR");
        console.log(xhr, resp, text);
      });
    };
    window.ubeLoginTelegram = $__default["default"].ubeLoginTelegram;
    $__default["default"].fn.ubeCabinet = function (url, _sessionKey, opts) {
      var container = $__default["default"](this);
      var sessionKey = _sessionKey;
      var updatedUrl = url.replace("/main/", "/form/");
      function initializeUbeForm(container) {
        return function (data, definition) {
          var options = opts || {};
          options.data = $__default["default"].extend({}, data, (opts || {}).data || {});
          options.sessionKey = sessionKey;
          options.loadFormDataFromSession = false;
          options.formDefinitionJson = definition;
          options.isTemplatePreloaded = true;
          if (data.error) {
            if (options.onSessionError) options.onSessionError(data.error, sessionKey);
          } else container.ube(updatedUrl, options);
        };
      }
      ubeCookie$1(cookies.UBE_SESSION_KEY, sessionKey, sessionExpiration());
      var requestUrl = url.replace(/\/main\/(.[^/]+)-cabinet/, "/esb/$1-cabinet/cabinet");
      if (opts && opts.data && opts.data.userId) requestUrl = requestUrl + "?userId=" + opts.data.userId;
      var closeLoaderOnFail = function closeLoaderOnFail() {
        toggleLoader(true);
      };
      toggleLoader(true);
      var loadedFormData,
        loadedFormDefinition = false;
      var isTemplateLoaded = opts && opts.isTemplatePreloaded;
      var checkIfAllLoaded = function checkIfAllLoaded() {
        if (loadedFormData && loadedFormDefinition) {
          toggleLoader(false);
          initializeUbeForm(container)(loadedFormData, loadedFormDefinition);
        }
      };
      var formDefinitionPromise = $__default["default"].getJSON(updatedUrl).fail(handleAjaxFail).fail(closeLoaderOnFail);
      $__default["default"].ajax({
        url: requestUrl,
        headers: {
          "ube-session-key": sessionKey
        },
        success: function success(_loadedFormData, status, xhr) {
          loadedFormData = _loadedFormData;
          var headerSessionKey = xhr.getResponseHeader('UBE_SESSION_KEY') || xhr.getResponseHeader('ube-session-key');
          if (headerSessionKey && headerSessionKey !== "") {
            console.log("Set session key");
            console.log(headerSessionKey);
            sessionKey = headerSessionKey;
            ubeCookie$1(cookies.UBE_SESSION_KEY, headerSessionKey, sessionExpiration());
          }
          checkIfAllLoaded();
        },
        error: function error(xhr, resp, text) {
          toggleLoader(false);
          $__default["default"].ube && $__default["default"].ube.showPopup("Ошибка загрузки данных в форму:" + text);
          console.log("UBE :: User data load error");
          console.log(xhr, resp, text);
        }
      }).fail(handleAjaxFail).fail(closeLoaderOnFail);
      formDefinitionPromise.done(function (_loadedFormDefinition) {
        loadedFormDefinition = _loadedFormDefinition;
        if (!isTemplateLoaded && (!/(retail)/.test(updatedUrl) || container.is(':empty'))) container.html(_loadedFormDefinition.template);
        isTemplateLoaded = true;
        checkIfAllLoaded();
      });
      checkIfAllLoaded();
    };
    $__default["default"].fn.ubeAV = function (url, sessionKey, opts) {
      var container = $__default["default"](this);
      var options = opts || {};
      var entity = url.replace(/.*\//, "");
      var updatedUrl = url.replace("/main/", "/form/").replace("-reg", "-av");
      options.sessionKey = sessionKey;
      options.template = url.replace("/main/", "/form/").replace("-reg", "-av");
      if (!options.data) options.data = {};
      options.data.entity = entity;
      container.ube(updatedUrl, options);
    };
    $__default["default"].fn.ubeNext = function () {
      $__default["default"](this).trigger("ubeNext");
    };
    $__default["default"].fn.ubePrev = function () {
      $__default["default"](this).trigger("ubePrev");
    };

    /**
     *
     * @param {string} url
     * @param {{transformPayload?: function, actionPathReg?: function, sessionKey?: string, loadFormDataFromSession?: boolean, template?: string, data?: object, setFieldValid?: function}} [options]
     * @returns {$}
     */
    $__default["default"].fn.ube = function (url, options) {
      options = options || {};
      var gaFieldSet = {};
      var sessionKey = options.sessionKey;
      Impression.runImpression(url);
      if (!sessionKey && ubeCookie$1(cookies.UBE_SESSION_KEY_REG) && url && (typeof url === 'string' || url instanceof String) && url.endsWith("-reg")) sessionKey = ubeCookie$1(cookies.UBE_SESSION_KEY_REG);
      url = ubeHostAdd(url);
      function setVariablesFromSource(src) {
        if (src && src.data && src.data.form) {
          options.loadFormDataFromSession = false;
          var d = src.data;
          options.template = d.template || options.template;
          options.data = d.data || options.data;
          url = d.form;
          sessionKey = d.sessionKey;
        }
      }
      setVariablesFromSource(url);

      // URL attributes to json
      var search = location.search.substring(1) || "";
      var query = search.split("&").reduce(function (prev, curr) {
        var splitted = curr.split("=");
        if (splitted.length === 1) prev[decodeURIComponent(splitted[0])] = decodeURIComponent(splitted[0]);
        if (splitted.length > 1) prev[decodeURIComponent(splitted[0])] = decodeURIComponent(splitted[1]);
        return prev;
      }, {});
      var events = {};
      for (var attrname in $__default["default"].ube) {
        options[attrname] = $__default["default"].ube[attrname];
      }
      var container = $__default["default"](this).first();
      var host = url.replace(/^((http|https)?:\/\/[^\/]+)(\/.*)?$/, "$1");
      var api_url = host + '/api';
      var getSessionUrl = api_url + "/session/get";
      options.data = options.data || {};
      var initialValues = {};
      function flattenComponents(components, parent) {
        var buffer = [];
        components.forEach(function (c) {
          if (parent) {
            if (parent.conditional && parent.conditional.when && (!c.conditional || !c.conditional.when)) c.conditional = parent.conditional;
            if (parent.customConditional && parent.customConditional.length > 0 && (!c.customConditional || c.customConditional.length == 0)) c.customConditional = parent.customConditional;
          }
          buffer.push(c);
          if (c.components) {
            buffer = buffer.concat(flattenComponents(c.components, c));
          }
          if (c.columns) {
            c.columns.forEach(function (x) {
              if (x.components) buffer = buffer.concat(flattenComponents(x.components, c));
            });
          }
        });
        return buffer;
      }
      function initializeFormByConfig(json) {
        var name = json.path;
        var isWizard = json.display == "wizard";
        var isLeadForm = json.display == "leadForm";
        var formProperties = json.properties || {};
        var captchaType = formProperties.captchaType || 'google';
        var captchaBypass = json.captchaBypass;
        var components = flattenComponents(json.components);
        var validationState = {};
        var isQRForm = isMbepDomain() && window.location.host.includes('qr');
        var isMBEPForm = isMbepDomain() && !window.location.host.includes('qr');
        var isP1Form = window.location.host.includes('premium.one');
        var categoryPrefix = isQRForm ? 'dl_qr_' : 'dl_';
        var remainingAttemptsCount, hasPreferredMethodContainer;
        if (formProperties.promoCampaignName) {
          sessionStorage.setItem('promoCampaignName', formProperties.promoCampaignName);
        }

        /**
         * Все методы работы с полями переносятся в field/Factory
         * @type {Factory}
         */
        var factory = new Factory(container, components, options);
        var fieldMap = factory.fieldMap,
          fieldNames = factory.fieldNames,
          hasField = factory.hasField,
          getField = factory.getField,
          setFieldValue = factory.setFieldValue,
          fieldNamesByTag = factory.fieldNamesByTag;
        var getFieldValue = function getFieldValue(key) {
          return factory.getFieldValue(key, initialValues[key]);
        };
        function resetOptinAfterSubmission() {
          ['email', 'phone', 'personalCode'].forEach(function (key) {
            if (hasField(key) && hasField(key + "ValidatedValue")) {
              setFieldValue(key + "CodeSent", false);
              setFieldValue(key + "ValidatedValue", "");
              setFieldValue(key + "CodeSentAt", null);
              setFieldValue("submitted" + capitalize(key) + "Code", null);
              resetFieldValidation("submitted" + capitalize(key) + "Code");
              handleFormVisibility();
            }
          });
        }
        var context = new Context();
        function fieldNamesByPart(part) {
          if (!part || part == "") return fieldNames;
          var panels = json.components.filter(function (c) {
            return c['type'] == "panel";
          });
          var buffer = [];
          var found = false;
          panels.forEach(function (panel) {
            if (panel.key === part) {
              found = true;
              flattenComponents(panel.components || [], panel).forEach(function (component) {
                buffer.push(component.key);
              });
            }
          });
          if (!found) console.error("Form part subbmitted, but no panel in config: " + part);
          return buffer;
        }
        var appendChildrenKeys = function appendChildrenKeys(key) {
          var component = fieldMap[key];
          if (!component) return console.error("UBE :: Error component not found: " + key);
          return flattenComponents([component]).map(function (x) {
            return x.key;
          });
        };
        console.log("UBE Form Loaded: " + name);
        if (!window.ubeHashInit) {
          checkHash(json, name);
          window.ubeHashInit = true;
        }
        function checkHash(json, name) {
          name = name || null;
          location.search.substring(1) || "";
          var query = getJsonFromUrl();
          if (!query.hash && query["T"]) query.hash = query["T"];
          if (!query.hash && query["hid"]) query.hash = query["hid"];
          var redirect = query["redirectTo"] || query["redirect"];
          var utm_campaign = query["utm_campaign"];
          var utm_source = query["utm_source"];
          var utm_medium = query["utm_medium"];
          var utm_content = query["utm_content"];
          var utm_term = query["utm_term"];
          if (query && query.hash && query.hash != "") {
            toggleLoader(true);
            ubeHostFallBack();
            var url = $__default["default"].ube.host + "/api/session/resolveHash?hash=" + query.hash + "&entity=" + name + "&source=" + window.location.hostname + "&ymid=" + ubeCookie$1('_ym_uid') || "";
            if (redirect) {
              url = url + "&redirect=" + encodeURIComponent(redirect);
            }
            if (utm_campaign) {
              url = url + "&utm_campaign=" + encodeURIComponent(utm_campaign);
            }
            if (utm_source) {
              url = url + "&utm_source=" + encodeURIComponent(utm_source);
            }
            if (utm_medium) {
              url = url + "&utm_medium=" + encodeURIComponent(utm_medium);
            }
            if (utm_content) {
              url = url + "&utm_content=" + encodeURIComponent(utm_content);
            }
            if (utm_term) {
              url = url + "&utm_term=" + encodeURIComponent(utm_term);
            }
            $__default["default"].get(url).always(function () {
              toggleLoader(false);
            }).done(function (data) {
              if (!redirect || redirect == "") redirect = data.redirectUrl;
              if (!verifyRedirectSameDomain(redirect)) {
                redirect = window.location.protocol + "//" + window.location.host;
                console.error("UBE Redirect URL domain differs from website domain");
              } else redirect = $__default["default"].ube.host + redirect;
              try {
                var rawURL = new URL(redirect);
                var searchParams = rawURL.searchParams;
                if (utm_campaign) {
                  searchParams.set('utm_campaign', utm_campaign);
                }
                if (utm_source) {
                  searchParams.set('utm_source', utm_source);
                }
                if (utm_medium) {
                  searchParams.set('utm_medium', utm_medium);
                }
                if (utm_term) {
                  searchParams.set('utm_term', utm_term);
                }
                if (utm_content) {
                  searchParams.set('utm_content', utm_content);
                }
                rawURL.search = searchParams.toString();
                redirect = rawURL.pathname + rawURL.search;
              } catch (e) {}
              if ($__default["default"].ube.login && data && data.sessionKey) {
                _handleLogin(data.sessionKey, redirect, {
                  kind: data.kind,
                  requireConsent: data.requireConsent || false,
                  entity: json.path,
                  termsCode: data.termsCode || [],
                  enterPassword: data.enterPassword,
                  userId: data.userId
                });
              } else if ($__default["default"].ube.loginFail && data && !data.sessionKey) {
                $__default["default"].ube.loginFail(data);
              }
            });
          } else if (query.socialKey && query.code) {
            toggleLoader(true);
            ubeHostFallBack();
            $__default["default"].ajax({
              url: $__default["default"].ube.host + "/api/auth/" + query.entity + "/" + query.socialKey + "/callback",
              data: {
                code: query.code
              },
              headers: {
                "Authorization": "Bearer " + sessionKey
              }
            }).done(function (result) {
              toggleLoader(false);
              handleSocialLoginResult(result, query.entity);
            }).fail(function () {
              toggleLoader(false);
              console.log("UBE :: Social code check submission ERROR");
              gaPush('dl_auth_social_fail', 'view - pop_up_fail_social - ' + query.socialKey);
              console.log(xhr, resp, text);
              if ($__default["default"].ube.loginFail) $__default["default"].ube.loginFail();
            });
          } else if ($__default["default"].ube && $__default["default"].ube.loginAbsent) {
            $__default["default"].ube.loginAbsent();
          }
        }
        function ajaxLookupGender(firstName, lastName, handler) {
          $__default["default"].ajax({
            url: api_url + "/lookup/gender?query=" + encodeURIComponent(firstName + " " + lastName),
            success: function success(t) {
              handler(t.result);
            }
          });
        }
        var wto;
        var previousLookupResult = "";
        function autolookupGender() {
          if (container.find("[name=gender]").hasClass("noAutolookup") || name.includes("-cabinet")) return;
          if (wto) clearTimeout(wto);
          wto = setTimeout(function () {
            var data = getFormData() || {};
            if (!data.firstName || data.firstName === "" || !data.lastName || data.lastName === "") return;
            ajaxLookupGender(data.firstName, data.lastName, function (result) {
              if (previousLookupResult !== result && result === "male" || result === "female") {
                previousLookupResult = result;
                setFieldValue("gender", result);
              }
            });
          }, 300);
        }
        function resetFieldValidation(key) {
          container.find(".ube-validation-set-class-" + key).each(function () {
            $__default["default"](this).removeClass($__default["default"](this).attr('data-ube-validation-success-class') || "ube-validation-success").removeClass($__default["default"](this).attr('data-ube-validation-class') || "ube-validation-error");
          });
          container.find(".ube-validation-message-for-" + key).empty();
          container.find(".ube-validation-message-show-for-" + key).hide();
        }
        function setFieldValid(key, value) {
          var common = function common(key, value) {
            container.find("input[name='" + key + "']");
            container.find(".ube-validation-set-class-" + key).each(function () {
              $__default["default"](this).addClass($__default["default"](this).attr('data-ube-validation-success-class') || "ube-validation-success").removeClass($__default["default"](this).attr('data-ube-validation-class') || "ube-validation-error");
            });
            container.find(".ube-validation-message-for-" + key).html("");
            container.find(".ube-validation-message-show-for-" + key).hide();
            if (key == "firstName" || key == "lastName") autolookupGender();
          };
          var custom = options.setFieldValid;
          if (key && value && value != "" && !gaFieldSet[key]) {
            var field = getField(key);
            if (field && field.is(':visible')) {
              gaFieldSet[key] = true;
              //gaPush("Registration", "Fill-" + key, value);
            }
          }
          (custom || common)(key, value, common);
        }
        function setFieldInvalid(key, value, description) {
          var common = function common(key, value, description) {
            container.find(".ube-validation-set-class-" + key).each(function () {
              $__default["default"](this).removeClass($__default["default"](this).attr('data-ube-validation-success-class') || "ube-validation-success").addClass($__default["default"](this).attr('data-ube-validation-class') || "ube-validation-error");
            });
            container.find(".ube-validation-message-for-" + key).html(description);
            container.find(".ube-validation-message-show-for-" + key).show();
          };
          var custom = options.setFieldInvalid;
          if (key && gaFieldSet[key] !== false) {
            getField(key);
            if (/-phone-send$/.test(name)) {
              var category = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
              var action;
              if (hasPreferredMethodContainer) {
                action = ubeSession('preferredMethod') === 'telegram' ? "number - form - phone_telegram_push - reason: ".concat(description) : "number - form - phone_sms_code - reason: ".concat(description);
              } else {
                action = "form - phone_number - reason: ".concat(description);
              }
              gaPush(category, action);
            } else if (/-phone-check$/.test(name)) {
              var _category = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
              var _action;
              if (hasPreferredMethodContainer) {
                if (ubeSession('preferredMethod') === 'telegram') {
                  _action = remainingAttemptsCount ? "telegram_push - form - phone_telegram_push - attempts_left: ".concat(remainingAttemptsCount, " - reason: ").concat(description) : "telegram_push - form - phone_telegram_push - reason: ".concat(description);
                } else {
                  _action = remainingAttemptsCount ? "sms_code - form - phone_sms_code - attempts_left: ".concat(remainingAttemptsCount, " - reason: ").concat(description) : "sms_code - form - phone_sms_code - reason: ".concat(description);
                }
              } else {
                _action = "form - phone_code - reason: ".concat(description);
              }
              gaPush(_category, _action);
            } else if (/-reg$/.test(name)) {
              var _category2 = isQRForm ? 'dl_qr_registration_fail' : 'dl_auth_registration_fail';
              if (isMBEPForm && $__default["default"]('.reg-form_step_0').is(':visible')) {
                gaPush('dl_av_idx_registration_fail', "form - idx_reg - ".concat(key, " - reason: ").concat(description));
              } else {
                gaPush(_category2, "form - registration - ".concat(key, " - reason: ").concat(description));
              }
            } else if (/-optin$/.test(name)) {
              gaPush(categoryPrefix + '2optin_fail', "form - 2optin - reason: ".concat(description));
            } else if (/-idx$/.test(name)) {
              gaPush(categoryPrefix + 'av_idx_registration_fail', "form - idx_reg - ".concat(key, " - reason: ").concat(description));
            } else if (/remind/.test(name)) {
              gaPush(categoryPrefix + "auth_resetPassword_fail", "form - resetPassword - reason: ".concat(description));
            } else if (/-login$/.test(name)) {
              gaPush(categoryPrefix + "auth_password_fail", "form - password - reason: ".concat(description));
            }
          }
          (custom || common)(key, value, description, common);
        }

        /**
         *
         * @param {string[]} keys
         * @param {string[]} tags
         * @param {function} [handleAllValid]
         * @param {function} [handleSomeInvalid]
         */
        function validateComponents(keys, tags, handleAllValid, handleSomeInvalid) {
          var keysByTags = tags.map(function (tag) {
            return fieldNamesByTag(tag) || [];
          }).flat();
          var allKeys = _toConsumableArray(new Set(keysByTags.concat(keys || []))).filter(hasField);
          var result = {};
          console.log("Validation multiple keys: " + keys.join(", ") + " and tags: " + tags.join(", "));
          function checkResult() {
            console.log("Check results: " + allKeys.map(function (key) {
              return key + ": " + result[key];
            }).join(", "));
            if (allKeys.every(function (key) {
              return result[key] === true;
            })) {
              console.log("All valid");
              handleAllValid && handleAllValid(allKeys);
            } else if (allKeys.every(function (key) {
              return result[key] === true || result[key] === false;
            })) {
              console.log("Some invalid");
              handleSomeInvalid && handleSomeInvalid(allKeys.filter(function (key) {
                return !result[key];
              }), allKeys.filter(function (key) {
                return result[key];
              }));
            }
          }
          allKeys.forEach(function (key) {
            return validateComponent(key, function (validKey) {
              result[validKey] = true;
              checkResult();
            }, function (invalidKey) {
              result[invalidKey] = false;
              checkResult();
            });
          });
        }
        function validateComponent(key, handleValid, handleInvalid, onlyToValid, event) {
          var value = getFieldValue(key);
          var isValidationCallbackEvent = event === 'blur' && $__default["default"]('input[name="' + key + '"]').length > 0 && $__default["default"]('input[name="' + key + '"]').attr('type') !== 'hidden';
          $__default["default"].fn.clearFieldIfNotFromList = function () {
            var item = $__default["default"](this).data('data-object');
            var label = $__default["default"](this).val();
            if (!item && label && label !== "" || item && item.label !== label) {
              if (label && $__default["default"](this).data("source") && $__default["default"](this).data("source").find(function (x) {
                return x && x.label === label;
              })) {
                $__default["default"](this).data('ui-autocomplete')._trigger('select', 'autocompleteselect', {
                  item: $__default["default"](this).data("source").find(function (x) {
                    return x && x.label === label;
                  })
                });
              } else {
                $__default["default"](this).attr('data-value', null).data('data-object', null).val(null).trigger("blur");
                value = null;
              }
            }
          };
          if (key === 'locationId' && window.location.pathname.includes('personal/private')) $__default["default"]('[name="locationId"]').clearFieldIfNotFromList();
          validateField(key, value, function (key, value) {
            setFieldValid(key, value);
            if (handleValid) handleValid(key, value);
            if (isValidationCallbackEvent) {
              if (options && options.onFieldValid && validationState[key] !== '') options.onFieldValid(key);
              validationState[key] = '';
            }
          }, function (key, value, description) {
            if (!onlyToValid) setFieldInvalid(key, value, description);
            if (handleInvalid) handleInvalid(key, value, description);
            if (isValidationCallbackEvent) {
              if (options && options.onFieldInvalid && validationState[key] !== description) options.onFieldInvalid(key);
              validationState[key] = description;
            }
          }, function (jqxhr, textStatus, error) {
            setFieldValid(key, value);
            if (handleValid) handleValid(key, value);
            handleAjaxFail(jqxhr, textStatus, error);
          });
        }
        var lastValidatedValue = {};
        function validateField(key, value, handleValid, handleInvalid, handleError, formData) {
          var component = fieldMap[key];
          var rules = component.validate;
          formData = formData || getFormData();
          function hasTag(tag) {
            return component.tags && component.tags.indexOf(tag) > -1;
          }
          function ajaxValidate(path, failMessage, handleValidFun) {
            ajaxValidateCall(path, function (valid, responseMessage) {
              if (typeof failMessage === 'function') {
                failMessage = failMessage(responseMessage);
              }
              valid ? handleValidFun ? handleValidFun(key, value) : handleValid(key, value) : handleInvalid(key, value, failMessage);
            });
          }
          function ajaxValidateCall(path, handler) {
            $__default["default"].ajax({
              headers: {
                "ga-id": ubeCookie$1('_ga') || "",
                "d-id": ubeCookie$1('_d') || ""
              },
              url: api_url + path,
              success: function success(t) {
                var result = t.result;
                var valid = t.error == true || [true, "true", "unknown"].indexOf(result) >= 0;
                context.addValidationResult(key, value, valid, path);
                handler(valid, t.message);
              },
              error: handleError
            });
          }
          if (!handleVisibility(key, formData || getFormData())) return handleValid(key, value);
          if (rules) {
            var customMessage = rules.customMessage && rules.customMessage != "" ? rules.customMessage : "Пожалуйста, укажите " + component.label;
            if (rules.required && (value || "").length == 0) {
              return handleInvalid(key, value, customMessage);
            }
            if (rules.pattern && rules.pattern.length > 0 && !new RegExp(rules.pattern).test(value)) return handleInvalid(key, value, customMessage);
            if (rules.custom && rules.custom.length > 0) {
              var mul = new Function('valid, input, query, data, initialData', rules.custom + "; return valid;");
              var customResult = mul(true, value, query, formData || getFormData(), _objectSpread2({}, options.data));
              if (customResult != true && customResult && customResult.length > 0) return handleInvalid(key, value, customResult);
            }
          }
          function handleValidFromOption(key, value) {
            if (value && value.length > 0 && options.validateValue) options.validateValue(key, value, handleValid, handleInvalid);else handleValid(key, value);
            if (value && value !== "" && hasTag("submitOnValid") && lastValidatedValue[key] !== value) container.find("form").submit();
            lastValidatedValue[key] = value;
          }
          if (hasTag("validateServerSide")) {
            var requestData = {
              firstName: formData.firstName,
              userId: formData.userId
            };
            requestData[key] = value;
            return $__default["default"].ajax({
              headers: {
                "ga-id": ubeCookie$1('_ga') || "",
                "d-id": ubeCookie$1('_d') || ""
              },
              url: host + "/esb/" + name + "/validate" + (sessionKey ? "?sessionKey=" + sessionKey : ""),
              method: "post",
              data: JSON.stringify(requestData),
              contentType: 'application/json; charset=UTF-8',
              success: function success(t) {
                if (t.sessionKey) sessionKey = t.sessionKey;
                var result = t && t.result && t.fields && t.fields[key] && t.fields[key].result;
                if (result && key === 'submittedPersonalCode') {
                  setFieldValue("personalDataChanged", false);
                }
                var valid = t.error == true || [true, "true", "unknown"].indexOf(result) >= 0;
                if (valid) handleValidFromOption(key, value);else handleInvalid(key, value, t && t.fields && t.fields[key] && t.fields[key].message ? t.fields[key].message : "Введите корректное значение");
              },
              error: handleError
            });
          }
          if (component.type == 'email') {
            if (key === "email" && hasField(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") !== value) {
              setFieldValue(key + "CodeSent", false);
              setFieldValue(key + "ValidatedValue", null);
              setFieldValue("submitted" + capitalize(key) + "Code", null);
              validateComponent("submitted" + capitalize(key) + "Code");
              handleFormVisibility();
            }

            //Do not validate email if not provided
            if (!value || value == "" || hasTag("disableServerValidation")) return handleValid(key, value);
            return ajaxValidate("/validate/email?email=" + value + "&entity=" + name + "&optin=" + hasTag("optin"), function (responseMessage) {
              if (responseMessage === "Foreign Email") return "Необходимо указать российский email адрес";else return component.validate.customMessage || "Некорректный или не существующий email адрес";
            }, function () {
              var userId = hasField("userId") ? getFieldValue("userId") : null;
              var userIdPart = userId ? "&userId=" + userId : "";
              var uniqueError = component.uniqueError;
              hasTag("validateNotExists") ? ajaxValidate("/validate/emailNotExists?email=" + value + userIdPart, uniqueError && uniqueError !== "" ? uniqueError : "E-Mail адрес уже был зарегистрирован ранее") : handleValidFromOption(key, value);
            });
          }
          if (component.type == 'phoneNumber') {
            if (key === "phone" && hasField(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") && getFieldValue(key + "ValidatedValue") !== value) {
              setFieldValue(key + "CodeSent", false);
              setFieldValue(key + "ValidatedValue", null);
              setFieldValue("submitted" + capitalize(key) + "Code", null);
              validateComponent("submitted" + capitalize(key) + "Code");
              handleFormVisibility();
            }
            if (hasTag("disableServerValidation")) return handleValid(key, value);
            return ajaxValidate("/validate/phone?number=" + value + "&entity=" + name, function (responseMessage) {
              if (responseMessage && responseMessage.includes('Что-то пошло не так')) return responseMessage;else return component.validate.customMessage || "Введите существующий номер телефона";
            }, function () {
              var userId = hasField("userId") ? getFieldValue("userId") : null;
              var userIdPart = userId ? "&userId=" + userId : "";
              var uniqueError = component.uniqueError;
              hasTag("validateNotExists") ? ajaxValidate("/validate/phoneNotExists?number=" + value + userIdPart, uniqueError && uniqueError !== "" ? uniqueError : "Телефон уже был зарегистрирован ранее") : handleValidFromOption(key, value);
            });
          }
          if (value && value.length > 0 && key === 'coupon') {
            return ajaxValidateCall("/validate/coupon?code=" + value + "&entity=" + name, function (valid, message) {
              if (valid) handleValid(key, value);else if (options.validateValue) options.validateValue(key, value, handleValid, handleInvalid);else handleInvalid(key, value, message || "Введите существующий код");
            });
          }
          if (value && value.length > 0 && key == 'createdEmail') {
            var path = api_url + "/nng/email/validate?email=" + value;
            return $__default["default"].ajax({
              headers: {
                "ga-id": ubeCookie$1('_ga') || "",
                "d-id": ubeCookie$1('_d') || ""
              },
              url: path,
              success: function success(t) {
                var result = t.result;
                var valid = t.error == true || [true, "true", "unknown"].indexOf(result) >= 0;
                context.addValidationResult(key, value, valid, path);
                if (t.result) handleValid(key, value);else handleInvalid(key, value, t.message);
              },
              error: function error(err) {
                handleInvalid(key, value, err.responseJSON.message);
              }
            });
          }
          if (value && value.length > 0 && hasTag("validateBonusCard")) return ajaxValidateCall("/validate/bonusCard?value=" + value + "&entity=" + name, function (valid, message) {
            if (valid) handleValid(key, value);else handleInvalid(key, value, message);
          });
          handleValidFromOption(key, value);
        }
        function getFieldObject(key) {
          return getField(key).data('data-object') || getFieldValue(key);
        }
        function getFormData(part) {
          var _options;
          var formData = {};
          var utm_source = query.utm_source,
            utm_campaign = query.utm_campaign,
            utm_medium = query.utm_medium,
            utm_content = query.utm_content,
            utm_term = query.utm_term,
            utmSource = query.utmSource,
            utmCampaign = query.utmCampaign,
            utmMedium = query.utmMedium,
            utmContent = query.utmContent,
            utmTerm = query.utmTerm;
          var scanToken = getQueryParameter(window.location.search, 'scanToken');
          formData.hashParams = fingerPrint.fingerprintData;
          formData.deviceParams = device.getDeviceData;
          formData.utmSource = utm_source || utmSource;
          formData.utmCampaign = utm_campaign || utmCampaign;
          formData.utmMedium = utm_medium || utmMedium;
          formData.utmContent = utm_content || utmContent;
          formData.utmTerm = utm_term || utmTerm;
          formData.noLoginSessionKey = options.noLoginSessionKey;
          if ((_options = options) !== null && _options !== void 0 && (_options = _options.data) !== null && _options !== void 0 && _options.preferredMethod) {
            formData.preferredMethod = options.data.preferredMethod;
          }
          if (scanToken) {
            formData.scanToken = scanToken;
          }
          if ($__default["default"].ube.impressionToken) {
            formData.impressionToken = $__default["default"].ube.impressionToken;
          }
          if (!isLeadForm) {
            formData.isFaceSkipped = options.isFaceSkipped || ubeSession('isFaceSkipped');
            formData.jwtFaceToken = options.jwtFaceToken || ubeCookie$1('UBE_JWT_FACE_TOKEN');
          }
          fieldNamesByPart(part).forEach(function (key) {
            formData[key] = getFieldValue(key);
            if (!formData[key] && ubeSession(key)) formData[key] = ubeSession(key);
          });
          formData.service = {
            deviceScreen: detectDeviceScreen()
          };
          try {
            formData.ga4UserId = getGA4UserId();
            formData.ga4SessionId = getGA4SessionId();
          } catch (err) {}
          formData.pageUrl = location.href;
          formData.referrerUrl = document.referrer;

          //Calculate calculate values
          fieldNamesByPart(part).forEach(function (key) {
            var component = fieldMap[key];
            var calculateValue = component.calculateValue;
            if (calculateValue && calculateValue.length > 0) {
              var mul = new Function('value, data, helper, query, initialData', calculateValue + "; return value;");
              var helper = {
                getFieldObject: getFieldObject
              };
              var calculationResult = mul(formData[key], formData, helper, query, _objectSpread2({}, options.data));
              formData[key] = calculationResult;
            }
          });
          return formData;
        }
        function handleVisibility(key, formData) {
          return toggleVisible(key, isVisible(key, formData));
        }
        function handleFormVisibility(exceptKey) {
          var formData = getFormData();
          fieldNames.forEach(function (key) {
            if (key != exceptKey) handleVisibility(key, formData);
          });
        }
        function handleResponseErrors(response) {
          var _response$errors, _response$message;
          if (response.statusCode === 400 && ((_response$errors = response.errors) === null || _response$errors === void 0 ? void 0 : _response$errors.length) > 0) {
            var invalids = {};
            response.errors.forEach(function (d) {
              var key = d.path;
              var description = d.error;
              invalids[key] = description;
              setFieldInvalid(key, null, description);
            });
            if (options && options.onValidationFailure) options.onValidationFailure(invalids);
            console.log("UBE :: Server-side validation FAIL");
            console.log(invalids);
          } else if (((_response$message = response.message) === null || _response$message === void 0 ? void 0 : _response$message.length) > 0) {
            showPopup(response.message);
          }
        }
        function isVisible(key, formData) {
          var component = fieldMap[key];
          var conditional = component.conditional;
          var customConditional = component.customConditional;
          var byConditional = true;
          var byCustomConditional = true;
          var checkIfNotEmpty = function checkIfNotEmpty(v) {
            if (!!v !== v) return v && v.length > 0;
            return v;
          };
          if (conditional && checkIfNotEmpty(conditional.show) && conditional.when && conditional.when.length > 0 && conditional.eq && conditional.eq.length > 0) {
            var show = conditional.show == "true" || conditional.show == true;
            if ((formData[conditional.when] || "").toString() == conditional.eq.toString()) byConditional = show;else byConditional = !show;
          }
          if (customConditional && customConditional.length > 0) {
            var mul = new Function('show, data, helper, query, initialData', customConditional + "; return show;");
            var helper = {
              getFieldObject: getFieldObject
            };
            var show = mul(true, formData, helper, query, _objectSpread2({}, options.data));
            byCustomConditional = !(show == false || show == "false");
          }
          return byConditional && byCustomConditional;
        }
        function toggleVisible(key, visible) {
          var element = container.find(".ube-visibility-show-for-" + key);
          var hideElement = container.find(".ube-visibility-hide-for-" + key);
          var component = fieldMap[key];
          if (!visible) {
            var wasVisible = element.is(":visible");
            if (wasVisible && component.tags && component.tags.indexOf("getFRToken") >= 0) {
              events.getFRToken = false;
              container.find("form").trigger("stopVideoCapture").off("stopVideoCapture");
              $__default["default"](".ube-face-error").hide();
              $__default["default"](".ube-face-container").show();
            }
          }
          if (visible) {
            var wasVisible = element.is(":visible");
            if (element.attr("data-ube-display")) element.css("display", element.attr("data-ube-display"));else element.show();
            hideElement.hide();

            /**
             * Мегафон отсылается только раз (ограничение раз в сутки), поэтому услови И
             */
            if (!wasVisible && !events.initIdx && component.tags && component.tags.includes("initIdx")) {
              gaPush(categoryPrefix + "av_process", "click - button - idx");
              events.initIdx = true;
              toggleLoader(false);
            }

            /**
             * Мегафон отсылается только раз (ограничение раз в сутки), поэтому услови И
             */
            if (!wasVisible && !events.sendMegafonCode && component.tags && component.tags.indexOf("sendMegafonCode") >= 0) {
              gaPush("AV", "Initialize", "megafon");
              events.sendMegafonCode = true;
              toggleLoader(true);
              setTimeout(function () {
                container.find("form").trigger("submitNoValidation");
              }, 100);
            }

            /**
             * К FR можно возвращаться, поэтому указывается условие ИЛИ
             */
            if ((!wasVisible || !events.getFRToken) && component.tags && component.tags.indexOf("getFRToken") >= 0) {
              events.getFRToken = true;
              toggleLoader(true);
              setFieldValue("token", null);
              setFieldValue("tokenUrl", null);
              setTimeout(function () {
                container.find("form").trigger("submitNoValidation");
              }, 100);
            }
            //container.find("input[name='"+key+"']").show();
          } else {
            element.hide();
            if (hideElement.attr("data-ube-display")) hideElement.css("display", hideElement.attr("data-ube-display"));else hideElement.show();
            //container.find("input[name='"+key+"']").hide();
          }
          return visible;
        }
        function validateAllFields(handleValid, handleInvalid, fieldNames) {
          handleValid = handleValid || function () {};
          handleInvalid = handleInvalid || function () {};
          var status = {};
          var invalids = {};
          var size = fieldNames.length;
          function checkFinish() {
            if (Object.keys(status).length < size) return;
            if (Object.keys(invalids).length == 0) return handleValid();else return handleInvalid(invalids);
          }
          var formData = getFormData();
          fieldNames.forEach(function (key) {
            var value = getFieldValue(key);
            handleVisibility(key, formData);
            validateField(key, value, function (key, value) {
              status[key] = "valid";
              setFieldValid(key, value);
              checkFinish();
            }, function (key, value, description) {
              //alert(key+": "+value+": "+description);
              status[key] = "invalid";
              invalids[key] = description;
              setFieldInvalid(key, value, description);
              checkFinish();
            }, function (jqxhr, textStatus, error) {
              status[key] = "error";
              setFieldValid(key, value);
              handleAjaxFail(jqxhr, textStatus, error);
              checkFinish();
            }, formData);
          });
        }
        var isLoading = false;
        function toggleLoader(visible) {
          isLoading = visible;
          console.log("UBE Toggle loader " + visible);
          if (options.toggleLoader) options.toggleLoader(visible);
        }
        function showPopup(message) {
          if (options.showPopup) options.showPopup(message);else {
            console.log(message);
            alert(message);
          }
        }
        var handle_form = function handle_form() {
          var form = container.find("form");
          var path = json.path;
          var action_path;
          var ga_name;
          hasPreferredMethodContainer = !!$__default["default"]('.ube-phone-send-preferredMethod').length;
          var isFRPassed = !!ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN);
          var promoCampaignName = sessionStorage.getItem('promoCampaignName');
          var fileTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'images/jpeg', 'images/jpg', 'images/png', 'images/gif', 'application/pdf'];
          factory.autoCreateAbsentFields();
          var timer = new Timer();
          if (/-reg$/.test(path)) {
            action_path = actionPathReg(options, path, isLeadForm, formProperties);
            var category = isQRForm ? 'dl_qr_registration_start' : 'dl_auth_registration_start';
            if (!isMBEPForm) {
              gaPush(category, "form - registration");
            }
            if (isMBEPForm) {
              gaPushObject({
                event: 'dl-pageview',
                pageURL: window.location.href,
                pageType: 'auth_nonBrand'
              });
            }
            if (isQRForm) gaPush("qr_reg", isFRPassed ? "fr - success" : "fr - fail - screen_2", promoCampaignName);
            ga_name = "Registration";
          } else if (/optin$/.test(path)) {
            action_path = "/esb/" + path + "/submitCodes";
            gaPush(categoryPrefix + "2optin_start", "form - 2optin");
            ga_name = "2OPTIN";
          } else if (/av$/.test(path)) {
            action_path = "/esb/" + path + "/submission";
            ga_name = "AV";
            if (hasField("faceMethod")) {
              gaPush(categoryPrefix + 'av_process', 'view - screen_av_fork');
            } else if (hasField("richcallMethod")) {
              options.richcall && options.richcall();
            } else {
              gaPush(categoryPrefix + "av_idx_start", "form - idx");
            }
          } else if (/login$/.test(path)) {
            action_path = "/esb/" + path + "/submission";
            ga_name = "Login";
            gaPush(categoryPrefix + "auth_password_start", "form - password");
            if (isMBEPForm) {
              gaPushObject({
                event: 'dl-pageview',
                pageURL: window.location.href,
                pageType: 'auth_nonBrand'
              });
            }
          } else if (/remind/.test(path)) {
            action_path = "/esb/" + path + "/submission";
            ga_name = "LoginRemind";
            gaPush(categoryPrefix + "auth_resetPassword_start", "form - resetPassword");
            if (isMBEPForm) {
              gaPushObject({
                event: 'dl-pageview',
                pageURL: window.location.href,
                pageType: 'auth_passwordReset'
              });
            }
          } else if (/cabinet/.test(path)) {
            action_path = "/esb/" + path + "/cabinet";
            ga_name = "PersonalCabinet";
          } else if (/instagram/.test(path)) {
            action_path = "/esb/" + path + "/instagram";
            ga_name = "UpdateInstagram";
            gaPush(ga_name, "Start");
          } else if (/-vk$/.test(path)) {
            action_path = "/esb/" + path + "/vk";
            ga_name = "UpdateVK";
            gaPush(ga_name, "Start");
          } else if (/-phone$/.test(path)) {
            action_path = "/esb/" + path + "/submission";
            ga_name = "PhoneVerification";
          } else if (/-phone-check$/.test(path)) {
            action_path = "/esb/" + path + "/submission";
          } else if (/-phone-send$/.test(path)) {
            action_path = "/esb/" + path + "/submission";
            var _category3 = isQRForm ? "dl_qr_phone_start" : "dl_auth_phone_start";
            if (!hasPreferredMethodContainer) {
              gaPush(_category3, "form - phone");
            }
            if (isQRForm) gaPush("qr_phone", isFRPassed ? "fr - success" : "fr - fail", promoCampaignName);
            if (isMBEPForm) {
              gaPushObject({
                event: 'dl-pageview',
                pageURL: window.location.href,
                pageType: 'auth_nonBrand'
              });
            }
          } else if (/-idx$/.test(path)) {
            action_path = "/esb/" + path + "/submission";
            ga_name = "IDXVerification";
            gaPush(categoryPrefix + "av_idx_registration_start", "form - idx_reg");
            if (isQRForm) gaPush("qr_reg", "fr - fail - screen_1", promoCampaignName);
          } else if (/-coupon$/.test(path)) {
            action_path = "/api/coupon/assignBenefit/" + path.replace('-coupon', '-reg');
          } else {
            action_path = "/main/" + path + "/submission";
            gaPush(path, "Start");
            ga_name = path;
          }
          function ajaxSubmitFormInternal(data, isSearchOnly) {
            var requestPath = action_path;
            var key = sessionKey || options.sessionKey;
            var authorizationHeader = key ? "Bearer ".concat(key) : undefined;
            var useCoreCRM = formProperties.useCoreCRM && requestPath.includes('/api/session/core/registration/');
            var dteCoupon = requestPath.includes('/api/coupon/assignBenefit/');
            form.attr("action", host + requestPath);
            if (ga_name === "AV") data.data.method;else if (ga_name === "Login") ;else if (ga_name === "Registration") data.data.utmSource;
            gaPushObject(data.data);
            var payload = data;
            if (options.transformPayload) {
              if (typeof options.transformPayload === 'function') {
                payload = options.transformPayload(payload);
              } else {
                throw new Error('options.transformPayload must be a function(object) {return object;}');
              }
            }
            if (useCoreCRM || dteCoupon) {
              payload = data.data;
            }
            data.isSearchOnly = isSearchOnly;
            $__default["default"].ajax({
              type: 'POST',
              headers: {
                "ga-id": ubeCookie$1('_ga') || "",
                "d-id": ubeCookie$1('_d') || "",
                "ym-id": ubeCookie$1('_ym_uid') || "",
                "Authorization": authorizationHeader
              },
              url: form.attr("action"),
              data: JSON.stringify(payload),
              contentType: 'application/json; charset=UTF-8',
              success: function success(result) {
                toggleLoader(false);
              },
              error: function error(xhr, resp, text) {
                var _xhr$responseJSON, _xhr$responseJSON2;
                if (/-reg$/.test(path)) {
                  action_path = actionPathReg(options, path, isLeadForm);
                  var _category4 = isQRForm ? 'dl_qr_registration_fail' : 'dl_auth_registration_fail';
                  gaPush(_category4, "form - registration - reason: technical");
                  if (isMBEPForm) {
                    if ($__default["default"]('.reg-form_step_0').is(':visible')) gaPush('dl_av_idx_registration_fail', "form - idx_reg - reason: technical");
                    gaPushObject({
                      event: 'dl-pageview',
                      pageURL: window.location.href,
                      pageType: 'auth_nonBrand'
                    });
                  }
                  if (isQRForm) gaPush("qr_reg", isFRPassed ? "fr - success" : "fr - fail - screen_2", promoCampaignName);
                  ga_name = "Registration";
                  if (useCoreCRM) {
                    handleResponseErrors(xhr.responseJSON);
                  }
                } else if (/optin$/.test(path)) {
                  action_path = "/esb/" + path + "/submitCodes";
                  gaPush(categoryPrefix + "2optin_fail", "form - 2optin - reason: technical");
                  ga_name = "2OPTIN";
                } else if (/av$/.test(path)) {
                  action_path = "/esb/" + path + "/submission";
                  gaPush(categoryPrefix + "av_idx_fail", "form - idx - reason: technical");
                  ga_name = "AV";
                } else if (/-phone-check$/.test(path)) {
                  action_path = "/esb/" + path + "/submission";
                  ga_name = "PhoneCodeVerification";
                  var _category5 = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
                  var action;
                  if (isP1Form) gaPush('dl_auth_phone', 'fail - phone', 'technical');else {
                    if (hasPreferredMethodContainer) {
                      action = ubeSession('preferredMethod') === 'telegram' ? 'number - form - phone_telegram_push - reason: technical' : 'number - form - phone_sms_code - reason: technical';
                    } else {
                      action = 'form - phone_number - reason: technical';
                    }
                  }
                  gaPush(_category5, action);
                } else if (/-phone-send$/.test(path)) {
                  action_path = "/esb/" + path + "/submission";
                  var _category6 = isQRForm ? 'dl_qr_phone_fail' : 'dl_auth_phone_fail';
                  var _action2;
                  if (hasPreferredMethodContainer) {
                    if (ubeSession('preferredMethod') === 'telegram') {
                      _action2 = remainingAttemptsCount ? "telegram_push - form - phone_telegram_push - attempts_left: ".concat(remainingAttemptsCount, " - reason: technical") : 'telegram_push - form - phone_telegram_push - reason: technical';
                    } else {
                      _action2 = remainingAttemptsCount ? "sms_code - form - phone_sms_code - attempts_left: ".concat(remainingAttemptsCount, " - reason: technical") : 'sms_code - form - phone_sms_code - reason: technical';
                    }
                  } else {
                    _action2 = 'form - phone_code - reason: technical';
                  }
                  gaPush(_category6, _action2);
                } else if (/-idx$/.test(path)) {
                  action_path = "/esb/" + path + "/submission";
                  ga_name = "IDXVerification";
                  gaPush(categoryPrefix + "av_idx_registration_fail", "form - idx_reg - reason: technical");
                  if (isQRForm) gaPush("qr_reg", "fr - fail - screen_1", promoCampaignName);
                } else if (/-coupon$/.test(path)) {
                  handleResponseErrors(xhr.responseJSON);
                }
                if (xhr !== null && xhr !== void 0 && (_xhr$responseJSON = xhr.responseJSON) !== null && _xhr$responseJSON !== void 0 && _xhr$responseJSON.error && (xhr === null || xhr === void 0 || (_xhr$responseJSON2 = xhr.responseJSON) === null || _xhr$responseJSON2 === void 0 || (_xhr$responseJSON2 = _xhr$responseJSON2.error) === null || _xhr$responseJSON2 === void 0 ? void 0 : _xhr$responseJSON2.length) > 0) {
                  showPopup(xhr.responseJSON.error);
                }
                toggleLoader(false);
                console.log("UBE :: Form submission ERROR");
                console.log(xhr, resp, text);
              }
            }).done(function (result) {
              function handleResult(result) {
                if (result.data) {
                  if (result.data.userId) gaUserId(result.data.userId);else if (result.data.data && result.data.data.userId) gaUserId(result.data.data.userId);
                }
                if (result.sessionKey) sessionKey = result.sessionKey;
                if (result.data && result.data.requireConsent && typeof $__default["default"].ube.showTermsPopup === "function") {
                  return $__default["default"].ube.showTermsPopup(result.data.sessionKey, result.data.termsCode, function () {
                    return acceptTerms(result.data.sessionKey, path, result.data.termsCode, api_url);
                  }, result.data.userId).then(function (respond) {
                    var buff = _objectSpread2(_objectSpread2({}, result), {}, {
                      data: _objectSpread2(_objectSpread2({}, result.data), {}, {
                        requireConsent: false
                      })
                    });
                    return handleResult(buff);
                  })["catch"](function (err) {
                    console.log('Error while showing terms popup', err);
                  });
                }
                if (result.event == "enterPassword" && typeof $__default["default"].ube.enterPassword === "function") {
                  return $__default["default"].ube.enterPassword(result.data.sessionKey, function (newPassword) {
                    return setPassword(result.data.sessionKey, path, newPassword, api_url);
                  }, result.data.userId).then(function (respond) {
                    var buff = _objectSpread2(_objectSpread2({}, result), {}, {
                      event: 'loginSuccess'
                    });
                    return handleResult(buff);
                  })["catch"](function (err) {
                    console.log('Error while setting password', err);
                  });
                }
                if (result.event == "enterPassword" && typeof $__default["default"].ube.enterPassword !== "function") {
                  var buff = _objectSpread2(_objectSpread2({}, result), {}, {
                    event: 'loginSuccess'
                  });
                  return handleResult(buff);
                }
                function gaCheck(error) {
                  if (ga_name === 'PhoneCodeVerification') gaPush(categoryPrefix + 'auth_fail', 'method: phone - invalid-password', 'Введен некорректный логин (email или моб. телефон)');else if (ga_name === 'Login') gaPush(categoryPrefix + 'auth_password_fail', 'form - password - reason: ' + error);else if (ga_name === 'LoginRemind') gaPush(categoryPrefix + 'auth_resetPassword_fail', 'form - resetPassword - reason: ' + error);
                }
                if (result.name === "ValidationError") {
                  var invalids = {};
                  result.details.forEach(function (d) {
                    var key = d.path;
                    var description = d.message;
                    invalids[key] = description;
                    setFieldInvalid(key, null, description);
                  });
                  if (options && options.onValidationFailure) options.onValidationFailure(invalids);
                  if ($__default["default"]('.remaining-attempts-count').length && path.endsWith('phone-check')) {
                    var count = result.details[0].remainingAttempts;
                    if (count >= 0) {
                      remainingAttemptsCount = count;
                      $__default["default"]('.remaining-attempts-count').text("\u041E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ".concat(pluralize(count, ['попытка', 'попытки', 'попыток'])));
                    } else {
                      $__default["default"]('.remaining-attempts-count').text('');
                      remainingAttemptsCount = '';
                    }
                  }
                  console.log("UBE :: Server-side validation FAIL");
                  console.log(invalids);
                } else if (result.error && result.error.length > 0) {
                  gaCheck("error");
                  showPopup(result.error);
                } else if (result.event === 'updateApprove') {
                  window.popup.open("#profile-edit-popup");
                  $__default["default"](document).on("mousedown", '.profile__edit-popup-submit', function () {
                    setFieldValue('personalDataChangeApproved', true);
                    $__default["default"]("[name=popup]").val('non-av');
                    onFormSubmit('changeContacts');
                    window.popup.close();
                    setTimeout(function () {
                      return setFieldValue('personalDataChangeApproved', false);
                    }, 4000);
                  });
                } else if (result.event == "update") {
                  reloadFormData(result.data);
                } else if (result.event == "face") {
                  reloadFormData(result.data);
                  initializeFaceCapture();
                } else if (result.event == "beforeSubmit") {
                  var callback = function callback() {
                    return ajaxSubmitFormInternal(data, false);
                  };
                  if (options.onBeforeSubmit) options.onBeforeSubmit(data, result.data, callback, setFieldInvalid);else callback();
                } else if (result.event == "requireConsent") {
                  gaPush("Consent", "Show");
                  var template = result.data.template;
                  var component = $__default["default"](template);
                  component.appendTo("body");
                  component.find(".ube-form-submit-click").click(function (e) {
                    gaPush("Consent", "Agree");
                    e.preventDefault();
                    component.trigger("remove").remove();
                    data.agreeWithNewConsents = true;
                    validateSetCaptchaProof(container, data, captchaType, ajaxSubmitFormInternal);
                    return false;
                  });
                  component.find(".ube-trigger-event[data-ube-event=close]").click(function (e) {
                    gaPush("Consent", "Close");
                    e.preventDefault();
                    component.trigger("remove").remove();
                    return false;
                  });
                } else if (result.event == 'loginSuccess') {
                  submissionSuccess(result);
                } else if (options.onSubmissionSuccess) {
                  submissionSuccess(result);
                }
              }
              function submissionSuccess(result) {
                var _result$data, _result$data2;
                /**
                 * Очистка сессии только после заполнения формы регистрации
                 */
                var mainRegistrationSteps = ['PhoneVerification', 'PhoneCodeVerification', 'IDXVerification'];
                var event = result.event,
                  data = result.data;
                if (!mainRegistrationSteps.includes(ga_name)) clearSessionFields();
                if (name.includes('phone-send')) {
                  var _category7 = isQRForm ? 'dl_qr_phone_process' : 'dl_auth_phone_process';
                  var action;
                  if (hasPreferredMethodContainer) {
                    action = ubeSession('preferredMethod') === 'telegram' ? 'send - telegram_push_to_las - form - phone_telegram_push' : 'send - sms_code_to_las - form - phone_sms_code';
                  } else {
                    action = 'send - code';
                  }
                  gaPush(_category7, action);
                } else if (name.includes('-phone-check')) {
                  if (event === 'loginSuccess' && data.userId) ubeCookie$1(cookies.UBE_USERID, data.userId, sessionExpiration());
                  var _category8 = isQRForm ? 'dl_qr_phone_success' : 'dl_auth_phone_success';
                  var _action3;
                  if (hasPreferredMethodContainer) {
                    _action3 = ubeSession('preferredMethod') === 'telegram' ? "form - phone_telegram_push - (".concat(result.event === 'loginSuccess' ? 'in_base' : 'not_in_base', ")") : "form - phone_sms_code (".concat(result.event === 'loginSuccess' ? 'in_base' : 'not_in_base', ")");
                  } else {
                    _action3 = "form - phone - (".concat(result.event === 'loginSuccess' ? 'in_base' : 'not_in_base', ")");
                  }
                  if (remainingAttemptsCount) {
                    gaPush(_category8, _action3 + ' - attempts_left: ' + remainingAttemptsCount);
                  } else {
                    gaPush(_category8, _action3);
                  }
                } else if (name.includes('-reg')) {
                  var _data$data;
                  (data === null || data === void 0 || (_data$data = data.data) === null || _data$data === void 0 ? void 0 : _data$data.userId) && ubeCookie$1(cookies.UBE_USERID, data.data.userId, sessionExpiration());
                  var _category9 = isQRForm ? 'dl_qr_registration_success' : 'dl_auth_registration_success';
                  gaPush(_category9, 'form - registration');
                } else if (name.includes('-optin')) {
                  var _data$data2;
                  (data === null || data === void 0 || (_data$data2 = data.data) === null || _data$data2 === void 0 ? void 0 : _data$data2.userId) && ubeCookie$1(cookies.UBE_USERID, data.data.userId, sessionExpiration());
                  gaPush(categoryPrefix + '2optin_success', 'form - 2optin');
                } else if (name.includes('-av')) {
                  if (!hasField('faceMethod') || data.data.method === 'document') {
                    gaPush(categoryPrefix + 'av_idx_success', 'form - idx - document: ' + data.data.documentType);
                  }
                } else if (name.includes('-idx')) {
                  gaPush(categoryPrefix + 'av_idx_registration_success', 'form - idx_reg');
                }
                if (ga_name === 'LoginRemind') gaPush(categoryPrefix + 'auth_resetPassword_success', 'form - resetPassword');else if (ga_name === 'Login') {
                  var _action4;
                  switch (result.source) {
                    case 'sms':
                      _action4 = 'phone';
                      break;
                    case 'password':
                      _action4 = 'email';
                  }
                  gaPush(categoryPrefix + 'auth_password_success', "form - password - ".concat(_action4));
                }
                var submissionId = (_result$data = result.data) === null || _result$data === void 0 ? void 0 : _result$data.submissionId;
                var userId = (_result$data2 = result.data) === null || _result$data2 === void 0 ? void 0 : _result$data2.userId;
                if (result && result.data && result.data.data) {
                  submissionId = submissionId || result.data.data.submissionId;
                  userId = userId || result.data.data.userId;
                }
                if (result && result.data && result.data.sessionKey) ubeCookie$1('ube_session_key', result.data.sessionKey, sessionExpiration());
                options.onSubmissionSuccess(submissionId, userId, result);
                container.add(form).trigger("formSuccess", data, result);
                resetOptinAfterSubmission();
              }
              if (Array.isArray(result)) {
                result.forEach(function (r) {
                  handleResult(r);
                });
              } else {
                handleResult(result);
              }
            });
          }
          function ajaxSubmitForm(data) {
            toggleLoader(true);
            if (data) {
              data.timer = timer.ends();
              data.context = context.json;
            }
            return ajaxSubmitFormInternal(data, !!options.onBeforeSubmit);
          }
          form.on("submitNoValidation", function (event) {
            event.preventDefault();
            toggleLoader(true);
            ajaxSubmitForm({
              data: getFormData()
            });
          });
          function onFormSubmit(part) {
            if (isLoading) return;
            toggleLoader(true);
            var data = {
              data: getFormData(part)
            };
            if (ga_name === "AV") data.data.method;else if (ga_name === "Login") ;else if (ga_name === "Registration") data.data.utmSource;
            if (part) data.part = part;
            validateAllFields(function () {
              if (options.onValidationSuccess) options.onValidationSuccess(data);
              console.log("UBE :: Form validation SUCCESS");
              validationState = {};
              if (/-reg$/.test(path)) {
                var _category10 = isQRForm ? 'dl_qr_registration_process' : 'dl_auth_registration_process';
                gaPush(_category10, 'send - form - registration');
              } else if (/optin$/.test(path)) {
                action_path = "/esb/" + path + "/submitCodes";
                gaPush(categoryPrefix + "2optin_process", "send - form - 2optin");
                ga_name = "2OPTIN";
              } else if (/av$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "AV";
                gaPush(categoryPrefix + 'av_idx_process', "send - form - idx - document: ".concat(data.data.documentType));
              } else if (/login$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "Login";
                gaPush(categoryPrefix + "auth_password_process", "send - form - password");
                if (isMBEPForm) {
                  gaPushObject({
                    event: 'dl-pageview',
                    pageURL: window.location.href,
                    pageType: 'auth_nonBrand'
                  });
                }
              } else if (/remind/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "LoginRemind";
                gaPush(categoryPrefix + "auth_resetPassword_process", "send - form - resetPassword");
                if (isMBEPForm) {
                  gaPushObject({
                    event: 'dl-pageview',
                    pageURL: window.location.href,
                    pageType: 'auth_passwordReset'
                  });
                }
              } else if (/cabinet/.test(path)) {
                action_path = "/esb/" + path + "/cabinet";
                ga_name = "PersonalCabinet";
              } else if (/instagram/.test(path)) {
                action_path = "/esb/" + path + "/instagram";
                ga_name = "UpdateInstagram";
                gaPush(ga_name, "Start");
              } else if (/-vk$/.test(path)) {
                action_path = "/esb/" + path + "/vk";
                ga_name = "UpdateVK";
                gaPush(ga_name, "Start");
              } else if (/-phone$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                ga_name = "PhoneVerification";
                gaPush(ga_name, "Start");
              } else if (/-phone-check$/.test(path)) {
                var _category11 = isQRForm ? 'dl_qr_phone_process' : 'dl_auth_phone_process';
                var action;
                if (hasPreferredMethodContainer) {
                  if (ubeSession('preferredMethod') === 'telegram') {
                    action = remainingAttemptsCount ? "send - telegram_push - form - phone_telegram_push - attempts_left: ".concat(remainingAttemptsCount) : 'send - telegram_push - form - phone_telegram_push';
                  } else {
                    action = remainingAttemptsCount ? "send - sms_code - form - phone_sms_code - attempts_left: ".concat(remainingAttemptsCount) : 'send - sms_code - form - phone_sms_code';
                  }
                } else {
                  action = 'send - form - phone_code';
                }
                gaPush(_category11, action);
              } else if (/-phone-send$/.test(path)) {
                var _category12 = isQRForm ? 'dl_qr_phone_process' : 'dl_auth_phone_process';
                var _action5;
                if (hasPreferredMethodContainer) {
                  _action5 = ubeSession('preferredMethod') === 'telegram' ? 'send - number - form - phone_telegram_push' : 'send - number - form - phone_sms_code';
                } else {
                  _action5 = 'send - form - phone_number';
                }
                gaPush(_category12, _action5);
              } else if (/-idx$/.test(path)) {
                action_path = "/esb/" + path + "/submission";
                gaPush(categoryPrefix + "av_idx_registration_process", "send - form - idx_reg");
              }
              validateSetCaptchaProof(container, data, captchaType, ajaxSubmitForm);
            }, function (invalids) {
              if (options.onValidationFailure) options.onValidationFailure(invalids);
              toggleLoader(false);
              console.log("UBE :: Form validation FAIL");
              console.log(invalids);
              var fields = Object.keys(invalids).map(function (key) {
                return getField(key);
              });
              if (options && options.onFieldInvalid) {
                for (var _i = 0, _Object$entries = Object.entries(invalids); _i < _Object$entries.length; _i++) {
                  var _Object$entries$_i = _slicedToArray(_Object$entries[_i], 2),
                    key = _Object$entries$_i[0],
                    value = _Object$entries$_i[1];
                  if (validationState[key] !== invalids[key]) options.onFieldInvalid(key, value);
                }
                validationState = _objectSpread2(_objectSpread2({}, validationState), invalids);
              }
              $__default["default"].scrollToElement($__default["default"](fields).map(function () {
                return this.toArray();
              }));
            }, fieldNamesByPart(part));
          }
          form.submit(function (event) {
            event.preventDefault();
            onFormSubmit();
            return false;
          });
          form.find(".ube-form-submit-click").click(function (event) {
            event.preventDefault();
            onFormSubmit($__default["default"](this).attr("data-part"));
            return false;
          });
          form.find("[type=submit]").click(function (event) {
            event.preventDefault();
            onFormSubmit($__default["default"](this).filter("[name=part]").val());
            return false;
          });
          function reloadFormData(data, part) {
            var part = data.part;
            if (data.data) data = data.data;
            options.data = data;
            fieldNamesByPart(part).forEach(function (key) {
              setFieldValue(key, data[key]);
              getField(key).blur();
            });
          }

          //Reload form if token is empty
          container.find(".ube-camera-container").click(function (e) {
            if (hasField("method") && hasField("token") && getFieldValue("method") === "face") {
              var token = getFieldValue("token");
              if (!token || token === "") {
                e.preventDefault();
                form.trigger("submitNoValidation");
                return false;
              }
            }
          });
          function initializeFaceCapture() {
            var token = getFieldValue("token");
            var tokenUrl = getFieldValue("tokenUrl");
            var tryCount = 1;
            var fcm;
            var b64Img = '';
            var renderContainer = container.find(".ube-camera-container");
            var renderTarget = container.find(".ube-camera-render");
            var captureButton = container.find(".ube-camera-capture");
            var fallbackTarget = container.find(".ube-camera-fallback");
            if (renderTarget.data("init") || !token || !tokenUrl) return false;
            renderTarget.show().data("init", true);
            function sendBlobToServer(blob, callback, type, imageData) {
              var eventType;
              if (type === 'auto') eventType = 'ACS Camera';else eventType = 'Photo Upload';
              toggleLoader(true);
              $__default["default"].ajax({
                url: tokenUrl,
                data: blob,
                // the formData function is available in almost all new browsers.
                type: "POST",
                processData: false,
                cache: false,
                dataType: "json",
                // Change this according to your response from the server.
                contentType: 'application/octet-stream',
                crossDomain: true,
                headers: {
                  "Authorization": "Bearer " + token,
                  "X-ACS-PICTURE-MODE": "stream"
                },
                error: function error(err) {
                  toggleLoader(false);
                  console.error("Error from ACS API");
                  console.error(err);
                  logACSResultToELK(eventType, false, true, 'Network Error', imageData, b64Img, name);
                },
                success: function success(data) {
                  toggleLoader(false);
                  console.log("Success from ACS API");
                  console.log(data);
                  if (data) {
                    console.log(data.status_code);
                    console.log(data.error_message);
                    console.log(data.error_code);
                    if (data.status_code === "SUCCESS" && !window.bad) {
                      form.trigger("submitNoValidation");
                      var label = tryCount === 1 ? 'first' : 'second';
                      logACSResultToELK(eventType, true, false, null, imageData, b64Img, name, token);
                      gaPush(categoryPrefix + "av_fr_success", "form - fr_".concat(type, " - ").concat(label));
                      if (callback) callback();
                    } else if (data.next_validation_type === "DOCUMENT" || window.bad) {
                      var _label;
                      if (data.errorMessage === "Technical Error") _label = 'technical';else if (tryCount === 1) _label = 'first';else _label = 'second';
                      var detailMessage;
                      if (data.errors_detail) {
                        detailMessage = data.errors_detail && data.errors_detail[0] && data.errors_detail[0].code;
                      } else if (data.error_message) {
                        detailMessage = data.error_message;
                      } else {
                        detailMessage = "Technical Error";
                      }
                      gaPush(categoryPrefix + "av_fr_fail", "form - fr_".concat(type, " - ").concat(_label, " - reason: ").concat(detailMessage));
                      logACSResultToELK(eventType, false, false, detailMessage, imageData, b64Img, name);
                      if (data.errors_detail) {
                        data.errors_detail[0] && data.errors_detail[0].code || "Technical Error";
                        logACSResultToELK(eventType, false, false, data.errors_detail[0].code || "Technical Error", imageData, b64Img, name);
                      }
                      if ($__default["default"](".ube-face-error").length > 0) {
                        $__default["default"](".ube-face-container").hide();
                        $__default["default"](".ube-face-error").fadeIn(200);
                        if (callback) callback();
                      } else if ($__default["default"](".ube-visibility-show-for-documentMethod").length > 0 && $__default["default"](".ube-visibility-show-for-megafonMethod").length === 0) {
                        showPopup("Ой! Похоже, что вы выглядите слишком молодо. Попробуйте подтвердить возраст с помощью документов");
                        setTimeout(function () {
                          setFieldValue("method", "document");
                          handleFormVisibility();
                          if (callback) callback();
                        }, 4000);
                      } else {
                        showPopup("Ой! Похоже, что вы выглядите слишком молодо. Попробуйте подтвердить возраст через SMS код");
                        setTimeout(function () {
                          setFieldValue("method", "megafon");
                          handleFormVisibility();
                          if (callback) callback();
                        }, 4000);
                      }
                    } else if (data.error_message) {
                      var _label3;
                      if (!data.error_message) _label3 = 'technical';else if (tryCount === 1) _label3 = 'first';else _label3 = 'second';
                      console.log(data.error_message);
                      gaPush(categoryPrefix + "av_fr_fail", "form - fr_".concat(type, " - ").concat(_label3, " - reason: ").concat(data.error_message));
                      if (data.errors_detail) {
                        var code = data.errors_detail[0].code;
                        faceErrors[code] ? faceErrors[code].title : faceErrors["default"].title;
                        faceErrors[code] ? faceErrors[code].subtitle : faceErrors["default"].subtitle;
                        faceErrors[code] ? faceErrors[code].text : faceErrors["default"].text;
                        if (!!faceErrors[code]) {
                          var _faceErrors$code = faceErrors[code];
                            _faceErrors$code.title;
                            _faceErrors$code.subtitle;
                            _faceErrors$code.text;
                        }
                      }
                      var _detailMessage;
                      if (data.errors_detail) {
                        _detailMessage = data.errors_detail && data.errors_detail[0] && data.errors_detail[0].code;
                      } else if (data.error_message) {
                        _detailMessage = data.error_message;
                      } else {
                        _detailMessage = "Technical Error";
                      }
                      logACSResultToELK(eventType, false, false, _detailMessage, imageData, b64Img, name);
                      if (tryCount < 2) {
                        tryCount++;
                        fcm.reload();
                        if (options.acsOptions && options.acsOptions.debugMode && data.errors_detail) {
                          $__default["default"]('body').append('<p class="server-error-message"></p>');
                          $__default["default"]('.server-error-message').html(JSON.stringify(data.errors_detail));
                        }
                        showPopup("Ой! Похоже, что вы выглядите слишком молодо.<br><br> <small>Возможно вы не выполнили одно из условий. В любом случае стоит попробовать еще раз, чтобы изображение получилось более чётким, не засвеченным и не слишком затемненным.</small>");
                      } else {
                        setFieldValue("method", "megafon");
                        handleFormVisibility();
                        if (callback) callback();
                      }
                    }
                  }
                }
              });
            }
            function renderCameraCapture() {
              if (isNoCameraStream) return renderFileUpload();
              fallbackTarget.hide();
              renderContainer.addClass("ube-camera-option-capture").removeClass("ube-camera-option-upload");
              $__default["default"]('.ube-camera-capture').hide();
              var onFaceSuccess = function onFaceSuccess(_ref) {
                var img = _ref.img;
                console.log("Image data:");
                b64Img = img;
                console.log(img);
                if (options.acsOptions && options.acsOptions.debugMode) {
                  if (!$__default["default"]('#result-image').length) {
                    $__default["default"]('.container').append('<textarea id="result-image"></textarea>');
                  }
                  $__default["default"]('#result-image').text(img);
                }
                var blob = imageDataToBlob(img);
                console.log("Blob:");
                console.log(blob);
                var dummyForm = $__default["default"]("<form style='position: absolute;top:-2000px;left:-2000px;display: block;'>" + "<input type=\"text\" id=\"filename\" name=\"filename\" />" + "</form>");
                dummyForm.appendTo("body");
                var formDataToUpload = new FormData(dummyForm[0]);
                formDataToUpload.append("image", blob);
                console.log("Sending ACS API request");
                var dummyImg = new Image();
                dummyImg.onload = function () {
                  var imageData = {
                    width: dummyImg.width,
                    height: dummyImg.height,
                    sizeKB: getImageSize(img).toFixed(3)
                  };
                  var aggregatedImageData = {
                    initial: imageData,
                    resized: imageData
                  };
                  console.log("Sending ACS API request");
                  sendBlobToServer(blob, stopVideoCapture, 'auto', aggregatedImageData);
                };
                dummyImg.src = img;
                gaPush(categoryPrefix + "av_fr_process", "send - form - fr_auto");
              };
              var onFaceError = function onFaceError(err) {
                var errLabel = err.message || err || 'Unknown error';
                console.log('Face capture error:', errLabel);
                gaPush(categoryPrefix + "av_fr_process", "start - form - fr_upload - reason: ".concat(errLabel));
                renderFileUpload();
              };
              var onReadyForCaptureFace = function onReadyForCaptureFace() {
                gaPush(categoryPrefix + "av_fr_process", "start - form - fr_auto");
              };
              var props = {
                faceCaptureAssetsRootUrl: $__default["default"].ube.host + '/js/plugin/',
                onSuccess: onFaceSuccess,
                onError: onFaceError,
                language: 'ru',
                captureMethod: 'auto',
                onReadyForCapture: onReadyForCaptureFace,
                manualCaptureFallback: false
              };
              fcm = Yoti.FaceCaptureModule.render(props, renderTarget[0]);
              var stopVideoCapture = function stopVideoCapture() {
                console.log("stopVideoCapture()");
                fcm.unmount();
              };
              form.on("stopVideoCapture", function () {
                console.log("Handling stop function");
                stopVideoCapture();
              });
            }
            function renderFileUpload() {
              renderContainer.removeClass("ube-camera-option-capture").addClass("ube-camera-option-upload");
              fallbackTarget.show();
              renderTarget.hide();
              var dummyFile = $__default["default"]("<input type=\"file\" accept=\"image/*\" capture=\"user\" style='width:0;height:0;position:absolute;'/>").appendTo("body");
              var canvas = $__default["default"]("<canvas class='ube-dummy-image' style='visibility:hidden;display:block;position: absolute;top:-5000px;left:-5000px'></canvas>").appendTo("body")[0];
              var maxWidth = 2000;
              var maxHeight = 2000;
              var maxPixels = 2000000;
              dummyFile.off("change").change(function () {
                if (this.files.length === 0) {
                  console.log("File field empty");
                } else {
                  if (!(fileTypes.indexOf(this.files[0].type) > -1)) {
                    showPopup('Поддерживаются только форматы файлов изображений');
                    return;
                  }
                  console.log("File field changed");
                  var reader = new FileReader();
                  reader.addEventListener("load", function () {
                    var initialImage = this.result;
                    console.log("Image data:");
                    console.log(initialImage);
                    b64Img = initialImage;
                    var dummyImg = new Image();
                    var resizedImage;
                    dummyImg.onload = function () {
                      var imageFileSizeKB = getImageSize(initialImage).toFixed(3);
                      var ctx = canvas.getContext("2d");
                      var initialImageData = {
                        width: dummyImg.width,
                        height: dummyImg.height,
                        sizeKB: imageFileSizeKB
                      };
                      var isImageValid = resizeImage(dummyImg, maxWidth, maxHeight, maxPixels);
                      canvas.width = dummyImg.width;
                      canvas.height = dummyImg.height;
                      ctx.drawImage(dummyImg, 0, 0, dummyImg.width, dummyImg.height);
                      resizedImage = canvas.toDataURL('image/jpeg', 0.9);
                      dummyFile.val("");
                      dummyFile.wrap('<form>').closest('form').get(0).reset();
                      dummyFile.unwrap();
                      var resizedImageData = {
                        width: dummyImg.width,
                        height: dummyImg.height,
                        sizeKB: getImageSize(resizedImage).toFixed(3)
                      };
                      var aggregatedImageData = {
                        initial: initialImageData,
                        resized: isImageValid ? initialImageData : resizedImageData
                      };
                      var blob = imageDataToBlob(isImageValid ? initialImage : resizedImage);
                      sendBlobToServer(blob, undefined, 'upload', aggregatedImageData);
                    };
                    dummyImg.src = initialImage;
                  }, false);
                  reader.readAsDataURL(this.files[0]);
                }
                gaPush(categoryPrefix + "av_fr_process", "send - form - fr_upload");
              });
              captureButton.add(".ube-camera-option-upload").off("click").click(function (e) {
                console.log("Capture upload clicked");
                e.preventDefault();
                dummyFile.click();
                return false;
              });
            }
            renderCameraCapture();
          }
          fieldNames.forEach(function (key) {
            var field = form.find("[name='" + key + "']");
            var component = fieldMap[key];
            var type = component.type;
            var handler = function handler(onlyToValid, event) {
              handleFormVisibility(key);
              validateComponent(key, null, null, onlyToValid, event);
            };

            //set initial value

            var initialValue = options.data[key] || field.attr("data-ube-initial");
            if (key === "ageVerifiedToken" && (!initialValue || initialValue === "")) {
              try {
                if (ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN)) {
                  initialValue = ubeCookie$1(cookies.UBE_AGE_VERIFIED_TOKEN);
                } else if (localStorage && localStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN)) {
                  initialValue = localStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN);
                }
              } catch (error) {
                if (window.backupLocalStorage && window.backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN)) {
                  initialValue = window.backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED_TOKEN);
                }
              }
            }
            if (key === "ageVerified" && (!initialValue || initialValue === "")) {
              try {
                if (ubeCookie$1(cookies.UBE_AGE_VERIFIED)) {
                  initialValue = ubeCookie$1(cookies.UBE_AGE_VERIFIED);
                } else if (localStorage && localStorage.getItem(cookies.UBE_AGE_VERIFIED)) {
                  initialValue = localStorage.getItem(cookies.UBE_AGE_VERIFIED);
                }
              } catch (error) {
                if (backupLocalStorage && backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED)) {
                  initialValue = backupLocalStorage.getItem(cookies.UBE_AGE_VERIFIED);
                }
              }
            }
            if (/-reg$/.test(path) && autoAddSessionFields.indexOf(key) > -1 && ubeSession(key)) {
              if (!initialValue || initialValue === "") initialValue = ubeSession(key);
            }
            if (component.defaultValue && component.defaultValue.length > 0) initialValue = component.defaultValue;
            if (component.customDefaultValue && component.customDefaultValue.length > 0) {
              var mul = new Function('value, data, query', component.customDefaultValue + "; return value;");
              initialValue = mul(initialValue, options.data, query);
            }
            if (initialValue || initialValue != 0) {
              setFieldValue(key, initialValue);
              initialValues[key] = initialValue;
            }
            $__default["default"](".ube-value-update-on-click-" + key).click(function () {
              var option = $__default["default"](this).attr("data-option");
              if (option === 'face') {
                gaPush(categoryPrefix + 'av_process', 'click - button - fr');
                gaPush(categoryPrefix + "av_fr_start", "form - fr");
              } else if (option === 'document') {
                gaPush(categoryPrefix + 'av_process', 'click - button - idx');
                gaPush(categoryPrefix + "av_idx_start", "form - idx");
              }
              setFieldValue(key, $__default["default"](this).attr("data-option"));
              getField(key).blur();
            });
            var common = function common(key, handler) {
              if (type === "checkbox") field.change(function () {
                handler(false, 'blur');
              });else if (type === "radio") field.blur(function () {
                handler(false, 'blur');
              }).click(handler);else if (type === "file") {
                field.change(function (e) {
                  if (!(fileTypes.indexOf(this.files[0].type) > -1)) {
                    showPopup('Поддерживаются только форматы файлов изображений и pdf');
                    e.target.value = '';
                    return false;
                  }
                  field.ubeFileToBase64({
                    callback: function callback() {
                      handler(false, 'blur');
                    },
                    previewSelector: container.find(".ube-file-preview-".concat(key || "document"))
                  });
                  e.preventDefault;
                  return false;
                });
              } else if (type === "select" && $__default["default"]('input[name="' + key + '"]').attr('type') !== 'hidden') {
                field.on('change', function () {
                  handler(false, 'blur');
                });
              } else if (type === "textfield" || type === "phoneNumber" || type === "email" || type === "number") {
                var wto;
                var handleChange = function handleChange(e) {
                  if (wto) clearTimeout(wto);
                  wto = setTimeout(function () {
                    if (e.code === 'Enter') handler(true, 'blur');else handler(true, 'change');
                  }, 650);
                };
                if (isAndroid) field.on('keyup', handleChange);
                field.on('paste', handleChange).keypress(handleChange).blur(function () {
                  if (wto) clearTimeout(wto);
                  wto = null;
                  handler(false, 'blur');
                });
              } else if ($__default["default"]('input[name="' + key + '"]').length > 0 && $__default["default"]('input[name="' + key + '"]').attr('type') !== 'hidden') field.blur(function () {
                handler(false, 'blur');
              });else field.blur(handler);
            };
            var custom = options.bindValidation;
            (custom || common)(key, handler, common);
            var inputMask = component.inputMask;
            var placeholder = component.placeholder;
            var inputPlaceholder = component.properties ? component.properties.inputPlaceholder : undefined;
            if (inputMask && inputMask.length > 0) field.ubeMask(inputMask, placeholder, inputPlaceholder);
            if (placeholder && placeholder.length > 0) field.attr("placeholder", placeholder);
            handleFormVisibility();

            //Timer field events
            field.focus(function () {
              timer.focus(key);
            });
            field.blur(function () {
              timer.blur(key);
            });
          });
          container.find(".ube-mask").ubeMask();
          function dadataSuggestFio(definition, part) {
            form.find(definition).not("[autocomplete='off']").ubeAutocomplete({
              source: function source(t, e) {
                $__default["default"].ajax({
                  url: api_url + "/lookup/fio",
                  data: {
                    query: t.term,
                    part: part
                  },
                  success: function success(t) {
                    e((t.result || []).slice(0, 5));
                  }
                });
              }
            });
          }
          dadataSuggestFio('.formio-lookup-name', 'NAME');
          dadataSuggestFio('.formio-lookup-lastname, .formio-lookup-surname', 'SURNAME');
          dadataSuggestFio('.formio-lookup-middlename, .formio-lookup-middlename', 'PATRONYMIC');
          var clearFieldIfNotFromList = function clearFieldIfNotFromList(t, ui) {
            var item = $__default["default"](this).data('data-object');
            var label = $__default["default"](this).val();
            if (!item && label && label !== "" || item && item.label !== label) {
              if (label && $__default["default"](this).data("source") && $__default["default"](this).data("source").find(function (x) {
                return x && x.label === label;
              })) $__default["default"](this).data('ui-autocomplete')._trigger('select', 'autocompleteselect', {
                item: $__default["default"](this).data("source").find(function (x) {
                  return x && x.label === label;
                })
              });else $__default["default"](this).attr('data-value', null).data('data-object', null).val(null).trigger("blur");
            }
          };
          var fieldItemFocus = function fieldItemFocus(t, e) {
            $__default["default"](this).attr('data-value', e.item.value);
            $__default["default"](this).data('data-object', e.item);
            this.value = e.item.label;
            t.preventDefault();
          };
          container.find(".ube-lookup-cityTrial").ubeAutocomplete({
            source: function source(t, e) {
              $__default["default"].ajax({
                url: api_url + "/lookup/cityTrial",
                data: {
                  query: t.term
                },
                success: function success(t) {
                  e(t.result.slice(0, 10));
                }
              });
            },
            select: function select(t, e) {
              t.preventDefault(), $__default["default"](this).attr('data-value', e.item.label), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
            },
            focus: fieldItemFocus,
            change: clearFieldIfNotFromList
          }).each(function () {
            var element = $__default["default"](this);
            function setLocationObject(result) {
              element.attr('data-value', result.value).data('data-object', result).val(result.label).trigger("blur");
            }
            $__default["default"].ajax({
              url: api_url + "/lookup/currentCityTrial",
              success: function success(t) {
                if (t.result && Array.isArray(t.result) && t.result[0]) setLocationObject(t.result[0]);
              },
              error: function error() {}
            });
          });
          container.find(".ube-lookup-metroTrial").each(function () {
            var element = $__default["default"](this);
            element.ubeAutocomplete({
              source: function source(t, e) {
                $__default["default"].ajax({
                  url: api_url + "/lookup/metroTrial",
                  data: {
                    metro: t.term,
                    city: hasField("city") ? getFieldValue("city") : null
                  },
                  success: function success(t) {
                    e(t.result.slice(0, 10));
                  }
                });
              },
              select: function select(t, e) {
                t.preventDefault(), $__default["default"](this).attr('data-value', e.item.label), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
              },
              focus: fieldItemFocus,
              change: clearFieldIfNotFromList
            });
          });
          container.find(".formio-lookup-address").each(function () {
            var element = $__default["default"](this);
            var addressPrefix = $__default["default"](this).attr('data-address-prefix') || "shipping";
            element.ubeAutocomplete({
              source: function source(t, e) {
                $__default["default"].ajax({
                  url: api_url + "/lookup/address",
                  data: {
                    query: t.term,
                    city: hasField("city") ? getFieldValue("city") : null
                  },
                  success: function success(t) {
                    e(t.result.slice(0, 5));
                  }
                });
              },
              select: function select(t, e) {
                t.preventDefault(), $__default["default"](this).attr('data-value', e.item.label), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
                if (e.item && e.item.data) {
                  var d = e.item.data;
                  if (d) {
                    var mapping = {
                      "setAddress": e.item.label,
                      "setAddressCity": d.city,
                      "setAddressKladr": d.kladr_id,
                      "setAddressCityKladr": d.city_kladr_id,
                      "setAddressStreet": d.street,
                      "setAddressStreetType": d.street_type,
                      "setAddressHouse": d.house,
                      "setAddressBlock": d.block,
                      "setAddressFlat": d.flat,
                      "setPostalCode": d.postal_code
                    };
                    Object.keys(mapping).forEach(function (key) {
                      fieldNamesByTag(key).forEach(function (fieldName) {
                        if (fieldName.indexOf(addressPrefix) > -1 && hasField(fieldName)) setFieldValue(fieldName, mapping[key]);
                      });
                    });
                  }
                }
              },
              focus: fieldItemFocus,
              change: clearFieldIfNotFromList
            });
            var initialValue = $__default["default"](this).val();
            if (initialValue && initialValue != "") {
              console.log(initialValue);
              $__default["default"].ajax({
                url: api_url + "/lookup/address",
                data: {
                  query: initialValue,
                  city: hasField("city") ? getFieldValue("city") : null
                },
                success: function success(t) {
                  if (t && t.result && t.result[0] && t.result[0].data) {
                    var d = t.result[0].data;
                    var mapping = {
                      "setAddressCity": d.city,
                      "setAddressKladr": d.kladr_id,
                      "setAddressCityKladr": d.city_kladr_id,
                      "setAddressStreet": d.street,
                      "setAddressStreetType": d.street_type,
                      "setAddressHouse": d.house,
                      "setAddressBlock": d.block,
                      "setAddressFlat": d.flat,
                      "setPostalCode": d.postal_code
                    };
                    Object.keys(mapping).forEach(function (key) {
                      fieldNamesByTag(key).forEach(function (fieldName) {
                        if (mapping[key] && mapping[key] !== "" && fieldName.indexOf(addressPrefix) > -1 && hasField(fieldName)) {
                          setFieldValue(fieldName, mapping[key]);
                        }
                      });
                    });
                  }
                }
              });
            }
          });
          container.find("input[name='locationId'], .formio-lookup-location").ubeAutocomplete({
            source: function source(t, e) {
              $__default["default"].ajax({
                url: api_url + "/lookup/cities",
                data: {
                  query: t.term
                },
                success: function success(t) {
                  e(t.result.slice(0, 5));
                }
              });
            },
            select: function select(t, e) {
              t.preventDefault(), $__default["default"](this).attr('data-value', e.item.value), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
            },
            focus: fieldItemFocus,
            change: clearFieldIfNotFromList
          }).each(function () {
            var field = $__default["default"](this);
            var locationId = field.attr('data-value');
            var defaultCity = {
              value: 77000000000,
              label: "г. Москва"
            };
            function setLocationObject(result) {
              field.attr('data-value', result.value).data('data-object', result).val(result.label).trigger("blur");
              if (hasField("locationText")) setFieldValue("locationText", result.label);
            }
            if (locationId && locationId != "") {
              $__default["default"].ajax({
                url: api_url + "/lookup/city?locationId=" + locationId,
                success: function success(t) {
                  if (t.result && t.result.value && t.result.label) {
                    field.attr('data-value', t.result.value).data('data-object', t.result).val(t.result.label).trigger("blur");
                    if (hasField("locationText")) setFieldValue("locationText", t.result.label);
                  }
                }
              });
            } else {
              if (field.hasClass("noAutolookup")) return false;
              $__default["default"].ajax({
                url: api_url + "/lookup/currentCity",
                success: function success(t) {
                  if (!t.result || !t.result.value || !t.result.label) {
                    setLocationObject(defaultCity);
                  } else setLocationObject(t.result);
                },
                error: function error() {
                  setLocationObject(defaultCity);
                }
              });
            }
          });
          function getBrandLabelForField(key) {
            return function () {
              var field = $__default["default"](this);
              var brandId = field.attr('data-value');
              if (brandId && brandId != "") {
                $__default["default"].ajax({
                  url: api_url + "/lookup/brands/" + brandId,
                  success: function success(t) {
                    if (t.result && t.result.value && t.result.label) {
                      form.find(".ube-label-" + key).html(t.result.label);
                      field.attr('data-value', t.result.value).data('data-object', t.result).val(t.result.label).trigger("blur");
                    }
                  }
                });
              }
            };
          }
          function lookupBrand(key, pmi, families, focus) {
            var brandsInput = form.find("input[name='" + key + "'], .formio-lookup-" + key);
            var withSticks = brandsInput.attr('data-withSticks');
            var exceptBondstreet = brandsInput.attr('data-exceptBondstreet');
            withSticks = !!withSticks;
            exceptBondstreet = !!exceptBondstreet;
            pmi = pmi || "";
            var field = brandsInput.ubeAutocomplete({
              position: {
                my: "left top",
                at: "left bottom",
                collision: "none"
              },
              classes: {
                "ui-autocomplete": "max-height"
              },
              source: function source(t, e) {
                $__default["default"].ajax({
                  url: api_url + "/lookup/brands",
                  data: {
                    query: t.term,
                    pmi: pmi,
                    families: families,
                    withSticks: withSticks,
                    exceptBondstreet: exceptBondstreet
                  },
                  success: function success(t) {
                    var brands = t.result.map(function (item) {
                      if (item.label.includes('NEXT/DUBLISS')) return _objectSpread2(_objectSpread2({}, item), {}, {
                        label: item.label.replace('NEXT/DUBLISS', 'NEXT')
                      });
                      return item;
                    });
                    e(brands);
                  }
                });
              },
              minLength: 0,
              select: function select(t, e) {
                t.preventDefault(), $__default["default"](this).attr('data-value', e.item.value), form.find(".ube-label-" + key).html(e.item.label), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
              },
              focus: fieldItemFocus,
              change: clearFieldIfNotFromList
            }).each(getBrandLabelForField(key));
            if (focus) {
              field.focus(function () {
                if (field[Object.keys(field)[0]].value.length == 0) {
                  $__default["default"](this).autocomplete("search", "");
                }
              });
            }
          }
          function lookupFamily(key, onValueChange) {
            form.find("input[name='" + key + "'], .formio-lookup-" + key).ubeAutocomplete({
              position: {
                my: "left top",
                at: "left bottom",
                collision: "none"
              },
              classes: {
                "ui-autocomplete": "max-height"
              },
              source: function source(t, e) {
                $__default["default"].ajax({
                  url: api_url + "/lookup/brands/family",
                  data: {
                    query: t.term
                  },
                  success: function success(t) {
                    e(t.result);
                  }
                });
              },
              minLength: 0,
              select: function select(t, e) {
                t.preventDefault(), $__default["default"](this).attr('data-value', e.item.value), form.find(".ube-label-" + key).html(e.item.label), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
                if (onValueChange) onValueChange(e.item.value);
              },
              focus: fieldItemFocus,
              change: clearFieldIfNotFromList
            }).each(getBrandLabelForField(key));
          }
          function lookupSku(key, familySourceField, searchOnClick) {
            var field = form.find("input[name='" + key + "'], .formio-lookup-" + key).ubeAutocomplete({
              position: {
                my: "left top",
                at: "left bottom",
                collision: "none"
              },
              classes: {
                "ui-autocomplete": "max-height"
              },
              source: function source(t, e) {
                $__default["default"].ajax({
                  url: api_url + "/lookup/brands/sku",
                  data: {
                    query: t.term,
                    familyId: familySourceField ? getFieldValue(familySourceField) : undefined
                  },
                  success: function success(t) {
                    e(t.result);
                  }
                });
              },
              minLength: 0,
              select: function select(t, e) {
                t.preventDefault(), $__default["default"](this).attr('data-value', e.item.value), form.find(".ube-label-" + key).html(e.item.label), $__default["default"](this).data('data-object', e.item), $__default["default"](this).val(e.item.label).trigger("blur");
              },
              focus: fieldItemFocus,
              change: clearFieldIfNotFromList
            }).each(getBrandLabelForField(key));
            if (searchOnClick) {
              field.focus(function () {
                $__default["default"](this).autocomplete("search", "");
              });
            }
          }
          if (hasField('cigaretteBrand') && getField('cigaretteBrand').length > 0) {
            lookupFamily('cigaretteBrand', function (value) {
              setFieldValue('cigaretteType', null);
            });
            lookupSku('cigaretteType', 'cigaretteBrand', true);
          } else lookupBrand('cigaretteType');
          if (url && (url.indexOf("pone") > -1 || url.indexOf("bondstreet-mbep-reg") > -1 || url.includes('-bs-'))) lookupBrand('cigaretteTypeExt', true, true, true);else lookupBrand('cigaretteTypeExt');
          container.off("click", ".ube-trigger-event").on("click", ".ube-trigger-event", function (e) {
            e.preventDefault();
            if (isLoading) return false;
            var event = $__default["default"](this).attr("data-ube-event");
            var repeat = $__default["default"](this).attr("data-ube-repeat");
            var cabinetUrl = $__default["default"](this).attr("data-cabinet-url") || "/personal/age-verification";
            var action;
            if (event.includes('close') && isQRForm) {
              if (hasPreferredMethodContainer) {
                action = ubeSession('preferredMethod') === 'telegram' ? 'click - button - change_phone - form - phone_telegram_push' : 'click - button - change_phone - form - phone_sms_code';
              } else {
                action = 'click - button - change_phone';
              }
              gaPush('dl_qr_phone_process', action);
            } else if (name.endsWith('optin')) {
              gaPush(categoryPrefix + "2optin_process", "click - button - back");
            } else if (name.includes('cabinet')) {
              gaPush('dl_lk_profile', 'confirm - ' + event.split('-').slice(-1).join());
            }
            console.log("UBE :: Trigger event " + event);
            var data = initialValues;
            var formData = getFormData();
            if (event == "resendCode" || event == "resendPhoneCode" || event == "resendEmailCode") {
              if (hasPreferredMethodContainer) {
                if (ubeSession('preferredMethod') === 'telegram') {
                  action = remainingAttemptsCount ? "telegram_push - send_again - form - phone_telegram_push - attempts_left: ".concat(remainingAttemptsCount) : 'telegram_push - send_again - form - phone_telegram_push';
                } else {
                  action = remainingAttemptsCount ? "sms_code - send_again - form - phone_sms_code - attempts_left: ".concat(remainingAttemptsCount) : 'sms_code - send_again - form - phone_sms_code';
                }
                gaPush('dl_qr_phone_process', action);
              }
              $__default["default"].ajax({
                url: api_url + "/resendCode",
                headers: {
                  "ube-session-key": sessionKey
                },
                data: {
                  form: name,
                  entity: data.entity || name,
                  submissionId: data.submissionId,
                  profileId: formData.profileId,
                  event: event,
                  repeat: repeat
                },
                success: function success(t) {
                  if (t.message) {
                    showPopup(t.message);
                    if ($__default["default"]('.remaining-attempts-count').length) $__default["default"]('.remaining-attempts-count').text('');
                  } else if (t.error) showPopup(t.error);else {
                    console.error("UBE :: Resend code failed");
                    console.error(t);
                  }
                }
              });
            } else if (event === 'idxCheckAndTransferToAvForm') $__default["default"].ajax({
              url: api_url + "/session/av/idx/personal",
              method: 'post',
              data: {
                sessionKey: sessionKey
              },
              success: function success(t) {
                if (t.message === 'Возраст подтвержден') {
                  showPopup('Возраст подтвержден');
                  toggleLoader(true);
                  location.reload();
                  toggleLoader(false);
                } else location.pathname = cabinetUrl;
              }
            });else if (event.indexOf("social-login-") > -1) {
              $__default["default"](".ube-validation-message-show-for-social-login").hide();
              toggleLoader(true);
              var key = event.substring(13);
              gaPush(categoryPrefix + "auth_social_start", "click - icon: ".concat(key));
              $__default["default"].ajax({
                url: api_url + "/auth/" + name + "/" + key + "/url",
                headers: {
                  "Authorization": "Bearer " + sessionKey
                }
              }).done(function (data) {
                window.location.href = data.authorizationUrl;
              });
            } else if (event.indexOf("social-popup-login-") > -1) {
              var key = event.substring(19);
              gaPush("Social-Login", "Shop-Popup", key);
              ubeOauth(key, sessionKey, name, api_url, function (value, result) {
                if (result && result.socialId) {
                  setFieldValue("socialId", result.socialId);
                  setFieldValue("socialKey", key);
                }
                var entity = data.entity || name;
                handleSocialLoginResult(result, entity);
              });
            } else if (event.indexOf("social-set-") > -1) {
              var key = event.substring(11);
              gaPush("Social-Attach", "Shop-Popup", key);
              var finalUrl = $__default["default"](this).attr("data-ube-url");
              ubeOauth(key, sessionKey, name, api_url, function (value) {
                if (!value) return;
                var field;
                if (key === "vk") {
                  field = "vkontakte";
                  value = "id" + value;
                } else field = key;
                if (key) setFieldValue(field, value);
              }, finalUrl);
            } else if (event.indexOf("optin-cancel-") > -1) {
              var key = event.substring(13);
              if (["email", "phone", "cross", "personal"].indexOf(key) === -1) return console.error("Optin validation only available for phone and email fields, not for " + key);
              setFieldValue(key + "CodeSent", false);
              setFieldValue(key + "ValidatedValue", "");
              setFieldValue(key + "CodeSentAt", null);
              setFieldValue("submitted" + capitalize(key) + "Code", null);
              resetFieldValidation("submitted" + capitalize(key) + "Code");
              handleFormVisibility();
            } else if (event.indexOf("optin-validate-") > -1) {
              var key = event.substring(15);
              if (["email", "phone", "cross", "personal"].indexOf(key) === -1) return console.error("Optin validation only available for phone and email fields, not for " + key);
              resetFieldValidation("submitted" + capitalize(key) + "Code");
              validateComponents(["firstName"], ["optinValidate" + capitalize(key)], function () {
                return validateComponent(key, function () {
                  var requestData = {
                    firstName: formData.firstName,
                    userId: formData.userId
                  };
                  requestData[key] = formData[key];
                  if (key === 'personal') {
                    requestData.profile = formData.profile;
                    requestData.lastName = formData.lastName;
                    requestData.gender = formData.gender;
                  }
                  toggleLoader(true);
                  $__default["default"].ajax({
                    headers: {
                      "ga-id": ubeCookie$1('_ga') || "",
                      "d-id": ubeCookie$1('_d') || ""
                    },
                    url: host + "/esb/" + name + "/validate" + (sessionKey ? "?sessionKey=" + sessionKey : ""),
                    method: "post",
                    data: JSON.stringify(requestData),
                    contentType: 'application/json; charset=UTF-8',
                    success: function success(t) {
                      toggleLoader(false);
                      if (t.sessionKey) sessionKey = t.sessionKey;
                      if (t.result) {
                        if (getFieldValue(key + "ValidatedValue") !== getFieldValue(key)) setFieldValue("submitted" + capitalize(key) + "Code", null);
                        setFieldValue(key + "CodeSent", true);
                        setFieldValue(key + "ValidatedValue", formData[key]);
                        setFieldValue(key + "CodeSentAt", new Date().getTime());
                        var crossKey = "is" + capitalize(key) + "Cross";
                        if (t.sessionData && hasField(crossKey)) setFieldValue(crossKey, t.sessionData[crossKey]);
                        if (t.codeChannel && t.codeChannel === 'sms' && t.message && hasField('codeChannel')) {
                          $__default["default"]('label[for="submittedPhoneCode"]').html('Введите код из SMS сообщения:<span style="color: red;">*</span>');
                          window.toastr && window.toastr.success(t.message);
                        }
                        //TODO Временно убрана мгновенная валидация для тестирования в рамках https://jira.iqos.ru/browse/RRPEPA-566
                        //validateComponent("submitted" + capitalize(key) + "Code");
                        handleFormVisibility();
                        getField(key).trigger("optin-started");
                      } else if (t.error) {
                        showPopup(t.error);
                        setFieldValue(key + "CodeSent", false);
                        setFieldValue(key + "ValidatedValue", "");
                        setFieldValue(key + "CodeSentAt", null);
                        setFieldValue("submitted" + capitalize(key) + "Code", null);
                        handleFormVisibility();
                      } else if (t.fields && t.fields[key] && t.fields[key].result === false && t.fields[key].message) {
                        setFieldValue(key + "CodeSent", false);
                        setFieldValue(key + "ValidatedValue", "");
                        setFieldValue(key + "CodeSentAt", null);
                        setFieldValue("submitted" + capitalize(key) + "Code", null);
                        setFieldInvalid(key, formData[key], t.fields[key].message);
                      }
                    },
                    error: function error(xhr, resp, text) {
                      toggleLoader(false);
                      console.log("UBE :: Form submission ERROR");
                      console.log(xhr, resp, text);
                    }
                  });
                }, function () {});
              });
            } else if (options.onSubmissionSuccess) {
              if (sessionKey) ubeCookie$1('ube_session_key', sessionKey, sessionExpiration());
              options.onSubmissionSuccess(data.submissionId, data.userId, {
                event: event,
                data: {
                  data: data,
                  sessionKey: sessionKey
                }
              });
            }
            e.preventDefault();
          });
          $__default["default"](document).on("mousedown", '.popup-block-age-verification a', function () {
            var event = $__default["default"](this).attr("data-ube-event");
            var cabinetUrl = $__default["default"](this).attr("data-cabinet-url") || "/personal/age-verification";
            if (event === 'idxCheckAndTransferToAvForm') $__default["default"].ajax({
              url: api_url + "/session/av/idx/personal",
              method: 'post',
              data: {
                sessionKey: sessionKey
              },
              success: function success(t) {
                if (t.message === 'Возраст подтвержден') {
                  showPopup('Возраст подтвержден');
                  toggleLoader(true);
                  location.reload();
                  toggleLoader(false);
                } else location.pathname = cabinetUrl;
              }
            });
          });
          form.ubeTraverseEnter();
          if (isWizard) {
            var currentStepIndex = 0;
            var panels = json.components.filter(function (c) {
              return c['type'] == "panel";
            });
            var panelKeys = panels.map(function (c) {
              return c.key;
            });
            var stepCount = panels.length;
            if (isMBEPForm) {
              gaPush('dl_av_idx_registration_start', 'form - idx_reg');
            }
            var changeStep = function changeStep(delta, b, e) {
              var newStepIndex = currentStepIndex + delta;
              if (isMBEPForm && newStepIndex === 1 && currentStepIndex === 0) {
                gaPush('dl_av_idx_registration_process', 'send - form - idx_reg');
                gaPush('dl_av_idx_registration_success', 'form - idx_reg');
                gaPush('dl_auth_registration_start', 'form - registration');
              }
              if (newStepIndex >= stepCount) {
                form.submit();
              } else if (newStepIndex >= 0) {
                var key = panelKeys[currentStepIndex];
                var callbackAfterValidation = function callbackAfterValidation() {
                  if (options.onStepChange) options.onStepChange(newStepIndex, currentStepIndex, b, e);else {
                    var newKey = panelKeys[newStepIndex];
                    toggleVisible(key, false);
                    toggleVisible(newKey, true);
                  }
                  currentStepIndex = newStepIndex;
                };
                if (delta > 0) validateAllFields(callbackAfterValidation, null, appendChildrenKeys(key));else callbackAfterValidation();
              }
            };
            var handleStepClick = function handleStepClick(delta) {
              return function (e) {
                changeStep(delta, $__default["default"](this), e);
                e.preventDefault();
                return false;
              };
            };
            form.find(".ube-wizard-next").click(handleStepClick(1));
            form.find(".ube-wizard-prev").click(handleStepClick(-1));
            container.add(form).on("ubeNext", handleStepClick(1)).on("ubePrev", handleStepClick(-1));
          }
          container.data('ube', {
            appendChildrenKeys: appendChildrenKeys,
            validateAllFields: validateAllFields,
            validateComponent: validateComponent,
            sessionKey: sessionKey
          });

          /**
           * Выключение стандартного browser autocomplete
           */
          container.find("[autocomplete='off'], [autocomplete='false'], [autocomplete='disabled'], [autocomplete='no']").disableBrowserAutocomplete();
          form.trigger("formLoaded");
          if (!captchaBypass) {
            if (container.find(".g-recaptcha").length > 0) {
              initFormCaptcha(container, 'google');
            } else if (captchaType === 'google' && formProperties.grecaptcha && formProperties.grecaptcha.length > 0) {
              form.append('<div class="g-recaptcha" data-sitekey="' + formProperties.grecaptcha + '" data-size="invisible"></div>');
              initFormCaptcha(container, captchaType);
            } else if (captchaType === 'yandex' && formProperties.grecaptcha && formProperties.grecaptcha.length > 0) {
              sessionStorage.setItem('sitekey', formProperties.grecaptcha);
              form.append("<div class=\"yandex-captcha\"></div>");
              initFormCaptcha(container, captchaType);
            } else container.removeAttr("withReCaptcha");
          }
          if (!captchaV3Initialized && location.hostname.match(captchaV3Domains)) {
            initFormCaptchaV3();
            captchaV3Initialized = true;
          }
          if (options.onFormLoad) options.onFormLoad(json === null || json === void 0 ? void 0 : json.properties);
        };
        var template_url = options.template || "";
        if (template_url.length == 0 && (!/retail/.test(name) && /-(idx|reg|optin|av|login|remind|cabinet|phone|phone-send|phone-check)$/.test(name) || container.is(':empty'))) template_url = host + "/template/" + name;
        var isTemplatePreloaded = options.isTemplatePreloaded && !isNoPreload(name);
        if (!isTemplatePreloaded && template_url.length > 0 && !(/(retail)/.test(template_url) && !container.is(':empty'))) container.empty().append(json.template);
        handle_form();
      }
      var updatedUrl = url.replace('/main/', '/form/').replace('/template/', '/form/');
      if (sessionKey && options.loadFormDataFromSession !== false) {
        $__default["default"].when($__default["default"].ajax({
          url: updatedUrl,
          type: "GET"
        }), $__default["default"].ajax({
          url: getSessionUrl,
          type: "GET",
          headers: {
            "Authorization": "Bearer " + sessionKey
          }
        })).then(function (json, sessionData) {
          setVariablesFromSource(sessionData[0]);
          initializeFormByConfig(json[0]);
          if (sessionData && sessionData.error && options.onSessionError) options.onSessionError(sessionData.error, sessionKey);
        });
      } else if (options.formDefinitionJson) initializeFormByConfig(options.formDefinitionJson);else {
        $__default["default"].getJSON(updatedUrl).done(initializeFormByConfig).fail(handleAjaxFail);
      }
      return this;
    };
    function getJsonFromUrl() {
      var query = location.search.substr(1);
      var result = {};
      query.split("&").forEach(function (part) {
        var item = part.split("=");
        result[item[0]] = decodeURIComponent(item[1]);
      });
      return result;
    }

    /**
     * Verifies that redirect url belongs to same domain
     * @param {string} redirectUrl
     * @return {boolean}
     */
    function verifyRedirectSameDomain(redirectUrl) {
      if (!redirectUrl || redirectUrl === "") return true;
      var currentHostname = (window.location.hostname || "") + "";
      if (!currentHostname) return true;
      try {
        var url = new URL(redirectUrl);
        var redirectHostname = (url.hostname || "") + "";
        if (redirectHostname !== currentHostname) {
          console.error("Redirect URL: '" + redirectUrl + "', hostname: '" + url.hostname + "', current hostname: '" + currentHostname + "'");
        }
        return redirectHostname === currentHostname;
      } catch (e) {}
      return true;
    }
    $__default["default"](document).ready(function () {
      function checkUtm() {
        var query = getJsonFromUrl();
        if (query.utm_content) ubeSession("utmContent", query.utm_content);
        if (query.utm_campaign) ubeSession("utmCampaign", query.utm_campaign);
        if (query.utm_source) ubeSession("utmSource", query.utm_source);
        if (query.utm_medium) ubeSession("utmMedium", query.utm_medium);
      }
      function checkCookiePolicy() {
        if (ubeCookie$1(_COOKIE_POLICY)) return;
        ubeHostFallBack();
        var host = encodeURIComponent(window.location.hostname);
        var path = encodeURIComponent(window.location.pathname);
        var rand = "" + new Date().getTime();
        ubeCookie$1(_COOKIE_CHECK, rand);
        if (ubeCookie$1(_COOKIE_CHECK) != rand) return;
        ubeCookie$1(_COOKIE_CHECK, null);
        $__default["default"].get($__default["default"].ube.host + "/api/cookie/popup?host=" + host + "&path=" + path).done(function (result) {
          if (result && result.showCookie && result.template) {
            var popup = $__default["default"](result.template);
            popup.hide().appendTo($__default["default"]("body")).not("script, style").fadeIn(400);
            $__default["default"](".cookie-confirm-button").click(function () {
              ubeCookie$1(_COOKIE_POLICY, "CONFIRMED");
              $__default["default"].get($__default["default"].ube.host + "/api/cookie/track?host=" + host + "&path=" + path);
              setTimeout(function () {
                popup.not("script, style").fadeOut(400);
              }, 1000);
              gaPush("UBE-Cookie", "Agree");
            });
            gaPush("UBE-Cookie", "Show");
          } else {
            /**
             * Disable cookie check for 1 day. Possible cookie will be switched on for domain
             * @type {Date}
             */
            var tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
            ubeCookie$1(_COOKIE_POLICY, "DOMAIN_DISABLED", tomorrow.toUTCString());
          }
        });
      }
      function init() {
        oneTrustInit() || checkCookiePolicy();
        checkUtm();
      }
      window.setTimeout(init, 100);
      ubeHostFallBack();
      initWidgets();
    });

    exports.AV = AV;
    exports.Block = Block;
    exports.Content = Content;
    exports.DteCoupon = DteCoupon;
    exports.EmailOptin = EmailOptin;
    exports.Face = Face;
    exports.FailContent = FailContent;
    exports.IDXReg = IDXReg;
    exports.PhoneCheck = PhoneCheck;
    exports.PhoneSend = PhoneSend;
    exports.Redirect = Redirect;
    exports.Registration = Registration;
    exports.Start = Start;
    exports.Survey = Survey;
    exports.ThankYou = ThankYou;
    exports.create = create;

    Object.defineProperty(exports, '__esModule', { value: true });

    return exports;

})({}, jQuery);
//# sourceMappingURL=ube.js.map
