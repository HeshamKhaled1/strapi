import { InlineConfig, UserConfig, createLogger, searchForWorkspaceRoot } from 'vite';
import browserslistToEsbuild from 'browserslist-to-esbuild';
import react from '@vitejs/plugin-react-swc';

import { getUserConfig } from '../core/config';
import { loadStrapiMonorepo } from '../core/monorepo';
import type { BuildContext } from '../createBuildContext';
import { getMonorepoAliases } from '../core/aliases';
import { buildFilesPlugin } from './plugins';

const resolveBaseConfig = async (ctx: BuildContext): Promise<InlineConfig> => {
  const monorepo = await loadStrapiMonorepo(ctx.cwd);
  const target = browserslistToEsbuild(ctx.target);

  return {
    root: ctx.cwd,
    base: ctx.basePath,
    build: {
      emptyOutDir: false, // Rely on CLI to do this
      outDir: ctx.distDir,
      target,
    },
    cacheDir: 'node_modules/.strapi/vite',
    configFile: false,
    define: {
      'process.env': ctx.env,
    },
    envPrefix: 'STRAPI_ADMIN_',
    esbuild: {
      loader: 'jsx',
      include: /.*\.jsx?$/,
      exclude: [],
    },
    plugins: [
      react(),
      buildFilesPlugin(ctx),
      {
        name: 'fix-accept-header-404', // issue with vite dev server: https://github.com/vitejs/vite/issues/9520
        configureServer(server) {
          console.log('configuring');
          server.middlewares.use((req, _res, next) => {
            if (req.headers.accept == 'application/json, text/plain, */*') {
              req.headers.accept = '*/*';
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: getMonorepoAliases({ monorepo }),
    },
  };
};

const resolveProductionConfig = async (ctx: BuildContext): Promise<InlineConfig> => {
  const {
    options: { minify, sourcemaps },
  } = ctx;

  const baseConfig = await resolveBaseConfig(ctx);

  return {
    ...baseConfig,
    logLevel: 'silent',
    mode: 'production',
    build: {
      ...baseConfig.build,
      assetsDir: '',
      minify: minify ? 'esbuild' : false,
      sourcemap: sourcemaps,
      rollupOptions: {
        input: {
          strapi: ctx.entry,
        },
      },
    },
  };
};

const resolveDevelopmentConfig = async (ctx: BuildContext): Promise<InlineConfig> => {
  const baseConfig = await resolveBaseConfig(ctx);

  return {
    ...baseConfig,
    server: {
      middlewareMode: true,
      hmr: {
        port: 3000,
      },
      open: ctx.options.open,
    },
  };
};

const USER_CONFIGS = ['vite.config.js', 'vite.config.mjs', 'vite.config.ts'];

type UserViteConfig = (config: UserConfig) => UserConfig;

const mergeConfigWithUserConfig = async (config: InlineConfig, ctx: BuildContext) => {
  const userConfig = await getUserConfig<UserViteConfig>(USER_CONFIGS, ctx);

  if (userConfig) {
    return userConfig(config);
  }

  return config;
};

export { mergeConfigWithUserConfig, resolveProductionConfig, resolveDevelopmentConfig };
