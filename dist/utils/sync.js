'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.default = function (socknet) {
  var Sync = function () {
    function Sync() {
      _classCallCheck(this, Sync);

      this.config = {
        return: true,
        route: '/BackSync',
        args: {}
      };
    }

    _createClass(Sync, [{
      key: 'on',
      value: function on(socket, args, callback) {
        var models = [];

        Object.keys(socknet.events).forEach(function (key) {
          var event = socknet.events[key];
          if (!event.model) return;
          if (!socket.session && event.config.requireSession) return;
          models.push(event);
        });

        callback(null, models);
      }
    }]);

    return Sync;
  }();

  ;

  socknet.on(new Sync());
};

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }