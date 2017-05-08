/* Copyright 2016 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/* globals chrome */

'use strict';
var FILE_URL = 'https://localhost:3000/files'
var PDF_URL = 'https://localhost:3000/pdf'
var DEFAULT_URL = 'compressed.tracemonkey-pldi-09.pdf';
document.addEventListener('contextmenu', event => event.preventDefault());

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
  (function rewriteUrlClosure() {
    // Run this code outside DOMContentLoaded to make sure that the URL
    // is rewritten as soon as possible.
    var queryString = document.location.search.slice(1);
    var m = /(^|&)file=([^&]*)/.exec(queryString);
    DEFAULT_URL = m ? decodeURIComponent(m[2]) : '';

    // Example: chrome-extension://.../http://example.com/file.pdf
    var humanReadableUrl = '/' + DEFAULT_URL + location.hash;
    history.replaceState(history.state, '', humanReadableUrl);
    if (top === window) {
      chrome.runtime.sendMessage('showPageAction');
    }
  })();
}

var pdfjsWebApp;
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('PRODUCTION')) {
  pdfjsWebApp = require('./app.js');
}

if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('FIREFOX || MOZCENTRAL')) {
  // FIXME the l10n.js file in the Firefox extension needs global FirefoxCom.
  window.FirefoxCom = require('./firefoxcom.js').FirefoxCom;
  require('./firefox_print_service.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME')) {
  require('./chromecom.js');
}
if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('CHROME || GENERIC')) {
  require('./pdf_print_service.js');
}

function getViewerConfiguration(filename) {
  var path = "../uploads/" + filename + ".pdf"
  if (filename === "") {
    path = ''
  }
  return {
    appContainer: document.body,
    mainContainer: document.getElementById('viewerContainer'),
    viewerContainer: document.getElementById('viewer'),
    eventBus: null, // using global event bus with DOM events
    toolbar: {
      container: document.getElementById('toolbarViewer'),
      numPages: document.getElementById('numPages'),
      pageNumber: document.getElementById('pageNumber'),
      scaleSelectContainer: document.getElementById('scaleSelectContainer'),
      scaleSelect: document.getElementById('scaleSelect'),
      customScaleOption: document.getElementById('customScaleOption'),
      previous: document.getElementById('previous'),
      next: document.getElementById('next'),
      zoomIn: document.getElementById('zoomIn'),
      zoomOut: document.getElementById('zoomOut'),
      viewFind: document.getElementById('viewFind'),
      //openFile: document.getElementById('openFile'),
      print: document.getElementById('print'),
      presentationModeButton: document.getElementById('presentationMode'),
      download: document.getElementById('download'),
      viewBookmark: document.getElementById('viewBookmark'),
    },
    secondaryToolbar: {
      toolbar: document.getElementById('secondaryToolbar'),
      toggleButton: document.getElementById('secondaryToolbarToggle'),
      toolbarButtonContainer: document.getElementById('secondaryToolbarButtonContainer'),
      presentationModeButton: document.getElementById('secondaryPresentationMode'),
      //openFileButton: document.getElementById('secondaryOpenFile'),
      printButton: document.getElementById('secondaryPrint'),
      downloadButton: document.getElementById('secondaryDownload'),
      viewBookmarkButton: document.getElementById('secondaryViewBookmark'),
      firstPageButton: document.getElementById('firstPage'),
      lastPageButton: document.getElementById('lastPage'),
      pageRotateCwButton: document.getElementById('pageRotateCw'),
      pageRotateCcwButton: document.getElementById('pageRotateCcw'),
      toggleHandToolButton: document.getElementById('toggleHandTool'),
      documentPropertiesButton: document.getElementById('documentProperties'),
    },
    fullscreen: {
      contextFirstPage: document.getElementById('contextFirstPage'),
      contextLastPage: document.getElementById('contextLastPage'),
      contextPageRotateCw: document.getElementById('contextPageRotateCw'),
      contextPageRotateCcw: document.getElementById('contextPageRotateCcw'),
    },
    sidebar: {
      // Divs (and sidebar button)
      mainContainer: document.getElementById('mainContainer'),
      outerContainer: document.getElementById('outerContainer'),
      toggleButton: document.getElementById('sidebarToggle'),
      // Buttons
      thumbnailButton: document.getElementById('viewThumbnail'),
      outlineButton: document.getElementById('viewOutline'),
      attachmentsButton: document.getElementById('viewAttachments'),
      // Views
      thumbnailView: document.getElementById('thumbnailView'),
      outlineView: document.getElementById('outlineView'),
      attachmentsView: document.getElementById('attachmentsView'),
    },
    findBar: {
      bar: document.getElementById('findbar'),
      toggleButton: document.getElementById('viewFind'),
      findField: document.getElementById('findInput'),
      highlightAllCheckbox: document.getElementById('findHighlightAll'),
      caseSensitiveCheckbox: document.getElementById('findMatchCase'),
      findMsg: document.getElementById('findMsg'),
      findResultsCount: document.getElementById('findResultsCount'),
      findStatusIcon: document.getElementById('findStatusIcon'),
      findPreviousButton: document.getElementById('findPrevious'),
      findNextButton: document.getElementById('findNext')
    },
    passwordOverlay: {
      overlayName: 'passwordOverlay',
      container: document.getElementById('passwordOverlay'),
      label: document.getElementById('passwordText'),
      input: document.getElementById('password'),
      submitButton: document.getElementById('passwordSubmit'),
      cancelButton: document.getElementById('passwordCancel')
    },
    documentProperties: {
      overlayName: 'documentPropertiesOverlay',
      container: document.getElementById('documentPropertiesOverlay'),
      closeButton: document.getElementById('documentPropertiesClose'),
      fields: {
        'fileName': document.getElementById('fileNameField'),
        'fileSize': document.getElementById('fileSizeField'),
        'title': document.getElementById('titleField'),
        'author': document.getElementById('authorField'),
        'subject': document.getElementById('subjectField'),
        'keywords': document.getElementById('keywordsField'),
        'creationDate': document.getElementById('creationDateField'),
        'modificationDate': document.getElementById('modificationDateField'),
        'creator': document.getElementById('creatorField'),
        'producer': document.getElementById('producerField'),
        'version': document.getElementById('versionField'),
        'pageCount': document.getElementById('pageCountField')
      }
    },
    errorWrapper: {
      container: document.getElementById('errorWrapper'),
      errorMessage: document.getElementById('errorMessage'),
      closeButton: document.getElementById('errorClose'),
      errorMoreInfo: document.getElementById('errorMoreInfo'),
      moreInfoButton: document.getElementById('errorShowMore'),
      lessInfoButton: document.getElementById('errorShowLess'),
    },
    printContainer: document.getElementById('printContainer'),
    openFileInputName: 'fileInput',
    debuggerScriptPath: './debugger.js',
    defaultUrl: path
  };
}

