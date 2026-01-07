/**
 * ESBuild plugin to resolve Lambda Layer path aliases at runtime
 * Transforms @utils/* and @types/* imports to /opt/nodejs/* for Lambda Layer
 */
export const lambdaLayerPlugin = {
  name: 'lambda-layer-plugin',
  setup(build) {
    // Intercept @utils/* imports
    build.onResolve({ filter: /^@utils\// }, args => {
      return {
        path: args.path.replace('@utils/', '/opt/nodejs/utils/'),
        external: true
      };
    });
    
    // Intercept @shared/* imports
    build.onResolve({ filter: /^@shared\// }, args => {
      return {
        path: args.path.replace('@shared/', '/opt/nodejs/types/'),
        external: true
      };
    });
    
    // Intercept @models/* imports
    build.onResolve({ filter: /^@models\// }, args => {
      return {
        path: args.path.replace('@models/', '/opt/nodejs/models/'),
        external: true
      };
    });
  }
};
