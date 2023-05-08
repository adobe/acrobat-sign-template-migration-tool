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

import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {MigrationConsoleComponent} from './components/migration-console/migration-console.component';
import {LoginComponent} from './components/login/login.component';

const routes: Routes = [
  {path: 'migration-console', component: MigrationConsoleComponent },
  {path: 'login', component: LoginComponent},
  {path: '', component: LoginComponent} // default route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
