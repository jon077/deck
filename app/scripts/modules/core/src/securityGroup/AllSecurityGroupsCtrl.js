'use strict';

import _ from 'lodash';

import { CLOUD_PROVIDER_REGISTRY } from 'core/cloudProvider/cloudProvider.registry';
import { SKIN_SELECTION_SERVICE } from 'core/cloudProvider/skinSelection/skinSelection.service';
import { PROVIDER_SELECTION_SERVICE } from 'core/cloudProvider/providerSelection/providerSelection.service';
import { SETTINGS } from 'core/config/settings';
import { SECURITY_GROUP_FILTER_MODEL } from './filter/securityGroupFilter.model';
import { SECURITY_GROUP_FILTER_SERVICE } from './filter/securityGroupFilter.service';

const angular = require('angular');

module.exports = angular
  .module('spinnaker.core.securityGroup.all.controller', [
    SECURITY_GROUP_FILTER_SERVICE,
    SECURITY_GROUP_FILTER_MODEL,
    PROVIDER_SELECTION_SERVICE,
    SKIN_SELECTION_SERVICE,
    require('angular-ui-bootstrap'),
    CLOUD_PROVIDER_REGISTRY,
  ])
  .controller('AllSecurityGroupsCtrl', function(
    $scope,
    app,
    $uibModal,
    $timeout,
    skinSelectionService,
    providerSelectionService,
    cloudProviderRegistry,
    securityGroupFilterModel,
    securityGroupFilterService,
  ) {
    this.$onInit = () => {
      const groupsUpdatedSubscription = securityGroupFilterService.groupsUpdatedStream.subscribe(() => groupsUpdated());

      securityGroupFilterModel.activate();

      this.initialized = false;

      $scope.application = app;

      $scope.sortFilter = securityGroupFilterModel.sortFilter;

      app.setActiveState(app.securityGroups);
      $scope.$on('$destroy', () => {
        app.setActiveState();
        groupsUpdatedSubscription.unsubscribe();
      });

      app.securityGroups.onRefresh($scope, () => updateSecurityGroups());
      app.securityGroups.ready().then(() => updateSecurityGroups());
    };

    this.groupingsTemplate = require('./groupings.html');

    let updateSecurityGroups = () => {
      $scope.$evalAsync(() => {
        securityGroupFilterService.updateSecurityGroups(app);
        groupsUpdated();
      });
    };

    let groupsUpdated = () => {
      $scope.$applyAsync(() => {
        $scope.groups = securityGroupFilterModel.groups;
        $scope.tags = securityGroupFilterModel.tags;
        this.initialized = this.initialized || app.securityGroups.loaded;
      });
    };

    this.clearFilters = function() {
      securityGroupFilterService.clearFilters();
      updateSecurityGroups();
    };

    this.createSecurityGroup = function createSecurityGroup() {
      providerSelectionService.selectProvider(app, 'securityGroup').then(selectedProvider => {
        skinSelectionService.selectSkin(selectedProvider).then(selectedVersion => {
          let provider = cloudProviderRegistry.getValue(selectedProvider, 'securityGroup', selectedVersion);
          var defaultCredentials =
              app.defaultCredentials[selectedProvider] || SETTINGS.providers[selectedProvider].defaults.account,
            defaultRegion =
              app.defaultRegions[selectedProvider] || SETTINGS.providers[selectedProvider].defaults.region;
          $uibModal.open({
            templateUrl: provider.createSecurityGroupTemplateUrl,
            controller: `${provider.createSecurityGroupController} as ctrl`,
            size: 'lg',
            resolve: {
              securityGroup: () => {
                return {
                  credentials: defaultCredentials,
                  subnet: 'none',
                  regions: [defaultRegion],
                  vpcId: null,
                  securityGroupIngress: [],
                };
              },
              application: () => {
                return app;
              },
            },
          });
        });
      });
    };

    this.updateSecurityGroups = _.debounce(updateSecurityGroups, 200);
  });
