大文件上传API
---

ResumeableFile(resumeableObj, file, uniqueIdentifier)
----
property:
    - resumeableObj resumeable结构体
    - file
    - fileName
    - size 
    - preprocessState = 0 // 0 = unprocessed, 1 = processing, 2 = finished
    - _pause = false // 是否处于暂停状态
    - chunks = []
fn:
    - abort 中断 // Stop current uploads
    - cancel 取消 // Reset this file to be void
    - retry  重试 
    - progress 记录各个chunk的上传进度
    - isUploading 当前是否正在上传
    - isComplete 当前是否上传完成
    - pause 暂停
    - isPaused 是否处于暂停状态
    - upload 不是暂停状态,且chunk的状态是可以上传时执行chunk.send


ResumeableChunk(resumeableObj, fileObj, offset, callback)
----
property:
    - resumeableObj resumeable结构体
    - fileObj 
    - fileObjSize
    - fileObjType 
    - offset 索引
    - callback 
    - preprocessState = 0 // 0 = unprocessed, 1 = processing, 2 = finished
    - xhr

fn:
    - send 发送上传请求, 显示上传进度,发送数据块时分 1) 上传成功状态,继续上传下一块; 2) 重新上传该块
    - abort 中止上传
    - status // Returns: 'pending', 'uploading', 'success', 'error'
    - progress 上传进度

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