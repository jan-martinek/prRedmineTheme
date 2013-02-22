// Template code

$(document).ready(function() {
    $userId = getUserId();

    // return closed ticket to its author ans set closing time automatically where possible
    // not really elegant solution with timeout, may fail when ajax request is not fast enough

    $('#all_attributes').on('change','select#issue_status_id',  function() {
      if ($(this).val() == 3) { // Solved
        var author = $('p.author a').first().attr('href').substring(7);
        setTimeout(function() {
          $('select#issue_assigned_to_id').val(author);
          $('select#issue_assigned_to_id').parent().highlight();
        }, 500);
      }

      if ($(this).val() == 17 || $(this).val() == 5) { // Closed (on baufinder) OR Closed anywhere else
        setTimeout(function() {
          if ($('#issue_custom_field_values_24').size() > 0) {
              var date = new Date();
              $('#issue_custom_field_values_24').val(date.yyyymmdd());
              $('#issue_custom_field_values_24').parent().highlight();
          }
        }, 500);
      }
    });

    var selector = 'table.issues .due_date';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'relativeTime', createRelativeTime);
    addAlternateCellContent(selector, 'verbalDate', createVerbalDate);
    showAlternateCellContent(selector, $.cookie(selector) ? $.cookie(selector) : 'relativeTime');

    selector = 'table.issues .updated_on';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'relativeTime', createRelativeTime);
    showAlternateCellContent(selector, $.cookie(selector) ? $.cookie(selector) : 'relativeTime');

    selector = 'table.issues td.status';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'statusIcon', createStatusIcon);
    if ($.cookie(selector) == 'statusIcon') showAlternateCellContent(selector, 'statusIcon');

    selector = 'table.issues .tracker';
    setDefaultCellContentDataAttribute(selector);
    addAlternateCellContent(selector, 'shortIssueType', createShortIssueType);
    showAlternateCellContent(selector, $.cookie(selector) ? $.cookie(selector) : 'shortIssueType');
    $('table.issues th[title="Sort by \"Tracker\""] a').html('Type');


    // zen mode
    $('<div id="enterZenMode" style="float: right"><a href="#">Zen mode</a></div>').insertBefore('#loggedas');
    $('<a id="exitZenMode" href="#">&#9775; Exit zen</a>').appendTo('#main>#content>.contextual');

    // toggle zen mode - cookie intentionally not implemented
    $('body').on('click', '#enterZenMode', function() {
      $('body').addClass('zenMode');
      return false;
    });
    $('body').on('click', '#exitZenMode', function() {
      $('body').removeClass('zenMode');
      return false;
    });


    // toggle sidebar visibility
    if ($('#sidebar').children().length > 0) {
      $('#sidebar').before('<button type="button" class="toggleSidebar">&times;</button>');
    }

    var urlHash = 'everywhere'; //disabled, hides sidebar on all pages - window.location.href.hashCode();
    if ($.cookie('sidebarHidden.' + urlHash)) {
      hideSidebar();
      $.cookie('sidebarHidden.' + urlHash, true, { expires: 5 }); //extend expiration
    }

    $('button.toggleSidebar').click(function () {
      if ($('#sidebar').is(':visible')) {
        hideSidebar();
        $.cookie('sidebarHidden.' + urlHash, true, { expires: 5 });
      } else {
        showSidebar();
        $.removeCookie('sidebarHidden.' + urlHash);
      }
    });

    // header links
    $('#header h1').prepend('<a class="go-to-my-issues" href="/issues?assigned_to_id=me&set_filter=1&sort=priority%3Adesc%2Cupdated_on%3Adesc">My issues</a><a class="go-to-projects" href="/projects">Projects</a>');

    // better functioning update, mainly on mobile
    $('.icon-edit[onclick="showAndScrollTo("update", "notes"); return false;"]').addClass('updateButton').attr('onclick', '');
    $('.updateButton').click(function(e) {
      $('#update').show();
      $('#notes').focus();
      $('html, body').animate({scrollTop: $('#notes').closest('fieldset').offset().top}, 100);

      // leaner update form cookie init
      if ($.cookie('issueAttributesMinimized')) {
        $('.issueAttributes button.minimize').click();
        $.cookie('issueAttributesMinimized', true, { expires: 7, path: '/' }); // renew expiration
      }
      if ($.cookie('timeLoggingMinimized')) {
        $('.timeLogging button.minimize').click();
        $.cookie('timeLoggingMinimized', true, { expires: 7, path: '/' }); // renew expiration
      }
      e.preventDefault();
    });

    //leaner update form - temporary dirty implementation
    var issueAttributes = $('#update fieldset:nth-child(1)').addClass('issueAttributes');
    var timeLogging = $('#update fieldset:nth-child(2)').addClass('timeLogging');
    var issueJournalNotes = $('#update fieldset:nth-child(3)').addClass('issueJournalNotes');

    issueAttributes.prepend('<button class="minimize"><i class="bootstrap-icon-minus"></i></button>');
    $('.issueAttributes button.minimize').click(function() {
      toggleFormFolding('issueAttributes', $(this));
      return false;
    });

    timeLogging.prepend('<button class="minimize"><i class="bootstrap-icon-minus"></i></button>');
    $('.timeLogging button.minimize').click(function() {
      toggleFormFolding('timeLogging', $(this));
      return false;
    });

    // floating update textarea
    if ($(window).width() > 768) {
      var updateForm = $('#update');
      var textareaWrapper = updateForm.find('.issueJournalNotes .jstEditor');
      var textareaTools = updateForm.find('.issueJournalNotes .jstElements');
      var textarea = textareaWrapper.find('textarea');

      textareaWrapper.append('<a href="#" class="collapseTextarea">&#x25BC;</a>');
      var collapseLink = $('.collapseTextarea');

      collapseLink.click(function() {
        if (textarea.height() > 100) {
          collapseLink.css({bottom: '50px'}).html('&#x25B2;');
          textareaTools.hide();
          $('#update.fixedTextarea input[name="commit"]').hide();
          textarea.animate({height: '40px'}, 'fast');
        } else {
          collapseLink.css({bottom: ''}).html('&#x25BC;');
          textareaTools.show();
          $('#update.fixedTextarea input[name="commit"]').css({display: 'inline'});
          textarea.animate({height: '180px'}, 'fast');
        }
        return false;
      });

      $(window).scroll(function() {
        if ($(updateForm).is(':visible')) {
          var range = textareaWrapper.offset().top + textareaWrapper.height();
          var windowBottomScrollTop = $(window).scrollTop() + $(window).height();

          if (!$('.fixedTextarea').length && windowBottomScrollTop < range) {
            textareaWrapper.css({'height': (textarea.height() + 20) + 'px'});
            textarea.css({width: (textarea.width() + 20) +'px', height: (textarea.height() + 20) +'px'});
            collapseLink.css({bottom: ''}).html('&#x25BC;');
            updateForm.addClass('fixedTextarea');
          } else if ($('.fixedTextarea').length && windowBottomScrollTop > range) {
            textareaWrapper.css({height: ''});
            textarea.css({width: '', height: ''});
            textareaTools.show();
            $('#update.fixedTextarea input[name="commit"]').css({display: 'inline'});
            $('.closeTextarea').html('&#x25BC;').css({bottom: ''});
            $('#update.fixedTextarea').removeClass('fixedTextarea');
          }
        }
      });
    }


    // experimental
    var usedLanguage = assessUsedLanguage();
});


