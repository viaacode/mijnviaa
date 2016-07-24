var fs = require("fs");
var path = require("path");
var moment = require("moment");

var jsend = require('../util/jsend');

var DATE_FORMAT = 'YYYY-MM-DD HH:mm:';

/**
 *
 * @param options {
 *   y: 'items',
 *   reportType: 'last-month',
 *   begin: '',
 *   end: '',
 *   gran: ''
 * };
 */
function generateReports (options) {
  var data = [];

  var begin = moment(options.begin, DATE_FORMAT);
  var end = options.end ? moment(options.end, DATE_FORMAT) : moment();

  var random = getRandomFunction(options);

  for (var m = moment(begin); m.isBefore(end); m.add(1, options.gran)) {
    data.push({
      x: m.valueOf(),
      y: random()
    });
  }

  return data;
}

function getRandomFunction (options) {
  var max = 300;

  switch (options.y) {
    case 'items':
      return function () {
        return Math.floor(Math.random() * max);
      };
    default:
      return function () {
        return Math.random() * max;
      };
  }
}

// helper method
function reportsGenerationOptions (y, type) {
  var options = {
    y: y,
    reportType: type,
    begin: moment(new Date()),
    end: '',
    gran: ''
  };

  switch (options.reportType) {
    case 'last-day':
      options.gran = 'hour';
      options.begin = options.begin.startOf(options.gran).subtract(1, 'day');
      break;

    case 'last-week':
      options.gran = 'day';
      options.begin = options.begin.startOf(options.gran).subtract(1, 'week');
      break;

    case 'last-month':
      options.gran = 'day';
      options.begin = options.begin.startOf(options.gran).subtract(1, 'month');
      break;

    case 'last-year':
      options.gran = 'month';
      options.begin = options.begin.startOf(options.gran).subtract(1, 'year');
      break;

    default:
      throw Error('Trying to generate dummy data - reportType unknown: '+ options.reportType);
  }

  options.begin = options.begin.format(DATE_FORMAT);
  return options;
}

module.exports = function (config) {
  var statsJson = fs.readFileSync(config.paths.server('dummy/stats.json'), "utf8");
  var servicesJson = fs.readFileSync(config.paths.server('dummy//services.json'), "utf8");

  /**
   *
   * @param url
   * @param callback function (error, response, body)
   */
  function request (url, callback) {
    var data = '{}';
    var response = {statusCode: 200};
    var error = null;

    var parts = url.split('?')[0].split('/');

    var i;
    if (url.startsWith(config.endpoints.stats)) {
      console.log('dummy stats');
      console.log(statsJson);
      data = statsJson;
    } else if ((i = parts.indexOf('report')) >= 0) {
      console.log('dummy reports');
      var y = parts[i + 1];
      // report/mam/items?gran=last-day
      var type = url.split('?')[1].split('&')[0].split('=')[1];
      var options = reportsGenerationOptions(y, type);
      data = generateReports(options);
    } else if ((i = parts.indexOf('services')) >= 0) {
      console.log('dummy services');
      var serviceName = parts[i + 1];
      data = JSON.parse(servicesJson)[serviceName];
    } else {
      console.log('dummy data not found');
      return callback(jsend.error('Not found dummy data', 404))
    }

    return callback(error, response, data);
  }

  return {
    services: JSON.parse(servicesJson),
    request: request,
    reportsGeneration: generateReports
  };
};
