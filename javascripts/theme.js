// JavaScript Relative Time Helpers
// The MIT License
// Copyright (c) 2009 James F. Herdman
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


/**
 * Returns a description of this date in relative terms.

 * Examples, where new Date().toString() == "Mon Nov 23 2009 17:36:51 GMT-0500 (EST)":
 *
 * new Date().toRelativeTime()
 * --> 'Just now'
 *
 * new Date("Nov 21, 2009").toRelativeTime()
 * --> '2 days ago'
 *
 * new Date("Nov 25, 2009").toRelativeTime()
 * --> '2 days from now'
 *
 * // One second ago
 * new Date("Nov 23 2009 17:36:50 GMT-0500 (EST)").toRelativeTime()
 * --> '1 second ago'
 *
 * toRelativeTime() takes an optional argument - a configuration object.
 * It can have the following properties:
 * - now - Date object that defines "now" for the purpose of conversion.
 *         By default, current date & time is used (i.e. new Date())
 * - nowThreshold - Threshold in milliseconds which is considered "Just now"
 *                  for times in the past or "Right now" for now or the immediate future
 * - smartDays - If enabled, dates within a week of now will use Today/Yesterday/Tomorrow
 *               or weekdays along with time, e.g. "Thursday at 15:10:34"
 *               rather than "4 days ago" or "Tomorrow at 20:12:01"
 *               instead of "1 day from now"
 *
 * If a single number is given as argument, it is interpreted as nowThreshold:
 *
 * // One second ago, now setting a now_threshold to 5 seconds
 * new Date("Nov 23 2009 17:36:50 GMT-0500 (EST)").toRelativeTime(5000)
 * --> 'Just now'
 *
 * // One second in the future, now setting a now_threshold to 5 seconds
 * new Date("Nov 23 2009 17:36:52 GMT-0500 (EST)").toRelativeTime(5000)
 * --> 'Right now'
 *
 */
 Date.prototype.toRelativeTime = (function() {

  var _ = function(options) {
    var opts = processOptions(options);

    var now = opts.now || new Date();
    var delta = now - this;
    var future = (delta <= 0);
    delta = Math.abs(delta);

    // special cases controlled by options
    if (delta <= opts.nowThreshold) {
      return future ? 'Right now' : 'Just now';
    }
    if (opts.smartDays && delta <= 6 * MS_IN_DAY) {
      return toSmartDays(this, now);
    }

    var units = null;
    for (var key in CONVERSIONS) {
      if (delta < CONVERSIONS[key])
        break;
      units = key; // keeps track of the selected key over the iteration
      if (units == 'hour' || units == 'minute'  || units == 'day') {
        units = units.substr(0, 1);
      } else {
        units = ' ' + units;
      }
      delta = delta / CONVERSIONS[key];
    }

    // pluralize a unit when the difference is greater than 1.
    delta = Math.floor(delta);
    if (delta !== 1 && units.length > 1) { units += "s"; }
    return [delta, units, future ? " left" : " ago"].join("");
  };

  var processOptions = function(arg) {
    if (!arg) arg = 0;
    if (typeof arg === 'string') {
      arg = parseInt(arg, 10);
    }
    if (typeof arg === 'number') {
      if (isNaN(arg)) arg = 0;
      return {nowThreshold: arg};
    }
    return arg;
  };

  var toSmartDays = function(date, now) {
    var day;
    var weekday = date.getDay();
    var dayDiff = weekday - now.getDay();
    if (dayDiff === 0)       day = 'Today';
    else if (dayDiff == -1) day = 'Yesterday';
    else if (dayDiff == 1 && date > now)  day = 'Tomorrow';
    else                    day = WEEKDAYS[weekday];
    return day + " at " + date.toLocaleTimeString();
  };

  var CONVERSIONS = {
    millisecond: 1, // ms    -> ms
    second: 1000,   // ms    -> sec
    minute: 60,     // sec   -> min
    hour:   60,     // min   -> hour
    day:    24,     // hour  -> day
    month:  30,     // day   -> month (roughly)
    year:   12      // month -> year
  };
  var MS_IN_DAY = (CONVERSIONS.millisecond * CONVERSIONS.second * CONVERSIONS.minute * CONVERSIONS.hour * CONVERSIONS.day);

  var WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return _;

})();


