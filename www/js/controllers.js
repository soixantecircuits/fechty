angular.module('starter.controllers', [])

  .controller('DashCtrl', function($scope, $ionicModal, Hosts, Camera, lodash, $interval) {
    //angular.element('.item-avatar').css('display', 'none');
    $scope.hostNumber = 0;
    $scope.connectedHost = 0;
    $scope.connectedCamera = 0;
    $scope.streaming = 0;
    $scope.machineList = [];
    $scope.disconnected = {
      host: false,
      camera: false
    };
    $scope.settings = {
      enableFriends: true
    };
    
    $scope.init = function(){
      $scope.refreshHost();
      
      // Ne fonctionne pas actuellement, n'a pas été prévu pour être update plusieurs fois.
      // Le tableau de machines inconnues augmentent.
      // Il faut optimiser la fonction.
      // Ajouter aussi une barre de chargement en haut

      //$interval($scope.refreshHost, CONFIG.delay);
    };

    $scope.isUp = function(host) {
      if (host.latency === undefined) {
        return;
      }
      return (host.latency >= 0) ? 'up' : 'down';
    };
    $scope.isUpImg = function(host) {
      return '';
    };
    $scope.deviceConnected = function(host) {
      if (host.camera !== undefined)
        return (host.camera.camera.length > 0) ? 'up' : 'down';
      else
        return;
    };
    $scope.isStreaming = function(host) {
      if (host.camera !== undefined)
        return (host.camera.isStreaming) ? 'up' : 'down';
      else
        return;
    };

    $scope.getHostNumber = function(host) {
      try {
        return host.hostname.match(/\d+/)[0];
      } catch (ex) {
        return host.hostname;
      }

    };

    $scope.refreshHost = function() {
      console.log('refresh host');
      Hosts.all()
      .success(function(response) {
        console.log(response.data);
        $scope.hosts = response.data;
        Hosts
          .pingAll()
          .success(function(response) {
            function mergeByProperty(arr1, arr2, prop) {
              lodash.each(arr2, function(arr2obj) {
                var arr1obj = lodash.find(arr1, function(arr1obj) {
                  return arr1obj[prop] === arr2obj[prop];
                });
                //If the object already exist extend it with the new values from arr2, otherwise just add the new object to arr1
                arr1obj ? lodash.extend(arr1obj, arr2obj) : arr1.push(arr2obj);
              });
            }
            mergeByProperty($scope.hosts, response.data, 'hostname');
            $scope.hostNumber = $scope.hosts.length;
            $scope.connectedHost = 0;
            $scope.connectedCamera = 0;
            $scope.streaming = 0;
            //console.log(lodash.merge($scope.hosts, response.data));
            lodash.each($scope.hosts, function(host, index) {
              if (host.latency >= 0) {
                $scope.connectedHost++;
                Camera
                  .status(host.address)
                  .success(function(response) {
                    $scope.connectedCamera++;
                    if (response.isStreaming) {
                      $scope.streaming++;
                    }
                    $scope.hosts[index].camera = response;
                  })
                  .error(function(data, status, headers, config) {
                    console.log('Can\'t get status for:', host.address);
                  });
              }
            });
            Hosts.workstationList().success(function(machineList) {
              function removeExisteByProperty(arr1, arr2, prop) {

                lodash.each(arr1, function(arr1obj, index) {
                  var isExist = lodash.find(arr2, function(arr2obj) {
                    return arr1obj[prop] === arr2obj[prop];
                  });
                  isExist ? console.log('exist') : $scope.machineList.push(arr1obj);
                });
              }
              removeExisteByProperty(machineList, response.data, 'address');
            });
          })
          .error(function(data, status, headers, config) {
            console.log('error ping all');
          });
      })
      .error(function(data, status, headers, config) {
        console.log('error');
        $scope.hosts = {};
      });
    }
    $ionicModal.fromTemplateUrl('/templates/modal-rename.html', {
      scope: $scope,
      animation: 'slide-in-up'
    }).then(function(modal) {
      $scope.modal = modal;

      $scope.rename = function(oldName, newName) {
        console.log(oldName);
        console.log(newName);
        $scope.messageModal = 'Renaming...';
        Hosts
          .rename(oldName, newName)
          .success(function(response) {
            $scope.messageModal = 'Renamde... wait for reboot';
            $scope.modal.hide();
          })
          .error(function(data, status, headers, config) {
            console.log('Can\'t rename: ', data);
            $scope.messageModal = 'Fail to rename ' + oldName + ' to ' + newName + '. Reason: ' + data.err.code;
          });
      };
    });
    $scope.openModal = function(oldName) {
      $scope.oldName = oldName;
      $scope.modal.show();
    };
    $scope.closeModal = function() {
      $scope.modal.hide();
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function() {
      $scope.modal.remove();
    });
    // Execute action on hide modal
    $scope.$on('modal.hidden', function() {
      // Execute action
    });
    // Execute action on remove modal
    $scope.$on('modal.removed', function() {
      // Execute action
    });

    $scope.reboot = function(hostname) {
      Hosts
        .reboot(hostname)
        .success(function(response) {
          console.log("reboot succeed");
        })
        .error(function(data, status, headers, config) {
          console.log('Can\'t reboot: ', data);
        });
    };
    $scope.rebootAll = function() {
      Hosts
        .rebootAll()
        .success(function(response) {
          console.log("reboot succeed");
        })
        .error(function(data, status, headers, config) {
          console.log('Can\'t reboot: ', data);
        });
    };
    $scope.init();
  });