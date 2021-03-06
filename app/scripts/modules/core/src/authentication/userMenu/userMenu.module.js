'use strict';

import { AUTHENTICATION_SERVICE } from '../authentication.service';
import { AUTHENTICATION_USER_MENU } from './userMenu.directive';

import './userMenu.less';

const angular = require('angular');

module.exports = angular.module('spinnaker.core.authentication.userMenu', [
  AUTHENTICATION_SERVICE,
  AUTHENTICATION_USER_MENU,
]);