function getUserId() {
  var userId = /users\/([0-9]+)$/.exec($('#loggedas a').attr('href')).pop();
  console.log('user id recognized: ' + userId);

  return userId;
}


/* sidebar toggling */
function showSidebar() {
  $('#sidebar').show();
  $('button.toggleSidebar').html('&times;');
  $('#main').removeClass('nosidebar');
}
function hideSidebar() {
  $('#sidebar').hide();
  $('button.toggleSidebar').html('&larr;');
  $('#main').addClass('nosidebar');
}

/* working with alternate contents */
function setDefaultCellContentDataAttribute(cells) {
  $(cells).each(function() {
    $(this).data('VAL' + 'defaultValue', $(this).text());
    $(this).attr('title', $(this).text());
    $(this).data('currentlyViewed', 'defaultValue');
  });

  $(cells).click(function() {
    toggleAlternateCellContents(cells);
  });
}

function addAlternateCellContent(cells, valueName, procedure) {
  $(cells).each(function() {
    $(this).data('VAL' + valueName, procedure($(this).text()));
  });
}

function showAlternateCellContent(cells, valueName) {
  $(cells).each(function() {
    $(this).html($(this).data('VAL' + valueName));
    $(this).data('currentlyViewed', valueName);
  });

  $.cookie(cells, valueName, { expires: 7, path: '/' });
}

