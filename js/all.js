

/* ---- data/1KtzUsnmwc1Wr7KWWEGnWzmBSQoyH917Pz/js/utils/ZeroFrame.coffee ---- */


(function() {
  var ZeroFrame,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    slice = [].slice;

  ZeroFrame = (function() {
    function ZeroFrame(url) {
      this.onCloseWebsocket = bind(this.onCloseWebsocket, this);
      this.onOpenWebsocket = bind(this.onOpenWebsocket, this);
      this.route = bind(this.route, this);
      this.onMessage = bind(this.onMessage, this);
      this.url = url;
      this.waiting_cb = {};
      this.wrapper_nonce = document.location.href.replace(/.*wrapper_nonce=([A-Za-z0-9]+).*/, "$1");
      this.connect();
      this.next_message_id = 1;
      this.init();
    }

    ZeroFrame.prototype.init = function() {
      return this;
    };

    ZeroFrame.prototype.connect = function() {
      this.target = window.parent;
      window.addEventListener("message", this.onMessage, false);
      return this.cmd("innerReady");
    };

    ZeroFrame.prototype.onMessage = function(e) {
      var cmd, message;
      message = e.data;
      cmd = message.cmd;
      if (cmd === "response") {
        if (this.waiting_cb[message.to] != null) {
          return this.waiting_cb[message.to](message.result);
        } else {
          return this.log("Websocket callback not found:", message);
        }
      } else if (cmd === "wrapperReady") {
        return this.cmd("innerReady");
      } else if (cmd === "ping") {
        return this.response(message.id, "pong");
      } else if (cmd === "wrapperOpenedWebsocket") {
        return this.onOpenWebsocket();
      } else if (cmd === "wrapperClosedWebsocket") {
        return this.onCloseWebsocket();
      } else {
        return this.route(cmd, message);
      }
    };

    ZeroFrame.prototype.route = function(cmd, message) {
      return this.log("Unknown command", message);
    };

    ZeroFrame.prototype.response = function(to, result) {
      return this.send({
        "cmd": "response",
        "to": to,
        "result": result
      });
    };

    ZeroFrame.prototype.cmd = function(cmd, params, cb) {
      if (params == null) {
        params = {};
      }
      if (cb == null) {
        cb = null;
      }
      return this.send({
        "cmd": cmd,
        "params": params
      }, cb);
    };

    ZeroFrame.prototype.send = function(message, cb) {
      if (cb == null) {
        cb = null;
      }
      message.wrapper_nonce = this.wrapper_nonce;
      message.id = this.next_message_id;
      this.next_message_id += 1;
      this.target.postMessage(message, "*");
      if (cb) {
        return this.waiting_cb[message.id] = cb;
      }
    };

    ZeroFrame.prototype.log = function() {
      var args;
      args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      return console.log.apply(console, ["[ZeroFrame]"].concat(slice.call(args)));
    };

    ZeroFrame.prototype.onOpenWebsocket = function() {
      return this.log("Websocket open");
    };

    ZeroFrame.prototype.onCloseWebsocket = function() {
      return this.log("Websocket close");
    };

    return ZeroFrame;

  })();

  window.ZeroFrame = ZeroFrame;

}).call(this);



/* ---- data/1KtzUsnmwc1Wr7KWWEGnWzmBSQoyH917Pz/js/ZeroApp.coffee ---- */


(function() {
  var ZeroApp,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ZeroApp = (function(superClass) {
    extend(ZeroApp, superClass);

    function ZeroApp() {
      this.saveData = bind(this.saveData, this);
      this.selectUser = bind(this.selectUser, this);
      return ZeroApp.__super__.constructor.apply(this, arguments);
    }

    ZeroApp.prototype.onOpenWebsocket = function(e) {
      this.cmd("wrapperSetViewport", "width=device-width, initial-scale=1.0");
      return this.cmd("siteInfo", {}, (function(_this) {
        return function(site_info) {
          _this.site_info = site_info;
          if (site_info.cert_user_id) {
            return _this.log("Logged in as " + site_info.cert_user_id);
          } else {
            return _this.log("Not Logged in.");
          }
        };
      })(this));
    };

    ZeroApp.prototype.route = function(cmd, message) {
      if (cmd === "setSiteInfo") {
        this.site_info = message.params;
        if (message.params.cert_user_id) {
          return this.log("Logged in as " + message.params.cert_user_id);
        } else {
          return this.log("Not Logged in.");
        }
      }
    };

    ZeroApp.prototype.selectUser = function() {
      Page.cmd("certSelect", [["zeroid.bit"]]);
      return false;
    };

    ZeroApp.prototype.updateUserQuota = function() {
      if (this.site_info.cert_user_id) {
        return this.cmd("fileRules", "data/users/" + this.site_info.auth_address + "/content.json", (function(_this) {
          return function(rules) {
            return _this.log("Current size: " + rules.current_size + " / Max size: " + rules.max_size);
          };
        })(this));
      }
    };

    ZeroApp.prototype.queryData = function() {
      var query;
      query = "SELECT * FROM zeroapp";
      return this.cmd("dbQuery", [query], (function(_this) {
        return function(data) {
          return _this.log(data);
        };
      })(this));
    };

    ZeroApp.prototype.saveData = function() {
      var inner_path;
      if (!Page.site_info.cert_user_id) {
        Page.cmd("wrapperNotification", ["info", "Please, select your account."]);
        return false;
      }
      inner_path = "data/users/" + this.site_info.auth_address + "/data.json";
      this.cmd("fileGet", {
        "inner_path": inner_path,
        "required": false
      }, (function(_this) {
        return function(data) {
          var json_raw;
          if (data) {
            data = JSON.parse(data);
          } else {
            data = {
              "zeroapp": []
            };
          }
          data.zeroappp.push({
            "body": document.getElementById("message").value,
            "date_added": +(new Date)
          });
          json_raw = unescape(encodeURIComponent(JSON.stringify(data, void 0, '\t')));
          return _this.cmd("fileWrite", [inner_path, btoa(json_raw)], function(res) {
            if (res === "ok") {
              return _this.cmd("sitePublish", {
                "inner_path": inner_path
              }, function(res) {
                return _this.log("Data published");
              });
            } else {
              return _this.cmd("wrapperNotification", ["error", "File write error: " + res]);
            }
          });
        };
      })(this));
      return false;
    };

    return ZeroApp;

  })(ZeroFrame);

  window.Page = new ZeroApp();

}).call(this);
