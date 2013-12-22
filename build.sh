#!/bin/bash

tsc --noImplicitAny pdf-image-extractor.ts

cat <(echo '(function() { var PDFJS = {};') \
    pdf.js/src/shared/util.js \
    pdf.js/src/shared/colorspace.js \
    pdf.js/src/shared/pattern.js \
    pdf.js/src/shared/function.js \
    pdf.js/src/shared/annotation.js \
    pdf.js/src/core/network.js \
    pdf.js/src/core/chunked_stream.js \
    pdf.js/src/core/pdf_manager.js \
    pdf.js/src/core/core.js \
    pdf.js/src/core/obj.js \
    pdf.js/src/core/charsets.js \
    pdf.js/src/core/cidmaps.js \
    pdf.js/src/core/crypto.js \
    pdf.js/src/core/evaluator.js \
    pdf.js/src/core/cmap.js \
    pdf.js/src/core/fonts.js \
    pdf.js/src/core/font_renderer.js \
    pdf.js/src/core/glyphlist.js \
    pdf.js/src/core/image.js \
    pdf.js/src/core/metrics.js \
    pdf.js/src/core/parser.js \
    pdf.js/src/core/stream.js \
    pdf.js/src/core/worker.js \
    pdf.js/src/core/jpx.js \
    pdf.js/src/core/jbig2.js \
    pdf.js/src/core/bidi.js \
    pdf.js/external/jpgjs/jpg.js \
    pdf-image-extractor.js \
    <(echo '})();') \
    > dist/pdf-image-extractor.js

uglifyjs < dist/pdf-image-extractor.js > dist/pdf-image-extractor.min.js