function toggleAlternateCellContents(cells) {
  cell = $(cells).first();

  var data = cell.data();
  var variants = [];
  for (var param in data) {
    if (param.indexOf('VAL') === 0) variants.push(param.substring(3));
  }

  currentViewPosition = $.inArray(cell.data('currentlyViewed'), variants);
  nextViewPosition = (currentViewPosition < variants.length - 1) ? currentViewPosition + 1 : 0;
  showAlternateCellContent(cells, variants[nextViewPosition]);
}


function createStatusIcon(value) {
  // table cell alternate content creators
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
          textualDueDate = 'Tomorrow';
          break;
        case 2:
        case 3:
        case 4:
        case 5:
        case 6:
          textualDueDate = weekday[date.getDay()].substring(0,3) + ' ' + date.getDate() + '. ' + (date.getMonth()+1) + '.';
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

function createShortIssueType(value) {
  if (value == 'Požadavek') { return '<span style="opacity:.4">&fnof;</span>'; }
  if (value == 'Feature Request') { return '<span style="opacity:.4">&fnof;</span>'; }
  else { return value; }
}


/* hiding elements in a form - all are embedded in a paragraph */
/*function hideFormElement(id) {
  $(id).closest('p').hide();
}
function hideFormElements(ids) {
  $.each(ids, function(index, value) {
    hideFormElement(value);
  });
}
function showFormElement(id) {
  $(id).closest('p').show();
}
function showFormElements(ids) {
  $.each(ids, function(index, value) {
    showFormElement(value);
  });
}
function toggleFormElements(groupName, ids, button, buttonStates) {
  if ($(ids[0]).closest('p').is(':visible')) {
    hideFormElements(ids);
    button.html(buttonStates[1]);
    $.cookie(groupName + 'Minimized', true, { expires: 7, path: '/' });
  } else {
    showFormElements(ids);
    button.html(buttonStates[0]);
    $.removeCookie(groupName + 'Minimized', { expires: 7, path: '/' });

  }
}*/
function toggleFormFolding(groupName, button, buttonStates) {
  if (!$('#update').hasClass(groupName + 'Minimized')) {
    $('#update').addClass(groupName + 'Minimized');
    button.html('<i class="bootstrap-icon-plus"></i>');
    $.cookie(groupName + 'Minimized', true, { expires: 7, path: '/' });
  } else {
    $('#update').removeClass(groupName + 'Minimized');
    button.html('<i class="bootstrap-icon-minus"></i>');
    $.removeCookie(groupName + 'Minimized', { expires: 7, path: '/' });
  }
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

function assessUsedLanguage() {
  var homeLinkText = $('#top-menu a.home').text();
  if (homeLinkText == 'Úvodní') {
    return 'cs';
  } else return 'en';
}


// http://stackoverflow.com/questions/3066586/get-string-in-yyyymmdd-format-from-js-date-object
Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding
  };

//http://stackoverflow.com/a/7616484
String.prototype.hashCode = function(){
    var hash = 0, i, char;
    if (this.length == 0) return hash;
    for (i = 0; i < this.length; i++) {
        char = this.charCodeAt(i);
        hash = ((hash<<5)-hash)+char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
};

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


//http://stackoverflow.com/questions/848797/yellow-fade-effect-with-jquery/13106698#13106698
jQuery.fn.highlight = function () {
    $(this).each(function () {
        var el = $(this);
        var fadingEl = $("<div/>")
        .width(el.outerWidth())
        .height(el.outerHeight())
        .css({
            "position": "absolute",
            "left": el.offset().left,
            "top": el.offset().top,
            "background-color": "#ffff99",
            "opacity": ".7",
            "z-index": "9999999"
        }).appendTo('body');

        setTimeout(function () {
          fadingEl.fadeOut(1500).queue(function () {
            fadingEl.remove();
          });
        }, 1000);
    });
};

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