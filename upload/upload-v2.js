var files = [];

const HTTP_ERROR_CODE = [400, 401, 403, 404, 409, 415, 500, 501];

var $h = {
    each: function(o, callback){
        if(typeof(o.length)!=='undefined') {
          for (var i=0; i<o.length; i++) {
            // Array or FileList
            if(callback(o[i])===false) return;
          }
        } else {
          for (i in o) {
            // Object
            if(callback(i, o[i])===false) return;
          }
        }
    },
    contains:function(array, test) {
        var result = false;

        $h.each(array, function(value) {
          if (value == test) {
            result = true;
            return false;
          }
          return true;
        });

        return result;
    },
    FormatSize:function(size){
        if(size<1024) {
          return size + ' bytes';
        } else if(size<1024*1024) {
          return (size/1024.0).toFixed(0) + ' KB';
        } else if(size<1024*1024*1024) {
          return (size/1024.0/1024.0).toFixed(1) + ' MB';
        } else {
          return (size/1024.0/1024.0/1024.0).toFixed(1) + ' GB';
        }
    },
    md5: md5,
    FileReaderHandler: FileReaderHandler,
    ConstructUploadForm: ConstructUploadForm
}

function uploadNextChunk() {
   
}

function ResumableChunk(resumableObj, fileObj, offset, callback) {
    var $ = this;
    $.resumableObj = resumableObj;
    $.fileObj = fileObj;
    $.fileObjSize = fileObj.size;
    $.fileObjType = fileObj.type;
    $.offset = offset;
    $.callback = callback;

    var chunkSize = 1 * 1024 * 1024; //1M
    $.startByte = offset * chunkSize;
    $.endByte = Math.min($.fileObjSize, ($.offset + 1) * chunkSize);

    $.xhr = null;

    $.send = function() {
        var func = ($.fileObj.slice ? 'slice' : ($.fileObj.mozSlice ? 'mozSlice' : ($.fileObj.webkitSlice ? 'webkitSlice' : 'slice')));
        var FileBlob = $.fileObj[func]($.startByte, $.endByte);
        $h.FileReaderHandler(FileBlob, function(FileContent) {
            var FileContentMd5 = $h.md5(FileContent);
            var ChunkBlob = $h.ConstructUploadForm(FileBlob, $.fileObj, FileContentMd5, $.startByte, $.endByte); 
            $.xhr = new XMLHttpRequest();

            var doneHandler = function() {
                var status = $.uploadstatus();
                if (status === 'success') {
                    if ($.endByte < $.fileObjSize) {
                        $.callback(status);
                        $.send();
                    }
                } else {
                    // console.log(7777777)
                    $.callback(status);
                    $.send();
                }
            }

            $.xhr.addEventListener('load', doneHandler, false);
            $.xhr.addEventListener('error', doneHandler, false);
            $.xhr.addEventListener('timeout', doneHandler, false);

            $.xhr.open("POST", url, true);
            $.xhr.timeout = 2000;
            $.xhr.send(ChunkBlob);
        });
    }
    $.abort = function() {
        if($.xhr) $.xhr.abort();
        $.xhr = null;
    }
    $.uploadstatus = function() {
        if(!$.xhr) { return('pending'); }
        else if ($.xhr.readyState < 4) {
            return('uploading');
        } else {
            if($.xhr.status === 200 || $.xhr.status === 201) {
                return('success');
            } else if ($h.contains(HTTP_ERROR_CODE, $.xhr.status)) {
                return('error');
            } else {
                // this should never happen, but we'll reset and queue a retry
                // a likely case for this would be 503 service unavailable
                $.abort();
                return('pending');
            }
        }
    }
    $.progress = function() {

    }
    return (this);
}

/**
 *  上传操作
 */
var uploadFileBtn = document.querySelector('#test-file');
var abortBtn = document.querySelector('#abort');

var url = "http://192.168.18.198/upload/uploadbysize";

var ResumableChunkObj = null;

uploadFileBtn.addEventListener('change', function(e) {
    var file = this.files[0];
    ResumableChunkObj = ResumableChunk(ResumableChunkObj, file, 0, function(status) {
        console.log("111111111", status);
    }).send();
});

abortBtn.addEventListener("click", function(){
    ResumableChunkObj.abort();
});
