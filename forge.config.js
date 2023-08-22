/************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright [first year code created] Adobe
 * All Rights Reserved.
 *
 * NOTICE: All information contained herein is, and remains
 * the property of Adobe and its suppliers, if any. The intellectual
 * and technical concepts contained herein are proprietary to Adobe
 * and its suppliers and are protected by all applicable intellectual
 * property laws, including trade secret and copyright laws.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe.

 *************************************************************************
 */
module.exports = {
  packagerConfig: { asar: true },
  plugins:
  [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {}
    }
  ],
  rebuildConfig: {},
  makers:
  [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        authors: 'Ross Grogan-Kaylor',
        description: 'A template migration tool for Adobe Sign'
      }
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        name: 'Sign Template Migrator',
        authors: 'Ross Grogan-Kaylor',
        description: 'A template migration tool for Adobe Sign'
      }
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-deb',
      config: {}
    }
  ],
};
