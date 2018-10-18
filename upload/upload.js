window.BlobBuilder = window.MozBlobBuilder || window.WebKitBlobBuilder || window.BlobBuilder;

var uploadFile = document.querySelector('#test-file');
var progressBar = document.querySelector('#progress');
var sizeBtn = document.querySelector("#size");

var url = "http://192.168.18.198/upload/uploadbysize"

// var uploaders = [];
var blobList = [];

function progressHandler(molecule, denominator) {
    var factor = Math.ceil(molecule / denominator * 100);
    progressBar.innerHTML = factor + "%";
}

function UploadBySize(ajaxType, url, file, offset) {
    var SIZE = file.size;
    var BYTES_PER_CHUNK = 20 * 1024 * 1024;// 1M chunk size
    var Parts = Math.ceil(SIZE/BYTES_PER_CHUNK);
    var start = offset * BYTES_PER_CHUNK;
    var end = Math.min(file.size, (offset + 1) * BYTES_PER_CHUNK);

    var FileBlob = file.slice(start, end);
   
    FileReaderHandler(FileBlob, function (FileContent){
        var xhr = new XMLHttpRequest();
        // [注意note]:https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
        FileContent = FileContent.split(",")[1];

        var FileContentMd5 = md5(FileContent);
        var ChunkBlob = ConstructUploadForm(FileBlob, file, FileContentMd5, offset);

        xhr.open(ajaxType, url, true);
        xhr.timeout = 2000;

        xhr.addEventListener("progress", progressHandler.bind(null, end, SIZE), false);
        //xhr.setRequestHeader("If-None-Match", FileContentMd5);
        // xhr.setRequestHeader("If-Range", '"'+ FileContentMd5 + '"');
        xhr.setRequestHeader("range", "bytes="+ start + "-"+ end);

        if(Parts - 1 === offset){
            xhr.setRequestHeader("X-ng8w-uploaded", true);
            console.log("**** uploaded success! ****");
        }

        xhr.onload = function(e) {
            console.log(e)
        };
    
        xhr.send(ChunkBlob);
    
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 206) {
                    if (end < SIZE) {
                        offset += 1;
                        UploadBySize("POST", url, file, offset);
                    }
                } else {
                    UploadBySize("POST", url, file, offset);
                }
            }
        }
        xhr.onerror = function(e) {
            console.log("xhr error");
            console.log(e)
        };
    });
}

function ConstructUploadForm(blob, file, fmd5, offset) {
    var fd = new FormData();
    fd.append("filecontent", blob);
    fd.append("filemd5", fmd5);
    fd.append("rawmd5", file.name);
    fd.append("filename", file.name);
    fd.append("filesize", file.size);
    fd.append("chunksize", 1 * 1024 * 1024);
    fd.append("Index", offset);
    return fd;
}

uploadFile.addEventListener('change', function(e) {
    var file = this.files[0];
    var BYTES_PER_CHUNK = 1 * 1024 * 1024;// 1M chunk size
    var offset = 0;
    var start = offset * BYTES_PER_CHUNK;
    var end = Math.min(file.size, (offset + 1) * BYTES_PER_CHUNK);
    UploadBySize("POST", url, file, offset);
});




