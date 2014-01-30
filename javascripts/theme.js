var ProofReasonRedmineTheme = {
  init: function() {
    this.BetterHeader.init();
    this.BetterSidebar.init();
    this.BetterUpdateForm.init();
    this.TimeyIntegration.init();
    this.BetterTimeline.init();
    //AutoReturnToOwner.init(); disabled, timeout solution is not reliable
    this.AlternateCellFormats.init();
    this.AbsencesViewer.init();
    this.BetterIssuesContextualMenu.init();
    this.ZenMode.init();
  },

  tools: {
    dateFromRedmineString: function(issueDate) {
      issueDateArray = issueDate.replace(" ", '-').replace(":", '-').split("-");

      var year = issueDateArray[0];
      var month = issueDateArray[1]-1;
      var day = issueDateArray[2];
      var hours = issueDateArray[3] ? issueDateArray[3] : 12;
      var minutes = issueDateArray[4] ? issueDateArray[4] : 0;

      return new Date(year, month, day, hours, minutes);
    },

    cookie: function(key, value, expireInHours) {
      var ls = window.localStorage;

      if (value === undefined) {
        if ((expirationTime = ls.getItem('theme.' + key + '.expire')) !== null) {
          if (new Date() > new Date(expirationTime)) {
            ls.removeItem('theme.' + key + '.expire');
            ls.removeItem('theme.' + key);
            return null;
          }
        }

        return ls.getItem('theme.' + key);

      } else {
        if (expireInHours !== undefined) {
          var expirationTime = new Date().getTime() + expireInHours*3600*1000;
          ls.setItem('theme.' + key + '.expire', new Date(expirationTime));
        }

        return ls.setItem('theme.' + key, value);
      }
    },

    removeCookie: function(key) {
      return window.localStorage.removeItem('theme.' + key);
    },
  },

  debug: function() {
    this.PagePropertyMiner.debug();
  },

  PagePropertyMiner: {
    projectId: null,
    issuedId: null,
    userId: null,
    lang: null,

    matchPage: function (controller, action) {
      var body = $('body');

      if (body.hasClass('controller-' + controller) && body.hasClass('action-' + action)) {
        return true;
      }

      return false;
    },

    getProjectId: function() {
      if (this.projectId === null) {
        if (this.matchPage('issues', 'show')) {
          this.projectId = $('#issue_project_id option[selected="selected"]').val();
        }

        if (this.matchPage('timelog', 'new')) {
          this.projectId = $('#time_entry_project_id').val();
        }

        console.log('project id recognized: ' + this.projectId);
      }
      return this.projectId;
    },

    getIssueId: function() {
      if (this.issueId === null) {

        if (this.matchPage('issues', 'show')) {
          if ($('h2').eq(0).text().match(/^.+\#([0-9]+)/)) {
            this.issueId = /^.+\#([0-9]+)/.exec($('h2').eq(0).text()).pop();
          }
        }

        if (this.matchPage('timelog', 'new')) {
          if ($('input[name="back_url"]').attr('value').match(/^.+issues\/([0-9]+)\/?$/)) {
            this.issueId = /^.+issues\/([0-9]+)\/?$/.exec($('input[name="back_url"]').attr('value')).pop();
          }
        }

        console.log('issue id recognized: ' + this.issueId);
      }

      return this.issueId;
    },

    getUserId: function() {
      if (this.userId === null) {
        this.userId = /users\/([0-9]+)$/.exec($('#loggedas a').attr('href')).pop();

        console.log('user id recognized: ' + this.userId);
      }

      return this.userId;
    },

    assessUsedLanguage: function() {
      if (this.lang === null) {

        if ($('#top-menu a.home').text() == 'Úvodní') {
          this.lang = 'cs';
        } else {
          this.lang = 'en';
        }

        console.log('used language recognized: ' + this.lang);
      }

      return this.lang;
    },

    debug: function() {
      this.getProjectId();
      this.getIssueId();
      this.getUserId();
      this.assessUsedLanguage();
    }

  },

  BetterHeader: {
    init: function() {
      // header links
      $('#header h1').prepend('<a class="go-to-my-issues" href="https://redmine.proofreason.com/issues?query_id=135">My issues</a><a class="go-to-projects" href="/projects">Projects</a>');
      //standard link for my issues: /issues?assigned_to_id=me&set_filter=1&sort=priority%3Adesc%2Cupdated_on%3Adesc
    }
  },

  BetterSidebar: {
    init: function() {
      this.tools = ProofReasonRedmineTheme.tools;

      if ($('#sidebar').children().length > 0) {
        $('#sidebar').before('<button type="button" class="toggleSidebar">&times;</button>');
      }

      if (this.tools.cookie('sidebarHidden')) {
        this.hideSidebar();
        this.tools.cookie('sidebarHidden', true); //extend expiration
      }

      this.setListeners();
    },

    setListeners: function() {
      $('button.toggleSidebar').click(function () {
        ProofReasonRedmineTheme.BetterSidebar.toggleSidebar();
      });
    },

    toggleSidebar: function() {

      if ($('#sidebar').is(':visible')) {
        this.hideSidebar();
      } else {
        this.showSidebar();
      }
    },

    showSidebar: function() {
      $('#sidebar').show();
      $('button.toggleSidebar').html('&times;');
      $('#main').removeClass('nosidebar');
      this.tools.removeCookie('sidebarHidden');
    },

    hideSidebar: function() {
      $('#sidebar').hide();
      $('button.toggleSidebar').html('&larr;');
      $('#main').addClass('nosidebar');
      this.tools.cookie('sidebarHidden', true);
    }
  },

  BetterUpdateForm: {
    init: function() {
      this.tools = ProofReasonRedmineTheme.tools;

      // better functioning update, mainly on mobile
      $('.icon-edit[onclick="showAndScrollTo("update", "notes"); return false;"]').addClass('updateButton').attr('onclick', '');
      $('.updateButton').click(function(e) {
        $('#update').show();
        $('#notes').focus();
        $('html, body').animate({scrollTop: $('#notes').closest('fieldset').offset().top}, 100);

        // leaner update form cookie init

        e.preventDefault();
      });

      //leaner update form - temporary dirty implementation
      var issueAttributes = $('#update fieldset:nth-child(1)').addClass('issueAttributes');
      var timeLogging = $('#update fieldset:nth-child(2)').addClass('timeLogging');
      var issueJournalNotes = $('#update fieldset:nth-child(3)').addClass('issueJournalNotes');

      issueAttributes.prepend('<button class="minimize"><i class="bootstrap-icon-minus"></i></button>');
      $('.issueAttributes button.minimize').click(function() {
        ProofReasonRedmineTheme.BetterUpdateForm.toggleFormFolding('issueAttributes', $(this));
        return false;
      });
      if (this.tools.cookie('issueAttributesMinimized')) {
        $('.issueAttributes button.minimize').click();
        this.tools.cookie('issueAttributesMinimized', true); // renew expiration
      }

      timeLogging.prepend('<button class="minimize"><i class="bootstrap-icon-minus"></i></button>');
      $('.timeLogging button.minimize').click(function() {
        ProofReasonRedmineTheme.BetterUpdateForm.toggleFormFolding('timeLogging', $(this));
        return false;
      });
      if (this.tools.cookie('timeLoggingMinimized')) {
        $('.timeLogging button.minimize').click();
        this.tools.cookie('timeLoggingMinimized', true); // renew expiration
      }

      // floating update textarea
      if ($(window).width() >= 891) {
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
    },

    toggleFormFolding: function (groupName, button, buttonStates) {
      if (!$('#update').hasClass(groupName + 'Minimized')) {
        $('#update').addClass(groupName + 'Minimized');
        button.html('<i class="bootstrap-icon-plus"></i>');
        this.tools.cookie(groupName + 'Minimized', true);
      } else {
        $('#update').removeClass(groupName + 'Minimized');
        button.html('<i class="bootstrap-icon-minus"></i>');
        this.tools.removeCookie(groupName + 'Minimized');
      }
    }
  },

  AutoReturnToOwner: {
    init: function() {
      // return closed ticket to its author ans set closing time automatically where possible
      // not really elegant solution with timeout, may fail when ajax request is not fast enough

      $('#all_attributes').on('change','select#issue_status_id',  function() {
        if ($(this).val() == 3) { // Solved
          var author = $('p.author a').first().attr('href').substring(7);
          setTimeout(function() {
            $('select#issue_assigned_to_id').val(author);
            $('select#issue_assigned_to_id').prev('label').highlight();
          }, 500);
        }

        if ($(this).val() == 17 || $(this).val() == 5) { // Closed (on baufinder) OR Closed anywhere else
          setTimeout(function() {
            if ($('#issue_custom_field_values_24').size() > 0) {
                var date = new Date();
                $('#issue_custom_field_values_24').val(date.yyyymmdd());
                $('#issue_custom_field_values_24').prev('label').highlight();
            }
          }, 500);
        }
      });
    }
  },

  BetterTimeline: {
    init: function() {
      //simplified timeline in issues
      $('#history>.journal').addClass('peekable');
      $('#history .wiki').closest('.journal').removeClass('peekable');
      $('#history h3').append(' <a href="#" class="showStatusChanges">(show all issue status changes)</a>');
      $('.peekable').click(function() {
        $(this).removeClass('peekable');
      });

      $('#history h3 a').click(function() {
        $('#history>.journal').removeClass('peekable');
        $('.showStatusChanges').hide();
        return false;
      });
    }
  },

  TimeyIntegration: {
    init: function() {
      this.ppm = ProofReasonRedmineTheme.PagePropertyMiner;

      $('<div id="enterTimey" style="float: right"><a href="https://timey.proofreason.com" target="_blank">Open Timey</a></div>').insertBefore('#loggedas');

      this.insertTimeySwitch();
    },

    insertTimeySwitch: function() {

      var timeySwitch = '<a class="timeySwitch" href="#">logovat v Timey</a>';

      if (this.ppm.matchPage('timelog', 'new')) {
        $('#new_time_entry').prepend(timeySwitch);
      }

      if (this.ppm.matchPage('issues', 'show')) {
        $('.tabular.timeLogging').prepend(timeySwitch);
      }

      $('.timeySwitch').click(function() {
        ProofReasonRedmineTheme.TimeyIntegration.insertTimeyLogger();
        return false;
      });
    },

    insertTimeyLogger: function() {
      var projectId = this.ppm.getProjectId();
      var issueId = this.ppm.getIssueId();

      var url = 'https://timey.proofreason.com/';
      if (projectId > 0) {
        url = url+'?redmine[project_id]='+projectId;
        if (issueId > 0) url = url+'&redmine[issue_id]='+issueId;
      }
      url = url+'#/logs/new';

      var timeyLogger = '<div><iframe style="border:0; width: 100%; height: 220px" src="'+
      url+
      //'http://timey.eu01.aws.af.cm/?redmine[project_id]='+projectId+'&redmine[issue_id]='+issueId+
      '"></iframe></div>';
      if (this.ppm.matchPage('timelog', 'new')) {
        $('#new_time_entry').after(timeyLogger);
        $('#new_time_entry').hide();
      }
      if (this.ppm.matchPage('issues', 'show')) {
        $('.tabular.timeLogging').append(timeyLogger);
        $('.tabular.timeLogging .splitcontentleft, .tabular.timeLogging .splitcontentright, .tabular.timeLogging p').hide();
      }
    }
  },

  AlternateCellFormats: {
    init: function() {
      this.tools = ProofReasonRedmineTheme.tools;

      this.setFormatUp('table.issues .due_date', {'verbalDate' : this.format.verbalDate});
      this.setFormatUp('table.issues .updated_on', {'relativeTime' : this.format.relativeTime});
      this.setFormatUp('table.issues td.status', {
        'newHighlighted': this.format.newIssuesHighlighted,
        'statusIcon' : this.format.statusIcon
      });
      this.setFormatUp('table.issues .tracker', {'shortIssueType' : this.format.shortIssueType});

      // Short titles
      $('table.issues th[title="Sort by \"Priority\""] a').html('P');
      $('table.issues th[title="Sort by \"Tracker\""] a').html('Type');
      $('table.issues th[title="Sort by \"Estimated time\""] a').html('Estimate');
    },

    setFormatUp: function(cellSelector, alternateFormats, originalFormat) {
      this.prepareCells(cellSelector);
      for (format in alternateFormats) {
        this.addAlternateFormat(cellSelector, format, alternateFormats[format]);

        if (originalFormat == null) {
          originalFormat = format;
        }
      }
      this.showAlternateFormat(cellSelector, this.tools.cookie(cellSelector) ? this.tools.cookie(cellSelector) : originalFormat);
    },

    prepareCells: function(cells) {
      $(cells).each(function() {
        $(this).data('format.' + 'originalFormat', $(this).text());
        $(this).attr('title', $(this).text());
        $(this).data('currentlyDisplayed', 'originalFormat');
      });

      $(cells).click(function() {
        ProofReasonRedmineTheme.AlternateCellFormats.toggleFormats(cells);
      });
    },

    addAlternateFormat: function(cells, format, procedure) {
      $(cells).each(function() {
        $(this).data('format.' + format, procedure($(this).text()));
      });
    },

    showAlternateFormat: function(cells, format) {
      $(cells).each(function() {
        $(this).html($(this).data('format.' + format));
        $(this).data('currentlyDisplayed', format);
      });
    },

    toggleFormats: function(cells) {
      cell = $(cells).first();

      var data = cell.data();
      var variants = [];
      for (var param in data) {
        if (param.indexOf('format.') === 0) variants.push(param.substring(7));
      }

      currentFormat = $.inArray(cell.data('currentlyDisplayed'), variants);
      nextFormat = (currentFormat < variants.length - 1) ? currentFormat + 1 : 0;

      this.tools.cookie(cells, variants[nextFormat]);
      this.showAlternateFormat(cells, variants[nextFormat]);
    },

    format: {
      statusIcon: function(value) {
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
      },

      newIssuesHighlighted: function(value) {
        if (value == 'Nový / New') {
          return '<b style="color: red">' + value + '</b>';
        } else return value;
      },

      verbalDate: function(value) {
        var weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        if (!value) return '';
        else {
            var date = ProofReasonRedmineTheme.tools.dateFromRedmineString(value);
            var daysCount = daysFromToday(date);
            var textualDueDate = '';

            switch (daysCount) {
              case 0:
                textualDueDate = 'Yesterday';
                break;
              case 1:
                textualDueDate = ProofReasonRedmineTheme.AlternateCellFormats.format.relativeTime(value);
                break;
              case 2:
                textualDueDate = 'Tomorrow';
                break;
              case 3:
              case 4:
              case 5:
                textualDueDate = weekday[date.getDay()].substring(0,3) + ' ' + date.getDate() + '. ' + (date.getMonth()+1) + '.';
                break;
              default:
                textualDueDate = date.getDate() + '. ' + (date.getMonth()+1) + '.';
            }

            if (date < new Date()) {
              return '<b style="color: red">' + date.toRelativeTime(new Date(), 5000, true) + '</b>';
            }

            return textualDueDate;
        }
      },

      relativeTime: function(value) {
        if (!value) return '';
        var date = ProofReasonRedmineTheme.tools.dateFromRedmineString(value);
        return date.toRelativeTime(new Date(), 5000, true);
      },

      shortIssueType: function(value) {
        if (value == 'Požadavek') { return '<span style="opacity:.4">&fnof;</span>'; }
        if (value == 'Feature Request') { return '<span style="opacity:.4">&fnof;</span>'; }
        else { return value; }
      }
    }
  },

  ZenMode: {
    init: function() {
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
    }
  },

  AbsencesViewer: {
    absences: null,
    absencesInfoUrl: null,
    htmlOutput: null,

    init: function() {
      this.absencesInfoUrl = window.location.hostname == 'localhost' ?
      'holidays.html' : // test
      '/projects/pm/wiki/Holidays'; // production


      if (ProofReasonRedmineTheme.PagePropertyMiner.matchPage('welcome', 'index')) {
        $('div.projects.box').after('<div id="plannedAbsences"></div>');
      }

      if (ProofReasonRedmineTheme.PagePropertyMiner.matchPage('issues', 'index')) {
        $('#sidebar').append('<div id="plannedAbsences"></div>');
      }

      if ($('#plannedAbsences').length) {
        if (ProofReasonRedmineTheme.tools.cookie('absences')) {
          this.htmlOutput = ProofReasonRedmineTheme.tools.cookie('absences');
          this.putHtmlIntoDocument();
        } else {
          this.loadAbsencesData();
        }

      }
    },

    createHtml: function() {
      var output = '';

      this.absences.forEach(function(month) {
        if (month.people.length) {
          output += '<h4 style="margin: 10px 0 0">' + month.name + '</h4><ul>';

          month.people.forEach(function(person) {
            output += '<li style="margin: 0px 0;"><b>' + person.name + '</b>: ' + person.absences.join('., ').replace('-', '.—') + '.</li>';
          });

          output += '</ul>';
        }
      });

      ProofReasonRedmineTheme.tools.cookie('absences', output, 12);
      this.htmlOutput = output;
    },

    putHtmlIntoDocument: function() {
      $('#plannedAbsences').html('<h3 style="margin-top: 30px">Planned absences (<a href="javascript:ProofReasonRedmineTheme.AbsencesViewer.loadAbsencesData()">refresh</a>)</h3>' +
        this.htmlOutput + '<p><a href="' + this.absencesInfoUrl + '">Zobrazit detaily</a></p>');
    },

    loadAbsencesData: function() {
      this.absences = [];

      $.ajax({
        url: this.absencesInfoUrl,
        success: function(data) {
          AbsencesViewer = ProofReasonRedmineTheme.AbsencesViewer;

          data.split(/\s+<table>\s+/).forEach(function(table, tableNumber) {
            if (tableNumber > 0) {
              var month = {'name' : null, 'people' : []};
              var lastDayOfTheMonth = AbsencesViewer.findLastDayOfTheMonth(table);

              table.split(/\s+<tr>\s+/).forEach(function(row, rowNumber) {
                if (rowNumber == 0) {
                  month.name = row.match(/<strong>([^<]+)</);
                  month.name = month.name[1];
                }
                else if (rowNumber > 3) {
                  var holidays = [];
                  for (i = 1; i <= lastDayOfTheMonth; i++) {
                    if (row.indexOf('>' + i + '.') == -1) {
                      holidays.push(i);
                    }
                  }

                  if (holidays.length) {
                    holidays = getRanges(holidays);
                    var name = row.match(/^<td>([^<]+)</);
                    month.people.push({'name' : name[1], 'absences' : holidays});
                  }
                }
              });
              AbsencesViewer.absences.push(month);
            }
          });
          AbsencesViewer.createHtml();
          AbsencesViewer.putHtmlIntoDocument();
        },
        cache: false
      });
    },

    findLastDayOfTheMonth: function(table) {

      for (dayNumber = 31; dayNumber >= 28; dayNumber--) {
        if (table.indexOf(dayNumber + '.</td') != '-1') {
          return dayNumber;
        }
      }

      console.log('Last day of the month could not be assesed.');
    }
  },

  BetterIssuesContextualMenu: {
    init: function() {
      var menu = document.getElementById('context-menu');
      if (menu) {
        menu.parentNode.removeChild(menu);
        document.body.appendChild(menu);
      }
    }
  }
}

$(document).ready(function() {
  ProofReasonRedmineTheme.init();
});







//    ##       #### ########   ######
//    ##        ##  ##     ## ##    ##
//    ##        ##  ##     ## ##
//    ##        ##  ########   ######
//    ##        ##  ##     ##       ##
//    ##        ##  ##     ## ##    ##
//    ######## #### ########   ######


// http://stackoverflow.com/questions/2270910/how-to-convert-sequence-of-numbers-in-an-array-to-range-of-numbers
function getRanges(array) {
  var ranges = [], rstart, rend;
  for (var i = 0; i < array.length; i++) {
    rstart = array[i];
    rend = rstart;
    while (array[i + 1] - array[i] == 1) {
      rend = array[i + 1]; // increment the index if the numbers sequential
      i++;
    }
    ranges.push(rstart == rend ? rstart+'' : rstart + '-' + rend);
  }
  return ranges;
}


// http://stackoverflow.com/questions/1810984/number-of-days-in-any-month
function getDaysInMonth(m, y) {
   return /8|3|5|10/.test(--m)?30:m==1?(!(y%4)&&y%100)||!(y%400)?29:28:31;
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
