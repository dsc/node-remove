var fs, path, exists, existsSync, Seq, exports, removeAsync, removeSync;
fs = require('fs');
path = require('path');
exists = path.exists, existsSync = path.existsSync;
Seq = require('seq');
/**
 * Asynchronously and recursively remove files and/or directories.
 * 
 * @param {String|Array<String>} paths Path or paths to remove.
 * @param {Object} [options] Options:
 * @param {Boolean} [options.verbose=false] Log all errors and print each path
 *  just before it's removed.
 * @param {Boolean} [options.sequential=false] If true, remove the supplied
 *  paths sequentially, such that an unsuppressed error would short-circuit
 *  further deletes.
 * @param {Boolean} [options.ignoreErrors=false] If false, halt as soon as
 *  possible after an error occurs and invoke the callback. When operating
 *  in `sequential` mode, this implies an error removing the first of several
 *  paths would halt before touching the rest. If set, `ignoreErrors` overrides
 *  `ignoreMissing`.
 * @param {Boolean} [options.ignoreMissing=false] Whether to treat missing
 *  paths as errors.
 * @param {Function} cb Completion callback, invoked with null on success
 *  and the error on failure.
 * @returns {void}
 */
removeAsync = module.exports = exports = (function(){
  function removeAsync(paths, options, cb){
    var verbose, ignoreErrors, ignoreMissing, stepMethod, _ref;
    paths == null && (paths = []);
    if (typeof paths === 'string') {
      paths = [paths];
    }
    if (typeof options === 'function') {
      _ref = [options, {}], cb = _ref[0], options = _ref[1];
    }
    if (typeof cb !== 'function') {
      throw new Error('Callback must be a function!');
    }
    options = (_ref = __import({
      verbose: false,
      sequential: false,
      ignoreErrors: false,
      ignoreMissing: false
    }, options), verbose = _ref.verbose, ignoreErrors = _ref.ignoreErrors, ignoreMissing = _ref.ignoreMissing, _ref);
    stepMethod = options.sequential ? 'seqEach_' : 'parEach_';
    Seq(paths)[stepMethod](function(next_path, p){
      if (verbose) {
        console.log("rm -rv " + p);
      }
      return Seq().seq(fs.stat, p, Seq).seq(function(stats){
        if (!stats.isDirectory()) {
          return fs.unlink(p, next_path);
        } else {
          return fs.readdir(p, this);
        }
      }).seq(function(contents){
        return removeAsync(contents.map(function(it){
          return path.join(p, it);
        }), options, this);
      }).seq(fs.rmdir, p, Seq).seq(next_path.ok)['catch'](function(err){
        return next_path(err);
      });
    }).seq(function(){
      return cb(null);
    })['catch'](function(err){
      if (verbose) {
        console.error(err);
      }
      if (ignoreErrors || (ignoreMissing && err.code === 'ENOENT')) {
        return this.ok();
      }
      return cb(err);
    });
  }
  return removeAsync;
}());
exports.removeAsync = removeAsync;
/**
 * Synchronously and recursively remove files and/or directories.
 * 
 * @param {String|Array<String>} paths Path or paths to remove.
 * @param {Object} [options] Options:
 * @param {Boolean} [options.verbose=false] Log all errors and print each path
 *  just before it's removed.
 * @param {Boolean} [options.ignoreErrors=false] If false, halt as soon as
 *  possible after an error occurs and invoke the callback. This implies an error
 *  removing the first of several paths would halt before touching the rest. If
 *  set, `ignoreErrors` overrides `ignoreMissing`.
 * @param {Boolean} [options.ignoreMissing=false] Whether to treat missing
 *  paths as errors.
 * @returns {void}
 */
removeSync = exports.removeSync = (function(){
  function removeSync(paths, options){
    var verbose, ignoreErrors, ignoreMissing, p, stats, _ref, _i, _len;
    paths == null && (paths = []);
    options == null && (options = {});
    if (typeof paths === 'string') {
      paths = [paths];
    }
    options = (_ref = __import({
      verbose: false,
      ignoreErrors: false,
      ignoreMissing: false
    }, options), verbose = _ref.verbose, ignoreErrors = _ref.ignoreErrors, ignoreMissing = _ref.ignoreMissing, _ref);
    for (_i = 0, _len = paths.length; _i < _len; ++_i) {
      p = paths[_i];
      if (verbose) {
        console.log("rm -rv " + p);
      }
      try {
        stats = fs.statSync(p);
        if (!stats.isDirectory()) {
          fs.unlinkSync(p);
        } else {
          fs.readdirSync(p).forEach(_fn);
          fs.rmdirSync(p);
        }
      } catch (err) {
        if (verbose) {
          console.error(err);
        }
        if (ignoreErrors || (ignoreMissing && err.code === 'ENOENT')) {
          continue;
        } else {
          throw err;
        }
      }
    }
    function _fn(it){
      return removeSync(path.join(p, it), options);
    }
  }
  return removeSync;
}());
function __import(obj, src){
  var own = {}.hasOwnProperty;
  for (var key in src) if (own.call(src, key)) obj[key] = src[key];
  return obj;
}
