var up_btn = document.querySelector('#test-file');
var progressbar = document.querySelector('#progress');
var size_btn = document.querySelector("#size");

var resume_obj_list = [];

up_btn.addEventListener('change', function(e) {
    var file_list = this.files;
    for (var i = 0; i < file_list.length; i++ ) {
        var file = file_list[i];
        var resume_obj = {};
        resume_obj["file"] = file;
        resume_obj["fname"] = file.name;
        resume_obj["size"] = file.size;
        resume_obj["chunk_size"] = 50 * 1024 * 1024;
        resume_obj["offset"] = 0;
        resume_obj["md5_offset"] = 0;
        resume_obj["spark_md5"] = new SparkMD5.ArrayBuffer();
        // resume_obj["xhr"] = new XMLHttpRequest();

        resume_obj["chunk_num"] = Math.ceil(resume_obj["size"] / resume_obj["chunk_size"]);
        resume_obj["resume_chunk_obj_list"] = [];

        // calc_md5(resume_obj, function(resp){
        //     console.log("success calc spark md5", resp)
        // })
        process_upload_task(resume_obj);
    }
});

/**
 *  utils
 */

function freader_handler(file_blob, callback) {
    var reader = new FileReader();
    reader.onloadend = function (e) {
        if (e.target.readyState == FileReader.DONE) {
            // var uInt8Arr = new Uint8Array(e.target.result);
            var result = e.target.result;
            callback && callback(result);
        }
    }

    reader.readAsArrayBuffer(file_blob);
    // reader.readAsDataURL(file_blob);
}

function progress_handler(molecule, denominator) {
    var factor = Math.ceil(molecule / denominator * 100);
    progressbar.innerHTML = factor + "%";
}

function xhr_helper(xhr_obj, callback) {
    xhr_obj.timeout = 30000;
    // xhr_obj.onload = function(e) {
    //     callback && callback(e);
    // }
    xhr_obj.onreadystatechange = function(e) {
        if (e.target.readyState === 4) {
            if (e.target.status === 200 || e.target.status === 206) {
                callback && callback(e);
            }
        }
    }
    xhr_obj.onerror = function(e) {
        console.log("error", e);
    }
}

function format_params(params){
    return "?" + Object
          .keys(params)
          .map(function(key){
            return key+"="+encodeURIComponent(params[key])
          })
          .join("&")
}


/**
 * 提前计算出各块的md5在合适的offset取出
 */
function calc_md5(resume_obj_task, callback) {
    var md5_offset = resume_obj_task.md5_offset;
    var start = md5_offset * resume_obj_task.chunk_size;
    var end = Math.min(resume_obj_task.size, (md5_offset + 1) * resume_obj_task.chunk_size);

    var file_blob = resume_obj_task.file.slice(start, end);
    console.time("calc md5 used")

    freader_handler(file_blob, function(file_content) {
        resume_obj_task["resume_chunk_obj_list"][md5_offset] = [];
        resume_obj_task["resume_chunk_obj_list"][md5_offset]["chunk_md5"] = SparkMD5.ArrayBuffer.hash(file_content);
        resume_obj_task["resume_chunk_obj_list"][offset]["upload_status"] = 0;
        
        resume_obj_task.md5_offset += 1;
        if (resume_obj_task.md5_offset < resume_obj_task.chunk_num) {
            calc_md5(resume_obj_task)
        } else if (resume_obj_task.md5_offset == resume_obj_task.chunk_num) {
            console.timeEnd("calc md5 used")
            callback && callback(resume_obj_task);
        }
    })
}


function process_upload_task(resume_obj_task) {
    /**
     * 目前一个接一个处理;
     * 
     * TODO: 并行处理多个上传任务
     */

    var offset = resume_obj_task.offset;
    var start = offset * resume_obj_task.chunk_size;
    var end = Math.min(resume_obj_task.size, (offset + 1) * resume_obj_task.chunk_size);

    var file_blob = resume_obj_task.file.slice(start, end);
    console.time("jsdu")
    console.time("chunk"+offset)
    freader_handler(file_blob, function(file_content){
        resume_obj_task["resume_chunk_obj_list"][offset] = [];
        console.time("calc md5"+offset)
        //SparkMD5.ArrayBuffer
        resume_obj_task["spark_md5"].append(file_content);

        resume_obj_task["resume_chunk_obj_list"][offset]["chunk_md5"] = SparkMD5.ArrayBuffer.hash(file_content);
        resume_obj_task["resume_chunk_obj_list"][offset]["upload_status"] = 0;

        console.timeEnd("calc md5"+offset)
        console.timeEnd("chunk"+offset)

        is_uploaded_chunk(resume_obj_task, function(resp) {
            if (resp == "uploaded") {
                resume_obj_task.offset += 1;
                if (resume_obj_task.offset < resume_obj_task.chunk_num) {
                    process_upload_task(resume_obj_task)
                } else {
                    var all_md5 = resume_obj_task["spark_md5"].end();
                    resume_obj_task["spark_md5"].destroy();
                
                    resume_obj_task["all_md5"] = all_md5;
                    
                    notify_recovery(resume_obj_task);
                    console.log("upload task finished!", resume_obj_task);
                    console.timeEnd("jsdu")
                }
            }
        })
    });
}

