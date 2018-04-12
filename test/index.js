/**
 * @Author: Leone
 * @Date:   2018-04-12T02:19:33+02:00
 * @Last modified by:   Leone
 * @Last modified time: 2018-04-12T03:42:28+02:00
 */

const io = require('socket.io-client');

const socket = io.connect('http://localhost:1337', {
  query: {
    token: '',
    userId: '',
  },
});

socket.on('connect', () => {
  console.log('im connected');
  socket.emit('/BackSync', {}, console.log);
});