/*
> Refrence
[querySelector mdn]: https://developer.mozilla.org/zh-CN/docs/Web/API/Document/querySelector
[standard-method-for-http-partial-upload-resume-upload]: https://stackoverflow.com/questions/20969331/standard-method-for-http-partial-upload-resume-upload
[resumable-upload]: https://tus.io/protocols/resumable-upload.html
[Headers MDN]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers
[why-got-options-request-via-xhr]: http://levy.work/2016-09-01-why-got-options-request-via-ajax/
[Access_control_CORS]: https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Access_control_CORS
[CORS_preflight]: https://www.cnblogs.com/wonyun/p/CORS_preflight.html

[sending forms through javascript]:https://developer.mozilla.org/zh-CN/docs/Learn/HTML/Forms/Sending_forms_through_JavaScript
[what-is-http-multipart-request]:https://stackoverflow.com/questions/16958448/what-is-http-multipart-request
[javascript-filereader-parsing-long-file-in-chunks]: https://stackoverflow.com/questions/14438187/javascript-filereader-parsing-long-file-in-chunks
[tiny_uploader.js]:https://gist.github.com/alediaferia/cfb3a7503039f9278381
[example-of-multipart-form-data]: https://stackoverflow.com/questions/4238809/example-of-multipart-form-data
[filereader-readasbinarystring-to-upload-files]: https://stackoverflow.com/questions/7431365/filereader-readasbinarystring-to-upload-files
[promise]: http://liubin.org/promises-book/
[javascript-promises-with-filereader]: https://stackoverflow.com/questions/34495796/javascript-promises-with-filereader
[how-to-convert-callback-to-promise]: https://75team.com/post/how-to-convert-callback-to-promise.html

[Javascript异步编程的4种方法]: http://www.ruanyifeng.com/blog/2012/12/asynchronous%EF%BC%BFjavascript.html

[FileReader leads to excessive memory usage and browser crashes]:https://github.com/216software/ajax-put-rackspace/issues/2

[用XHR2实现大文件的切割上传（分块上传）]:http://blog.sina.com.cn/s/blog_77de8b110101faqp.html

[how-to-find-out-if-xmlhttprequest-send-worked]:https://stackoverflow.com/questions/10876123/how-to-find-out-if-xmlhttprequest-send-worked

TODO:
[jQuery-File-Upload Refrence]: https://github.com/blueimp/jQuery-File-Upload/commits/master?after=39607fdaaba0dc11ba8c116ac2968e28e796f153+1050

[flask cros]: http://flask.pocoo.org/snippets/56/
[修改 Flask 的默认响应头实现跨域(CORS)支持]: https://blog.zengrong.net/post/2615.html
[log-iptables-events-on-centos-7]: https://unix.stackexchange.com/questions/423778/log-iptables-events-on-centos-7
[xhr 详解]: https://segmentfault.com/a/1190000004322487

长连接
[persistent connection]:https://my.oschina.net/lifany/blog/874399
[what-exactly-does-a-persistent-connection-mean]:https://stackoverflow.com/questions/1480329/what-exactly-does-a-persistent-connection-mean
[HTTP长连接和短连接]:https://www.cnblogs.com/0201zcr/p/4694945.html

[Comet：基于 HTTP 长连接的“服务器推”技术]:https://www.ibm.com/developerworks/cn/web/wa-lo-comet/index.html
[http2和连接复用]:https://imququ.com/post/http2-and-wpo-2.html
[HTTP/2是若何做到多路复用的]: http://www.blogjava.net/yongboy/archive/2015/03/19/423611.aspx
[http2-spec]:https://github.com/http2/http2-spec/wiki/Implementations
[HTTP2简介和基于HTTP2的Web优化]:https://github.com/creeperyang/blog/issues/23
[http2 github]: https://http2.github.io/faq/
[frontend & http2 multiplexing]: https://aotu.io/notes/2016/03/17/http2-char/index.html
[nginx http2 white paper]: https://www.nginx.com/wp-content/uploads/2015/09/NGINX_HTTP2_White_Paper_v4.pdf
[美团点评移动网络优化实践]: https://tech.meituan.com/Shark_SDK.html

HTTP2测试方法
[http2测试方法]:https://www.jianshu.com/p/0c4ac947c34b
[how-to-serve-http-2-using-python]:https://medium.com/python-pandemonium/how-to-serve-http-2-using-python-5e5bbd1e7ff1
[migrate_to_https_and_http2]:https://www.freemindworld.com/blog/2016/160301_migrate_to_https_and_http2.shtml

ETAG
[cache-introduction]:https://blog.techbridge.cc/2017/06/17/cache-introduction/
[discussion-on-web-caching]:http://www.alloyteam.com/2016/03/discussion-on-web-caching/
[how-to-check-if-jquery-ajax-request-header-status-is-304-not-modified]:https://stackoverflow.com/questions/5173656/how-to-check-if-jquery-ajax-request-header-status-is-304-not-modified

上传时的编码问题
[deal-with-http-header-encoding-for-file-download]:https://blog.robotshell.org/2012/deal-with-http-header-encoding-for-file-download/comment-page-1/
[下载时中文乱码问题]:https://gist.github.com/xcaspar/b600629ec7d75e500e0d
[深入分析 web 请求响应中的编码问题]:https://www.ibm.com/developerworks/cn/web/wa-lo-ecoding-response-problem/index.html

上传策略-single request or mutipart chunk request
[sending-file-in-single-request-or-in-several-chunks]:https://www.aurigma.com/docs/iuf/sending-file-in-single-request-or-in-several-chunks.htm#filePerRequest
[aws s3 上传机制]:https://aws.amazon.com/cn/blogs/china/s3-multipul-upload-practice/
[amazon-s3-depth-of-practice-series-s3-cli-depth-parsing-and-performance-testing]:https://aws.amazon.com/cn/blogs/china/amazon-s3-depth-of-practice-series-s3-cli-depth-parsing-and-performance-testing/

[calc big file md5]:https://stackoverflow.com/questions/39112096/calcuate-md5-hash-of-a-large-file-using-javascript
RPC
[grpc]:https://grpc.io/

[io多路复用]:https://juejin.im/post/59f9c6d66fb9a0450e75713f


scope
[why-is-my-variable-unaltered-after-i-modify-it-inside-of-a-function-asynchron]:https://stackoverflow.com/questions/23667086/why-is-my-variable-unaltered-after-i-modify-it-inside-of-a-function-asynchron
*/ 