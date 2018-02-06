
class InjectUnnamedPlugin {
  constructor() {

  }

  apply(compiler) {
    const thiz = this;
    compiler.plugin('make', function (compilation, callback) {
      compilation.plugin('html-webpack-plugin-alter-chunks', function (chunks, {plugin}) {
        const allChunks = compilation.getStats().toJson().chunks;
        // Filter chunks (options.chunks and options.excludeCHunks)
        var chunks = thiz.filterChunks(allChunks, plugin.options.chunks, plugin.options.excludeChunks);

        chunks = plugin.sortChunks(chunks, plugin.options.chunksSortMode);

        return chunks;
      });
      //compilation.mainTemplate.plugin('require-ensure', function (prev, chunk, hash) {
      //  if (chunk.name === "manifest") {
      //    return "throw new Error('Dynamic chunk loading disabled in html-inject-unnamed-plugin');";
      //  }
      //  return prev;
      //});
      callback();
    });
  }

  filterChunks (chunks, includedChunks, excludedChunks) {
    return chunks.filter(function (chunk) {
      var chunkName = chunk.names[0];
      // This chunk doesn't have a name. This script can't handled it.
      if (chunkName === undefined) {
        chunk.names[0] = chunk.id + '-' + chunk.hash;
      }
      // Skip if the chunk should be lazy loaded
      if (typeof chunk.isInitial === 'function') {
        if (!chunk.isInitial()) {
          return false;
        }
      } else if (!chunk.initial) {
        return false;
      }
      // Skip if the chunks should be filtered and the given chunk was not added explicity
      if (Array.isArray(includedChunks) && includedChunks.indexOf(chunkName) === -1) {
        return false;
      }
      // Skip if the chunks should be filtered and the given chunk was excluded explicity
      if (Array.isArray(excludedChunks) && excludedChunks.indexOf(chunkName) !== -1) {
        return false;
      }
      // Add otherwise
      return true;
    });
  };
}

module.exports = InjectUnnamedPlugin;