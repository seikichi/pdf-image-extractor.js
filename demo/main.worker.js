importScripts('../dist/pdf-xobject-image-extractor.min.js');

var extractor = null;

self.onmessage = function (event) {
  var data = event.data;
  switch (data.action) {
  case 'open':
    var xhr = new XMLHttpRequest();
    xhr.open('GET', data.url, false);
    xhr.responseType = 'arraybuffer';
    xhr.send();

    var buffer = xhr.response;
    PDFXObjectImageExtractor.create(buffer, function (_extractor) {
      extractor = _extractor;
      var numPages = extractor.numPages();
      self.postMessage({action: 'open', numPages: numPages});
    });
    break;
  case 'extract':
    var pageNum = data.pageNum;
    extractor.extract(pageNum, function (images) {
      var buffers = [];
      for (var i = 0, len = images.length; i < len; ++i) {
        buffers.push(images[i].data.buffer);
      }
      self.postMessage({ action: 'extract', images: images }, buffers);
    });
    break;
  }
};