/*
 * Wraps up a common pattern used with this plugin whereby you take a String
 * representation of a Date, and want back a date object.
 */
Date.fromString = function(str) {
  return new Date(Date.parse(str));
};







/*!
 * jQuery Cookie Plugin v1.3
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2011, Klaus Hartl
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.opensource.org/licenses/GPL-2.0
 */
(function ($, document, undefined) {

  var pluses = /\+/g;

  function raw(s) {
    return s;
  }

  function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
  }

  var config = $.cookie = function (key, value, options) {

    // write
    if (value !== undefined) {
      options = $.extend({}, config.defaults, options);

      if (value === null) {
        options.expires = -1;
      }

      if (typeof options.expires === 'number') {
        var days = options.expires, t = options.expires = new Date();
        t.setDate(t.getDate() + days);
      }

      value = config.json ? JSON.stringify(value) : String(value);

      return (document.cookie = [
        encodeURIComponent(key), '=', config.raw ? value : encodeURIComponent(value),
        options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
        options.path    ? '; path=' + options.path : '',
        options.domain  ? '; domain=' + options.domain : '',
        options.secure  ? '; secure' : ''
      ].join(''));
    }

    // read
    var decode = config.raw ? raw : decoded;
    var cookies = document.cookie.split('; ');
    for (var i = 0, l = cookies.length; i < l; i++) {
      var parts = cookies[i].split('=');
      if (decode(parts.shift()) === key) {
        var cookie = decode(parts.join('='));
        return config.json ? JSON.parse(cookie) : cookie;
      }
    }

    return null;
  };

  config.defaults = {};

  $.removeCookie = function (key, options) {
    if ($.cookie(key) !== null) {
      $.cookie(key, null, options);
      return true;
    }
    return false;
  };

})(jQuery, document);






















// Template code

$(document).ready(function() {

    //set closing time automatically on baufinder
    if ($('#issue_custom_field_values_24').size() > 0) {
      $('select#issue_status_id').change(function() {
        if ($(this).val() == 17) {
          var date = new Date();
          $('#issue_custom_field_values_24').val(date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate());
        }
      });
    }

    var selector = 'table.issues .due_date';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'VALrelativeTime', createRelativeTime);
    addAlternateCellContent(selector, 'VALverbalDate', createVerbalDate);
    showAlternateCellContent(selector, $.cookie(selector) ? $.cookie(selector) : 'VALrelativeTime');

    selector = 'table.issues .updated_on';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'VALrelativeTime', createRelativeTime);
    showAlternateCellContent(selector, $.cookie(selector) ? $.cookie(selector) : 'VALrelativeTime');

    selector = 'table.issues td.status';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'VALstatusIcon', createStatusIcon);
    if ($.cookie(selector) == 'VALstatusIcon') showAlternateCellContent(selector, 'VALstatusIcon');


    // header links
    $('#header h1').prepend('<a class="go-to-my-issues" href="/issues?assigned_to_id=me&set_filter=1&sort=priority%3Adesc%2Cupdated_on%3Adesc">My issues</a><a class="go-to-projects" href="/projects">Projects</a>');

});












/* working with alternate contents */

function setDefaultCellContentDataAttribute(cells) {
  $(cells).each(function() {
    $(this).data('VALdefaultValue', $(this).text());
    $(this).attr('title', $(this).text());
    $(this).data('currentlyViewed', 'VALdefaultValue');
  });

  $(cells).click(function() {
    toggleAlternateCellContents(cells);
  });
}

function addAlternateCellContent(cells, valueName, procedure) {
  $(cells).each(function() {
    $(this).data(valueName, procedure($(this).text()));
  });
}