function webViewerLoad() {
  console.log("webViewerLoad");

  callAjax(FILE_URL, function(res) {
    var fileList = document.getElementById("fileList");
    var fileNames = res.split(';');

    fileNames.forEach(file => {
      var link = document.createElement("a");
      link.className = 'mdl-navigation__link'
      link.text = file;
      link.onclick = function() {
        console.log("clicked");
        var config = getViewerConfiguration(link.text);
        console.log("attempting to open " + link.text + ".pdf");
        if (typeof PDFJSDev === 'undefined' || !PDFJSDev.test('PRODUCTION')) {
          Promise.all([SystemJS.import('pdfjs-web/app'),
              SystemJS.import('pdfjs-web/pdf_print_service')
            ])
            .then(function(modules) {
              var app = modules[0];
              window.PDFViewerApplication = app.PDFViewerApplication;
              app.PDFViewerApplication.run(config);
            });
        } else {
          window.PDFViewerApplication = pdfjsWebApp.PDFViewerApplication;
          pdfjsWebApp.PDFViewerApplication.run(config);
        }

        // PDFJS.getDocument('/uploads/white-clay-map.pdf').then(function(pdfFile) {
        //   var pageNumber = 1;
        //   pdfFile.getPage(pageNumber).then(function(page) {
        //     var scale = 1;
        //     var viewport = page.getViewport(scale);
        //     var canvas = document.getElementById('page1');
        //     var context = canvas.getContext('2d');
        //
        //     var renderContext = {
        //       canvasContext: context,
        //       viewport: viewport
        //     };
        //
        //     page.render(renderContext);
        //   });




        // var http = new XMLHttpRequest();
        // var params = JSON.stringify({
        //   'file': link.text
        // });
        // http.open("POST", PDF_URL, true);
        //
        // http.setRequestHeader("Content-type", "application/json; charset=utf-8");
        // http.setRequestHeader("Content-length", params.length);
        // http.setRequestHeader("Connection", "close");
        //
        // http.onreadystatechange = function() {
        //   if (http.readyState == 4 && http.status == 200) {
        //     // ROB - this is where you hook into pdf.js and tell it to view
        //     console.log(http.responseText);
        //   }
        // }
        // http.send(params);
      }
      fileList.appendChild(link);
    })
  })

  var config = getViewerConfiguration("");
  if (typeof PDFJSDev === 'undefined' || !PDFJSDev.test('PRODUCTION')) {
    Promise.all([SystemJS.import('pdfjs-web/app'),
        SystemJS.import('pdfjs-web/pdf_print_service')
      ])
      .then(function(modules) {
        var app = modules[0];
        window.PDFViewerApplication = app.PDFViewerApplication;
        app.PDFViewerApplication.run(config);
      });
  } else {
    window.PDFViewerApplication = pdfjsWebApp.PDFViewerApplication;
    pdfjsWebApp.PDFViewerApplication.run(config);
  }


}

if (document.readyState === 'interactive' ||
  document.readyState === 'complete') {
  webViewerLoad();
} else {
  document.addEventListener('DOMContentLoaded', webViewerLoad, true);
}

// UI mods
// Disable right-click context menu for PDF Viewer
document.addEventListener('contextmenu', event => event.preventDefault());

// // Disable Ctrl + P Printing
// if ('matchMedia' in window) {
//     // Chrome, Firefox, and IE 10 support mediaMatch listeners
//     window.matchMedia('print').addListener(function(media) {
//         if (media.matches) {
//             beforePrint();
//         } else {
//             // Fires immediately, so wait for the first mouse movement
//             $(document).one('mouseover', afterPrint);
//         }
//     });
// } else {
//     // IE and Firefox fire before/after events
//     $(window).on('beforeprint', beforePrint);
//     $(window).on('afterprint', afterPrint);
// }
// function beforePrint() {
//     $(".textLayer").hide();
//     $(".PrintMessage").show();
// }
// function afterPrint() {
//     $(".PrintMessage").hide();
//     $(".textLayer").show();
// }

function callAjax(url, callback) {
  var xmlhttp;
  // compatible with IE7+, Firefox, Chrome, Opera, Safari
  xmlhttp = new XMLHttpRequest();
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      callback(xmlhttp.responseText);
    }
  }
  xmlhttp.open("GET", url, true);
  xmlhttp.send();
}
