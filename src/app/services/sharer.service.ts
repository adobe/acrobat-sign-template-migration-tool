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

import { Injectable } from '@angular/core';

/* The type of the object to be shared. */
export class SharedInner {
  complianceLevel: 'commercial' | 'gov-stage' | 'gov-prod' = 'commercial';
  initialOAuthState = '';
  credentials = {
    oAuthClientId: '',
    oAuthClientSecret: '',
    loginEmail: ''
  };
  shard = '';
};

export class Shared {
  source: SharedInner = new SharedInner();
  dest: SharedInner = new SharedInner();
  loggedIn: ('source' | 'dest')[] = [];
};

/* Service with getter and setter methods for sharing an object of type "Shared". */
@Injectable({providedIn: 'root'})
export class SharerService {
  /* If this constructor is being called for the first time, generate a default value for "shared". Otherwise,
  restore the value from the session storage by using the getShared() method. */
  private shared: Shared | null = null;

  /* If this constructor is being called for the first time, generate a default value for "shared". Otherwise,
  restore the value from the session storage by using the getShared() method. */
  constructor() {
    this.shared = this.shared == null ? new Shared() : this.getShared();
    this.shared = this.shared == null ? new Shared() : this.getShared();
  }
  
  /* It's tempting to use the syntatic sugar of getter and setter methods ("get shared()" and "set shared(shared: Shared)"),
  but this leads to the easy mistake of writing something such as "sharerService.shared.source = temp" and expecting it to work.
  Implementing a setter method for a non-primitive field actually does *not* cause the expected syntatic sugar
  for the non-primitive field's fields to be valid. */

  setShared(shared: Shared) {
    (<any> window).sessionStorage.setItem('shared', JSON.stringify(shared));
  }

  getShared(): Shared {
    const result = (<any> window).sessionStorage.getItem('shared');
    return result == null ? null : JSON.parse(result); // (== null) <=> (=== null or === undefined)
  }
}