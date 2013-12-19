var worker = new Worker('./main.worker.js');

worker.onmessage = function (event) {
  var data = event.data;
  switch (data.action) {
  case 'open':
    var numPages = data.numPages;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < numPages; ++i) {
      var option = document.createElement("option");
      var text = document.createTextNode(i + 1);
      option.value = String(i + 1);
      option.appendChild(text);
      frag.appendChild(option);
    }
    $('#page-select').html(frag);
    extractImages(1);
    break;
  case 'extract':
    var images = data.images;
    $('#output').empty();
    $('#image-num').html(String(images.length) + ' images');
    for (var i = 0, len = images.length; i < len; ++i) {
      var image = images[i];
      var canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      var context = canvas.getContext("2d");
      var imageData = context.createImageData(image.width, image.height);
      var source = image.data;
      var dest = imageData.data;
      if ('set' in dest) {
        dest.set(source);
      } else {
        for (var j = 0, len = dest.length; j < len; ++j) {
          dest[i] = source[i];
        }
      }
      context.putImageData(imageData, 0, 0);
      $('#output').append(canvas);
    }
    break;
  }
}
//   var image = event.data.image;
//   var diff = event.data.diff;
//   $('#time').html(diff);
//   var canvas = document.createElement('canvas');
//   canvas.width = image.width;
//   canvas.height = image.height;
//   var context = canvas.getContext("2d");
//   var imageData = context.createImageData(image.width, image.height);
//   var source = image.data;
//   var dest = imageData.data;
//   if ('set' in dest) {
//     dest.set(source);
//   } else {
//     for (var i = 0, len = dest.length; i < len; ++i) {
//       dest[i] = source[i];
//     }
//   }
//   context.putImageData(imageData, 0, 0);
//   $('#output').html(canvas);
// };
// worker.onerror = function (error) {
//   showError(error);
// };

function extractImages(pageNum) {
  worker.postMessage({
    action: 'extract',
    pageNum: pageNum
  });
};

function openPdf(file) {
  var url = (window.URL || window.webkitURL).createObjectURL(file);
  worker.postMessage({
    action: 'open',
    url: url
  });
}

$('#page-select').on('change', function (event) {
  var value = Number(event.target.value);
  extractImages(value);
});

$('#file').on('change', function (event) {
  var file = event.target.files[0];
  openPdf(file);
});

$('#drop-zone').on('dragover', function (jqEvent) {
  var event = jqEvent.originalEvent;
  event.stopPropagation();
  event.preventDefault();
  event.dataTransfer.dropEffect = 'copy';
}).on('drop', function (jqEvent) {
  var event = jqEvent.originalEvent;
  event.stopPropagation();
  event.preventDefault();
  var file = event.dataTransfer.files[0];
  openPdf(file);
});
