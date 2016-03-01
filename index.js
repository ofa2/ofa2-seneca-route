var _ = require('lodash');

module.exports = function (done) {
  var self = this;
  var routes = self.config.routes;
  var pins = [];

  _.each(self.config.routes, function (action, key) {
    var index = key.indexOf(' ');
    var keyParts = [key.slice(0, index), key.slice(index + 1)];
    var method = (keyParts[0] || '').toLowerCase();
    var pattern = keyParts[1];

    if(!(_.includes(['add', 'wrap'], method))) {
      throw new Error('invalid route method: ' + method);
    }

    var actionParts = action.split('.');
    var controller = self.controllers[actionParts[0]];
    var actionMethodName = actionParts[1];
    var actionMethod = controller[actionMethodName];
    if(!actionMethod) {
      throw new Error('undefined action method:' + action);
    }
    pins.push('{' + pattern + '}');
    self.seneca[method](pattern, actionMethod);
  });

  var senecaConnectionName = (self.config.seneca || {}).connection;
  var senecaConnection = self.config.connections[senecaConnectionName];
  if(senecaConnectionName && !senecaConnection) {
    throw new Error('unknown seneca connection:' + senecaConnectionName);
  }

  if(!senecaConnection.options.pins && !senecaConnection.options.pin) {
    senecaConnection.options.pin = '[' + pins.join(',') + ']';
  }
  self.seneca
    .use(senecaConnection.transport)
    .listen(senecaConnection.options);
  process.nextTick(done);
};
