/**
 * @Date:   2018-04-12T01:25:41+02:00
 * @Last modified time: 2018-04-14T01:12:01+02:00
 */

const debug = require('debug')('sockback');
const debugData = require('debug')('sockback-data');


module.exports = function(socknet) {
  class Sync {
    constructor() {
      this.config = {
        return: true,
        route: '/BackSync',
        args: {},
      };
    }
    on(socket, args, callback) {
      const models = [];

      debug('Sync start');
      debugData('Events', socknet.events);
      debugData('Session', socket.session);

      Object.keys(socknet.events).forEach((key) => {
        const event = socknet.events[key];

        debug(`Sync ${key}`);
        debugData(event);

        if (!event.model) return;
        if (!socket.session && event.config.requireSession) return;
        models.push(event);
      });
      callback(null, models);
    }
  };

  socknet.on(new Sync);
};
