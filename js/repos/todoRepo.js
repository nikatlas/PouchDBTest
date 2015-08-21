/**
 * Created by n.atlas on 21/8/2015.
 */
(function(){
    var todoRepo = {
        dal: null,
        setDAL: function(d){
            this.dal = d;
        },
        get: function(id){
            return this.dal.get(id);
        },
        put: function(item){
            return this.dal.put(item);
        },
        putget: function(item){
            return this.dal.putget(item);
        },
        remove: function(item){
            return this.dal.remove(item);
        },
        getAll: function(){
            var self = this;
            var arr = [];
            return self.dal.getAllData().then(function(docs){
                for(var i in docs.rows){
                    arr.push(docs.rows[i].doc);
                }
                return arr;
            });
        },
        addOrUpdate: function(item){
            return this.dal.addOrUpdate(item);
        }
    }
    window.todoRepo = todoRepo;
})();