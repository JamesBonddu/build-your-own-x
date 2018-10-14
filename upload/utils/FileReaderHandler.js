function ErrorHandler(evt) {
    switch(evt.target.error.code) {
        case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
        case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
        case evt.target.error.ABORT_ERR:
        break; 
        default:
        alert('An error occurred reading this file.');
    };
}


function FileReaderHandler(FileBlob, callback) {
    var reader = new FileReader();

    reader.onerror = ErrorHandler;
    reader.onloadend = function (e) {
        if (e.target.readyState == FileReader.DONE) {
            var result = e.target.result;
            callback && callback(result);
        }
    }

    reader.readAsBinaryString(FileBlob);
}
