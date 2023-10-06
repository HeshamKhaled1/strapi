import path from 'path';
<<<<<<< Updated upstream
import type { UID, Schema } from '@strapi/types';
=======
import type { UID, Schema, Attribute } from '@strapi/types';
>>>>>>> Stashed changes
import fse from 'fs-extra';
import _ from 'lodash';

import { isConfigurable } from '../../utils/attributes';

export type Infos = {
  category?: string;
  modelName?: string;
  plugin?: string;
  uid?: UID.ContentType;
  dir: string;
  filename: string;
  // TODO type this
  schema?: Schema.Schema;
};

export default function createSchemaHandler(infos: Infos) {
  const { category, modelName, plugin, uid, dir, filename, schema } = infos;

  const initialState = {
    modelName,
    plugin,
    category,
    uid,
    dir,
    filename,
    schema,
  };

  const state = _.cloneDeep(initialState);

  // always keep it the same to rollback
  Object.freeze(initialState.schema);

  let modified = false;
  let deleted = false;

  return {
    get modelName() {
      return initialState.modelName;
    },

    get plugin() {
      return initialState.plugin;
    },
    get category() {
      return initialState.category;
    },

    get kind() {
      return _.get(state.schema, 'kind', 'collectionType');
    },

    get uid() {
      return state.uid;
    },

    get writable() {
      return _.get(state, 'plugin') !== 'admin';
    },

    setUID(val: UID.ContentType) {
      modified = true;

      state.uid = val;
      return this;
    },

    setDir(val: string) {
      modified = true;

      state.dir = val;
      return this;
    },

    get schema() {
      return _.cloneDeep(state.schema);
    },

    setSchema(val: Schema.Schema) {
      modified = true;

      state.schema = _.cloneDeep(val);
      return this;
    },

<<<<<<< Updated upstream
    // get a particular path inside the schema
=======
    // get a particuar path inside the schema
>>>>>>> Stashed changes
    get(path: string[]) {
      return _.get(state.schema, path);
    },

<<<<<<< Updated upstream
    // set a particular path inside the schema
    set(path: string[] | string, val: unknown) {
      if (!state.schema) return this;

=======
    // set a particuar path inside the schema
    set(path: string[] | string, val: unknown) {
>>>>>>> Stashed changes
      modified = true;

      const value = _.defaultTo(val, _.get(state.schema, path));
      _.set(state.schema, path, value);

      return this;
    },

<<<<<<< Updated upstream
    // delete a particular path inside the schema
=======
    // delete a particuar path inside the schema
>>>>>>> Stashed changes
    unset(path: string[]) {
      modified = true;

      _.unset(state.schema, path);

      return this;
    },

    delete() {
      deleted = true;
      return this;
    },

    getAttribute(key: string) {
      return this.get(['attributes', key]);
    },

<<<<<<< Updated upstream
    setAttribute(key: string, attribute: any) {
=======
    setAttribute(key: string, attribute: Attribute.Any) {
>>>>>>> Stashed changes
      return this.set(['attributes', key], attribute);
    },

    deleteAttribute(key: string) {
      return this.unset(['attributes', key]);
    },

    setAttributes(newAttributes: Schema.Attributes) {
<<<<<<< Updated upstream
      if (!this.schema) return this;

=======
>>>>>>> Stashed changes
      // delete old configurable attributes
      for (const key in this.schema.attributes) {
        if (isConfigurable(this.schema.attributes[key])) {
          this.deleteAttribute(key);
        }
      }

      // set new Attributes
      for (const key of Object.keys(newAttributes)) {
        this.setAttribute(key, newAttributes[key as keyof Schema.Attributes]);
      }

      return this;
    },

    removeContentType(uid: UID.ContentType) {
<<<<<<< Updated upstream
      if (!state.schema) return this;

      const attributes = state.schema.attributes as Record<string, any>;
=======
      const { attributes } = state.schema;
>>>>>>> Stashed changes

      Object.keys(attributes).forEach((key) => {
        const attribute = attributes[key];

        if (attribute.target === uid) {
          this.deleteAttribute(key);
        }
      });

      return this;
    },

    // utils
    removeComponent(uid: UID.Component) {
<<<<<<< Updated upstream
      if (!state.schema) return this;

      const attributes = state.schema.attributes as Record<string, any>;
=======
      const { attributes } = state.schema;
>>>>>>> Stashed changes

      Object.keys(attributes).forEach((key) => {
        const attr = attributes[key];

        if (attr.type === 'component' && attr.component === uid) {
          this.deleteAttribute(key);
        }

        if (
          attr.type === 'dynamiczone' &&
          Array.isArray(attr.components) &&
          attr.components.includes(uid)
        ) {
          const updatedComponentList = attributes[key].components.filter(
            (val: string) => val !== uid
          );
          this.set(['attributes', key, 'components'], updatedComponentList);
        }
      });

      return this;
    },

    updateComponent(uid: UID.Component, newUID: UID.Component) {
<<<<<<< Updated upstream
      if (!state.schema) return this;

      const attributes = state.schema.attributes as Record<string, any>;
=======
      const { attributes } = state.schema;
>>>>>>> Stashed changes

      Object.keys(attributes).forEach((key) => {
        const attr = attributes[key];

        if (attr.type === 'component' && attr.component === uid) {
          this.set(['attributes', key, 'component'], newUID);
        }

        if (
          attr.type === 'dynamiczone' &&
          Array.isArray(attr.components) &&
          attr.components.includes(uid)
        ) {
          const updatedComponentList = attr.components.map((val: string) =>
            val === uid ? newUID : val
          );

          this.set(['attributes', key, 'components'], updatedComponentList);
        }
      });

      return this;
    },

    // save the schema to disk
    async flush() {
      if (!this.writable) {
        return;
      }

      const initialPath = path.join(initialState.dir, initialState.filename);
      const filePath = path.join(state.dir, state.filename);

      if (deleted) {
        await fse.remove(initialPath);

        const list = await fse.readdir(initialState.dir);
        if (list.length === 0) {
          await fse.remove(initialState.dir);
        }

        return;
      }

      if (modified) {
        if (!state.schema) return Promise.resolve();

        await fse.ensureFile(filePath);

        await fse.writeJSON(
          filePath,
          {
            kind: (state.schema as any).kind,
            collectionName: state.schema.collectionName,
            info: state.schema.info,
            options: state.schema.options,
            pluginOptions: state.schema.pluginOptions,
            attributes: state.schema.attributes,
            config: (state.schema as any).config,
          },
          { spaces: 2 }
        );

        // remove from oldPath
        if (initialPath !== filePath) {
          await fse.remove(initialPath);

          const list = await fse.readdir(initialState.dir);
          if (list.length === 0) {
            await fse.remove(initialState.dir);
          }
        }

        return;
      }

      return Promise.resolve();
    },

    // reset the schema to its initial value
    async rollback() {
      if (!this.writable) {
        return;
      }

      const initialPath = path.join(initialState.dir, initialState.filename);
      const filePath = path.join(state.dir, state.filename);

      // it was a creation so it needs to be deleted
      if (!initialState.uid) {
        await fse.remove(filePath);

        const list = await fse.readdir(state.dir);
        if (list.length === 0) {
          await fse.remove(state.dir);
        }
        return;
      }

      if (modified || deleted) {
        await fse.ensureFile(initialPath);
        await fse.writeJSON(initialPath, initialState.schema, { spaces: 2 });

        // remove
        if (initialPath !== filePath) {
          await fse.remove(filePath);

          const list = await fse.readdir(state.dir);
          if (list.length === 0) {
            await fse.remove(state.dir);
          }
        }
      }

      return Promise.resolve();
    },
  };
<<<<<<< Updated upstream
}
=======
}
>>>>>>> Stashed changes
