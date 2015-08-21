/**
 * Created by n.atlas on 21/8/2015.
 */
(function(){
    var verbose = true;
    var dal = {
        onChangeFunctions: {},
        setOnChangeFunction: function(code, fn){//code to ensure each function is applied once
            this.onChangeFunctions[code] = fn;
        },
        setRemote: function(url){
            this._remoteUrl = url;
        },
        setDBName: function(name){
            this._dbName = name;
        },
        connect: function(){
            if(!this._dbName)throw "DAL Layer : DB Name must be set before connecting to it!";
            var self = this;
            return new PouchDB(this._dbName).then(function(s){
                self.connection = s;
                self.connection.changes({
                    since: 'now',
                    live: true,
                    include_docs: true
                }).on('change', function(change) {
                    // handle change
                    for(var i in self.onChangeFunctions){
                        self.onChangeFunctions[i](change);
                    }
                    //log("A change was made:")
                    //log(change);
                }).on('complete', function(info) {
                    // changes() was canceled
                    log("Stopped watching changes for some reason!")
                }).on('error', function (err) {
                    console.log(err);
                });

            });
        },
        close: function(){
            // maybe this is not needed! not found on API
        },
        deletedb: function(){
            if(!this.connection)return this.openConnectionError();
            return this.connection.destroy().then(function(msg){
                if( msg.ok ){
                    return msg;
                }
                else{
                    throw "DAL Layer : Couldnt delete the database!"
                }
            });
        },
        put: function(item, id, rev){
            if(!this.connection)return this.openConnectionError();
            return this.connection.put(item).then(function (res) {
                if (res.ok){
                    return res;
                }
                else{
                    throw "DAL Layer : There was an error updating the doc.";
                }
            }).catch(function (err) {
                throw "DAL Layer : There was an error updating a doc. DocID:" + id + " Error:" + err;
            })
        },
        putget: function(item, id, rev){
            var self = this;
            var cid = id || item._id;
            return self.put(item, id, rev).then(function(){
              return self.get(cid);
            });
        },
        addOrUpdate: function(item){
            var self = this;
            return this.get(item._id).then(function(doc){
               if(doc)
                    return self.put(doc);
               else
                    return self.put(item);
            });
        },
        get: function(id){
            if(!this.connection)return this.openConnectionError();
            return this.connection.get(id).catch(function(err){
                if( err.message == "missing" )return null;
                throw "DAL Layer : Error getting doc with id: " + id + " Error: " + err;
            });
        },
        remove: function(doc){
            if(!this.connection)return this.openConnectionError();
            doc._deleted = true;
            return this.put(doc).catch(function(err){
                throw  "DAL Layer : Error removing a doc. Error: " + err;
            });
        },
        getAll: function (options) {
            if(!options)options = {};
            return this.connection.allDocs(options);
        },
        getAllData: function(options){
            if(!options)options = {};
            options.include_docs = true;
            return this.connection.allDocs(options);
        },

        // Rememeber to add a sync function and add the filter doc that RUNS ON SERVER!
        sync: function (options, callback) {
            if(!options)options = {};
            var self = this;
            this.connection.sync(this._remoteUrl, options)
                .on("paused", function(){
                    if(callback)callback();
                })
                .on("change", function(){
                    if(callback)callback();
                })
                .on("error", function(err){
                    if( err.status == 500 )self.sync(options,callback);
                    console.log(err);
                });
        },

        openConnectionError: function(){
            return new Promise.resolve(true).then(function (a) {
                throw "DAL Layer : You must open a connection first";
            });
        }
    }


    var log = function(p){
        if(!verbose)return;
        if(typeof p === "string")console.log("DAL Layer : " + p);
        else console.log(p);
    }

    window.DAL = dal;
})();