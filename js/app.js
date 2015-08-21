/**
 * Created by n.atlas on 21/8/2015.
 */
(function () {
    var verbose = true;

    var log = function(p){
        if(!verbose)return;
        if(typeof p === "string")console.log("App : " + p);
        else console.log(p);
    }
    CRYPTO.setCreds("test", "test");
    DAL.setDBName("test");
    DAL.setRemote("https://nikatlas.iriscouch.com/test");
    DAL.connect().then(function () {
        return CRYPTO.setDAL(DAL);
    }).then(function(){
        todoRepo.setDAL(CRYPTO);
    });
    angular.module('dbtest', [])
        .controller('TestCtrl' , ['$scope' , function($scope){
            $scope.switchUser = function (creds) {
                CRYPTO.setCreds(creds.username, creds.pass);
                CRYPTO.sync(function(){
                    $scope.getAll();
                });
                $scope.array = [];
            };
            $scope.add = function () {
                if( !$scope.model._id ){
                    $scope.model._id = new Date().toISOString();
                    $scope.model.date = new Date().toISOString();
                }
                var newitem = $.extend({},$scope.model);
                todoRepo.addOrUpdate(newitem).then(function(){
                    $scope.getAll();
                });
                $scope.model = {};
            };
            $scope.getAll = function () {
                todoRepo.getAll().then(function (arr) {
                    $scope.$apply(function () {
                        $scope.array = arr;
                        console.log($scope.array);
                    });
                })
            };
            $scope.remove = function (item) {
                todoRepo.remove(item).then(function(){
                    $scope.getAll();
                });
            };
            $scope.sync = function(){
                CRYPTO.sync();
            }
        }]);
})();