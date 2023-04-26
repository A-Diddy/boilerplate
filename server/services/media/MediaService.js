'use strict';

const knexInstance = require("../../db/knexInstance");
const UUID = require('uuid');
const logger = require("../../utils/logger");

const MEDIA_TABLE = "media";
const MEDIA_BINARY_TABLE = "media_binary";

/**
 * Delete media (binary and metadata)
 *
 * id UUID The id of the media and metadata to delete
 * returns MediaMetadata
 **/
exports.deleteMediaById = function (id) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "path": "path",
      "extension": "extension",
      "jsonData": "",
      "updated_at": "2000-01-23T04:56:07.000+00:00",
      "hashcode": "hashcode",
      "length": 0.8008281904610115,
      "created_at": "2000-01-23T04:56:07.000+00:00",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "type": "type"
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Retrieve media binary data
 *
 * id UUID The id of the media data to retrieve
 * returns byte[]
 **/
exports.getMediaDataById = function (id) {
  console.log("getMediaDataById(",id,")");
  if (!UUID.validate(id)) {
    logger.warn("[MediaService] getMediaDataById(",id,"): Invalid ID");
    return [];
  }

  return knexInstance(MEDIA_BINARY_TABLE)
    .select("*")
    .where({id: id})
    .then((results) => {
      if (results.length <= 0) {
        return "Media not found";
      }
      return results[0];
    })
    .catch((e) => {
      logger.error(e);
    })
}


/**
 * Retrieve media metadata
 *
 * id UUID The id of the media metadata to retrieve
 * returns MediaMetadata
 **/
exports.getMediaMetadataById = function (id) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = {
      "path": "path",
      "extension": "extension",
      "jsonData": "",
      "updated_at": "2000-01-23T04:56:07.000+00:00",
      "hashcode": "hashcode",
      "length": 0.8008281904610115,
      "created_at": "2000-01-23T04:56:07.000+00:00",
      "id": "046b6c7f-0b8a-43b9-b35d-6489e6daee91",
      "type": "type"
    };
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**
 * Retrieve media via HEAD request. Reply for this request only includes headers and no body or payload is sent. Used for retrieving binary details (file size, type, etc.)
 *
 * id UUID The id of the media data to retrieve
 * returns byte[]
 **/
exports.headMediaDataById = function (id) {
  return new Promise(function (resolve, reject) {
    var examples = {};
    examples['application/json'] = "";
    if (Object.keys(examples).length > 0) {
      resolve(examples[Object.keys(examples)[0]]);
    } else {
      resolve();
    }
  });
}


/**********************************************************
 * Uploads binary data.
 *
 *  Inserts a new media and metadata record or updates existing records based on UUID.
 *
 *   formData.binary = [binary files]
 *   formData.meta = {body fields}
 *
 * @param {object} formData: {binary: [], meta: {fields}}
 * returns {Promise<string | [db errors]>}: Promise that resolves to the UUID used or an array of db insert/update results/errors.
 **********************************************************/
exports.postMedia = async function (formData) {
  console.log("postMedia(",formData,")");
  const meta = formData.meta || {};
  const file = formData.binary.source[0];

  let inId = meta.id || meta.jsonData?.id;
  let uuid = inId;
  let newRecord = false;
  let jsonData = {};
  try {
    jsonData = JSON.parse(meta.jsonData);
  } catch(e) {
    logger.error(e);
  }

  // If the id is missing or invalid...
  if (!UUID.validate(inId)) {
    newRecord = true;
    uuid = UUID.v4();
    jsonData.id = uuid;
  }

  let lastModified = jsonData.lastModified ? new Date(jsonData.lastModified) : null;

  const mediaBinaryColumns = {
    id: meta.id,
    og_filename: file.originalname,
    media_type: file.mimetype,
    encoding: file.encoding,
    size: file.size,
    last_modified: lastModified,
    use_hash: meta.generatehash ?? true,
    json_data: jsonData,
    binary_data: file.buffer
  }

  const mediaJson = {
    id: meta.id,
    og_filename: file.originalname,
    media_type: file.mimetype,
    encoding: file.encoding,
    size: file.size,
    use_hash: meta.generatehash
  }

  Object.keys(jsonData).forEach((key) => {
    if (jsonData.hasOwnProperty(key)) {
      mediaJson[key] = jsonData[key];
    }
  })

  // console.log("MEDIA_BINARY = ", mediaBinaryColumns);
  // console.log("MEDIA = ", mediaJson);

  // If we have a valid UUID, check if a record exists for it
  if (!newRecord) {
    newRecord = await knexInstance(MEDIA_TABLE)
      .select("id")
      .where({id: uuid})
      .then((results) => {
        return results.length < 1;
      })
  }

  // Create a collection of promises to write to each table
  const promises = [];

  if (newRecord) {
    console.log("INSERTING NEW MEDIA");
    // Insert new records -------------------------------------
    promises.push(knexInstance(MEDIA_BINARY_TABLE)
      .insert(mediaBinaryColumns)
      .returning("id")
      .catch((e) => {
        logger.error(e);
        return e;
      }));
    promises.push(knexInstance(MEDIA_TABLE)
      .insert({id: uuid, json_data: mediaJson})
      .returning("id")
      .catch((e) => {
        logger.error(e);
        return e;
      }));
  } else {
    console.log("UPDATING EXISTING MEDIA");
    // Update existing records -------------------------------
    promises.push(knexInstance(MEDIA_BINARY_TABLE)
      .update(mediaBinaryColumns)
      .where({id: uuid})
      .returning("id")
      .catch((e) => {
        logger.error(e);
        return e;
      }))
    promises.push(knexInstance(MEDIA_TABLE)
      .update({json_data: mediaJson})
      .where({id: uuid})
      .returning("id")
      .catch((e) => {
        logger.error(e);
        return e;
      }))
  }

  // Once each db insert/update is complete, get the ID from the first (any) result and return just the ID string.
  return Promise.all(promises)
    .then((results) => {
      console.log("[Media] Sending response: ", results[0][0].id);
      return results[0][0].id;
    })
    .catch((e) => {
      logger.error(e);
      return e;
    });
}

