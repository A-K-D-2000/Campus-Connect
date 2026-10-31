const cloudinary = require('../config/cloudinary');

// Upload one file (held in memory) and return its https URL
const uploadOne = (file, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (err, result) => (err ? reject(err) : resolve(result.secure_url))
    );
    stream.end(file.buffer);
  });

// Upload several files at once and return the list of URLs
const uploadFiles = (files = [], folder) =>
  Promise.all(files.map((f) => uploadOne(f, folder)));

module.exports = { uploadFiles };