import { createServer } from 'vite';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { Common } from '@strapi/types';

import { mergeConfigWithUserConfig, resolveDevelopmentConfig } from './config';

import type { BuildContext } from '../createBuildContext';

const watch = async (ctx: BuildContext) => {
  const config = await resolveDevelopmentConfig(ctx);
  const finalConfig = await mergeConfigWithUserConfig(config, ctx);

  ctx.logger.debug('Vite config', finalConfig);

  const vite = await createServer(finalConfig);

  //   ctx.strapi.server.app.use((ctx, next) => {
  //     console.log('hit middleware');
  //     return new Promise((resolve, reject) => {
  //       console.log('im in a promiseeeee');
  //       vite.middlewares(ctx.req, ctx.res, (err?: unknown) => {
  //         console.log('hit vite server middlewares');
  //         if (err) reject(err);
  //         else resolve(next());
  //       });
  //     });
  //   });

  const serveAdmin: Common.MiddlewareHandler = async (koaCtx, next) => {
    console.log('serving admin :pray:');

    await next();

    if (koaCtx.method !== 'HEAD' && koaCtx.method !== 'GET') {
      return;
    }

    if (koaCtx.body != null || koaCtx.status !== 404) {
      return;
    }

    const url = koaCtx.originalUrl;

    console.log('url', url);

    // 1. Read index.html
    let template = await fs.readFile(path.resolve(ctx.runtimeDir, 'index.html'), 'utf-8');

    // 2. Apply Vite HTML transforms. This injects the Vite HMR client,
    //    and also applies HTML transforms from Vite plugins, e.g. global
    //    preambles from @vitejs/plugin-react
    template = await vite.transformIndexHtml(url, template);

    // 3. Load the server entry. ssrLoadModule automatically transforms
    //    ESM source code to be usable in Node.js! There is no bundling
    //    required, and provides efficient invalidation similar to HMR.
    const { render } = await vite.ssrLoadModule(path.resolve(ctx.runtimeDir, 'app.js'));

    // 4. render the app HTML. This assumes entry-server.js's exported
    //     `render` function calls appropriate framework SSR APIs,
    //    e.g. ReactDOMServer.renderToString()
    const appHtml = await render(url);

    // 5. Inject the app-rendered HTML into the template.
    const html = template.replace(`<!--ssr-outlet-->`, appHtml);
    koaCtx.type = 'html';
    koaCtx.body = html;
  };

  ctx.strapi.server.routes([
    {
      method: 'GET',
      path: `${ctx.basePath}:path*`,
      handler: serveAdmin,
      config: { auth: false },
    },
  ]);

  console.log('fin.');
};

export { watch };
