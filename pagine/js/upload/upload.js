"use strict";

const cloudinary = require('cloudinary');

module.exports.init = (CLOUD_NAME, API_KEY, API_SECRET) => {
    cloudinary.config({
        cloud_name: CLOUD_NAME,
        api_key: API_KEY,
        api_secret: API_SECRET
    });
}

module.exports.upload = (array, callback, error) => {
    let res_promises = array.map(file => new Promise((resolve, reject) => {
        cloudinary.v2.uploader.upload(file, { folder: "facegram", use_filename: true, unique_filename: false }, (error, result) => {
            if (error) {
                reject(error);
            }
            else {
                resolve(result.secure_url);
            }
        });
    }));
    // Promise.all will fire when all promises are resolved 
    Promise.all(res_promises).then(callback).catch(error);
}