function notify_recovery(resume_obj_task) {
    var xhr = new XMLHttpRequest();
    var identify = identify_form(resume_obj_task);
    var notify_recovery_url = "http://192.168.18.198/upload/upload_finished" + format_params(identify);

    xhr.open("GET", notify_recovery_url, true);
    xhr.send();
    
    xhr_helper(xhr, function(e) {
        console.log(e);
    })
}

function is_uploaded_chunk(resume_obj_task, callback) {
    /**
     *  GET request chunk is uploaded
     */
    var offset = resume_obj_task.offset;
    var start = offset * resume_obj_task.chunk_size;
    var end = Math.min(resume_obj_task.size, (offset + 1) * resume_obj_task.chunk_size);

    var is_uploaded_form = is_uploaded_chunk_form(resume_obj_task);
    var is_uploaded_url = "http://192.168.18.198/upload/isuploaded" + format_params(is_uploaded_form);
    var xhr = new XMLHttpRequest();
    
    xhr.addEventListener("progress", progress_handler.bind(null, end, resume_obj_task.size), false);
    xhr.open("GET", is_uploaded_url, true);
    xhr.send();

    xhr_helper(xhr, function(e) {    
        console.log("xxxxxx", e.target.response)
        var resp = e.target.response;
        if (resp == "uploading") {
            upload_chunk(resume_obj_task, callback);
        } else if (resp == "uploaded"){
            callback && callback(resp);
            console.log("this chunk is uploaded!");
        }
    })
}


function upload_chunk(resume_obj_task, callback) {
    var offset = resume_obj_task.offset;
    var start = offset * resume_obj_task.chunk_size;
    var end = Math.min(resume_obj_task.size, (offset + 1) * resume_obj_task.chunk_size);
    var chunk_form = upload_chunk_form(resume_obj_task);

    var upload_chunk_url = "http://192.168.18.198/upload/uploadbysize";
    var xhr = new XMLHttpRequest();
    xhr.open("POST", upload_chunk_url, true);

    // xhr.addEventListener("progress", progress_handler.bind(null, end, resume_obj_task.size), false);
    xhr.setRequestHeader("range", "bytes="+ start + "-"+ end);
    xhr.send(chunk_form)

    xhr_helper(xhr, function(e) {
        console.log("do upload", e);
        var resp = e.target.response;
        if (resp == "uploading") {
            upload_chunk(resume_obj_task);
        } else {
            callback && callback(resp);
        }
    })
}

/**
 * 上传form
 */
function is_uploaded_chunk_form(resume_obj_task) {
    var form = {};
    form["rawmd5"] = resume_obj_task.fname;
    form["chunkmd5"] = resume_obj_task["resume_chunk_obj_list"][resume_obj_task.offset]["chunk_md5"];
    return form;
}


function upload_chunk_form(resume_obj_task) {
    var fd = new FormData();
    var offset = resume_obj_task.offset;
    var start = offset * resume_obj_task.chunk_size;
    var end = Math.min(resume_obj_task.size ,(offset + 1) * resume_obj_task.chunk_size);
    var blob = resume_obj_task.file.slice(start, end);

    fd.append("filecontent", blob);
    fd.append("filemd5", resume_obj_task["resume_chunk_obj_list"][resume_obj_task.offset]["chunk_md5"]);
    fd.append("rawmd5", resume_obj_task.fname);
    fd.append("filename", resume_obj_task.fname);
    fd.append("filesize", resume_obj_task.size);
    fd.append("chunksize", resume_obj_task.chunk_size);
    fd.append("Index", offset);

    return fd;
}


function identify_form(resume_obj_task) {
    var form = {};
    form["rawmd5"] = resume_obj_task.fname;
    form["allmd5"] = resume_obj_task["all_md5"];
    return form;
}