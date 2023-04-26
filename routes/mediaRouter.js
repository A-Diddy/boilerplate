require('dotenv').config();
const express = require('express');
const multer = require('multer');
// var ensureLogIn = require('connect-ensure-login').ensureLoggedIn;
const ensureLogIn = require('./routerUtils');
const UUID = require("uuid");
// const IoService = require("../server/services/io/ioService");
const MediaService = require("../server/services/media/MediaService");
const logger = require("../server/utils/logger");

const router = express.Router();
const ensureLoggedIn = ensureLogIn();

////////////////////////////////////////////////////////////////////
// Multer Configuration Options: File upload handling
//

// Accept a mix of files, specified by fields. An object with arrays of files will be stored in req.files.
const fileUploadFieldDef = [
  {name: 'source', maxCount: 1},
  {name: 'id'},
  {name: 'generatehash'},
  {name: 'mediatype'},
  {name: 'jsonData'}
]

const multerLimits = {
  fieldNameSize: 100,   // Max field name size	100 bytes
  fieldSize: 1048576,         // Max field value size (in bytes)	1MB
  fields: -1,           // Max number of non-file fields	Infinity
  fileSize: -1,         // For multipart forms, the max file size (in bytes)	Infinity
  files: -1,            // For multipart forms, the max number of file fields	Infinity
  parts: -1,            // For multipart forms, the max number of parts (fields + files)	Infinity
  headerPairs: 2000     // For multipart forms, the max number of header key=>value pairs to parse	2000
}

// Set this to a function to control which files should be uploaded and which should be skipped. The function should look like this:
const multerFileFilter = (req, file, cb) => {
  // The function should call `cb` with a boolean
  // to indicate if the file should be accepted

  // To reject this file pass `false`, like so:
  cb(null, false)

  // To accept the file pass `true`, like so:
  cb(null, true)

  // You can always pass an error if something goes wrong:
  cb(new Error('I don\'t have a clue!'))
}

const fileSizeLimitErrorHandler = (err, req, res, next) => {
  if (err) {
    console.log("[MediaRouter] fileSizeLimitErrorHandler(): ", err);
    res.send(413)
  } else {
    next()
  }
}

const multerOpts = {
  dest: "",         // Destination to store files. If omitted, files are kept in memory with the request (req.files)
  storage: "",      // Custom storage solution (default = 'MemoryStorage')
  fileFilter: "",   // Function to control which files are accepted
  limits: "",       // Limits of uploaded data
  preservePath: ""  // Keep the full path of files instead of just the base name
}

const fileUploadHandler = multer();//(multerOpts);
// Example Usage:
// multer.fields(fileUploadFieldDef); Accept files in only the specified fields -> req.files
// multer.array()                     Accept multiple files with the same field name -> req.files
// multer.any();                      Accept files within any field -> req.files
// multer.single(fieldName);          Accept only a single file field -> req.file
// multer.none();                     Accept no files

////////////////////////////////////////////////////////////////////

// Insert or update media
router.post('/',
  ensureLoggedIn,
  function (req, res, next) {
    if (!req.user) {
      return res.render('home', {title: process.env.TITLE});
    }
    next();
  },
  fileUploadHandler.fields(fileUploadFieldDef),   // Puts binary files into req.files[] and data into req.body
  fileSizeLimitErrorHandler,                      // Handle errors with acceptance of file stream
  function (req, res, next) {
    console.log("!!!!!!!!!!!!!!!!!!!!! body = ", req.body);
    try {
      const mediaObj = {
        binary: req.files,
        meta: req.body
      };
      MediaService.postMedia(mediaObj)
        .then((result) => {
          res.send(result);
        }).catch((e) => {
        console.log(e);
        res.send(e);
      });
    } catch (e) {
      console.log(e);
    }
  }
);

// Get media
router.get('/:id',
  function (req, res, next) {
    MediaService.getMediaDataById(req.params.id)
      .then((result) => {
        console.log("[MediaRouter] Got media: ", result);
        res.writeHead(200, {
          "Content-Type": result.media_type,
          "Content-Length": result.size,
          "Content-Transfer-Encoding": result.encoding,
          "Original-Name": result.og_filename,
          "Last-Modified": result.last_modified,
          // "Content-Disposition": result.og_filename,   // Forces a browser download/save
          "X-Powered-By": process.env.TITLE
        });
        res.end(result.binary_data);
      })
      .catch((e) => {
        logger.error(e);
        res.send(e)
      })
  }
);

module.exports = router;
