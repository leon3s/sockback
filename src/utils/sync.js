export default function(socknet) {

  class Sync {

    config = {
      return: true,
      route: '/BackSync',
      args: {},
    }

    on(socket, args, callback) {
      const models = [];

      Object.keys(socknet.events).forEach((key) => {
        const event = socknet.events[key];
        if (!event.model) return;
        if (!socket.session && event.config.requireSession) return;
        models.push(event);
      });

      callback(null, models);
    }
  };

  socknet.on(new Sync);
}
