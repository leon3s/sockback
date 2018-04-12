/**
 * @Author: Leone
 * @Date:   2018-04-12T01:48:32+02:00
 * @Last modified by:   Leone
 * @Last modified time: 2018-04-12T05:53:47+02:00
 */

function generateMethod(model, modelName, method, requireSession) {
  const fn = model[method];
  const config = {
    args: {},
    return: true,
    requireSession,
    route: `/${modelName}/${method}`,
    properties: model.definition.properties,
  };

  const switcher = {
    deleteById(args, callback) {
      fn(args.id, callback);
    },
    findById(args, callback) {
      fn(args.id, callback);
    },
    default(args, callback) {
      fn(args, callback);
    },
  };

  return {
    config,
    name: method,
    model: modelName,
    on: (socket, args, callback) => {
      const swtFn = switcher[method] || switcher.default;
      try {
        swtFn(args, callback);
      } catch(e) {
        callback(e);
      }
    },
  };
}

function bindRemoteEvent(socknet, model, modelName) {
  model.remoteEvent = function(modelProperty, config = {}) {
    const event = {
      model: modelName,
      name: modelProperty,
      on: model[modelProperty],
      config: {
        args: config.args || {},
        return: config.return || false,
        route: `/${modelName}/${modelProperty}`,
        properties: model.definition.properties,
        requireSession: config.requireSession || false,
      },
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

export default function(socknet) {

  const methods = [
    'find',
    'upsert',
    'create',
    'findById',
    'deleteById',
  ];

  socknet.app.models().forEach(({ modelName }) => {
    const model = socknet.models[modelName];
    bindRemoteEvent(socknet, model, modelName);
    methods.forEach((method) => {
      const requireSession = modelMethodRequireSession(model, method);
      socknet.on(generateMethod(model, modelName, method, requireSession));
    });
  });
}
