/**
 * Created by n.atlas on 21/8/2015.
 */
(function(CryptoJS){
    var verbose = true;

    var crypto = {
        dal: null,
        setDAL: function(d){
          this.dal = d;
          //var filter = {
          //    "_id": "_design/app",
          //    "filters": {
          //        "by_user": function (doc, req) {
          //            return doc._id.indexOf(req.query.hash) === 0;
          //        }.toString()
          //    }
          //};
          //return this.dal.get(filter._id).then(function (s) {
          //    if(s == null){
          //        return this.dal.add(filter);
          //    }
          //});
        },
        setCreds: function (username, pass) {
            this._hash = CryptoJS.MD5(username + pass + username + pass + username + pass);
            this.pass = pass;
        },
        put: function(item){
            this.checkCreds();
            item._id = this._hash + item._id;
            item = this.encryptFields(item);
            return this.dal.put(item);
        },
        putget: function(item){
            cid = item._id;
            var self = this;
            return self.put(item).then(function(r){
                return self.get(cid);
            });
        },
        addOrUpdate: function(item){
            this.checkCreds();
            item._id = this._hash + item._id;
            item = this.encryptFields(item);
            var self = this;
            return self.dal.addOrUpdate(item);
        },
        get: function(id){
            this.checkCreds();
            id = this._hash + id;
            var self = this;
            return self.dal.get(id).then(function(doc){
                if(!doc)return null;
                doc._id = doc._id.replace(self._hash, "");
                return self.decryptFields(doc);
            });
        },
        remove: function(doc){
            this.checkCreds();
            doc._id = this._hash + doc._id;
            doc = this.encryptFields(doc);
            return this.dal.remove(doc);
        },
        getAll: function (options) {
            this.checkCreds();
            if(!options)options = {};
            options.startkey = this._hash;
            options.endkey = this._hash+'\uffff';
            return this.dal.allDocs(options).then(function (docs) {
                for(var i in docs.rows){
                    docs.rows[i]["id"] = docs.rows[i]["id"].replace(this._hash , "");
                }
                return docs;
            });
        },
        getAllData: function (options) {
            this.checkCreds();
            if(!options)options = {};
            options.startkey = this._hash+'';
            options.endkey = this._hash+'\uffff';
            var self = this;
            return self.dal.getAllData(options).then(function (docs) {
                for(var i in docs.rows){
                    docs.rows[i]["id"] = docs.rows[i]["id"].replace(this._hash , "");
                    docs.rows[i].doc._id = docs.rows[i].doc._id.replace(this._hash , "");
                    docs.rows[i].doc = self.decryptFields(docs.rows[i].doc);
                }
                return docs;
            });
        },
        sync: function(callback){
            this.dal.sync({
                live: true
            }, callback);
        },

        encryptFields: function(item){
            for(var i in item){
                if( typeof i === "string" )
                    if( i[0] == "_" )continue;
                item[i] = JSON.stringify(item[i]);
                item[i] = CryptoJS.AES.encrypt(item[i], this.pass).toString();
            }
            return item;
        },
        decryptFields: function(item){
            for(var i in item){
                if( typeof i === "string" )
                    if( i[0] == "_" )continue;
                item[i] = CryptoJS.AES.decrypt(item[i], this.pass);
                item[i] = JSON.parse(hex2a(item[i].toString()));
            }
            return item;
        },
        checkCreds: function(){
            if(!this.pass || !this._hash) throw "Crypto Layer : Credentials must be set.";
        }
    }

    var hex2a = function(hex) {
        var str = '';
        for (var i = 0; i < hex.length; i += 2)
            str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
        return str;
    }
    var log = function(p){
        if(!verbose)return;
        if(typeof p === "string")console.log("CRYPTO Layer : " + p);
        else console.log(p);
    }

    window.CRYPTO = crypto;
})(CryptoJS);