function showAlternateCellContent(cells, valueName) {
  $(cells).each(function() {
    $(this).html($(this).data(valueName));
    $(this).data('currentlyViewed', valueName);
  });

  $.cookie(cells, valueName, { expires: 7 });
}

function toggleAlternateCellContents(cells) {
  cell = $(cells).first();

  var data = cell.data();
  var variants = [];
  for (var param in data) {
    if (param.indexOf('VAL') === 0) variants.push(param);
  }

  currentViewPosition = $.inArray(cell.data('currentlyViewed'), variants);
  nextViewPosition = (currentViewPosition < variants.length - 1) ? currentViewPosition + 1 : 0;
  showAlternateCellContent(cells, variants[nextViewPosition]);
}



var statusReplacements = {
  'Nový / New' : ['file'],
  'Přiřazený / Assigned' : ['user'],
  'Vyřešený / Solved' : ['ok'],
  'Feedback' : ['comment'],
  'Čeká se / Waiting' : ['refresh'],
  'Odložený / Postponed' : ['stop'],
  'Čeká na klienta' : ['eye-open'],
  'Uzavřený / Closed' : ['home'],
  'Odmítnutý / Rejected' : ['ban-circle'],
  'Needs explanation' : ['question-sign'],
  'Needs design' : ['picture'],
  'Refused' : ['ban-circle'],
  'Needs estimation' : ['time'],
  'Needs estimation approval' : ['time', 'ok-sign'],
  'Needs implementation' : ['thumbs-up'],
  'Needs code review' : ['th-list'],
  'Needs deployment' : ['upload'],
  'Needs review' : ['eye-open'],
  'Closed' : ['home']
};

function createStatusIcon(value) {
  replacementCell = '';

  for (var i = 0; i < statusReplacements[value].length; i++) {
    replacementCell += '<i class="bootstrap-icon-'+statusReplacements[value][i]+'"></i>';
  }

  return replacementCell;
}


var weekday = new Array(7);
weekday[0] = "Sunday";
weekday[1] = "Monday";
weekday[2] = "Tuesday";
weekday[3] = "Wednesday";
weekday[4] = "Thursday";
weekday[5] = "Friday";
weekday[6] = "Saturday";

function createVerbalDate(value) {
  if (!value) return '';
  else {
      var date = dateFromRedmineString(value);
      var daysCount = daysFromToday(date);
      var textualDueDate = '';

      switch (daysCount) {
        case 0:
          textualDueDate = 'Today';
          break;
        case -1:
          textualDueDate = 'Yesterday';
          break;
        case 1:
          textualDueDate = 'Tommorow';
          break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
          textualDueDate = weekday[date.getDay()];
          break;
        default:
          textualDueDate = date.getDate() + '. ' + (date.getMonth()+1) + '.';
      }

      return textualDueDate;
  }
}

function createRelativeTime(value) {
  if (!value) return '';
  var date = dateFromRedmineString(value);
  return date.toRelativeTime(new Date(), 5000, true);
}

function dateFromRedmineString(issueDate) {
  issueDateArray = issueDate.replace(" ", '-').replace(":", '-').split("-");

  var year = issueDateArray[0];
  var month = issueDateArray[1]-1;
  var day = issueDateArray[2];
  var minutes = issueDateArray[3] ? issueDateArray[3] : 0;
  var seconds = issueDateArray[4] ? issueDateArray[4] : 0;

  return new Date(year, month, day, minutes, seconds);
}


//http://stackoverflow.com/questions/2627473/how-to-calculate-the-number-of-days-between-two-dates-using-javascript
function daysFromToday(date) {

    // The number of milliseconds in one day
    var ONE_DAY = 1000 * 60 * 60 * 24;

    // Convert both dates to milliseconds
    var date1_ms = (new Date()).getTime();
    var date2_ms = date.getTime();

    // Calculate the difference in milliseconds
    var difference_ms = date2_ms - date1_ms;

    // Convert back to days and return
    return Math.round(difference_ms/ONE_DAY) + 1;

}
