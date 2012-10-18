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
        units = units.substr(0, 1)
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
    var weekday = date.getDay(),
        dayDiff = weekday - now.getDay();
    if (dayDiff == 0)       day = 'Today';
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



// Template code

$(document).ready(function() {

    // relative times

    $('.updated_on, .due_date').each(function(i, obj) {
        var issueDate = $(this).text()
        var cellClass = ''
        if ($(this).hasClass('updated_on')) cellClass = 'updated_on'
        if ($(this).hasClass('due_date')) cellClass = 'due_date'

        if (issueDate) {
            $(this).attr('title', issueDate)
            issueDateArray = issueDate.replace(" ", '-').replace(":", '-').split("-")

            var year = issueDateArray[0]
            var month = issueDateArray[1]-1
            var day = issueDateArray[2]
            var minutes = issueDateArray[3] ? issueDateArray[3] : 0
            var seconds = issueDateArray[4] ? issueDateArray[4] : 0

            var date = new Date(year, month, day, minutes, seconds)
            var relativeDate = date.toRelativeTime(new Date, 5000, true)

            $(this).before('<td class="' + cellClass + '-replacement" title="' + issueDate + '">' + relativeDate + '</td>')

        } else {
            $(this).before('<td class="' + cellClass + '-replacement" title=""></td>')
        }
        $(this).hide();
    })

    toggleTableReplacement('table.issues', 'due_date')
    toggleTableReplacement('table.issues', 'updated_on')


    // status
    var statusReplacements = {
      'Nový / New' : 'file',
      'Přiřazený / Assigned' : 'user',
      'Vyřešený / Solved' : 'ok',
      'Feedback' : 'headphones',
      'Čeká se / Waiting' : 'refresh',
      'Odložený / Postponed' : 'fast-forward',
      'Čeká na klienta' : 'eye-open',
      'Uzavřený / Closed' : 'home',
      'Odmítnutý / Rejected' : 'ban-circle'
    }

    $('table.issues td.status').each(function(i, obj) {
      statusName = $(this).text()
      if (statusName.length) {
        $(this).before('<td class="status-replacement" title="'+statusName+'" style="display: none"><i class="bootstrap-icon-'+statusReplacements[statusName]+'"></i></td>')
      }
    })

    toggleTableReplacement('table.issues', 'status')

})

function toggleTableReplacement(tableIdentifier, cellClass) {
    $(tableIdentifier).on("click", 'td.' + cellClass + ', td.' + cellClass + '-replacement', function(event){
      if ($(this).hasClass(cellClass + '-replacement')) {
        $('.' + cellClass + '-replacement').hide();
        $('.' + cellClass).show();
      } else {
        $('.' + cellClass + '-replacement').show();
        $('.' + cellClass).hide();
      }
  })
}
