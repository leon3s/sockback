'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

exports.default = function (socknet) {

  var methods = ['find', 'upsert', 'create', 'findById', 'deleteById'];

  socknet.app.models().forEach(function (_ref) {
    var modelName = _ref.modelName;

    var model = socknet.models[modelName];
    bindRemoteEvent(socknet, model, modelName);
    methods.forEach(function (method) {
      var requireSession = modelMethodRequireSession(model, method);
      socknet.on(generateMethod(model, modelName, method, requireSession));
    });
  });
};

/**
 * @Author: Leone
 * @Date:   2018-04-12T01:48:32+02:00
 * @Last modified by:   Leone
 * @Last modified time: 2018-04-12T05:53:47+02:00
 */

function generateMethod(model, modelName, method, requireSession) {
  var fn = model[method];
  var config = {
    args: {},
    return: true,
    requireSession: requireSession,
    route: '/' + modelName + '/' + method,
    properties: model.definition.properties
  };

  var switcher = {
    deleteById: function deleteById(args, callback) {
      fn(args.id, callback);
    },
    findById: function findById(args, callback) {
      fn(args.id, callback);
    },
    default: function _default(args, callback) {
      fn(args, callback);
    }
  };

  return {
    config: config,
    name: method,
    model: modelName,
    on: function on(socket, args, callback) {
      var swtFn = switcher[method] || switcher.default;
      try {
        swtFn(args, callback);
      } catch (e) {
        callback(e);
      }
    }
  };
}

function bindRemoteEvent(socknet, model, modelName) {
  model.remoteEvent = function (modelProperty) {
    var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    var event = {
      model: modelName,
      name: modelProperty,
      on: model[modelProperty],
      config: {
        args: config.args || {},
        return: config.return || false,
        route: '/' + modelName + '/' + modelProperty,
        properties: model.definition.properties,
        requireSession: config.requireSession || false
      }
    };
    socknet.on(event);
  };
}

function modelMethodRequireSession(model, method) {
  try {
    model.definition[method].isRequired;
    return true;
  } catch (e) {
    return false;
  }
}