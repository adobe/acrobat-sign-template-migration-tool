/************************************************************************
 *
 * ADOBE CONFIDENTIAL
 * ___________________
 *
 * Copyright 2023 Adobe
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

export function getRandomId(): string { // from https://stackoverflow.com/a/55365334
  const r = randomIdHelper;
  return `${r()}${r()}-${r()}-${r()}-${r()}-${r()}${r()}${r()}`;
}

function randomIdHelper(): string { // from https://stackoverflow.com/a/55365334
  return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
}

