大文件上传API
---

ChunkAPI
---

function ChunkBySize(file FileBolb, int ChunkSize)  
return [chunkBolb,...]


function ChunkByIndex(file FileBlob, int Start, int End)
return ChunkBlob

ChunkBlob 的结构如下:
{
    size: xxx,
    md5: xxx,
    fname: xxx,
    index: [start, end],
    content: fileBlobContent
}


MutiPartUploadAPI
---

function MutiPartUpload(url, ChunkBlob)
返回index, ETag
return index, Etag

function MutiPartUploadProgress(arr index)


Utils API
---

> 计算MD5,放在RequestHeaders

MD5.js

> 格式化文件大小

function FormatFileSize(int FileSize)
return FormateSize


# TODO

- 使用E-TAG,用来缓存传输

- 复用一个链接

- 在传输过程中出现异常, 导致链接中断后能够从断点处进行上传;(参照Resumable.js后,发现需要更好的数据结构和API的设计;)

## E-TAG

[HTTP_ETAG wiki]:https://zh.wikipedia.org/wiki/HTTP_ETag

[HTTP etag infoq]:http://www.infoq.com/cn/articles/etags

[using-http-cache]:https://harttle.land/2017/04/04/using-http-cache.html