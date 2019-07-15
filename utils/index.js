const fs = require('fs');

exports.fsExistsSync = (path) => {
    try{
        fs.accessSync(path,fs.F_OK);
    }catch(e){
        return false;
    }
    return true;
}