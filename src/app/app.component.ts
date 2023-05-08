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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import { SharerService } from './services/sharer.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(private sharerService: SharerService, private router: Router) { }

  ngOnInit() {
    /* See preload.ts for the definitions of the functions from api. */

    /* Send a message to the Electron main process indicating that the Angular app has loaded. */
    (<any> window).api.notifyIsRendererInitDone();

    /* When the Electron main process recieves the notification sent in the above,
    it sends a message back that, when recieved, results in the invocation of the
    below defined callback function. The message includes a "url" argument that is
    passed to the callback. */
    (<any> window).api.onNavigate((event: any, url: string) => { 
      /* If the user has logged into both their source and dest accounts, then navigate them to the
      "url" argument that's passed to the callback. Otherwise, return them back to the login UI so that
      they can log into the remaining account
      
      Currently, the "url" argument of the callback is always "/migration-console". */
      const shared = this.sharerService.getShared();
      if (shared.loggedIn.includes('source') && shared.loggedIn.includes('dest'))
        this.router.navigateByUrl(url);
      else
        this.router.navigateByUrl('/login'); 
    });
  }
}
