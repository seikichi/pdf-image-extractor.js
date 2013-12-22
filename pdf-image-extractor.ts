declare class Promise<T> {
  isResolved: boolean;
  isRejected: boolean;
  resolve(value: T): void;
  reject(reason: string): void;
  then<U>(onResolve: (value :T) => Promise<U>,
          onReject?: (reason: any) => U): Promise<U>;
  then<U>(onResolve: (value :T) => U,
          onReject?: (reason: any) => U): Promise<U>;
  then<U>(onResolve: (value :T) => Promise<U>,
          onReject?: (reason: any) => Promise<U>): Promise<U>;
  then<U>(onResolve: (value :T) => U,
          onReject?: (reason: any) => Promise<U>): Promise<U>;
}

declare class JpegImage {
  width: number;
  height: number;
  constructor();
  parse(data: Uint8Array): void;
  copyToImageData(imageData: ImageData): void;
}

declare class LocalPdfManager {
  pdfModel: {
    numPages: number;
    getPage(pageNum: number): any;
  }
  constructor(buffer: ArrayBuffer);
}

class PDFImageExtractor {
  private manager: LocalPdfManager;

  static create(
    data: ArrayBuffer,
    callback: (extractor: PDFImageExtractor) => void): void {
      var extractor = new PDFImageExtractor(data);
      extractor.loadDocument().then(() => {
        callback(extractor);
      });
  }

  constructor(private data: ArrayBuffer) {
    this.manager = new LocalPdfManager(data);
  }

  numPages(): number {
    return this.manager.pdfModel.numPages;
  }

  extract(pageNum: number, callback: (images: ImageData[]) => void): void {
    var images: ImageData[] = [];
    var imagePromises: Promise<ImageData>[] = [];
    this.manager.pdfModel.getPage(pageNum - 1).then((page: any) => {
      var handler = {
        send: (id: string, data: any) => {
          if (id === 'obj') {
            var type = data[2];
            if (type === 'JpegStream') {
              var url = data[3];
              var promise = this.decodeJpegStream(data[3]);
              imagePromises.push(promise);
              promise.then((imageData: ImageData) => {
                images.push(imageData);
              })
            } else if (type === 'Image') {
              images.push(data[3]);
            }
          }
        }
      };
      return page.getOperatorList(handler);
    }).then(() => {
      return (<any>Promise).all(imagePromises);
    }).then(() => {
      callback(images);
    }, () => {
      callback(images);
    });
  }

  decodeJpegStream(url: string): Promise<ImageData> {
    var xhr = new XMLHttpRequest();
    var promise = new Promise<ImageData>();
    xhr.open('GET', url);
    xhr.responseType = 'arraybuffer';
    xhr.onload = () => {
      var image = new JpegImage();
      image.parse(new Uint8Array(xhr.response));
      var imageData = {
        width: image.width,
        height: image.height,
        data: new Uint8Array(image.width * image.height * 4),
      };
      image.copyToImageData(imageData);
      promise.resolve(imageData);
    };
    xhr.onerror = (error: any) => {
      promise.reject(error);
    };
    xhr.send(null);
    return promise;
  }

  loadDocument(): Promise<any> {
    var recoveryMode = false;
    var pdfManager: any = this.manager;
    var loadDocumentPromise = new Promise();
    var parseSuccess = function parseSuccess() {
      var numPagesPromise = pdfManager.ensureModel('numPages');
      var fingerprintPromise = pdfManager.ensureModel('fingerprint');
      var outlinePromise = pdfManager.ensureCatalog('documentOutline');
      var infoPromise = pdfManager.ensureModel('documentInfo');
      var metadataPromise = pdfManager.ensureCatalog('metadata');
      var encryptedPromise = pdfManager.ensureXRef('encrypt');
      var javaScriptPromise = pdfManager.ensureCatalog('javaScript');
      (<any>Promise).all([
        numPagesPromise,
        fingerprintPromise,
        outlinePromise,
        infoPromise,
        metadataPromise,
        encryptedPromise,
        javaScriptPromise]).then((results: any) => {
          var doc = {
            numPages: results[0],
            fingerprint: results[1],
            outline: results[2],
            info: results[3],
            metadata: results[4],
            encrypted: !!results[5],
            javaScript: results[6]
          };
          loadDocumentPromise.resolve(doc);
        }, parseFailure);
    };

    var parseFailure = (e: any) => {
      loadDocumentPromise.reject(e);
    };

    pdfManager.ensureModel('checkHeader', []).then(function() {
      pdfManager.ensureModel('parseStartXRef', []).then(function() {
        pdfManager.ensureModel('parse', [recoveryMode]).then(
          parseSuccess, parseFailure);
      }, parseFailure);
    }, parseFailure);
    return loadDocumentPromise;
  }
}

// export to node, amd, window or worker
declare var process: any;
declare var require: any;
declare var module: any;
declare var self: Window;
declare var define: any;

if (typeof process === 'object' && typeof require === 'function') { // NODE
  module['exports'] = PDFImageExtractor;
} else if (typeof define === "function" && define.amd) { // AMD
  define('pdf-image-extractor', <any>[], () => PDFImageExtractor);
} else if (typeof window === 'object') { // WEB
  window['PDFImageExtractor'] = PDFImageExtractor;
} else if (typeof importScripts === 'function') { // WORKER
  self['PDFImageExtractor'] = PDFImageExtractor;
}
