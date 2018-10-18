大文件上传API
---

大文件上传分三个流程:

- 第一阶段: 大文件列表上传(bgf_list), 针对每个item, 先执行分块读取,以计算各块的经过base64转码后计算的md5, 以及最终的md5;

- 第二阶段: 依据 `offset` 先检测该 `bg_file` 是否已经上传过;
            - 若未上传过,执行上传该文件块;
                - 上传成功,修改该`chunk`的上传状态,以及上传进度;
                - 未上传成功,重新执行上传操作;
            - 已经上传过, `offset`偏移后执行以上检测步骤

- 第三阶段: 某个bg_file的所有item的上传状态进行检测和校验,最终显示某个上传任务完成.
    - 当bg_file上传完成向后台发起合并请求,等待后台重组后反馈合并完成(在此期间无法再次执行合并操作,针对查询操作是可以进行的.)


var bgf_list = [file,...];

resumeObj 可复原File对象结构

[{
    file: file,
    fname: file.name,
    size: file.size,
    type: file.type,
    chunk_size: 1 * 1024 * 1024,
    chunk_num: xx,//最终分几块
    all_md5: xxx,
    resume_chunk_obj_list: [
        {
            "chunk_md5": "xxx",
            "upload_status": 0,//0 unprocessed; 1 processing; 2 finished.
            "offset": x
        }
    ...]   
}]

阶段一:

function calc_md5(resumeObj)
    init offset
    resumeObj.resume_chunk_obj_list[offset] = b64_md5
    offset += 1
    resumeObj.all_md5 = md5(resumeObj.chunk_md5.contact)


阶段二:

function is_uploaded_chunk(resumeObj)
    init offset
    GET request
        if not uploaded:
            upload_chunk
                if success:
                    offset += 1
                else:
                    upload_chunk
        else:
            offset += 1
            is_uploaded_chunk
    


